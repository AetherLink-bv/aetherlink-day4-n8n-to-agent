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
last session), `lib/run.mjs` (the `query()` loop), and `01-single-agent/options.mjs` with its
`// STEP 1` TODOs.

n8n then: Execute workflow or the Chat Message trigger started one run. SDK now:
`npm run lessonN -- MSG-0N` starts one run. `npm run chat` accepts free text and resumes
the previous session, like Simple Memory.

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
3. Memory: start `npm run chat`, give it a colour and ask for it back.
4. No memory: do the same with `npm run chat -- --no-memory`. Now the chat does not know the colour.

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
    settingSources: ['project', 'user'],
    systemPrompt: { type: 'preset', preset: 'claude_code' },
    tools: [],
    disallowedTools: ['WebSearch', 'WebFetch', 'Bash'],
    maxTurns: 3,
  };
}
```

The system prompt is the built-in `claude_code` preset. `settingSources` adds two layers on top of it.
`'project'` loads `claude-project/CLAUDE.md`, the work instructions of this agent. `'user'` loads your
own Claude Code setup from `~/.claude`: your `settings.json` (with its `env` block and permissions), your
personal `CLAUDE.md`, your hooks and your plugins. The agent now starts the same way as `claude` in your terminal.
MCP servers and claude.ai connectors from your account stay off, because the package passes a strict MCP
config. Two things to watch. If your personal `CLAUDE.md` asks for a tone or a format, the agent can follow
it in this lesson too. A large personal setup is sent with every run, so each run costs more.
`maxTurns` is n8n's "Max Iterations".

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

1. Add this import line as the first line of the file:

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

3. Start the chat.

   ```sh
   npm run chat
   ```

4. Type `My favourite colour is red`.

5. Ask `What is my favourite colour?`.

6. Type `exit` to stop the chat.

7. Start the chat without memory and ask the same question. This time it does not know: every message
   is a new conversation.

   ```sh
   npm run chat -- --no-memory
   ```

**Done when:** you can point at the schema and the Switch, and say why only the first chat remembered red.

The default chat resumes the previous `sessionId`; `--no-memory` starts a new query each turn.
Every `npm run lesson1` is a fresh session on purpose (one ticket = one case).
Free-form chat is the default; use `npm run chat -- --lesson 1 --structured` to keep the lesson schema.
The chat follows `CLAUDE.md` too, so even "My favourite colour is red" can get a priority.

### Your turn · Step 1c: six messages and the tone trap

1. Run MSG-01 to MSG-06, one at a time. The command below runs MSG-01.

   ```sh
   npm run lesson1 -- MSG-01
   ```

2. Write down each label (low, medium or high) on paper or in a notes file. You enter them in Step 4.

3. In `01-single-agent/claude-project/CLAUDE.md`, select everything from the line `## Priority definitions`
   up to the next line that starts with `##`. These lines are the rules for high, medium and low.

4. Cut the selection (Ctrl+X) and save the file (Ctrl+S).

5. Run MSG-01 and MSG-06 again. For each, write down: the same label as before, or a different one?

   ```sh
   npm run lesson1 -- MSG-01
   npm run lesson1 -- MSG-06
   ```

6. Paste the rules back in the same place (Ctrl+V) and save the file. Lost them? Run:

   ```sh
   git checkout origin/step-1 -- 01-single-agent/claude-project/CLAUDE.md
   ```

7. Run the tests. Look for: `fail 0`.

   ```sh
   npm run verify
   ```

**Done when:** you have six labels, you have compared the tone trap, `CLAUDE.md` has its rules again,
and verify shows `fail 0`.

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

**Goal:** your single agent becomes a team. The team lead (the orchestrator) calls the risk expert
first, then the writer. One job per agent keeps every set of instructions short and clear.
n8n then: Risk Agent and Customer Reply Agent as tools of the AI Agent. SDK now: `options.agents`
plus the `Agent` tool.

**Done when:** the trace shows risk first, then the reply, and you have tested a vague description.

### How the loop works here

The orchestrator calls `risk-agent` first, passes its result to `customer-reply-agent`, then writes
the combined result to a draft file. Each specialist is one Markdown file in `.claude/agents/`: the
top (`name` and `description`) says who the agent is and when to use it, the text below is its work
instructions. The description decides who gets the task, like a job advert. In this package
`lib/agents.mjs` reads those files and gives them to the SDK; the tools each specialist may use are
set in code. When you start `claude` in the repository root, Claude Code reads the same folder itself.

### Demo (facilitator)

1. Dress rehearsal: `npm run lesson2 -- MSG-05 --dry-run`. It shows the setup. It does not call agents yet.
2. A real run: `npm run lesson2 -- MSG-05`. Look for: first `Agent → risk-agent`, then
   `Agent → customer-reply-agent`.
