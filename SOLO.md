# Workshop 4 · Step by step

You build a support agent with Claude Code and the Claude Agent SDK in six steps. Each step:
**Goal → Build → Run → Check**. Every prompt the agent uses is printed in full at the
step where it appears.

You start on `main` (Step 0). Each step has a branch with the finished result:
`step-1`, `step-2`, `step-3`, `step-4` (= `solution`). In a fresh clone, fetch
the remote branches before copying files or comparing steps:

```sh
git fetch origin
git checkout origin/step-1 -- path/to/file
git diff origin/main origin/step-1
git diff origin/step-1 origin/step-2
```

If you fall behind with local or untracked work, save it and switch to the target
branch. `git switch step-N` creates a tracking branch from `origin/step-N` when
needed:

```sh
git stash -u
git fetch origin
git switch step-N
npm ci
npm run verify
```

Use `--` between `npm run lessonN` and its arguments. Message IDs have two
digits: `MSG-01`. Claude Code is the default backend when no API key is set.
Every `--dry-run` works offline and shows the Claude Code equivalent.

| Step | You build | Catch-up branch |
| --- | --- | --- |
| 0 | Setup, customer context, offline chat and Switch routing | `main` |
| 1 | One agent + system prompt + structured priority output | `step-1` |
| 2 | Orchestrator + `risk-agent` + `customer-reply-agent` | `step-2` |
| 3 | Read-only transaction/customer MCP tools + human review of reply drafts | `step-3` |
| 4 | Acceptance table and `npm run check` | `step-4` |
| 5 | Build your own agent | `step-4` |

---

## Step 0 · Setup, dry run, smoke test

**Goal:** your laptop is ready, and a dry run shows what the agent would receive. The AI does nothing yet.
Slides: "Demo · Step 0" and "Your turn · Step 0".

### How the loop works here

An agent run starts with a prompt and options. Claude Code or the SDK sends them to the model,
which can answer or request tools. Tool results return to the model for another turn, until it
finishes or reaches `maxTurns`. The runner prints initialization, assistant, tool-use, tool-result
and result events. A chat session resumes its `sessionId` on the next turn; a lesson run starts a
fresh session for one ticket. Read the [illustrative sample trace](docs/sample-trace.md); it is
hand-written and is not model evidence.

### Demo (facilitator)

```sh
npm ci
npm run doctor
npm run verify
npm run lesson1 -- MSG-01 --dry-run
```

Point out `meets minimum` after `doctor`, `fail 0` after `verify`, and `backend: claude-code` in the
dry run: it uses your Claude Code login. The `{}` in the dry run is the agent's settings, still empty
until Step 1. The line `Claude Code equivalent` shows what happens under the hood; you never type it.

### Your turn · Step 0

1. Open a terminal and go to your Documents folder. Windows: PowerShell. Mac: Terminal.

   ```sh
   cd ~/Documents
   ```

2. Download the package. This gives you your own copy.

   ```sh
   git clone https://github.com/AetherLink-bv/aetherlink-day4-n8n-to-agent.git
   ```

3. Go into the folder and install the parts. This takes about a minute. Lines that start with
   `npm warn` are fine. A line that starts with `npm error` means something went wrong: ask for help.

   ```sh
   cd aetherlink-day4-n8n-to-agent
   npm ci
   ```

4. Run the health check and the tests. Look for: `meets minimum` and `fail 0`.

   ```sh
   npm run doctor
   npm run verify
   ```

5. Do a dress rehearsal. The last line reads `dry run — no model call`. That is correct: the AI does
   nothing yet. Keep `--dry-run` until you have built Step 1: without it, the package stops and says
   `Step 1 is not built yet`.

   ```sh
   npm run lesson1 -- MSG-01 --dry-run
   ```

**Done when:** `npm run verify` shows `fail 0`, and the dry run ends with `dry run — no model call`.
`npm run verify` also runs the chat dry run, so there is no separate step for that.

**Company laptop (Vertex AI or Bedrock):** you do not need an API key or a `.env` file. The
`Login settings` line of `npm run doctor` shows what the package found. See
[Set up Workshop 4](docs/SETUP.md), Company login.

