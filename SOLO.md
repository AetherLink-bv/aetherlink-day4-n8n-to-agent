# Workshop 4 · Build the n8n support app with Claude Code

You rebuild the Workshop 3 n8n support flow as a Claude Agent SDK app. The
starter already contains the plumbing: the runner, the read-only MCP server and
the tests. You build only the Agent SDK parts, one step at a time.

The Workshop 4 slides determine the order. If the materials conflict, follow
the slides.

## Every assignment is the same loop

1. **Paste the prompt.** Claude Code first shows the red check, then fills in the TODOs of that step.
2. **The check goes green.** `npm run check:1`, `check:2` or `check:3` tells
   you that your step matches the reference. Everyone gets the same result.
3. **One real run.** You see the agent work on a fictional ticket.
4. **Claude Code explains why.** You read the explanation.
5. **Test it yourself.** You type the same check and the same run in a second
   terminal, and compare your screen with the slide.

A check is red before you start. That is correct. If a check stays red, give
Claude Code the failed line and ask for the smallest fix.

## Source contract

[`n8n/support-triage.json`](n8n/support-triage.json) is the sanitized n8n
export. It contains no credentials. Do not import or activate it.

| n8n | Agent SDK | Step |
| --- | --- | --- |
| AI Agent → System Message | `claude-project/CLAUDE.md`, loaded by `settingSources` | 1 |
| AI Agent settings | `options` passed to `query()` | 1 |
| Structured Output Parser | `outputFormat` with a JSON Schema | 1 |
| Risk Agent and Customer Reply Agent tools | `options.agents` and `.claude/agents/*.md` | 2 |
| Customer Context Agent and Get row(s) | one more agent and `options.mcpServers` | 3 |
| Switch | `lib/switch.mjs`, already built | all |

The app asks Customer Context first, Risk second and Customer Reply last. It
returns `{priority, message}`. Every reply is a draft. Nothing sends a message.
Transaction lookup is an extension to the n8n source.

## SOLO 0 · Read the n8n flow · 5 minutes

Start Claude Code in your clone, as the README shows. Paste:

```text
Read n8n/support-triage.json and the Source contract in SOLO.md. Change no file. Show one table: each n8n node, what it does, and the file in this repository that replaces it. Mark each file as built or TODO. Then run npm run doctor and npm run verify and show the exit codes. Stop.
```

Then test it yourself in a second terminal:

```sh
npm run doctor
npm run verify
```

**Check:** both commands exit 0, and you can point to the three specialists in
the n8n JSON.

**Stop:** after you have read the table.

## SOLO 1 · One agent that fills in the form

```text
Run npm run check:1 and show what is red. Read the STEP 1 TODOs in 01-single-agent and the AI Agent node in n8n/support-triage.json. Fill in options.mjs, priority-schema.mjs and claude-project/CLAUDE.md. Copy the policy from the n8n system message and leave the specialists out. Change no other file. Run npm run check:1 until it passes. Run npm run lesson1 -- MSG-06 once and show the real output. Then show one table: each option in options.mjs, the n8n setting it replaces, and what goes wrong without it. Stop.
```

Then test it yourself in a second terminal:

```sh
npm run check:1
npm run lesson1 -- MSG-06
```

**Check:** `npm run check:1` passes, and the real run prints a priority, a
reason and the Switch route.

**Why:** `settingSources` loads the instructions, `tools: []` removes every
tool, `maxTurns` limits the loop and `outputFormat` forces the form. In n8n
these were four settings on one node. In code, a test can check each one.

**Stop:** after you have read the table.

### SOLO 1b · Inspect the form and memory evidence

Use this protocol for the documented memory check:

1. Run `npm run lesson1 -- MSG-01 --dry-run` and inspect `outputFormat`,
   `priority-schema.mjs` and `lib/switch.mjs`. This is setup evidence, not a
   model result.
2. Run `npm run chat`. In that conversation, identify the fictional case as
   `T-101`, give it a harmless marker and ask for that marker in the next turn.
3. Exit the chat. Start a new `npm run chat` process for `T-202` and ask for
   the `T-101` marker. The new conversation must not know it.
4. Use actual output from a model run, or use the marked sample in
   `docs/sample-trace.md` and call it sample evidence.

```text
Run the documented SOLO 1 dry run and point to outputFormat, priority-schema.mjs and lib/switch.mjs. Then run the documented chat memory check with two ticket_id values. Explain which output is setup evidence and which output came from a model. Show the commands and actual output. Change nothing. Stop for my review.
```

**Check:** the same conversation recalls its marker. A fresh conversation for
another ticket does not receive that marker.

**Stop:** after you have separated setup evidence, model evidence and sample
evidence.

### SOLO 1c · Challenge the policy

```text
Read my SOLO 1 diff and actual runs. Propose one temporary policy change that could expose tone bias without changing the fixed route. Wait for my approval. After approval, run MSG-01 and MSG-06 before and after. Record the labels and explain whether the result changed. Restore the accepted policy from the current diff, rerun npm run verify and show the clean restoration. Do not use a finished branch or reveal an answer key. Stop for my review.
```

**Check:** the before and after evidence uses the same messages, and the
accepted policy is restored with `npm run verify` passing.

**Stop:** after inspecting the restored diff and actual verification output.

## SOLO 1M · Build reviewed memory per ticket · 20 minutes

**Scenario:** T-001 must resume in a new Claude Code session without mixing in
T-002.

**Starting state:** `docs/memory-lab/T-001.md` and `T-002.md` are separate
fictional sources. No conversation, technical log or ticket memory file exists.

