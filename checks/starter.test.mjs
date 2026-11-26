import assert from 'node:assert/strict';
import { test } from 'node:test';
import { execFileSync } from 'node:child_process';
import { read, root } from './helpers.mjs';

// Only for the main branch in CI. It fails as soon as a participant builds a step, so it is not part of npm test.
test('the starter leaves every build step to the participant', () => {
  for (const file of ['01-single-agent/options.mjs', '01-single-agent/priority-schema.mjs', '02-subagents/options.mjs', '03-mcp/options.mjs']) {
    assert.match(read(file), /STEP \d:/, `${file} still has its TODOs`);
  }
  for (const agent of ['risk-agent', 'customer-reply-agent', 'customer-context-agent']) {
    assert.match(read(`.claude/agents/${agent}.md`), /TODO \(Step \d\)/, `${agent}.md still has its TODOs`);
  }
});

test('one starter contains the lesson sources and runs the bundled A5 exercise offline', () => {
  for (const file of ['n8n/day3-review-queue.json', 'n8n/support-triage.json', 'docs/sample-trace.md', 'docs/memory-lab/T-001.md', 'docs/memory-lab/T-002.md']) {
    assert.ok(read(file).trim(), file);
  }
  execFileSync(process.execPath, ['day4-sdk-parity/verify.mjs'], { cwd: root });
});