3. The draft: open `02-subagents/claude-project/output/MSG-05.md`. A person reads it before anything
   is sent.

### Your turn · Step 2

#### 1. Get the Step 2 files

**Option A:** build them yourself with Build 1 to 3 below. **Option B, if you are short on time:**
copy them from the finished branch instead, then skip to step 2.

```sh
git checkout origin/step-2 -- .claude lib/agents.mjs 02-subagents package.json test/step2.test.mjs
npm run verify
```

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

This is the Claude Code subagent format, and it is exactly the split from last session's Risk Agent
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
    settingSources: ['project', 'user'],
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

Create the empty folder `02-subagents/claude-project/output/` with an empty file `.gitkeep` in it,
so Git tracks the folder. Then open `package.json` and make two changes in `"scripts"`:

1. Add this line directly under the `"lesson1"` line:

   ```json
       "lesson2": "node 02-subagents/agent.mjs",
   ```

2. Replace the whole `"verify"` line with:

   ```json
       "verify": "npm test && npm run lesson1 -- MSG-01 --dry-run && npm run lesson2 -- MSG-05 --dry-run && npm run chat -- --dry-run"
   ```

Copy the Step 2 test and run the tests. Look for: `fail 0`.

```sh
git checkout origin/step-2 -- test/step2.test.mjs
npm run verify
```

#### 2. Run the team on two messages

```sh
npm run lesson2 -- MSG-05
npm run lesson2 -- MSG-10
```

Look for: `Agent → risk-agent`, then `Agent → customer-reply-agent`. MSG-10 is missing information,
so the team asks for it. No `Agent →` lines? Then the team lead did the work itself: run it again.
`--dry-run` shows the setup only; it does not call agents or create a draft.

#### 3. Read the draft

Open `02-subagents/claude-project/output/MSG-05.md`. Would you send this? A person decides. The draft
only asks for the missing facts; it does not make anything up.

#### 4. The description test

In `.claude/agents/risk-agent.md`, change the description to `Helps with things.` and run MSG-05
again. Does the risk expert still run? It does not always change the result. The point is that
nothing guarantees it any more. Last session the same thing happened in n8n when the Risk Agent's
Description was empty.

```sh
npm run lesson2 -- MSG-05
```

#### 5. Put it back

```sh
git checkout origin/step-2 -- .claude/agents/risk-agent.md
```

Stuck? `git stash -u`, then `git switch step-2` gives you the finished version.

**Done when:** the trace shows risk first, then the reply; you have read the draft and tested a vague
description.

**Check your screen:** two `Agent` lines, first `risk-agent`, then `customer-reply-agent`. The draft
only asks for the missing facts.

**Discuss: who did what?** Which agent runs first, and why? Where is last session's n8n Description now?

---

## Step 3 · Read-only customer and transaction MCP tools

**Goal:** your team gets two lookup desks: customers and transactions. They can look things up, but
not change them. The agent takes facts from a desk, not from its imagination. n8n then: the
Customer Context Agent with `Get row(s) in Data table` over the Data Table imported from
`customer_context.csv`. SDK now: two stdio MCP servers in `options.mcpServers`.

**Done when:** the trace shows both lookups, and you have written down three more labels.

### How the loop works here

MCP is the lookup desk. The agent asks the desk for facts; the desk reads the customer list
(`docs/customer_context.csv`) or the transactions spreadsheet (`docs/transactions.xlsx`) and hands
over only what was asked for. `customer-context-agent` calls `get_customer`; `risk-agent` calls
`get_transaction` (and may use `list_transactions`). Neither agent reads a data file itself, and the
desks never change a record. A person reviews each reply draft before it is sent.

### Demo (facilitator)

1. Test the desks: `npm run smoke:mcp`. Tests both desks without the AI.
2. A real run: `npm run lesson3 -- MSG-08`. Look for: `get_customer` and `get_transaction`.
3. Where did the facts come from? In the draft, the `External data` section lists what each desk
   handed over.

### Your turn · Step 3

1. Get the Step 3 files. The last three lines install the payment desk and take you back to the
   package folder. You do not start the desks yourself: the SDK starts each desk when an agent needs it.

   ```sh
   git checkout origin/step-3 -- 03-mcp .mcp.json .claude lib package.json test/step3.test.mjs
   npm ci
   cd 03-mcp/transaction-mcp
   npm ci
   cd ../..
   ```

2. Test the desks. Last line: `MCP servers OK — read-only lookups; no model was called.`

   ```sh
   npm run smoke:mcp
   ```

3. Run three messages. Each draft shows the label under `Result`, for example
   `03-mcp/claude-project/output/MSG-08.md`.

   ```sh
   npm run lesson3 -- MSG-08
   npm run lesson3 -- MSG-07
   npm run lesson3 -- MSG-09
   ```

