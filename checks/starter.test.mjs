import assert from 'node:assert/strict';
import { test } from 'node:test';
import { read } from './helpers.mjs';

// Only for the main branch in CI. It fails as soon as a participant builds a step, so it is not part of npm test.
test('the starter leaves every build step to the participant', () => {
  for (const file of ['01-single-agent/options.mjs', '01-single-agent/priority-schema.mjs', '02-subagents/options.mjs', '03-mcp/options.mjs']) {
    assert.match(read(file), /STEP \d:/, `${file} still has its TODOs`);
  }
  for (const agent of ['risk-agent', 'customer-reply-agent', 'customer-context-agent']) {
    assert.match(read(`.claude/agents/${agent}.md`), /TODO \(Step \d\)/, `${agent}.md still has its TODOs`);
  }
});
