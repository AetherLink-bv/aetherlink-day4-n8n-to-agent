import { existsSync, readFileSync } from 'node:fs';
import { homedir } from 'node:os';
import path from 'node:path';

// Company logins (Vertex AI, Bedrock, a gateway or proxy) live in the env block of
// ~/.claude/settings.json. The lessons load user settings, but a lesson can still set its own
// settingSources, so the login-based backends also copy the login variables from that block.
// npm run doctor uses the same reader to name them.
const loginPrefixes = [
  'CLAUDE_CODE_USE_',
  'CLAUDE_CODE_SKIP_',
  'ANTHROPIC_VERTEX_',
  'ANTHROPIC_BEDROCK_',
  'ANTHROPIC_FOUNDRY_',
  'ANTHROPIC_DEFAULT_',
  'VERTEX_REGION_',
  'CLOUD_ML_',
  'GOOGLE_',
  'AWS_',
];
const loginNames = new Set([
  'ANTHROPIC_BASE_URL',
  'ANTHROPIC_AUTH_TOKEN',
  'ANTHROPIC_CUSTOM_HEADERS',
  'ANTHROPIC_MODEL',
  'ANTHROPIC_SMALL_FAST_MODEL',
  'CLAUDE_CODE_CLIENT_CERT',
  'CLAUDE_CODE_CLIENT_KEY',
  'NODE_EXTRA_CA_CERTS',
  'HTTPS_PROXY',
  'HTTP_PROXY',
  'NO_PROXY',
]);

export function isLoginVariable(name) {
  return loginNames.has(name) || loginPrefixes.some((prefix) => name.startsWith(prefix));
}

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
    const values = Object.fromEntries(Object.entries(block)
      .filter(([name, value]) => typeof value === 'string' && isLoginVariable(name)));
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
