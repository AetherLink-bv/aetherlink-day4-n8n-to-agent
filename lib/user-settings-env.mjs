import { existsSync, readFileSync } from 'node:fs';
import { homedir } from 'node:os';
import path from 'node:path';

// The lessons load only project settings, so Claude Code would skip the env block in
// ~/.claude/settings.json. Company logins (Vertex AI, Bedrock, a proxy) live there, so the
// login-based backends copy just that block, not the user's CLAUDE.md, MCP servers or hooks.
export function userSettingsFile({ env = process.env, home = homedir() } = {}) {
  return path.join(env.CLAUDE_CONFIG_DIR || path.join(home, '.claude'), 'settings.json');
}

export function readUserSettingsEnv({ env = process.env, home = homedir() } = {}) {
  const file = userSettingsFile({ env, home });
  if (!existsSync(file)) {
    return { file, env: {}, error: null };
  }
  try {
    const block = JSON.parse(readFileSync(file, 'utf8')).env;
    if (!block || typeof block !== 'object' || Array.isArray(block)) {
      return { file, env: {}, error: null };
    }
    const values = Object.fromEntries(Object.entries(block).filter(([, value]) => typeof value === 'string'));
    return { file, env: values, error: null };
  } catch (error) {
    return { file, env: {}, error: `could not read ${file}: ${error.message}` };
  }
}

export function withUserSettingsEnv(base = process.env, settings = readUserSettingsEnv()) {
  return { ...settings.env, ...base };
}

export function describeUserSettingsEnv(settings) {
  if (settings.error) {
    return `Login settings: ${settings.error}`;
  }
  const names = Object.keys(settings.env).sort();
  if (names.length === 0) {
    return `Login settings: none in ${settings.file}`;
  }
  const provider = names.includes('CLAUDE_CODE_USE_VERTEX')
    ? ' (Vertex AI)'
    : names.includes('CLAUDE_CODE_USE_BEDROCK') ? ' (Amazon Bedrock)' : '';
  return `Login settings${provider}: ${names.join(', ')} from ${settings.file}`;
}
