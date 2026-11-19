import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { spawnSync } from 'node:child_process';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { parseMessages } from '../lib/messages.mjs';

const lab = path.dirname(fileURLToPath(import.meta.url));
const project = path.resolve(lab, '..');
const read = file => readFileSync(path.join(lab, file), 'utf8');

const cases = JSON.parse(read('cases.json'));
assert.deepEqual(cases.map(item => item.route), ['low', 'medium', 'high']);
assert.deepEqual(cases.map(item => [item.message_id, item.customer_id, item.customer_type]), [
  ['MSG-01', 'CUST-004', 'Standard'],
  ['MSG-06', 'CUST-005', 'Enterprise'],
  ['MSG-05', 'CUST-003', 'Enterprise'],
]);

const projectMessages = parseMessages(readFileSync(path.join(project, 'docs', 'customer-messages.md'), 'utf8'));
const customerRows = readFileSync(path.join(project, 'docs', 'customer_context.csv'), 'utf8')
  .trim().split('\n').slice(1).map(line => line.split(','));
const customerTypes = new Map(customerRows.map(([customerId, , customerType]) => [customerId, customerType]));
for (const example of cases) {
  const fixture = projectMessages.find(item => item.id === example.message_id);
  assert.ok(fixture, `${example.message_id} must exist in the participant message fixture.`);
  assert.deepEqual(
    [fixture.customer, fixture.subject, fixture.message, customerTypes.get(fixture.customer)],
    [example.customer_id, example.subject, example.message, example.customer_type],
    `${example.message_id} must match the participant message and customer fixtures.`,
  );
}

const options = read('options.mjs');
for (const name of ['customer-context-agent', 'risk-agent', 'customer-reply-agent']) assert.match(options, new RegExp(name));
assert.doesNotMatch(options, /mcp__drafts__save_reply_draft/);

const instructions = read('CLAUDE.md');
const day3Policy = read('day3-policy.txt').trim();
assert.ok(instructions.includes(day3Policy), 'CLAUDE.md must include the exact Day 3 priority and latest-chat policy.');
assert.match(instructions, /customer-context-agent[\s\S]*risk-agent[\s\S]*customer-reply-agent/);
assert.match(instructions, /internal risk note must not appear/i);
assert.match(instructions, /Decide the priority yourself/i);

const reply = read('agents/customer-reply-agent.md');
assert.match(reply, /Do not mention .*internal risk note/i);
assert.match(reply, /Do not claim or promise/i);
assert.match(reply, /Do not send the reply/i);

for (const command of [
  [path.join(lab, 'run.mjs'), '--customer', 'CUST-001', '--message', 'Can you send my invoice?', '--dry-run'],
  [path.join(lab, 'smoke-results.mjs')],
]) {
  const result = spawnSync(process.execPath, command, { cwd: project, encoding: 'utf8' });
  assert.equal(result.status, 0, result.stderr || result.stdout);
}

console.log('Day 4 parity check passed.');
console.log('Chat input, main-owned priority, three deterministic routes and post-validation draft storage are configured. Nothing was sent.');
console.log('This offline check does not test model behavior. Run the three examples live to verify the agent results.');
for (const item of cases) console.log(`${item.route.toUpperCase()} · ${item.customer_type} · ${item.message_id}`);
