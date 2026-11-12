import assert from 'node:assert/strict';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { StdioClientTransport } from '@modelcontextprotocol/sdk/client/stdio.js';

// Starts the MCP server the way the agent does and calls both tools. No model call.
const server = path.join(path.dirname(fileURLToPath(import.meta.url)), 'server.js');
const client = new Client({ name: 'support-smoke', version: '1.0.0' });
await client.connect(new StdioClientTransport({ command: process.execPath, args: [server] }));

const call = async (name, args) => {
  const result = await client.callTool({ name, arguments: args });
  const text = result.content.map((block) => block.text ?? '').join('');
  return { isError: Boolean(result.isError), text, value: result.isError ? null : JSON.parse(text) };
};

try {
  const { tools } = await client.listTools();
  assert.deepEqual(tools.map((tool) => tool.name).sort(), ['get_customer', 'get_transaction']);
  assert.ok(tools.every((tool) => tool.annotations?.readOnlyHint === true), 'every tool is read-only');

  const customer = await call('get_customer', { customer_id: 'CUST-003' });
  assert.equal(customer.value.customer_name, 'GlobalPay Commerce');
  assert.equal(customer.value.critical, true);
  const noCustomer = await call('get_customer', { customer_id: 'CUST-999' });
  assert.ok(noCustomer.isError && /customer not found/.test(noCustomer.text));

  const transaction = await call('get_transaction', { transaction_id: 'TX-1014' });
  assert.equal(transaction.value.transaction_id, 'TX-1014');
  assert.ok(transaction.value.status, 'the transaction has a status');
  const noTransaction = await call('get_transaction', { transaction_id: 'TX-9999' });
  assert.ok(noTransaction.isError && /transaction not found/.test(noTransaction.text));

  console.log('MCP smoke: get_customer and get_transaction read the data, 2 read-only tools');
} finally {
  await client.close();
}
