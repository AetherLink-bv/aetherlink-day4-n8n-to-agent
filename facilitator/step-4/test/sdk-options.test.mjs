import assert from 'node:assert/strict';
import { test } from 'node:test';
import { sdkQueryOptions } from '../lib/run.mjs';

// The SDK backends get the same rule as claude-code: only the lesson's own MCP servers.
test('SDK runs only use the MCP servers the lesson names', () => {
  const options = { tools: [], mcpServers: { customers: { type: 'stdio', command: 'node' } } };
  assert.equal(sdkQueryOptions(options, 'sdk').strictMcpConfig, true);
  assert.equal(sdkQueryOptions(options, 'sdk-login', { PATH: '/bin' }).strictMcpConfig, true);
  assert.deepEqual(sdkQueryOptions(options, 'sdk').mcpServers, options.mcpServers);
  assert.equal(sdkQueryOptions(options, 'sdk').env, undefined);
  assert.equal(sdkQueryOptions(options, 'sdk-login', { PATH: '/bin' }).env.PATH, '/bin');
  assert.equal(options.strictMcpConfig, undefined);
});
