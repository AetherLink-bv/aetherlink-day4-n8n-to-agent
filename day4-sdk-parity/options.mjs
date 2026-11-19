import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { loadAgent } from '../lib/agents.mjs';

const lab = path.dirname(fileURLToPath(import.meta.url));
const supportServer = path.resolve(lab, '..', '03-mcp', 'support-mcp', 'server.js');
const agent = (name, tools = []) => loadAgent(name, tools, path.join(lab, 'agents', `${name}.md`));

export const outputSchema = {
  type: 'object',
  properties: {
    priority: { type: 'string', enum: ['low', 'medium', 'high'] },
    message: { type: 'string' },
  },
  required: ['priority', 'message'],
  additionalProperties: false,
};

export function buildOptions() {
  const lookupTools = ['mcp__support__get_customer', 'mcp__support__get_transaction'];
  return {
    cwd: lab,
    settingSources: ['project', 'user'],
    systemPrompt: { type: 'preset', preset: 'claude_code' },
    mcpServers: {
      support: { type: 'stdio', command: 'node', args: [supportServer] },
    },
    agents: {
      'customer-context-agent': agent('customer-context-agent', lookupTools),
      'risk-agent': agent('risk-agent'),
      'customer-reply-agent': agent('customer-reply-agent'),
    },
    tools: ['Agent'],
    allowedTools: ['Agent', ...lookupTools],
    disallowedTools: ['WebSearch', 'WebFetch', 'Bash', 'Write', 'Edit'],
    maxTurns: 12,
    outputFormat: { type: 'json_schema', schema: outputSchema },
  };
}
