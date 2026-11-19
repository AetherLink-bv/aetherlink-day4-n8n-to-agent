import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { StdioClientTransport } from '@modelcontextprotocol/sdk/client/stdio.js';

const lab = path.dirname(fileURLToPath(import.meta.url));

export async function saveReviewDraft(arguments_, { draftsDirectory } = {}) {
  const client = new Client({ name: 'day4-parity', version: '1.0.0' });
  const transport = new StdioClientTransport({
    command: process.execPath,
    args: [path.join(lab, 'drafts-server.mjs')],
    env: { ...process.env, ...(draftsDirectory ? { DRAFTS_DIR: draftsDirectory } : {}) },
  });
  try {
    await client.connect(transport);
    const result = await client.callTool({ name: 'save_reply_draft', arguments: arguments_ });
    if (result.isError) throw new Error(result.content?.[0]?.text ?? 'Draft tool failed.');
    return result.content?.[0]?.text ?? '';
  } finally {
    await client.close().catch(() => {});
  }
}
