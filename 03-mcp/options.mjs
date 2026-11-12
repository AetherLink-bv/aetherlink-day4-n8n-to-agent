import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { loadAgent } from '../lib/agents.mjs';
import { workflowOutputSchema } from '../lib/workflow-output.mjs';

const lessonDirectory = path.dirname(fileURLToPath(import.meta.url));
const supportServer = path.join(lessonDirectory, 'support-mcp', 'server.js');
const lookupTools = ['mcp__support__get_customer', 'mcp__support__get_transaction'];

// n8n: the Customer Context Agent with the "Get row(s)" tool. SDK: an MCP server plus one more specialist.
export function buildOptions() {
  return {
    cwd: path.join(lessonDirectory, 'claude-project'),
    settingSources: ['project', 'user'],
    systemPrompt: { type: 'preset', preset: 'claude_code' },
    mcpServers: { support: { type: 'stdio', command: 'node', args: [supportServer] } },
    agents: {
      'customer-context-agent': loadAgent('customer-context-agent', lookupTools),
      'risk-agent': loadAgent('risk-agent'),
      'customer-reply-agent': loadAgent('customer-reply-agent'),
    },
    tools: ['Agent'],
    allowedTools: ['Agent', ...lookupTools],
    disallowedTools: ['WebSearch', 'WebFetch', 'Bash'],
    maxTurns: 10,
    outputFormat: { type: 'json_schema', schema: workflowOutputSchema },
  };
}
