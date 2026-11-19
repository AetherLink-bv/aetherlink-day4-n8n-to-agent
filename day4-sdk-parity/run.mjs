import { readFile } from 'node:fs/promises';
import { randomBytes } from 'node:crypto';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { parseMessages } from '../lib/messages.mjs';
import { runQuery } from '../lib/run.mjs';
import { buildOptions } from './options.mjs';
import { routeAndSave } from './route-and-save.mjs';

const lab = path.dirname(fileURLToPath(import.meta.url));
const project = path.resolve(lab, '..');
const args = process.argv.slice(2);
const dryRun = args.includes('--dry-run');
const id = args.find(arg => /^MSG-\d{2}$/.test(arg));
const valueAfter = flag => {
  const index = args.indexOf(flag);
  if (index < 0) return null;
  if (!args[index + 1]) throw new Error(`${flag} needs a value.`);
  return args[index + 1];
};
const message = valueAfter('--message');
const customer = valueAfter('--customer') ?? 'CUST-001';
const known = new Set([id, '--dry-run', '--message', message, '--customer', customer].filter(Boolean));
if ((!id && !message) || args.some(arg => !known.has(arg))) {
  throw new Error('Use a fixture: node day4-sdk-parity/run.mjs MSG-01 [--dry-run]\nOr free text: node day4-sdk-parity/run.mjs --customer CUST-001 --message "Your message" [--dry-run]');
}
if (id && message) throw new Error('Choose a fixture ID or --message, not both.');

const messages = parseMessages(await readFile(path.join(project, 'docs', 'customer-messages.md'), 'utf8'));
const ticket = id
  ? messages.find(item => item.id === id)
  : { id: `CHAT-${Date.now()}-${randomBytes(3).toString('hex')}`, customer, subject: 'Chat message', message };
if (!ticket) throw new Error(`Unknown message: ${id}`);

const prompt = `Process this support ticket through the Day 4 SDK workflow.

Message ID: ${ticket.id}
Customer ID: ${ticket.customer}
Subject: ${ticket.subject}

${ticket.message}`;

const run = await runQuery({
  prompt,
  options: buildOptions(),
  dryRun,
  dryRunNote: 'Dry run only. A real run asks the main agent to call Context, Risk and Customer Reply. Code validates and routes the result, then saves a review draft. Nothing sends it.',
});

if (!dryRun) {
  const saved = await routeAndSave({ result: run.result, ticket });
  console.log(`Switch → ${saved.priority} → ${saved.route.action} (${saved.route.team})`);
  console.log(`Draft saved for human review: ${saved.path}`);
}