4. Write down each label on paper or in a notes file. You enter them in `labels.json` in Step 4.

5. Find the lookups. In the trace: `get_customer` and `get_transaction`. In the draft: the
   `External data` section.

6. Stuck? This gives you the finished version.

   ```sh
   git stash -u
   git switch step-3
   ```

**Done when:** both lookups are in the trace, `External data` is in the draft, and three more labels
are written down.

**Check your screen:** after `npm run smoke:mcp` you see only lookup tools (`get_customer`,
`get_transaction` and `list_transactions`), no tools that change anything, and the last line
`MCP servers OK`. No model was called.

**Discuss: where did the facts come from?** Which facts came from a lookup desk? Who reads the draft
before it is sent?

### Read along: what the Step 3 files contain

The read-only tools in `03-mcp/transaction-mcp/server.js`:

```js
const server = new McpServer({ name: 'transactions', version: '1.1.0' });

const transactionId = z.string().regex(/^TX-\d{4}$/);
const status = z.enum(STATUSES);
const fraudFlag = z.enum(['Yes', 'No']);
const readOnly = { readOnlyHint: true, openWorldHint: false };

const readWorkbook = async () => {
  const sheets = await readXlsxFile(workbookPath);
  return rowsToTransactions(Array.isArray(sheets) && sheets[0]?.data ? sheets[0].data : sheets);
};
const ok = (value) => ({ content: [{ type: 'text', text: JSON.stringify(value) }] });
const fail = (text) => ({ isError: true, content: [{ type: 'text', text }] });
const notFound = (id) => fail(`No transaction ${id} in the data`);

server.registerTool('list_transactions', {
  description: 'List transactions, optionally filtered by status, customer name or fraud flag.',
  inputSchema: {
    status: status.optional(),
    customer: z.string().min(1).optional(),
    fraud_flag: fraudFlag.optional(),
    limit: z.number().int().min(1).max(50).optional(),
  },
  annotations: { title: 'List transactions', ...readOnly },
}, async ({ status: wanted, customer, fraud_flag, limit }) => (
  ok(listTransactions(await readWorkbook(), { status: wanted, customer, fraudFlag: fraud_flag, limit }))
));

server.registerTool('get_transaction', {
  description: 'Look up one transaction by its transaction ID.',
  inputSchema: { transaction_id: transactionId },
  annotations: { title: 'Get transaction', ...readOnly },
}, async ({ transaction_id }) => {
  const transaction = findTransaction(await readWorkbook(), transaction_id);
  return transaction ? ok(transaction) : notFound(transaction_id);
});

await server.connect(new StdioServerTransport());
```