**Look around:** `docs/customer-messages.md` (MSG-01 to MSG-10), `docs/transactions.xlsx`,
`docs/customer_context.csv` (the file Maarten's Data Table was imported from),
`docs/n8n-flow-diagram.html` (open it in your browser, next to your own n8n flow from
yesterday), `lib/run.mjs` (the `query()` loop), and `01-single-agent/options.mjs` with its
`// STEP 1` TODOs.

n8n then: Execute workflow or the Chat Message trigger started one run. SDK now:
`npm run lessonN -- MSG-0N` starts one run; `npm run chat` accepts free text and resumes
the prior session, like Simple Memory.

Claude Code is the default for real runs. See [Set up Workshop 4](docs/SETUP.md) for platform
instructions and optional API-key use with the `sdk` backend.

---

## Step 1 · One agent + system prompt + Priority Parser

**Goal:** one agent with work instructions (`CLAUDE.md`) and a form with two fields: priority and
reason. A fixed form makes the answer predictable, so the code can sort it. n8n then: the AI Agent
node with a System Message and the Priority Parser. SDK now: `query()` with options; the system
message lives in `CLAUDE.md` and the parser is a JSON schema.

**Done when:** you have written down six labels and tested the tone trap.

### How the loop works here

`buildOptions()` loads the project instructions, tools and JSON schema; the result event prints
the parsed priority and the Switch route. The AI gives the label. The code picks the tray.

### Demo (facilitator)

1. Dress rehearsal: `npm run lesson1 -- MSG-01 --dry-run`. Look for `outputFormat`: that is the form.
2. A real run: `npm run lesson1 -- MSG-01`. Look for `Structured output`, and `Switch → low`.
3. Memory: `npm run chat`. Give it a colour, then ask for it back. Then try again with `--no-memory`.

No internet or no login? Show [docs/sample-trace.md](docs/sample-trace.md) and say clearly that it
is a sample.

### Your turn · Step 1a: build the agent

Copy the code below; there is no need to type it.

**Build 1 — the settings.** Replace the entire `01-single-agent/options.mjs` file:

```js
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const lessonDirectory = path.dirname(fileURLToPath(import.meta.url));

export function buildOptions() {
  return {
    cwd: path.join(lessonDirectory, 'claude-project'),
    settingSources: ['project'],
    systemPrompt: { type: 'preset', preset: 'claude_code' },
    tools: [],
    disallowedTools: ['WebSearch', 'WebFetch', 'Bash'],
    maxTurns: 3,
  };
}
```

The system prompt is the built-in `claude_code` preset; `settingSources: ['project']` adds
`claude-project/CLAUDE.md` on top of it. `maxTurns` is n8n's "Max Iterations".

**Build 2 — the work instructions.** Replace `01-single-agent/claude-project/CLAUDE.md` with:

```markdown
# Customer Support Triage

## Purpose
You are a customer-support assistant for a payment company. Read each incoming customer message and assign a priority.

## Rules
- Use only information supplied by the user or available inside this project.
- Do not search the web for customer or transaction information.
- Do not invent facts.
- If important information is missing, say what is missing.
- Keep your explanation concise.

## Priority definitions
- **LOW** — General questions, requests for information, cosmetic issues, or situations with little/no immediate customer or financial impact.
- **MEDIUM** — A real service or payment problem affecting one customer, but with no clear sign of fraud, security risk, major financial exposure, or widespread impact.
- **HIGH** — Suspected fraud or security risk, unknown/unauthorised transactions, multiple affected transactions, substantial or time-critical financial impact, or evidence that many customers may be affected.
- Judge impact and risk, not tone: angry wording alone never raises the priority, and calm wording never lowers it.

## Required output
Return the priority (`low`, `medium` or `high`) and a reason of one or two sentences.
The SDK turns this into JSON (the Priority Parser).
```

**Build 3 — the form.** Create `01-single-agent/priority-schema.mjs`:

```js
export const prioritySchema = {
  type: 'object',
  properties: {
    priority: { type: 'string', enum: ['low', 'medium', 'high'] },
    reason: { type: 'string' },
  },
  required: ['priority', 'reason'],
  additionalProperties: false,
};
```

Then open `01-single-agent/options.mjs` again and make two changes. People often forget the second one.

1. Add this import line at the very top of the file:

   ```js
   import { prioritySchema } from './priority-schema.mjs';
   ```

2. Add this line inside `buildOptions()`, directly under `maxTurns: 3,`:

   ```js
       outputFormat: { type: 'json_schema', schema: prioritySchema },
   ```

The structured output parser needs an extra turn, so leave `maxTurns: 3`.

**Test it.** Copy the Step 1 test from the finished branch and run the tests:

```sh
git checkout origin/step-1 -- test/step1.test.mjs
npm run verify
```

Look for: `fail 0`. Does verify fail on the schema? Then the import line or the `outputFormat` line is
missing in `options.mjs`. Stuck? `git stash -u`, then `git switch step-1` gives you the finished version.

### Your turn · Step 1b: look inside and test memory

1. Do a dress rehearsal. You see the settings the agent receives. Find `outputFormat`: that is the form.

   ```sh
   npm run lesson1 -- MSG-01 --dry-run
   ```

2. Open `01-single-agent/priority-schema.mjs` and `lib/switch.mjs`. The schema defines what the answer
   looks like. The Switch picks the route: the code decides, not the model.

3. Start the chat and give it something to remember. Type `My favourite colour is red`. Then ask
   `What is my favourite colour?`. Type `exit` to stop.

   ```sh
   npm run chat
   ```

4. Do it again, without memory. Ask the same question. This time it does not know: every message is a
   new conversation.

   ```sh
   npm run chat -- --no-memory
   ```

**Done when:** you can point at the schema and the Switch, and say why only the first chat remembered red.

The default chat resumes the previous `sessionId`; `--no-memory` starts a new query each turn.
Every `npm run lesson1` is a fresh session on purpose (one ticket = one case).
Free-form chat is the default; use `npm run chat -- --lesson 1 --structured` to keep the lesson schema.
The chat follows `CLAUDE.md` too, so even "My favourite colour is red" can get a priority.

### Your turn · Step 1c: six messages and the tone trap

1. Label six messages, one by one. Then run MSG-02 to MSG-06. Write each label down (low, medium or
   high) on paper or in a notes file: you enter them in Step 4.

   ```sh
   npm run lesson1 -- MSG-01
   ```

2. Remove the rules for high, medium and low. In `01-single-agent/claude-project/CLAUDE.md`, select
   everything from the line `## Priority definitions` up to the next line that starts with `##`. Cut it
   (Ctrl+X) and save (Ctrl+S).

3. Run two messages again. For MSG-01 and MSG-06, write down: the same label as before, or a different one?

   ```sh
   npm run lesson1 -- MSG-01
   npm run lesson1 -- MSG-06
   ```

4. Put the rules back. Paste the section back in the same place (Ctrl+V) and save. Lost it? Run:

   ```sh
   git checkout origin/step-1 -- 01-single-agent/claude-project/CLAUDE.md
   ```

5. Check that it still works. Look for: `fail 0`.

   ```sh
   npm run verify
   ```

**Done when:** six labels are written down, the tone trap is compared, `CLAUDE.md` is restored, and `fail 0`.

**What changed in the prompt:** without the definitions the model judges by tone, so a loud
message can look urgent and a calm one harmless. A strong model often still gets MSG-01 and MSG-06
right, but now nothing in the file guarantees it. The definitions plus the line
`Judge impact and risk, not tone: angry wording alone never raises the priority, and calm
wording never lowers it.` make impact the rule.

**Check your screen:** after a real run you see `Structured output` (the completed form: priority
and reason) and a `Switch →` line, for example `Switch → low → AUTO_REPLY`. The code picked the tray,
not the AI. The reason text is different on every run.

**Discuss: who decides what?** Which values can priority have? Who picks the route: the AI or the
code? What changes with `--no-memory`?

Catch up: `git stash -u`, then `git switch step-1`.

---

## Step 2 · Orchestrator + subagents

**Goal:** the main agent stops doing everything itself. It delegates the analysis to
`risk-agent` and the reply to `customer-reply-agent`, and saves a draft for a person to review.
n8n then: Risk Agent and Customer Reply Agent as tools of the AI Agent (Maarten's slides 7–9).
SDK now: `options.agents` plus the `Agent` tool.

### How the loop works here

The orchestrator calls the risk agent first, passes its result to the reply agent, then writes
the combined result. The structured schema limits the fields returned to the lesson.

### Demo (facilitator) → Your turn

**Goal:** see specialist delegation and the order of the two subagents.

**Facilitator demo:** run `npm run lesson2 -- MSG-05 --dry-run`; then show a completed trace with
`[tool_use] Agent → risk-agent` before `[tool_use] Agent → customer-reply-agent`.

**Your turn:** build both agent prompts, the loader, schema and options below.

**Build 1 — the subagent prompts.** Create `.claude/agents/risk-agent.md`:

```markdown
---
name: risk-agent
description: Payment risk and escalation specialist. Reviews one customer-support ticket, assigns priority LOW, MEDIUM or HIGH using the project priority definitions and writes a short internal risk note.
---
You are a payment risk and escalation specialist for a payment company's customer support.
Review the ticket context and identify: customer risk, complaint risk, urgency, and whether escalation is needed.
Classify the priority using these definitions:
- LOW — General questions, requests for information, cosmetic issues, or situations with little/no immediate customer or financial impact.
- MEDIUM — A real service or payment problem affecting one customer, but with no clear sign of fraud, security risk, major financial exposure, or widespread impact.
- HIGH — Suspected fraud or security risk, unknown/unauthorised transactions, multiple affected transactions, substantial or time-critical financial impact, or evidence that many customers may be affected.
Judge impact and risk, not tone: angry wording alone never raises the priority, and calm wording never lowers it.
Use only the supplied ticket context. Do not invent facts. If important information is missing, list it.
Return exactly:
Priority: LOW | MEDIUM | HIGH
Risk note: one or two sentences for the internal team: customer risk, complaint risk, urgency, escalate yes/no.
Missing information: none, or a short list.
```

Create `.claude/agents/customer-reply-agent.md`:

```markdown
---
name: customer-reply-agent
description: Customer support communication specialist. Writes a short, friendly and professional reply draft to the customer, using the ticket context and the risk-agent result from the main agent.
---
You are a customer support communication specialist.
You write the reply email to the customer of a payment company.
You receive the original message and the risk-agent result. Do not change or re-decide the priority.
Write a short, polite reply in plain English: acknowledge the issue, say what happens next, and ask for any missing information the risk-agent listed.
Do not promise refunds, reversals, compensation or timelines. Do not invent facts.
Start with `Subject:` and end with `Draft — needs human approval before sending.`
Do not mention the internal risk note or the priority.
```

This is the Claude Code subagent format, and it is exactly the split from yesterday's Risk Agent
settings: the frontmatter `description` is n8n's **Description** (it tells the orchestrator when
to delegate), the body is n8n's **System Message** (the subagent's own prompt).

