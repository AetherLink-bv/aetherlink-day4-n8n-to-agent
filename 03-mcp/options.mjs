import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { loadAgent } from '../lib/agents.mjs';
import { workflowOutputSchema } from '../lib/workflow-output.mjs';

const lessonDirectory = path.dirname(fileURLToPath(import.meta.url));
const supportServer = path.join(lessonDirectory, 'support-mcp', 'server.js');
const lookupTools = ['mcp__support__get_customer', 'mcp__support__get_transaction'];

// n8n: the Customer Context Agent with the "Get row(s)" tool. SDK: an MCP server plus one more specialist.
// Check your work with: npm run check:3
export function buildOptions() {
  return {
    // STEP 3: start from your Step 2 options. cwd is this lesson's claude-project.
    // STEP 3: mcpServers → { support: { type: 'stdio', command: 'node', args: [supportServer] } } (n8n: the data table tool).
    // STEP 3: agents → add 'customer-context-agent': loadAgent('customer-context-agent', lookupTools).
    //         Only this specialist gets the lookup tools. risk-agent and customer-reply-agent keep no tools.
    // STEP 3: allowedTools → ['Agent', ...lookupTools]: the lookups run without a permission question.
  };
}
