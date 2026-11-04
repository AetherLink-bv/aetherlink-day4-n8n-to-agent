import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { test } from 'node:test';

// SOLO.md Step 3 shows the Step 3 files to read along. These checks fail when the text in SOLO.md
// no longer matches the files on this branch.
const solo = readFileSync('SOLO.md', 'utf8');
const section = solo.slice(solo.indexOf('### Read along: what the Step 3 files contain'), solo.indexOf('## Step 4 ·'));

test('SOLO Step 3: every file it shows is the file on this branch', () => {
  const shown = [...section.matchAll(/`([^`\s]+\.(?:js|mjs|md|json))`[^\n]*:\n\n```\w*\n([\s\S]*?)\n```/g)];
  assert.deepEqual(shown.map(([, file]) => file), [
    '03-mcp/transaction-mcp/server.js',
    '03-mcp/options.mjs',
    '.mcp.json',
    '.claude/agents/risk-agent.md',
    '.claude/agents/customer-context-agent.md',
    '03-mcp/claude-project/CLAUDE.md',
  ]);
  for (const [, file, body] of shown) {
    assert.ok(readFileSync(file, 'utf8').includes(body), `${file} no longer matches SOLO.md Step 3`);
  }
});