**Build 2 — load them.** Create `lib/agents.mjs`:

```js
import { readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const agentsDirectory = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '.claude', 'agents');

// Reads a subagent from .claude/agents/<name>.md (the same file format Claude Code uses):
// the frontmatter `description` tells the orchestrator when to delegate, the body is the subagent's prompt.
// The tools are set in code, per lesson, so each subagent gets only what it needs.
export function loadAgent(name, tools = []) {
  const text = readFileSync(path.join(agentsDirectory, `${name}.md`), 'utf8');
  const match = text.match(/^---\r?\n([\s\S]*?)\r?\n---\r?\n([\s\S]*)$/);

  if (!match) {
    throw new Error(`.claude/agents/${name}.md needs a --- frontmatter block with a description.`);
  }

  const description = /^description:\s*(.+)$/m.exec(match[1])?.[1]?.trim();

  if (!description) {
    throw new Error(`.claude/agents/${name}.md has no description in its frontmatter.`);
  }

  return { description, prompt: match[2].trim(), tools };
}
```

Create `02-subagents/agents.mjs`:

```js
import { loadAgent } from '../lib/agents.mjs';

// n8n: the Risk Agent and Customer Reply Agent tool nodes. SDK: options.agents.
// The prompts live in .claude/agents/risk-agent.md and .claude/agents/customer-reply-agent.md.
export const agents = {
  'risk-agent': loadAgent('risk-agent'),
  'customer-reply-agent': loadAgent('customer-reply-agent'),
};
```

