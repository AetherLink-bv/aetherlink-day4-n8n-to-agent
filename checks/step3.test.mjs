import assert from 'node:assert/strict';
import { existsSync } from 'node:fs';
import { test } from 'node:test';
import { buildOptions } from '../03-mcp/options.mjs';
import { workflowOutputSchema } from '../lib/workflow-output.mjs';
import { assertAgentFile, assertBaseOptions } from './helpers.mjs';

const lookupTools = ['mcp__support__get_customer', 'mcp__support__get_transaction'];

test('Step 3: the context specialist looks up facts and never guesses', () => {
  const body = assertAgentFile(assert, 'customer-context-agent');
  assert.match(body, /get_customer/, 'customer-context-agent uses get_customer');
  assert.match(body, /get_transaction/, 'customer-context-agent uses get_transaction');
  assert.match(body, /customer not found/i, 'it says "customer not found" when no row matches');
  assert.match(body, /never guess/i, 'it never guesses');
});

test('Step 3: only the context specialist reaches the read-only MCP server', () => {
  const options = buildOptions();
  assertBaseOptions(assert, options, '03-mcp');
  const server = options.mcpServers?.support;
  assert.equal(server?.type, 'stdio', 'mcpServers.support is a stdio server');
  assert.equal(server?.command, 'node');
  assert.ok(existsSync(server?.args?.[0] ?? ''), 'mcpServers.support starts support-mcp/server.js');

  assert.deepEqual(Object.keys(options.agents ?? {}).sort(), ['customer-context-agent', 'customer-reply-agent', 'risk-agent']);
  assert.deepEqual(options.agents['customer-context-agent'].tools, lookupTools, 'customer-context-agent has both lookup tools');
  assert.deepEqual(options.agents['risk-agent'].tools, [], 'risk-agent has no tools');
  assert.deepEqual(options.agents['customer-reply-agent'].tools, [], 'customer-reply-agent has no tools');

  assert.deepEqual(options.tools, ['Agent'], "tools is ['Agent']: the team lead may only delegate");
  assert.deepEqual([...(options.allowedTools ?? [])].sort(), ['Agent', ...lookupTools].sort());
  assert.equal(options.maxTurns, 10, 'maxTurns is 10');
  assert.deepEqual(options.outputFormat, { type: 'json_schema', schema: workflowOutputSchema });
});
