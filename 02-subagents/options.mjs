import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { loadAgent } from '../lib/agents.mjs';
import { workflowOutputSchema } from '../lib/workflow-output.mjs';

const lessonDirectory = path.dirname(fileURLToPath(import.meta.url));

// n8n: the AI Agent with two agent tools connected. SDK: one team lead with options.agents.
export function buildOptions() {
  return {
    cwd: path.join(lessonDirectory, 'claude-project'),
    settingSources: ['project', 'user'],
    systemPrompt: { type: 'preset', preset: 'claude_code' },
    agents: {
      'risk-agent': loadAgent('risk-agent'),
      'customer-reply-agent': loadAgent('customer-reply-agent'),
    },
    tools: ['Agent'],
    allowedTools: ['Agent'],
    disallowedTools: ['WebSearch', 'WebFetch', 'Bash'],
    maxTurns: 10,
    outputFormat: { type: 'json_schema', schema: workflowOutputSchema },
  };
}