**Build 3 — structured output and the orchestrator.** Create `02-subagents/ticket-schema.mjs`:

```js
export const ticketSchema = {
  type: 'object',
  properties: {
    priority: { type: 'string', enum: ['low', 'medium', 'high'] },
    sentiment: { type: 'string', enum: ['neutral', 'frustrated', 'angry'] },
    recommended_action: { type: 'string', enum: ['auto_reply', 'investigate', 'escalate'] },
    summary: { type: 'string' },
    risk_note: { type: 'string' },
    customer_reply: { type: 'string' },
  },
  required: ['priority', 'sentiment', 'recommended_action', 'summary', 'risk_note', 'customer_reply'],
  additionalProperties: false,
};
```

Create `02-subagents/options.mjs`:

```js
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { agents } from './agents.mjs';
import { ticketSchema } from './ticket-schema.mjs';

const lessonDirectory = path.dirname(fileURLToPath(import.meta.url));

export function buildOptions() {
  return {
    cwd: path.join(lessonDirectory, 'claude-project'),
    settingSources: ['project'],
    systemPrompt: { type: 'preset', preset: 'claude_code' },
    agents,
    tools: ['Agent', 'Write'],
    allowedTools: ['Agent', 'Write'],
    disallowedTools: ['WebSearch', 'WebFetch', 'Bash'],
    permissionMode: 'acceptEdits',
    maxTurns: 10,
    outputFormat: { type: 'json_schema', schema: ticketSchema },
  };
}
```

