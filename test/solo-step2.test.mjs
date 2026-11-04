import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { test } from 'node:test';

// A participant builds Step 2 by copying SOLO.md (Option A). These checks fail when SOLO.md and the
// finished Step 2 files on this branch drift apart.
const solo = readFileSync('SOLO.md', 'utf8');
const section = solo.slice(solo.indexOf('## Step 2 ·'), solo.indexOf('## Step 3 ·'));

test('SOLO Step 2: every file it tells you to create is the finished file', () => {
  const created = [...section.matchAll(/Create `([^`]+)`[^\n]*:\n\n```\w*\n([\s\S]*?)```/g)];
  assert.deepEqual(created.map(([, file]) => file), [
    '.claude/agents/risk-agent.md',
    '.claude/agents/customer-reply-agent.md',
    'lib/agents.mjs',
    '02-subagents/agents.mjs',
    '02-subagents/ticket-schema.mjs',
    '02-subagents/options.mjs',
    '02-subagents/agent.mjs',
    '02-subagents/claude-project/CLAUDE.md',
  ]);
  for (const [, file, body] of created) {
    assert.equal(body, readFileSync(file, 'utf8'), file);
  }
});

test('SOLO Step 2: the package.json lines are the finished scripts', () => {
  const lines = [...section.matchAll(/```json\n\s*("[^"]+": "[^\n]*"),?\n\s*```/g)].map(([, line]) => JSON.parse(`{${line}}`));
  const { scripts } = JSON.parse(readFileSync('package.json', 'utf8'));
  assert.deepEqual(lines, [{ lesson2: scripts.lesson2 }, { verify: scripts.verify }]);
});
