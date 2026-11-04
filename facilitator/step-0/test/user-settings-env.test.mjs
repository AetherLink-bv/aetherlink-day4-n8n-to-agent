import assert from 'node:assert/strict';
import { mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { test } from 'node:test';
import {
  describeUserSettingsEnv,
  readUserSettingsEnv,
  withUserSettingsEnv,
} from '../lib/user-settings-env.mjs';

function configDir(settings) {
  const directory = mkdtempSync(path.join(tmpdir(), 'w4-settings-'));
  if (settings !== undefined) {
    writeFileSync(path.join(directory, 'settings.json'), typeof settings === 'string' ? settings : JSON.stringify(settings));
  }
  return directory;
}

test('login settings: only the login variables of the user settings reach the lesson', () => {
  const directory = configDir({
    env: {
      CLAUDE_CODE_USE_VERTEX: '1',
      CLOUD_ML_REGION: 'europe-west1',
      ANTHROPIC_VERTEX_PROJECT_ID: 'wl-demo',
      HTTPS_PROXY: 'http://proxy.example:8080',
      CLAUDE_CODE_FORK_SUBAGENT: '1',
      CLAUDE_CODE_EXPERIMENTAL_AGENT_TEAMS: '1',
      MAX_MCP_OUTPUT_TOKENS: '50000',
      MAX_TURNS: 3,
    },
    mcpServers: { personal: { command: 'node' } },
  });
  try {
    const settings = readUserSettingsEnv({ env: { CLAUDE_CONFIG_DIR: directory } });
    assert.deepEqual(settings.env, {
      CLAUDE_CODE_USE_VERTEX: '1',
      CLOUD_ML_REGION: 'europe-west1',
      ANTHROPIC_VERTEX_PROJECT_ID: 'wl-demo',
      HTTPS_PROXY: 'http://proxy.example:8080',
    });
    assert.deepEqual(withUserSettingsEnv({ PATH: '/bin', CLOUD_ML_REGION: 'us-east5' }, settings), {
      CLAUDE_CODE_USE_VERTEX: '1',
      CLOUD_ML_REGION: 'us-east5',
      ANTHROPIC_VERTEX_PROJECT_ID: 'wl-demo',
      HTTPS_PROXY: 'http://proxy.example:8080',
      PATH: '/bin',
    });
    const line = describeUserSettingsEnv(settings);
    assert.match(line, /^Login settings \(Vertex AI\): ANTHROPIC_VERTEX_PROJECT_ID, CLAUDE_CODE_USE_VERTEX, CLOUD_ML_REGION, HTTPS_PROXY from /);
    assert.doesNotMatch(line, /wl-demo|europe-west1|proxy\.example/);
  } finally {
    rmSync(directory, { recursive: true, force: true });
  }
});

test('login settings: a missing or broken settings file never stops a lesson', () => {
  const missing = configDir();
  const broken = configDir('{ not json');
  try {
    const none = readUserSettingsEnv({ env: { CLAUDE_CONFIG_DIR: missing } });
    assert.deepEqual(none.env, {});
    assert.match(describeUserSettingsEnv(none), /^Login settings: none in /);
    const bad = readUserSettingsEnv({ env: { CLAUDE_CONFIG_DIR: broken } });
    assert.deepEqual(bad.env, {});
    assert.match(describeUserSettingsEnv(bad), /^Login settings: could not read /);
  } finally {
    rmSync(missing, { recursive: true, force: true });
    rmSync(broken, { recursive: true, force: true });
  }
});
