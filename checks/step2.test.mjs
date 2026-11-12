import assert from 'node:assert/strict';
import { test } from 'node:test';
import { buildOptions } from '../02-subagents/options.mjs';
import { workflowOutputSchema } from '../lib/workflow-output.mjs';
import { assertAgentFile, assertBaseOptions } from './helpers.mjs';

test('Step 2: each specialist is one file with a description and a system message', () => {
  assert.match(assertAgentFile(assert, 'risk-agent'), /risk note/i, 'risk-agent returns a risk note');
  assert.match(assertAgentFile(assert, 'customer-reply-agent'), /draft/i, 'customer-reply-agent writes a draft');
});

test('Step 2: the team lead delegates to two specialists and returns {priority, message}', () => {
  const options = buildOptions();
  assertBaseOptions(assert, options, '02-subagents');
  assert.deepEqual(Object.keys(options.agents ?? {}).sort(), ['customer-reply-agent', 'risk-agent']);
  for (const [name, agent] of Object.entries(options.agents)) {
    assert.deepEqual(agent.tools, [], `${name} has no tools`);
  }
  assert.deepEqual(options.tools, ['Agent'], "tools is ['Agent']: the team lead may only delegate");
  assert.deepEqual(options.allowedTools, ['Agent'], "allowedTools is ['Agent']");
  assert.equal(options.maxTurns, 10, 'maxTurns is 10');
  assert.deepEqual(options.outputFormat, { type: 'json_schema', schema: workflowOutputSchema }, 'outputFormat uses workflowOutputSchema');
});