The wiring in `03-mcp/options.mjs`:

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
    settingSources: ['project', 'user'],
    systemPrompt: { type: 'preset', preset: 'claude_code' },
    agents,
    tools: ['Agent', 'Write'],
    allowedTools: [
      'Agent',
      'Write',
      'mcp__transactions__get_transaction',
      'mcp__transactions__list_transactions',
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

`.mcp.json` registers the same desks for Claude Code, when you start `claude` in the repository root:

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

`.claude/agents/risk-agent.md` now has the transaction tool and the customer-context instruction:

```markdown
---
name: risk-agent
description: Payment risk and escalation specialist. Reviews one customer-support ticket, assigns priority LOW, MEDIUM or HIGH using the project priority definitions and writes a short internal risk note.
tools: mcp__transactions__get_transaction
---
You are a payment risk and escalation specialist for a payment company's customer support.
Review the ticket context and identify: customer risk, complaint risk, urgency, and whether escalation is needed.
Classify the priority using these definitions:
- LOW — General questions, requests for information, cosmetic issues, or situations with little/no immediate customer or financial impact.
- MEDIUM — A real service or payment problem affecting one customer, but with no clear sign of fraud, security risk, major financial exposure, or widespread impact.
- HIGH — Suspected fraud or security risk, unknown/unauthorised transactions, multiple affected transactions, substantial or time-critical financial impact, or evidence that many customers may be affected.
Judge impact and risk, not tone: angry wording alone never raises the priority, and calm wording never lowers it.
If the message contains a transaction ID (TX-####), call get_transaction first and base the analysis on the returned record: status, amount, issue details and fraud flag. Say which facts came from the transaction record. If the lookup returns nothing, say so and do not guess. If you have no get_transaction tool, list the transaction record as missing information.
When the main agent passes customer context, use it in the risk note: an Enterprise or critical customer raises complaint risk and the urgency of follow-up. The priority still follows the definitions above: customer context alone never raises or lowers it.
Use only the supplied ticket context and get_transaction results. Do not invent facts. If important information is missing, list it.
Return exactly:
Priority: LOW | MEDIUM | HIGH
Risk note: one or two sentences for the internal team: customer risk, complaint risk, urgency, escalate yes/no.
Missing information: none, or a short list.
```

The new `.claude/agents/customer-context-agent.md`:

```markdown
---
name: customer-context-agent
description: Looks up the customer behind a ticket (CUST-###) with get_customer and returns the customer context: type, transaction volume, previous incidents and whether the customer is critical.
tools: mcp__customers__get_customer
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

The orchestrator prompt `03-mcp/claude-project/CLAUDE.md`:

```markdown
# Customer Support Orchestrator

## Purpose
Coordinate specialised agents that process incoming customer-support messages.

## Workflow
1. When the ticket has a Customer ID, delegate lookup to `customer-context-agent`.
2. Delegate analysis to `risk-agent` with the message and customer context.
3. Delegate the customer reply to `customer-reply-agent` with the message, customer context and risk-agent result.
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

## Customer data
- Never read `docs/customer_context.csv` yourself; customer data only arrives through `get_customer`.

## Transaction data
- When it contains a transaction ID (format `TX-####`), `risk-agent` uses `get_transaction`.
- `risk-agent` may use `list_transactions` to find relevant transaction records.
- Never read transaction files yourself; transaction data only arrives through the tool.
- In the final output, add `External data:` listing facts from `get_transaction`, `list_transactions` and `get_customer` (or `none`).
- The customer reply in `output/` is a draft for a person to review before sending.
- Transaction records are read-only; never change them.
```

---

## Step 4 · Acceptance table and `npm run check`

**Goal:** compare your labels with the answer key, and record the evidence. Code where it must be
exact (the check, the Switch), the agent where it may think (the label and the reason), and a person
at the end (the draft and this table).

**Done when:** `npm run check` shows your result, and the acceptance table is saved.

### How the check works

The checker compares your labels with the answer key.
It does not call a model.

### Your turn · Step 4

1. Get the checker and run it once. The first run creates an empty file, `labels.json`. That is not
   an error.

   ```sh
   git checkout origin/step-4 -- check.mjs answer-key.json labels.template.json package.json
   npm run check
   ```

2. In `labels.json`, enter `low`, `medium` or `high` for MSG-01 to MSG-09. Use the labels from your
   own runs (Step 1 and Step 3), and save the file.

3. Check them.

   ```sh
   npm run check
   ```

   For each message you see `correct` or `revise`, then the lesson totals, for example:

   ```text
   MSG-01 correct
   MSG-02 revise
   Lesson 1 (MSG-01 to MSG-06): 5/6 REVISE
   Lesson 3 (MSG-01 to MSG-09): 8/9 REVISE
   ```

   (Example output only.) Lesson 1 passes at 6/6, Lesson 3 at 9/9. `MSG-10` is not graded. `revise`
   means: reread the priority definitions and the trace. Do not change a label only to pass.

4. Fill in the acceptance table. For each message: the label, the facts from the desks, and whether a
   person has read the draft.

   | Message | Agent label | Customer context (`get_customer`) | Transaction facts (`get_transaction`) | Draft reviewed by a person? |
   | --- | --- | --- | --- | --- |
   | MSG-01 | | | none | |
   | MSG-05 | | | none | |
   | MSG-07 | | | | |
   | MSG-08 | | | | |
   | MSG-09 | | | | |

5. Save the table as `participant-output/acceptance-table.md` in the package folder. Create the folder
   `participant-output/` first if it is not there. Git ignores this folder, so your notes stay on your laptop.
   Stuck? `git stash -u`, then `git switch step-4`.

**Check your screen:** the first run of `npm run check` created `labels.json`. That is not an error.
Fill in low, medium or high for each message, then run `npm run check` again.

---

## Stretch · Assignment: chat in, chat out

Last session's assignment: the ticket enters at the Chat Input, goes through the whole flow, and a chat
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
2. Watch the trace: which subagent ran, and which MCP tool did it call?
3. Ask a follow-up in the same chat. Now the session is the memory, like Simple Memory last session.
4. Explore, like "look at other nodes" last session: add a `SKILL.md` or a `PreToolUse` hook. What
   would you change in `CLAUDE.md`?

More stretch:

- Run `MSG-07` to `MSG-09` with `lesson2` (no tool) and compare with `lesson3`.
- Compare the customer and transaction facts returned by the read-only MCP tools.

## Wrap-up · recap round, bridge to Workshop 5

Recap round: everyone shows one result in one minute (a trace, a draft, the check output, or the
chat). One agent, two subagents, one MCP tool, and a person who reviews every draft. Which part was
easier in n8n, and which in code? Where must a person still decide?
