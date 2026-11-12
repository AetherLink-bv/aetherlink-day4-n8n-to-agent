import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { loadAgent } from '../lib/agents.mjs';
import { workflowOutputSchema } from '../lib/workflow-output.mjs';

const lessonDirectory = path.dirname(fileURLToPath(import.meta.url));

// n8n: the AI Agent with two agent tools connected. SDK: one team lead with options.agents.
// Check your work with: npm run check:2
export function buildOptions() {
  return {
    // STEP 2: cwd, settingSources, systemPrompt and disallowedTools → the same as in Step 1. cwd is this lesson's claude-project.
    // STEP 2: agents → { 'risk-agent': loadAgent('risk-agent'), 'customer-reply-agent': loadAgent('customer-reply-agent') }
    //         (n8n: the Risk Agent and Customer Reply Agent tool nodes). loadAgent reads .claude/agents/<name>.md.
    // STEP 2: tools → ['Agent'] and allowedTools → ['Agent']: the team lead may only delegate.
    // STEP 2: maxTurns → 10: the team lead needs turns to ask each specialist.
    // STEP 2: outputFormat → { type: 'json_schema', schema: workflowOutputSchema } (n8n: {priority, message}).
  };
}
