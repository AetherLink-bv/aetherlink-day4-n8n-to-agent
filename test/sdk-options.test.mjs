import assert from 'node:assert/strict';
import { test } from 'node:test';
import { sdkQueryOptions } from '../lib/run.mjs';

// The SDK backends get the same rule as claude-code: only the lesson's own MCP servers.
test('SDK runs only use the MCP servers the lesson names', () => {
  const options = { tools: [], mcpServers: { customers: { type: 'stdio', command: 'node' } } };
  const sdk = sdkQueryOptions(options, 'sdk', { PATH: '/bin', ANTHROPIC_API_KEY: 'test-key' });
  const login = sdkQueryOptions(options, 'sdk-login', { PATH: '/bin' });
  assert.equal(sdk.strictMcpConfig, true);
  assert.equal(login.strictMcpConfig, true);
  assert.deepEqual(sdk.mcpServers, options.mcpServers);
  assert.deepEqual(sdk.settingSources, ['project']);
  assert.deepEqual(login.settingSources, ['project']);
  assert.equal(sdk.extraArgs['no-chrome'], null);
  assert.equal(login.extraArgs['no-chrome'], null);
  assert.equal(sdk.env.PATH, '/bin');
  assert.equal(sdk.env.ANTHROPIC_API_KEY, 'test-key');
  assert.equal(login.env.PATH, '/bin');
  assert.equal(sdk.env.CLAUDE_CODE_DISABLE_AUTO_MEMORY, '1');
  assert.equal(login.env.CLAUDE_CODE_DISABLE_AUTO_MEMORY, '1');
  assert.equal(options.strictMcpConfig, undefined);
});
