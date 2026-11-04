import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { test } from 'node:test';

// SOLO.md gives the exact text that npm run check:assignment looks for. These checks fail when that
// text and the finished files on this branch drift apart.
const solo = readFileSync('SOLO.md', 'utf8');
const core = solo.slice(solo.indexOf('### Part 1 ·'), solo.indexOf('### Part 3 ·'));
const blocks = [...core.matchAll(/^( *)```(\w+)\n([\s\S]*?)^\1```/gm)].map(([, indent, lang, body]) => ({
  lang,
  body: body.split('\n').map((line) => (line.startsWith(indent) ? line.slice(indent.length) : line)).join('\n'),
}));
const json = blocks.filter((block) => block.lang === 'json').map((block) => JSON.parse(block.body));
const rules = blocks.find((block) => block.lang === 'markdown').body.trim().split('\n');

test('SOLO assignment: the CLAUDE.md rules are the finished rules, word for word', () => {
  assert.equal(rules.length, 3);
  const claude = readFileSync('03-mcp/claude-project/CLAUDE.md', 'utf8');
  for (const rule of rules) assert.ok(claude.includes(rule), rule);
});

test('SOLO assignment: the .mcp.json and settings.json blocks match the finished files', () => {
  const [mcp, settings] = json;
  const finishedMcp = JSON.parse(readFileSync('03-mcp/claude-project/.mcp.json', 'utf8'));
  for (const [name, server] of Object.entries(mcp.mcpServers)) {
    assert.deepEqual(server, finishedMcp.mcpServers[name], name);
  }
  assert.deepEqual(settings, JSON.parse(readFileSync('03-mcp/claude-project/.claude/settings.json', 'utf8')));
});

test('SOLO assignment: the names the core check needs are in Part 1 and 2', () => {
  for (const name of ['buildResolveOptions', 'createSdkHooks', 'TRANSACTIONS_WRITES_ENABLED', 'transaction-guard.mjs', 'transaction-agent.md']) {
    assert.ok(core.includes(name), name);
  }
});
