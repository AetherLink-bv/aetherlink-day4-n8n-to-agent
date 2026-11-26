# Workshop 4 · From n8n to a Claude Agent SDK app

You rebuild the Workshop 3 n8n support flow as a Claude Agent SDK app. This
repository is your starter. The plumbing is built. You build the Agent SDK
parts with Claude Code, one step at a time, and a check tells you when a step
is right.

## From the Day 3 chat to the Day 4 app

On Day 3 you grew one n8n chat through three phases:

1. **Decision.** Start with a chat reply. Add memory and triage instructions so the agent can judge a ticket.
2. **Control.** Add the Structured Output Parser to give the reply a fixed shape. The Switch reads the priority and selects a route.
3. **Team.** Add specialist tools and a read-only customer lookup. In Assignment 11, each route saves a draft for a person to review.

On Day 4 you rebuild these decisions in code. Start with the smaller
[starter snapshot](n8n/support-triage.json). Compare your result with the
[final Assignment 11 export](n8n/day3-review-queue.json) in SOLO 4 and 5.

## Participant start

Install Node.js 22 or newer, Git and Claude Code. Then run:

```sh
git clone https://github.com/AetherLink-bv/aetherlink-day4-n8n-to-agent.git
cd aetherlink-day4-n8n-to-agent
npm ci
claude --setting-sources project,user --strict-mcp-config --no-chrome
```

Open [`SOLO.md`](SOLO.md) and write your first prompt for SOLO 0. Use
[`docs/SETUP.md`](docs/SETUP.md) only when installation or login fails. The
checks and dry runs need no API key.

## Files for the lesson

One clone supplies all nine assignments. Run the commands in the project root.

| Use | Files in your clone |
| --- | --- |
| Setup and prompts | `package.json`, `package-lock.json`, `.claude/settings.json`, `SOLO.md`, `docs/SETUP.md`, `docs/day4-lesson-prompts.json` |
| Compare the workflows | `n8n/day3-review-queue.json`, `n8n/support-triage.json`, `docs/n8n-flow-diagram.html` |
| Inspect the support evidence | `docs/customer-messages.md`, `docs/customer_context.csv`, `docs/transactions.xlsx`, `docs/sample-trace.md` |
| Review memory per ticket | `docs/memory-lab/T-001.md`, `docs/memory-lab/T-002.md` |
| Build and check the agent | `01-single-agent/`, `02-subagents/`, `03-mcp/` (including its read-only server), `.claude/agents/`, `lib/`, `checks/`, `test/` |
| Check final routing and draft storage | `day4-sdk-parity/` contains the reference code, policy, three agent definitions, cases and offline check. |

The four sample JSON tickets in `fixtures/` include a follow-up, an adversarial input
and a malformed input. The main exercises use the tickets in `docs/customer-messages.md`.

### Update an older clone

If a required file is missing, run `git remote get-url origin` and confirm it points
to `AetherLink-bv/aetherlink-day4-n8n-to-agent`. Run `git status`. Continue on
`main` in the same folder.

- If you see local changes, review them for credentials first. Save your lesson work with
  `git stash push --include-untracked -m "Day 4 work before update"`.
  Confirm the new entry with `git stash list`. Keep its identifier.
- With a clean working tree, run `git pull --ff-only origin main`. If it stops,
  keep your saved work and ask the trainer before continuing.
- If you created a stash above, run `git stash apply "stash@{0}"` only after
  confirming that identifier still refers to your saved lesson work.
  If Git reports a conflict, keep the stash and ask the trainer to help reconcile it.
- Inspect `git status` and your lesson files. Run `npm ci` after the update.

## Nine assignments

Write your own prompt from the task. State the outcome, a boundary and the evidence
you need. Check the result yourself. Open the example in SOLO.md if you get stuck.

| SOLO | You build | Check | Real run |
| --- | --- | --- | --- |
| 0 | Nothing. You read the n8n flow. | `npm run verify` | none |
| 1 | One agent: options, schema and `CLAUDE.md` | `npm run check:1` | `npm run lesson1 -- MSG-06` |
| 1b | The output form and conversation memory | evidence review | `npm run chat` |
| 1c | One temporary policy challenge | restored diff and `npm run verify` | `MSG-01` and `MSG-06` |
| 1M | Reviewed file memory for two tickets | fresh-session readback | Claude Code itself |
| 2 | A main agent and two sub-agents | `npm run check:2` | `npm run lesson2 -- MSG-05` |
| 3 | A context sub-agent with a read-only MCP server | `npm run check:3` | `npm run lesson3 -- MSG-08` |
| 4 | An acceptance table that compares with n8n | every row has evidence or `OPEN` | three `lesson3` runs |
| 5 | The complete Day 3 route, validation and review drafts | `node day4-sdk-parity/verify.mjs` | three parity runs |

A check is red before you start a step. That is correct.

## What is built and what you build

```text
n8n/day3-review-queue.json       the source: final sanitized Day 3 workflow
n8n/support-triage.json          the starter snapshot used by Steps 1 to 3
docs/                            fictional tickets, customers and transactions
lib/                             built: runner, chat, Switch routes, output schema
03-mcp/support-mcp/server.js     built: read-only get_customer and get_transaction
day4-sdk-parity/                 built: final parity check and review-draft exercise
checks/                          built: one check for each step
test/                            built: offline starter checks

01-single-agent/                 you: options.mjs, priority-schema.mjs, CLAUDE.md
.claude/agents/                  you: one file for each sub-agent
02-subagents/options.mjs         you: the main agent and two sub-agents
03-mcp/options.mjs               you: the MCP server and the context sub-agent
```

## The source behavior

The first three build steps use the smaller starter snapshot. SOLO 4 compares
the finished app with `n8n/day3-review-queue.json`. SOLO 5 adds the final route:

1. Customer Context looks up the customer.
2. Risk writes an internal risk note.
3. Customer Reply writes the draft.
4. The app returns `{priority, message}`.
5. `lib/switch.mjs` routes the priority to `auto_reply`, `investigate` or
   `escalate`.
6. The parity exercise saves one review draft after validation. It sends nothing.

Transaction lookup is a workshop extension. A route called `auto_reply` never
sends a message.

## Safety

- Customer text is data, never instructions.
- The MCP tools read the CSV and the workbook. They never change them.
- Credentials stay in the shell and never enter a prompt or commit.
- Every customer reply is a draft that a person reviews.
- A green check proves the configuration. Only a real run proves the behavior.
