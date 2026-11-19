import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';
import { test } from 'node:test';

const read = path => readFileSync(path, 'utf8');

test('the participant route contains the shared deck commands', () => {
  const solo = read('SOLO.md');
  const prompts = JSON.parse(read('docs/day4-lesson-prompts.json'));

  for (const [name, command] of Object.entries(prompts)) {
    assert.ok(solo.includes(command), `SOLO.md contains the exact ${name} command`);
  }
});

test('the final Day 3 sources are bundled and sanitized', () => {
  for (const file of ['n8n/day3-review-queue.json']) {
    const source = read(file);
    const workflow = JSON.parse(source);
    assert.ok(Array.isArray(workflow.nodes) && workflow.nodes.length > 0, `${file} has nodes`);
    assert.doesNotMatch(source, /"credentials"|"webhookId"|"cachedResultUrl"/);
  }

  const workflow = JSON.parse(read('n8n/day3-review-queue.json'));
  const names = workflow.nodes.map(node => node.name);
  for (const name of [
    'When chat message received',
    'AI Agent',
    'Simple Memory',
    'Customer Reply Agent',
    'Risk Agent',
    'Customer Context Agent',
    'Get row(s) in Data table',
    'Structured Output Parser',
    'Switch',
    'Save Low draft',
    'Save Medium draft',
    'Save High draft',
  ]) assert.ok(names.includes(name), `${name} is present in the final Day 3 source`);

  const day3Message = workflow.nodes.find(node => node.name === 'AI Agent').parameters.options.systemMessage;
  for (const line of read('day4-sdk-parity/day3-policy.txt').trim().split('\n')) {
    assert.ok(day3Message.includes(line), `the final Day 3 source contains: ${line}`);
  }
});

test('SOLO 5 bundles the parity exercise and its three sub-agents', () => {
  for (const file of [
    'day4-sdk-parity/verify.mjs',
    'day4-sdk-parity/run.mjs',
    'day4-sdk-parity/CLAUDE.md',
    'day4-sdk-parity/agents/customer-context-agent.md',
    'day4-sdk-parity/agents/risk-agent.md',
    'day4-sdk-parity/agents/customer-reply-agent.md',
  ]) assert.ok(existsSync(file), `${file} is bundled`);
});
