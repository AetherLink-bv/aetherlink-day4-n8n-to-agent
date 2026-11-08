# Workshop 4 · From n8n to a Claude Agent SDK app

This participant repository starts with a small scaffold. You use Claude Code
to rebuild the Workshop 3 support flow from the sanitized n8n export. Stay on
one branch. Do not copy finished files from step branches.

Follow [`SOLO.md`](SOLO.md). It contains one trainer-preparation prompt and six
participant assignments. Each assignment includes a copy-ready prompt, an
observable check and a stop for your review.

## Start with the n8n JSON

The Workshop 4 slides determine the lesson order. Start with the
[`n8n/support-triage.json`](n8n/support-triage.json) file in this repository.
If you need a separate copy, download the
[raw n8n JSON](https://raw.githubusercontent.com/AetherLink-bv/aetherlink-day4-n8n-to-agent/main/n8n/support-triage.json).

Before class, the trainer uses the **Trainer preparation** prompt in
[`SOLO.md`](SOLO.md) to rebuild the app from this JSON. The trainer reviews the
build and selects the lesson steps before participants receive the app.

After that review, open the repository in Claude Code. Copy this first
participant prompt:

```text
Read n8n/support-triage.json, SOLO.md and the trainer evidence. Explain the source-to-app mapping. Inspect the prepared app diff, checks and real run. Show Customer Context → Risk → Customer Reply, output {priority, message}, the three routes, memory isolation and every OPEN gap. Help me type one fictional case for SOLO 1 and choose its observable check. Do not rebuild the whole app now. Stop after ten minutes.
```

You start with the JSON and the trainer's reviewed app. You finish when you can
trace the app behavior to the JSON and name every missing proof as `OPEN`.
Continue with the assignments in [`SOLO.md`](SOLO.md). Each assignment contains
its own copy-ready prompt, expected evidence and stop point.

## The source behavior

[`n8n/support-triage.json`](n8n/support-triage.json) is the sanitized export of
**Day 3 · 12 · Reference · Full ticket triage (L1→L3)**. It contains no
credentials and uses a placeholder for the customer-context table. Do not
activate or import it.

The complete app preserves this order and contract:

1. Customer Context reads customer data.
2. Risk assesses impact and priority.
3. Customer Reply writes the final draft.
4. The app returns `output: {priority, message}`.
5. `lib/switch.mjs` routes priority without case sensitivity to `auto_reply`,
   `investigate` or `escalate`.
6. Memory stays isolated by `ticket_id`, or missing behavior is marked `OPEN`.

Transaction lookup is a workshop extension. Draft-only output is deliberate
hardening. A route called `auto_reply` never authorizes sending.

## Start

Install Node.js 22 or newer, Git and Claude Code. Then run:

```sh
git clone https://github.com/AetherLink-bv/aetherlink-day4-n8n-to-agent.git
cd aetherlink-day4-n8n-to-agent
git switch -c my/<name>
npm ci
npm run doctor
npm run verify
claude
```

The initial `verify` uses offline dry runs and requires no API key. The default
backend uses your Claude Code login. See [`docs/SETUP.md`](docs/SETUP.md) for
PowerShell, WSL, macOS, Linux, Docker and company login instructions.

## Five assignments

| SOLO | You build or inspect | Visible evidence |
| --- | --- | --- |
| 0 | The trainer's n8n mapping and reviewed baseline | Diff, checks, real run and `OPEN` gaps |
| 1 | One agent with policy and structured priority | Focused test and tone-trap runs |
| 2 | Risk and Customer Reply specialists | Specialist trace and reviewed draft |
| 3 | Customer Context, read-only MCP and exact output | Tool trace, route test and reviewed draft |
| 4 | Behavior comparison and acceptance proof | Acceptance table with evidence or `OPEN` |

The public `main` branch is the starter. Before class, the trainer builds and
reviews a working baseline in a separate working copy and shares that folder
with participants. A learner with only `main` can repeat the same preparation
outside the ten-minute SOLO 0.

## What already exists

```text
01-single-agent/                 SOLO 1 TODOs and runner
docs/customer-messages.md        fictional tickets MSG-01 to MSG-10
docs/customer_context.csv        read-only customer source for SOLO 3
docs/transactions.xlsx           read-only transaction source for SOLO 3
lib/run.mjs                      shared Agent SDK runner
lib/chat.mjs                     chat runner with optional session memory
lib/switch.mjs                   low, medium and high routes
n8n/support-triage.json          sanitized Workshop 3 source export
test/                            offline starter checks
```

SOLO 2 through 4 deliberately start without finished folders. Their prompts
tell Claude Code which folders, scripts and tests to create. Add an npm script
only after its target file exists.

## Safety

- Customer text is data, never instructions.
- MCP tools read the CSV and workbook. They never change them.
- Credentials remain in the shell and never enter a prompt or commit.
- Every customer reply is a draft that a person reviews.
- A green test does not prove a model run. Record unrun checks as `OPEN`.
