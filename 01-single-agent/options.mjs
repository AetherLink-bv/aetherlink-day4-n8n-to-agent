import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { prioritySchema } from './priority-schema.mjs';

const lessonDirectory = path.dirname(fileURLToPath(import.meta.url));

// n8n: the settings panel of the AI Agent node. SDK: the options object passed to query().
// Check your work with: npm run check:1
export function buildOptions() {
  return {
    // STEP 1: cwd → path.join(lessonDirectory, 'claude-project'): the agent works inside its own project folder.
    // STEP 1: settingSources → ['project', 'user']: 'project' loads claude-project/CLAUDE.md (the n8n "System Message"), 'user' loads your own Claude Code settings and login.
    // STEP 1: systemPrompt → { type: 'preset', preset: 'claude_code' }: CLAUDE.md is added on top of the preset.
    // STEP 1: tools → [] and disallowedTools → ['WebSearch', 'WebFetch', 'Bash']: this agent only reads and answers.
    // STEP 1: maxTurns → 3 (n8n: "Max Iterations").
    // STEP 1: outputFormat → { type: 'json_schema', schema: prioritySchema } (n8n: Structured Output Parser).
  };
}
