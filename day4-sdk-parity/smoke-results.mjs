import { mkdtempSync, readdirSync, readFileSync, rmSync } from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { routeAndSave } from './route-and-save.mjs';

const temporary = mkdtempSync(path.join(os.tmpdir(), 'day4-result-'));
const cases = [
  ['MSG-01', 'low', 'Here is how to find the receipt.'],
  ['MSG-06', 'medium', 'We acknowledge that the portal shows the old company logo.'],
  ['MSG-05', 'high', 'A person must review this payment issue.'],
];

try {
  for (const [id, priority, message] of cases) {
    const saved = await routeAndSave({
      result: { priority, message },
      ticket: { id, subject: `Test ${priority}` },
      draftsDirectory: temporary,
    });
    const text = readFileSync(saved.path, 'utf8');
    if (!text.includes(`Priority: ${priority}`) || !text.includes(`Route: ${saved.route.action}`)) {
      throw new Error(`${id} did not persist its validated priority and route.`);
    }
    if (/refund|credit|compensation|deadline|escalat|investigat|contact|send/i.test(message)) {
      throw new Error(`${id} contains an unsupported promise or future action.`);
    }
  }

  const count = readdirSync(temporary).length;
  await routeAndSave({
    result: { priority: 'low', message: 'Invalid result.', risk_note: 'Internal only.' },
    ticket: { id: 'MSG-09', subject: 'Invalid' },
    draftsDirectory: temporary,
  }).then(() => { throw new Error('Invalid output unexpectedly saved a draft.'); }, error => {
    if (!/No draft was saved/.test(error.message)) throw error;
  });
  if (readdirSync(temporary).length !== count) throw new Error('Invalid output changed the drafts folder.');
  console.log('Result smoke passed. Three validated routes saved three drafts; one invalid result saved none. No message was sent.');
} finally {
  rmSync(temporary, { recursive: true, force: true });
}
