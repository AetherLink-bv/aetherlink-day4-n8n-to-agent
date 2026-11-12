import { readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

export const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
export const read = (file) => readFileSync(path.join(root, file), 'utf8');
export const blocked = ['WebSearch', 'WebFetch', 'Bash'];

// The parts every step shares: the project folder, both setting sources, the preset and the blocked tools.
export function assertBaseOptions(assert, options, lesson) {
  assert.equal(options.cwd, path.join(root, lesson, 'claude-project'), `cwd is ${lesson}/claude-project`);
  assert.deepEqual(options.settingSources, ['project', 'user'], "settingSources is ['project', 'user']");
  assert.deepEqual(options.systemPrompt, { type: 'preset', preset: 'claude_code' }, 'systemPrompt is the claude_code preset');
  for (const tool of blocked) {
    assert.ok(options.disallowedTools?.includes(tool), `disallowedTools blocks ${tool}`);
  }
}

export function assertAgentFile(assert, name) {
  const text = read(`.claude/agents/${name}.md`);
  const match = text.match(/^---\r?\n([\s\S]*?)\r?\n---\r?\n([\s\S]*)$/);
  assert.ok(match, `${name}.md keeps its --- frontmatter block`);
  assert.doesNotMatch(text, /TODO/, `${name}.md has no TODO left`);
  assert.match(match[1], new RegExp(`^name: ${name}$`, 'm'), `${name}.md keeps name: ${name}`);
  assert.ok(/^description:\s*\S.{20,}$/m.test(match[1]), `${name}.md has a description that says when to use it`);
  assert.ok(match[2].trim().length >= 80, `${name}.md has a system message in its body`);
  return match[2];
}
