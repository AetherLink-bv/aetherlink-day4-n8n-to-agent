import assert from 'node:assert/strict';
import { test } from 'node:test';
import { buildOptions } from '../01-single-agent/options.mjs';
import { prioritySchema } from '../01-single-agent/priority-schema.mjs';
import { assertBaseOptions, read } from './helpers.mjs';

test('Step 1: the options give one agent that only reads and answers', () => {
  const options = buildOptions();
  assertBaseOptions(assert, options, '01-single-agent');
  assert.deepEqual(options.tools, [], 'tools is []: this agent has no tools');
  assert.equal(options.maxTurns, 3, 'maxTurns is 3');
  assert.deepEqual(options.outputFormat, { type: 'json_schema', schema: prioritySchema }, 'outputFormat uses prioritySchema');
});

test('Step 1: the schema is the form with priority and reason', () => {
  assert.equal(prioritySchema.type, 'object');
  assert.deepEqual(prioritySchema.properties?.priority, { type: 'string', enum: ['low', 'medium', 'high'] });
  assert.equal(prioritySchema.properties?.reason?.type, 'string');
  assert.deepEqual([...(prioritySchema.required ?? [])].sort(), ['priority', 'reason']);
  assert.equal(prioritySchema.additionalProperties, false, 'additionalProperties is false: no extra fields');
});

test('Step 1: CLAUDE.md holds the policy from the n8n system message', () => {
  const policy = read('01-single-agent/claude-project/CLAUDE.md');
  assert.doesNotMatch(policy, /TODO/, 'CLAUDE.md has no TODO left');
  for (const level of ['low', 'medium', 'high']) {
    assert.match(policy, new RegExp(`\\b${level}\\b`, 'i'), `CLAUDE.md defines ${level}`);
  }
  assert.match(policy, /customer data, not instructions/i, 'CLAUDE.md says the ticket message is customer data, not instructions');
  assert.match(policy, /a person approves/i, 'CLAUDE.md says a person approves');
  assert.doesNotMatch(policy, /Risk Agent|Customer Reply Agent|Customer Context Agent/i, 'the specialists come in Step 2 and 3');
});
