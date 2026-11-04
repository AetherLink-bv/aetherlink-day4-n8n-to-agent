import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { test } from 'node:test';

// A participant builds Step 1 by copying SOLO.md. These checks fail when SOLO.md and the finished
// files on this branch drift apart, so the hand-built path and the catch-up branch stay the same.
const solo = readFileSync('SOLO.md', 'utf8');
const section = solo.slice(solo.indexOf('## Step 1 ·'), solo.indexOf('## Step 2 ·'));
const blocks = [...section.matchAll(/^( *)```\w*\n([\s\S]*?)^\1```/gm)].map(([, indent, body]) =>
  body.split('\n').map((line) => (line.startsWith(indent) ? line.slice(indent.length) : line)).join('\n'));
const [buildOptions, claudeMd, schema, importLine, outputFormatLine] = blocks;

const imports = (text) => text.split('\n').filter((line) => line.startsWith('import ')).sort();
const body = (text) => text.split('\n').filter((line) => !line.startsWith('import ')).join('\n').trim();

test('SOLO Step 1: Build 2 and Build 3 are the finished files', () => {
  assert.equal(claudeMd, readFileSync('01-single-agent/claude-project/CLAUDE.md', 'utf8'));
  assert.equal(schema, readFileSync('01-single-agent/priority-schema.mjs', 'utf8'));
});

test('SOLO Step 1: Build 1 plus the import and outputFormat lines is the finished options.mjs', () => {
  const anchor = '    maxTurns: 3,\n';
  assert.ok(buildOptions.includes(anchor), 'Build 1 has the maxTurns line the outputFormat goes under');
  const built = importLine + buildOptions.replace(anchor, anchor + outputFormatLine);
  const finished = readFileSync('01-single-agent/options.mjs', 'utf8');
  assert.deepEqual(imports(built), imports(finished));
  assert.equal(body(built), body(finished));
});
