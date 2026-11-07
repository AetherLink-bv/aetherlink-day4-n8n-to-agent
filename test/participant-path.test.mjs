import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { test } from 'node:test';

const read = (path) => readFileSync(path, 'utf8');

test('participant docs stay on one branch and use five prompt-first assignments', () => {
  const docs = `${read('README.md')}\n${read('SOLO.md')}`;
  const packageJson = JSON.parse(read('package.json'));

  assert.equal(packageJson.name, 'aetherlink-day4-n8n-to-agent');
  assert.doesNotMatch(docs, /git (?:checkout|switch) (?:origin\/)?(?:step-|solution)/i);
  assert.doesNotMatch(docs, /copy (?:the )?(?:code|files?).*finished branch/i);
  for (let step = 0; step <= 4; step += 1) {
    assert.match(read('SOLO.md'), new RegExp(`## SOLO ${step} \\u00b7`));
  }
  assert.match(docs, /Claude Code/i);
  assert.match(docs, /observable check|Visible evidence/i);
  assert.match(docs, /\*\*Stop:\*\*/i);
});

test('the sanitized n8n source defines the complete app contract', () => {
  const workflow = JSON.parse(read('n8n/support-triage.json'));
  const names = workflow.nodes.map(({ name }) => name);
  const source = JSON.stringify(workflow);
  const parameters = Object.fromEntries(workflow.nodes.map(({ name, parameters }) => [name, parameters]));

  for (const name of ['Customer Context Agent', 'Risk Agent', 'Customer Reply Agent', 'Structured Output Parser', 'Switch']) {
    assert.ok(names.includes(name), `${name} is missing`);
  }
  assert.match(source, /ticket_id/);
  assert.match(source, /priority/);
  assert.match(source, /message/);
  assert.match(source, /ignoreCase/);
  assert.doesNotMatch(source, /credentials|webhookId|cachedResultUrl/);
  assert.equal(parameters['Simple Memory'].sessionKey, '={{ $json.ticket_id }}');
  assert.deepEqual(JSON.parse(parameters['Structured Output Parser'].jsonSchemaExample), { priority: '', message: '' });
  assert.equal(parameters.Switch.options.ignoreCase, true);
  assert.deepEqual(
    ['low', 'medium', 'high'].map((name) => parameters[name].assignments.assignments[0].value),
    ['auto_reply', 'investigate', 'escalate'],
  );

  const systemMessage = parameters['AI Agent'].options.systemMessage;
  const context = systemMessage.indexOf('Ask it first');
  const risk = systemMessage.indexOf('before you decide');
  const reply = systemMessage.indexOf('Ask it last');
  assert.ok(context >= 0 && risk >= 0 && reply >= 0);
});
