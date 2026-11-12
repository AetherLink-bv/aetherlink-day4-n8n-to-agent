import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import readXlsxFile from 'read-excel-file/node';
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { z } from 'zod';

// n8n: the "Get row(s) in Data table" tool. SDK: an MCP server that the agent starts over stdio.
// Both tools only read. The data files stay in docs/, outside every claude-project folder.
const docs = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..', 'docs');
const customersPath = process.env.CUSTOMER_CONTEXT_CSV ?? path.join(docs, 'customer_context.csv');
const transactionsPath = process.env.TRANSACTIONS_XLSX ?? path.join(docs, 'transactions.xlsx');

const transactionFields = {
  'Transaction ID': 'transaction_id',
  Customer: 'customer',
  Amount: 'amount',
  Status: 'status',
  Date: 'date',
  Currency: 'currency',
  'Issue Details': 'issue_details',
  'Fraud Flag': 'fraud_flag',
};
const readOnly = { readOnlyHint: true, openWorldHint: false };
const found = (value) => ({ content: [{ type: 'text', text: JSON.stringify(value) }] });
const missing = (text) => ({ isError: true, content: [{ type: 'text', text }] });

async function findCustomer(id) {
  const [headerLine, ...rows] = (await readFile(customersPath, 'utf8')).trim().split(/\r?\n/);
  const headers = headerLine.split(',');
  const row = rows.map((line) => line.split(',')).find((values) => values[headers.indexOf('customer_id')] === id);
  if (!row) {
    return null;
  }
  const customer = Object.fromEntries(headers.map((header, index) => [header, row[index]]));
  return {
    ...customer,
    transactions_per_hour: Number(customer.transactions_per_hour),
    previous_incidents: Number(customer.previous_incidents),
    critical: customer.critical.toLowerCase() === 'true',
  };
}

async function findTransaction(id) {
  const sheets = await readXlsxFile(transactionsPath);
  const [headers, ...rows] = Array.isArray(sheets) && sheets[0]?.data ? sheets[0].data : sheets;
  const row = rows.find((values) => values[headers.indexOf('Transaction ID')] === id);
  if (!row) {
    return null;
  }
  return Object.fromEntries(headers.flatMap((header, index) => (
    transactionFields[header] ? [[transactionFields[header], row[index]]] : []
  )));
}

const server = new McpServer({ name: 'support', version: '1.0.0' });

server.registerTool('get_customer', {
  description: 'Look up one customer by customer ID: name, type, transactions per hour, previous incidents and critical.',
  inputSchema: { customer_id: z.string().regex(/^CUST-\d{3}$/) },
  annotations: { title: 'Get customer', ...readOnly },
}, async ({ customer_id }) => {
  const customer = await findCustomer(customer_id);
  return customer ? found(customer) : missing(`customer not found: ${customer_id}`);
});

server.registerTool('get_transaction', {
  description: 'Look up one transaction by transaction ID: customer, amount, status, date, issue details and fraud flag.',
  inputSchema: { transaction_id: z.string().regex(/^TX-\d{4}$/) },
  annotations: { title: 'Get transaction', ...readOnly },
}, async ({ transaction_id }) => {
  const transaction = await findTransaction(transaction_id);
  return transaction ? found(transaction) : missing(`transaction not found: ${transaction_id}`);
});

await server.connect(new StdioServerTransport());
