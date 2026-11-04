import assert from 'node:assert/strict';
import { test } from 'node:test';
import { toClaudeArgs } from '../lib/backend.mjs';

// Without --strict-mcp-config every subagent also gets the claude.ai connectors of the participant's
// account. On one account that made a single Step 2 message cost $5.13 instead of $0.13.
test('claude-code runs only use the MCP servers the lesson names', () => {
  assert.ok(toClaudeArgs('Customer message', { tools: [] }).includes('--strict-mcp-config'));

  const args = toClaudeArgs('Customer message', {
    mcpServers: { customers: { type: 'stdio', command: 'node', args: ['customers.js'] } },
  });
  assert.equal(args.filter((arg) => arg === '--strict-mcp-config').length, 1);
  assert.deepEqual(JSON.parse(args[args.indexOf('--mcp-config') + 1]).mcpServers, {
    customers: { type: 'stdio', command: 'node', args: ['customers.js'] },
  });
});