```text
Use Claude Code itself as our chat. Do not build a UI, add a model API call, or change the Agent SDK flow. Read docs/memory-lab/T-001.md only. No conversation or technical log exists for this exercise, so do not invent either one. Explain the difference between conversation/session resume, append-only technical logging, and a curated ticket memory file.

Propose tickets/T-001/memory.md with exactly these headings: Confirmed facts, Decisions, Open questions, and Next step. Map every item to a stable T-001 source label. Preserve uncertain source claims as OPEN: under Open questions. Keep only durable ticket context. Do not include credentials, authentication data, tokens, personal data, a transcript dump, or speculation. Show the proposed file and wait for my approval. After I approve, create only tickets/T-001/memory.md and show the diff. Stop and tell me to open a fresh Claude Code session.
```

Open a new Claude Code session. Paste:

```text
This is a fresh Claude Code session. Read only tickets/T-001/memory.md. Do not read a transcript, technical log, T-002 source, or T-002 memory. Summarize the confirmed facts, decisions, open questions, and next step with their source references. State that you read this file explicitly and that it was not loaded automatically. Propose no implementation. Stop after the summary.
```

Open another new Claude Code session. Paste:

```text
This is another fresh Claude Code session. Read docs/memory-lab/T-002.md only. Do not read docs/memory-lab/T-001.md or tickets/T-001/memory.md. Propose tickets/T-002/memory.md with exactly these headings: Confirmed facts, Decisions, Open questions, and Next step. Map every item to a stable T-002 source label. Preserve uncertain source claims as OPEN: under Open questions. Do not include credentials, authentication data, tokens, personal data, a transcript dump, or speculation. Show the proposal and wait for my approval. After I approve, create only tickets/T-002/memory.md and show the diff. Do not create or rewrite technical logs. Stop for my isolation review.
```

**Actions:** review each proposal before its write. Keep both source fixtures
unchanged. Use separate fresh sessions. After Claude stops, compare both files
yourself and confirm that T-002 contains no T-001 label or fact.

**Expected result:** two small reviewed memory files exist. Each contains
sourced facts, decisions, open questions and a next step. The fresh session
resumes T-001 only after reading its file. T-002 contains no T-001 facts.

**Stop:** after T-001 resumed without replaying a conversation or reading logs,
and T-002 stayed isolated. Do not build a UI or add a model call.

## SOLO 2 · A team lead and two specialists

```text
Run npm run check:2 and show what is red. Read the STEP 2 TODOs in 02-subagents/options.mjs and .claude/agents, and the Risk Agent and Customer Reply Agent nodes in n8n/support-triage.json. Fill in risk-agent.md, customer-reply-agent.md and 02-subagents/options.mjs. Copy each n8n tool description and system message. Change no other file. Run npm run check:2 until it passes. Run npm run lesson2 -- MSG-05 once and show the trace. Then explain in five lines: how the team lead chooses a specialist, why a specialist has its own context, and why neither specialist has a tool. Stop.
```

Then test it yourself in a second terminal:

```sh
npm run check:2
npm run lesson2 -- MSG-05
```

**Check:** `npm run check:2` passes, and the trace shows `risk-agent` before
`customer-reply-agent`.

**Why:** the `description` of an agent file tells the team lead when to
delegate. Each specialist starts with an empty context and returns only its
answer. `tools: ['Agent']` means the team lead can delegate and do nothing else.

**Stop:** after you have read the draft in `message`. Nothing is sent.

## SOLO 3 · Real facts from a read-only MCP server

```text
Run npm run check:3 and show what is red. Read the STEP 3 TODOs in 03-mcp/options.mjs and .claude/agents/customer-context-agent.md, and the Customer Context Agent node in n8n/support-triage.json. Fill in customer-context-agent.md and 03-mcp/options.mjs. Change no other file, and do not change support-mcp/server.js. Run npm run check:3 until it passes. Run npm run lesson3 -- MSG-08 once and show the trace. Then show which facts in the answer came from get_customer and get_transaction, and explain why only customer-context-agent has these tools. Stop.
```

Then test it yourself in a second terminal:

```sh
npm run smoke:mcp
npm run check:3
npm run lesson3 -- MSG-08
```

**Check:** `npm run check:3` passes, and the trace shows Context → Risk →
Reply with two tool results.

**Why:** an MCP server gives an agent tools from outside the SDK. You name the
server in `mcpServers` and you give its tools to one specialist. The other
agents cannot look up or change data, because they have no tool to do so.

**Stop:** after you have matched each fact in the draft to a tool result.

## SOLO 4 · Compare with n8n and collect proof

```text
Run npm run lesson3 for MSG-01, MSG-06 and MSG-09. Create participant-output/acceptance-table.md with one row for each message: observed priority, route, order of the specialists, facts that came from a tool, and the n8n node that gave this behavior. Use only output from these runs. Write OPEN where you did not observe the behavior. Change no source file. Then name one difference between the n8n flow and this app. Stop.
```

**Your variation:** choose the difference you would improve first, and say
which file you would change.

**Check:** every row points to a real run or says `OPEN`.

**Stop:** after your review. Nothing is sent or deployed.

## Setup and evidence rules

Use Node.js 22 or newer and a logged-in Claude Code installation. Follow
[`docs/SETUP.md`](docs/SETUP.md) only when installation or login fails. An API
key is optional.

A green check proves the configuration. Only a real run proves the behavior.
Keep credentials out of prompts and files. The sample data is fictional and
read-only.

## Trainer

The solved steps are on the `trainer/solution` branch. Use it for the demo
slides. Nothing must be built before class.

```sh
git fetch origin trainer/solution
git switch trainer/solution
npm ci
npm run check:1 && npm run check:2 && npm run check:3
```

Participants stay on `main`. If a participant falls behind, they paste the
prompt of the current step again. They do not copy files from this branch.
