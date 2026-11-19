import { mkdirSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { z } from 'zod';

const lab = path.dirname(fileURLToPath(import.meta.url));
const drafts = path.resolve(process.env.DRAFTS_DIR ?? path.join(lab, 'review-drafts'));
const server = new McpServer({ name: 'drafts', version: '1.0.0' });

server.registerTool('save_reply_draft', {
  description: 'Save a reply draft for a person to review. This tool never sends a message.',
  inputSchema: {
    message_id: z.string().regex(/^(MSG-\d{2}|CHAT-\d{13}-[a-f0-9]{6})$/),
    priority: z.enum(['low', 'medium', 'high']),
    route: z.enum(['auto_reply', 'investigate', 'escalate']),
    subject: z.string(),
    body: z.string(),
  },
  annotations: { title: 'Save reply draft', readOnlyHint: false, destructiveHint: true, openWorldHint: false },
}, async ({ message_id, priority, route, subject, body }) => {
  mkdirSync(drafts, { recursive: true });
  const target = path.join(drafts, `${message_id}.md`);
  writeFileSync(target, `DRAFT - a person reviews this before sending.\n\nPriority: ${priority}\nRoute: ${route}\nSubject: ${subject}\n\n${body}\n`);
  return { content: [{ type: 'text', text: `Draft saved for human review: ${target}` }] };
});

await server.connect(new StdioServerTransport());