Create `02-subagents/agent.mjs`:

```js
import { runLesson } from '../lib/run.mjs';
import { buildOptions } from './options.mjs';

await runLesson({ buildOptions });
```

Create `02-subagents/claude-project/CLAUDE.md` (the orchestrator's prompt):

```markdown
# Customer Support Orchestrator

## Purpose
Coordinate specialised agents that process incoming customer-support messages.

## Workflow
1. Delegate analysis and priority classification to the `risk-agent`.
2. Wait for the analyst result.
3. Delegate the customer reply to the `customer-reply-agent`, including the original message and risk-agent result.
4. Create a Markdown file in `output/` with the final result.

## Required output
Fill the structured fields from the specialist agents' results: `priority`, `sentiment`,
`recommended_action`, `summary`, `risk_note` and `customer_reply`.

## Rules
- Do not perform specialist analysis yourself when `risk-agent` is available.
- Do not write the customer email yourself when `customer-reply-agent` is available.
- Use only supplied/project information.
- Do not search the web for customer or transaction information.
- Do not invent facts.
```

Create the empty folder `02-subagents/claude-project/output/` and add
`"lesson2": "node 02-subagents/agent.mjs"` after `"lesson1"` in `package.json`. Add the folder's
`output/.gitkeep` so Git tracks it. Update `verify` to run `npm run lesson2 -- MSG-05 --dry-run`
after the lesson 1 dry run and before the chat dry run, and copy the Step 2 test:

```sh
git checkout origin/step-2 -- test/step2.test.mjs
```

Shortcut: `git checkout origin/step-2 -- .claude lib/agents.mjs 02-subagents package.json test/step2.test.mjs`
copies all Step 2 files.

**Run:**

```sh
npm run lesson2 -- MSG-05 --dry-run
npm run lesson2 -- MSG-05
npm run lesson2 -- MSG-10
```

**Offline check:** `--dry-run` shows setup only; it does not call agents, create a draft, or produce
the MSG-10 missing-information result. Use a logged-in Claude Code run or `docs/sample-trace.md`
(clearly labelled sample) for those results.

**Check:** in a live run, the trace shows `Agent → risk-agent` before `Agent → customer-reply-agent`.
Open `02-subagents/claude-project/output/MSG-05.md` only after a live run. For `MSG-10`, the live
run or labelled sample shows the analyst listing the missing information. No `Agent →` lines? The
orchestrator did the work itself: run again and discuss why.

**The description test.** Replace the `description:` of `.claude/agents/risk-agent.md` with
something vague (`Helps with things.`) and rerun `MSG-05`. Does the orchestrator still delegate?
Restore it with `git checkout origin/step-2 -- .claude/agents/risk-agent.md`. Yesterday the same
thing happened in n8n when the Risk Agent's Description was empty. Catch up: `git switch step-2`.

---

## Step 3 · Read-only customer and transaction MCP tools

**Goal:** `risk-agent` looks up transaction facts and `customer-context-agent` looks up customer
facts through read-only tools. Neither agent reads a data file itself. n8n then: the Customer
Context Agent with `Get row(s) in Data table` over the Data Table imported from
`customer_context.csv` (Maarten's slides 10–11). SDK now: two stdio MCP servers in
`options.mcpServers`.

Data paths: `docs/transactions.xlsx → get_transaction → risk-agent`; and
`docs/customer_context.csv → get_customer → customer-context-agent`.

### How the loop works here

Two stdio MCP servers expose narrow read-only lookups: `get_transaction` and `list_transactions`
for transactions, and `get_customer` for customer context. A person reviews each reply draft before
it is sent; the MCP servers do not change records.

### Demo (facilitator) → Your turn

**Goal:** verify each MCP server without making a model call, then follow the data path.

**Facilitator demo:** run `npm run smoke:mcp`. Point out
`MCP servers OK — read-only lookups; no model was called.`
and show the dry-run command's MCP configuration. A real trace labels calls `[tool_use]`.

**Your turn:** check out the Step 3 starter files, install both dependency sets, and run the smoke test.

**Get the server:**

```sh
git checkout origin/step-3 -- 03-mcp .mcp.json .claude lib package.json test/step3.test.mjs
npm ci
cd 03-mcp/transaction-mcp
npm ci
cd ../..
npm run smoke:mcp
```

The nested install is for the server's own dependencies. It does not start the servers: the SDK
starts each on demand over stdio. Do not start them yourself. The smoke test calls the tools on
their own (no model) and ends with
`MCP servers OK — read-only lookups; no model was called.`

**Read the read-only tools in `03-mcp/transaction-mcp/server.js`:**

```js
const server = new McpServer({ name: 'transactions', version: '1.1.0' });

server.registerTool('get_transaction', {
  description: 'Look up one transaction by its transaction ID.',
  inputSchema: { transaction_id: z.string().regex(/^TX-\d{4}$/) },
  annotations: { title: 'Get transaction', readOnlyHint: true, openWorldHint: false },
}, async ({ transaction_id }) => {
  const transaction = findTransaction(await readWorkbook(), transaction_id);
  return transaction ? ok(transaction) : notFound(transaction_id);
});

server.registerTool('list_transactions', {
  description: 'List transactions with optional status, customer, or fraud filters.',
  inputSchema: {
    status: z.enum(['COMPLETED', 'DECLINED', 'PENDING', 'REFUNDED', 'FAILED', 'DUPLICATE']).optional(),
    customer: z.string().min(1).optional(),
    fraud_flag: z.enum(['Yes', 'No']).optional(),
    limit: z.number().int().min(1).max(50).optional(),
  },
  annotations: { title: 'List transactions', readOnlyHint: true, openWorldHint: false },
}, async ({ status: wanted, customer, fraud_flag, limit }) => (
  ok(listTransactions(await readWorkbook(), { status: wanted, customer, fraudFlag: fraud_flag, limit }))
));

await server.connect(new StdioServerTransport());
```

**The wiring in `03-mcp/options.mjs`:**

```js
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { agents } from './agents.mjs';
import { defaultWorkbookPath } from './transaction-mcp/paths.mjs';

const lessonDirectory = path.dirname(fileURLToPath(import.meta.url));
const transactionServer = path.join(lessonDirectory, 'transaction-mcp', 'server.js');
const customerServer = path.join(lessonDirectory, 'transaction-mcp', 'customers.js');
const workbook = defaultWorkbookPath;
const customerContext = path.join(path.dirname(lessonDirectory), 'docs', 'customer_context.csv');

export function buildOptions() {
  return {
    cwd: path.join(lessonDirectory, 'claude-project'),
    settingSources: ['project'],
    systemPrompt: { type: 'preset', preset: 'claude_code' },
    agents,
    tools: ['Agent', 'Write'],
    allowedTools: [
      'Agent', 'Write',
      'mcp__transactions__get_transaction', 'mcp__transactions__list_transactions',
      'mcp__customers__get_customer',
    ],
    disallowedTools: ['WebSearch', 'WebFetch', 'Bash'],
    permissionMode: 'acceptEdits',
    maxTurns: 10,
    mcpServers: {
      transactions: {
        type: 'stdio',
        command: 'node',
        args: [transactionServer],
        env: { TRANSACTIONS_XLSX: workbook },
      },
      customers: {
        type: 'stdio',
        command: 'node',
        args: [customerServer],
        env: { CUSTOMER_CONTEXT_CSV: customerContext },
      },
    },
  };
}
```

`.mcp.json` registers the same server for Claude Code:

```json
{
  "mcpServers": {
    "transactions": {
      "type": "stdio",
      "command": "node",
      "args": ["03-mcp/transaction-mcp/server.js"]
    },
    "customers": {
      "type": "stdio",
      "command": "node",
      "args": ["03-mcp/transaction-mcp/customers.js"]
    }
  }
}
```

**What changed in the prompt:** `.claude/agents/risk-agent.md` gets the transaction tool and the
customer-context instruction:

```markdown
tools: mcp__transactions__get_transaction
...
If the message contains a transaction ID (TX-####), call get_transaction first and base the analysis on the returned record: status, amount, issue details and fraud flag. Say which facts came from the transaction record. If the lookup returns nothing, say so and do not guess. If you have no get_transaction tool, list the transaction record as missing information.
When the main agent passes customer context, use it in the risk note: an Enterprise or critical customer raises complaint risk and the urgency of follow-up. The priority still follows the definitions above: customer context alone never raises or lowers it.
Use only the supplied message and get_transaction/get_customer results. Do not invent facts. If important information is missing, list it.
```

Create `.claude/agents/customer-context-agent.md`:

```markdown
---
name: customer-context-agent
description: Looks up the customer behind a ticket (CUST-###) with get_customer and returns the customer context: type, transaction volume, previous incidents and whether the customer is critical.
---
You are the customer context specialist for a payment company's customer support.
If the ticket has a customer ID (format CUST-###), call get_customer once and report what the record says. If the lookup returns nothing, say so and do not guess. If there is no customer ID, say so.
Use only the get_customer result. Do not classify the priority and do not write to the customer.
Return exactly:
Customer: name (ID), customer type
Volume: transactions per hour
Previous incidents: number
Critical customer: yes | no
```

`03-mcp/claude-project/CLAUDE.md` adds these sections to the orchestrator prompt:

```markdown
## Workflow
1. For a customer ID, call `customer-context-agent` and `get_customer`.
2. Pass the message and customer context to `risk-agent`; it uses `get_transaction` when there is a transaction ID.
3. Pass the original message, customer context and risk-agent result to `customer-reply-agent`.
4. Create the human-review draft in `output/`.

## Customer and transaction data
- When a message contains a customer ID (format `CUST-###`), use `customer-context-agent` and `get_customer`.
- When it contains a transaction ID (format `TX-####`), `risk-agent` uses `get_transaction`.
- Never read customer or transaction files yourself; data only arrives through the tools.
- In the final output, add `External data:` listing facts from `get_customer`, `get_transaction` and `list_transactions` (or `none`).
- The customer reply in `output/` is a draft for a person to review before sending.

```

**Run:**

```sh
npm run lesson3 -- MSG-08 --dry-run
npm run lesson3 -- MSG-08
npm run lesson3 -- MSG-07
npm run lesson3 -- MSG-09
```

**Offline check:** `--dry-run` shows the configured MCP servers and tools; it does not call them or
produce an `External data:` result.

**Check:** in a logged-in Claude Code run, `risk-agent` looks up each TX ID with
`mcp__transactions__get_transaction`. The live response's `External data:` line lists which facts
came from the tool. The workbook stays in `docs/`, outside `claude-project`.

The transaction workbook is exposed only through read-only MCP tools. The final reply remains a
draft for a person to review before sending. Catch up: `git switch step-3`.

---

## Step 4 · Acceptance table and `npm run check`

**Goal:** check your labels and record the evidence.

### How the loop works here

The offline checker compares your entered labels with the answer key; it does not call a model.

### Demo (facilitator) → Your turn

**Goal:** see how completed labels are checked without treating example output as model evidence.

**Facilitator demo:** run `npm run check` with a prepared `labels.json` filled using labels from
your own runs, then show the `correct` or `revise` lines plus the Lesson totals. A fresh clone only
creates the empty file on its first check.

**Your turn:** copy the Step 4 checker, run it once to create `labels.json`, fill it with labels from
your own runs, then run `npm run check` a second time.

```sh
git checkout origin/step-4 -- check.mjs answer-key.json labels.template.json package.json
npm run check
```

The first run in a fresh clone creates an empty `labels.json`; it does not contain model results.
Fill in `low`, `medium` or `high` from your own runs for each message you ran, leave the rest empty,
and run `npm run check` a second time:

```text
MSG-01 correct
MSG-02 revise
Lesson 1 (MSG-01 to MSG-06): 5/6 REVISE
Lesson 3 (MSG-01 to MSG-09): 5/9 REVISE
```

(Example output only.) The check passes when Lesson 1 is 6/6 and no filled-in label is wrong;
Lesson 3 passes at 9/9. `MSG-10` is not graded. `revise` means: reread the priority definitions and
the trace. Do not change a label just to pass.

**Acceptance table** — copy and fill in:

| Message | Agent label | Customer context (`get_customer`) | Transaction facts (`get_transaction`) | Draft reviewed by a person? |
| --- | --- | --- | --- | --- |
| MSG-01 | | | none | |
| MSG-05 | | | none | |
| MSG-07 | | | | |
| MSG-08 | | | | |
| MSG-09 | | | | |

Save the completed acceptance table in `participant-output/` or your squad's `intent.md`.
Catch up: `git switch step-4` (or `solution`).

---

## Stretch · Assignment: chat in, chat out

Yesterday's assignment: the ticket goes in via the Chat Input, through the whole flow, and a chat
message comes back. Same assignment, in code:

```sh
cd aetherlink-day4-n8n-to-agent
npm run chat -- --lesson 3
```

Or use Claude Code:

```sh
cd aetherlink-day4-n8n-to-agent
claude
```

Claude Code reads `.mcp.json` (the transaction and customer servers) and `.claude/agents/`
(`risk-agent`, `customer-reply-agent`, `customer-context-agent`), so the whole Step 3 flow is
available from a chat.

1. Paste one customer message with a `TX-####` ID from `docs/customer-messages.md` and ask for the
   priority, the analysis and a reply draft.
2. Watch the trace: which subagent ran, which MCP tool was called?
3. Ask a follow-up in the same chat. Now the session is the memory, like Simple Memory yesterday.
4. Explore, like "look at other nodes" yesterday: add a `SKILL.md` or a `PreToolUse` hook. What
   would you change in `CLAUDE.md`?

More stretch:

- Run `MSG-07` to `MSG-09` with `lesson2` (no tool) and compare with `lesson3`.
- Compare the customer and transaction facts returned by the read-only MCP tools.

## Wrap-up · recap round, bridge to Workshop 5

Recap round: everyone shows one result in one minute (a trace, a draft, the check output, or the
chat). One agent, two subagents, one MCP tool, and a person who reviews every draft. Which part was
easier in n8n, and which in code? Where must a person still decide?
