# Workshop 4 · Build the n8n support app with Claude Code

You rebuild the Workshop 3 n8n support flow as a Claude Agent SDK app. The
starter already contains the plumbing: the runner, the read-only MCP server and
the tests. You build only the Agent SDK parts, one step at a time.

The Workshop 4 slides determine the order. If the materials conflict, follow
the slides.

## How to write and test your prompts

1. **Write your own prompt.** Name the outcome, set one boundary and ask for
   evidence you can inspect. Use the assignment brief below. If the result
   misses a requirement, revise your prompt before opening the example.
2. **The check goes green.** `npm run check:1`, `check:2` or `check:3` tells
   you that your step matches the reference. Everyone gets the same result.
3. **One real run.** You see the agent work on a fictional ticket.
4. **Claude Code explains why.** You read the explanation.
5. **Test it yourself.** You type the same check and the same run in a second
   terminal, and compare your screen with the slide.

A check is red before you start. That is correct. If a check stays red, give
Claude Code the failed line and ask for the smallest fix.

## Source contract

[`n8n/day3-review-queue.json`](n8n/day3-review-queue.json) is the final
sanitized Day 3 workflow. [`n8n/support-triage.json`](n8n/support-triage.json)
is the smaller starter snapshot used by Steps 1 to 3. Both files contain no
credentials. Do not import or activate them.

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

Start Claude Code in your clone, as the README shows.

Ask for a comparison of the final Day 3 flow and the starter. Keep both files unchanged. Which missing behavior should the comparison mark OPEN?

<details>
<summary>Stuck? Compare your prompt with this example.</summary>

```text
Read n8n/day3-review-queue.json, n8n/support-triage.json and the Source contract in SOLO.md. Change no file. Show one comparison table with these columns: Day 3 part, final Day 3 node, starter snapshot node, and Agent SDK file that replaces it. Include chat, Simple Memory, the main AI Agent, Structured Output Parser, Switch, Customer Reply Agent, Risk Agent, Customer Context Agent, Get row(s), and all three Save draft nodes. Mark anything in the final workflow that Day 4 does not yet reproduce as OPEN. Stop.
```

</details>

Then test it yourself in a second terminal:

```sh
npm run doctor
npm run verify
```

**Check:** both commands exit 0, and you can point to the three sub-agents in
the final n8n JSON.

**Stop:** after you have read the table.

## SOLO 1 · One agent that fills in the form

Describe the form one agent must return. Limit edits to the three Step 1 files. Ask for the first failed check and its passing result.

<details>
<summary>Stuck? Compare your prompt with this example.</summary>

```text
Run npm run check:1 and show what is red. Read the STEP 1 TODOs in 01-single-agent and the AI Agent node in n8n/support-triage.json. Fill in options.mjs, priority-schema.mjs and claude-project/CLAUDE.md. Copy the policy from the n8n system message and leave the sub-agents out. Change no other file. Run npm run check:1 until it passes. Run npm run lesson1 -- MSG-06 once and show the real output. Then show one table: each option in options.mjs, the n8n setting it replaces, and what goes wrong without it. Stop.
```

</details>

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

Start in the project root, the folder that contains `package.json`. Use this
protocol for the documented memory check:

1. Run `npm run lesson1 -- MSG-01 --dry-run` and inspect `outputFormat`,
   `priority-schema.mjs` and `lib/switch.mjs`. This is setup evidence, not a
   model result.
2. Run `npm run chat`. Wait for `you>`. Enter: “This is ticket T-101. Remember
   the harmless marker BLUE-LANTERN.” At the next `you>`, ask: “What is the
   marker for T-101?” This answer is live model evidence.
3. At the next `you>`, enter `exit`. Wait for the normal shell prompt. Stay in
   the project root and run `npm run chat` again. At `you>`, enter: “This is
   ticket T-202. What is the marker for T-101?” This new process must not know
   it.
4. Keep the evidence labels separate: the dry run is configuration evidence,
   the chat is live model evidence and `docs/sample-trace.md` is sample
   evidence.

Design a two-ticket memory experiment using the protocol above. Keep the code unchanged. What output would distinguish same-session recall from a fresh session?

<details>
<summary>Stuck? Compare your prompt with this example.</summary>

```text
Run the documented SOLO 1 dry run and point to outputFormat, priority-schema.mjs and lib/switch.mjs. Then run the documented chat memory check with two ticket_id values. Explain which output is setup evidence and which output came from a model. Show the commands and actual output. Change nothing. Stop for my review.
```

</details>

**Check:** the same conversation recalls its marker. A fresh conversation for
another ticket does not receive that marker.

**Stop:** after you have separated setup evidence, model evidence and sample
evidence.

### SOLO 1c · Challenge the policy

Start with the accepted files from SOLO 1. Keep those edits. Before the
experiment, read the exact current Priority definitions and inspect
`git diff -- 01-single-agent/claude-project/CLAUDE.md`. Do not reset the file
or replace unrelated work.

Choose a temporary policy variation. Require approval before the edit. Ask for comparable results on both tickets and proof that your accepted policy survived restoration.

<details>
<summary>Stuck? Compare your prompt with this example.</summary>

```text
Read my SOLO 1 diff and actual runs. Propose one temporary policy change that could expose tone bias without changing the fixed route. Wait for my approval. After approval, run MSG-01 and MSG-06 before and after. Record the labels and explain whether the result changed. Restore the accepted policy from the current diff, rerun npm run verify and show the clean restoration. Do not use a finished branch or reveal an answer key. Stop for my review.
```

</details>

After the experiment, restore only the temporary policy change to the exact
pre-experiment text. Inspect the same diff again. Your accepted SOLO 1 edits
must remain, and the temporary change must be gone.

**Check:** the before and after evidence uses the same messages, and the
accepted policy is restored with `npm run verify` passing.

**Stop:** after inspecting the restored diff and actual verification output.

## SOLO 1M · Build reviewed memory per ticket · 20 minutes

**Scenario:** T-001 must resume in a new Claude Code session without mixing in
T-002.

**Starting state:** `docs/memory-lab/T-001.md` and `T-002.md` are separate
fictional sources. No conversation, technical log or ticket memory file exists.

Ask for a memory proposal using T-001 only. Require Confirmed facts, Decisions, Open questions and Next step, a source label per item and OPEN for uncertainty. Exclude personal data, credentials and transcripts. Require approval before writing.

<details>
<summary>Stuck? Compare your prompt with this example.</summary>

```text
Use Claude Code itself as our chat. Do not build a UI, add a model API call, or change the Agent SDK flow. Read docs/memory-lab/T-001.md only. No conversation or technical log exists for this exercise, so do not invent either one. Explain the difference between conversation/session resume, append-only technical logging, and a curated ticket memory file.

Propose tickets/T-001/memory.md with exactly these headings: Confirmed facts, Decisions, Open questions, and Next step. Map every item to a stable T-001 source label. Preserve uncertain source claims as OPEN: under Open questions. Keep only durable ticket context. Do not include credentials, authentication data, tokens, personal data, a transcript dump, or speculation. Show the proposed file and wait for my approval. After I approve, create only tickets/T-001/memory.md and show the diff. Stop and tell me to open a fresh Claude Code session.
```

</details>

Type `/exit` in Claude Code. Wait for the normal shell prompt and stay in the
project root. Start a fresh session with
`claude --setting-sources project,user --strict-mcp-config --no-chrome`.
Write a new prompt in that session.

Ask the new session to read only the reviewed T-001 memory file. Request a summary with source labels and an explanation of how the session obtained it.

<details>
<summary>Stuck? Compare your prompt with this example.</summary>

```text
This is a fresh Claude Code session. Read only tickets/T-001/memory.md. Do not read a transcript, technical log, T-002 source, or T-002 memory. Summarize the confirmed facts, decisions, open questions, and next step with their source references. State that you read this file explicitly and that it was not loaded automatically. Propose no implementation. Stop after the summary.
```

</details>

Type `/exit` again. Wait for the normal shell prompt and stay in the project
root. Run
`claude --setting-sources project,user --strict-mcp-config --no-chrome` again.
Write a new prompt in that session.

Ask for a separate T-002 proposal using only its source. Retain the same headings, evidence and approval rules. How will you check for T-001 contamination?

<details>
<summary>Stuck? Compare your prompt with this example.</summary>

```text
This is another fresh Claude Code session. Read docs/memory-lab/T-002.md only. Do not read docs/memory-lab/T-001.md or tickets/T-001/memory.md. Propose tickets/T-002/memory.md with exactly these headings: Confirmed facts, Decisions, Open questions, and Next step. Map every item to a stable T-002 source label. Preserve uncertain source claims as OPEN: under Open questions. Do not include credentials, authentication data, tokens, personal data, a transcript dump, or speculation. Show the proposal and wait for my approval. After I approve, create only tickets/T-002/memory.md and show the diff. Do not create or rewrite technical logs. Stop for my isolation review.
```

</details>

**Actions:** review each proposal before its write. Keep both source fixtures
unchanged. Use separate fresh sessions. After Claude stops, compare both files
yourself and confirm that T-002 contains no T-001 label or fact.

**Expected result:** two small reviewed memory files exist. Each contains
sourced facts, decisions, open questions and a next step. The fresh session
resumes T-001 only after reading its file. T-002 contains no T-001 facts.

**Stop:** after T-001 resumed without replaying a conversation or reading logs,
and T-002 stayed isolated. Do not build a UI or add a model call.

## SOLO 2 · A main agent and two sub-agents

Describe the two specialists you need. Limit edits to their definitions and Step 2 options. Request a passing check and evidence of which specialist ran first.

<details>
<summary>Stuck? Compare your prompt with this example.</summary>

```text
Run npm run check:2 and show what is red. Read the STEP 2 TODOs in 02-subagents/options.mjs and .claude/agents, and the Risk Agent and Customer Reply Agent nodes in n8n/support-triage.json. Fill in risk-agent.md, customer-reply-agent.md and 02-subagents/options.mjs. Copy each n8n tool description and system message. Change no other file. Run npm run check:2 until it passes. Run npm run lesson2 -- MSG-05 once and show the trace. Then explain in five lines: how the main agent chooses a sub-agent, why a sub-agent has its own context, and why neither sub-agent has a tool. Stop.
```

</details>

Then test it yourself in a second terminal:

```sh
npm run check:2
npm run lesson2 -- MSG-05
```

**Check:** `npm run check:2` passes, and the trace shows `risk-agent` before
`customer-reply-agent`.

**Why:** the `description` of an agent file tells the main agent when to
delegate. Each sub-agent starts with an empty context and returns only its
answer. `tools: ['Agent']` means the main agent can delegate and do nothing else.

**Stop:** after you have read the draft in `message`. Nothing is sent.

## SOLO 3 · Real facts from a read-only MCP server

Describe a lookup that only the context specialist may perform. Keep the server read-only. Ask for the check and trace each reported fact to its tool result.

<details>
<summary>Stuck? Compare your prompt with this example.</summary>

```text
Run npm run check:3 and show what is red. Read the STEP 3 TODOs in 03-mcp/options.mjs and .claude/agents/customer-context-agent.md, and the Customer Context Agent node in n8n/support-triage.json. Fill in customer-context-agent.md and 03-mcp/options.mjs. Change no other file, and do not change support-mcp/server.js. Run npm run check:3 until it passes. Run npm run lesson3 -- MSG-08 once and show the trace. Then show which facts in the answer came from get_customer and get_transaction, and explain why only customer-context-agent has these tools. Stop.
```

</details>

Then test it yourself in a second terminal:

```sh
npm run smoke:mcp
npm run check:3
npm run lesson3 -- MSG-08
```

**Check:** `npm run check:3` passes, and the trace shows Context → Risk →
Reply with two tool results.

**Why:** an MCP server gives an agent tools from outside the SDK. You name the
server in `mcpServers` and you give its tools to one sub-agent. The other
agents cannot look up or change data, because they have no tool to do so.

**Stop:** after you have matched each fact in the draft to a tool result.

## SOLO 4 · Compare with n8n and collect proof

Describe the comparison table for MSG-01, MSG-06 and MSG-09. Keep source files unchanged. Require direct evidence per row and OPEN for anything unobserved.

<details>
<summary>Stuck? Compare your prompt with this example.</summary>

```text
Run npm run lesson3 for MSG-01, MSG-06 and MSG-09. Read n8n/day3-review-queue.json as the final Day 3 source. Create participant-output/acceptance-table.md with one row for each message: observed priority, route, order of the sub-agents, facts that came from a tool, and the final Day 3 node that gave this behavior. Use only output from these runs. Write OPEN where you did not observe the behavior. Change no source file. Then name one difference between the final Day 3 workflow and this app. Stop.
```

</details>

**Your variation:** choose the difference you would improve first, and say
which file you would change.

**Check:** every row points to a real run or says `OPEN`.

**Stop:** after your review. Nothing is sent or deployed.

## SOLO 5 · Match the final Day 3 route

Start in the project root, the folder that contains `package.json`. The folder
`day4-sdk-parity/` is already bundled in this repository. Use that copy first.
If it is missing, download the Day 4 SDK exercise from the course slide and
unpack it so the project root contains `day4-sdk-parity/`. Do not run the
commands from inside that folder.

The exercise adds the final Day 3 policy, all three sub-agents, deterministic
routing and review-draft storage. It does not change the earlier assignments.

Run the offline check:

```sh
node day4-sdk-parity/verify.mjs
```

Then run the three examples:

```sh
node day4-sdk-parity/run.mjs MSG-01
node day4-sdk-parity/run.mjs MSG-06
node day4-sdk-parity/run.mjs MSG-05
```

Inspect `day4-sdk-parity/review-drafts/`. Each run must create one draft with
its priority and route. The reply must not contain the internal risk note or
promise an action that this workflow does not perform.

**Check:** the offline check passes. The live runs return low, medium and high.
Each result is validated before its review draft is saved. Nothing is sent.

**Stop:** after you have compared the three drafts with the final Day 3 route.

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
git clone --branch trainer/solution --single-branch https://github.com/AetherLink-bv/aetherlink-day4-n8n-to-agent.git aetherlink-day4-trainer
cd aetherlink-day4-trainer
npm ci
npm run verify
npm run check:1 && npm run check:2 && npm run check:3
node day4-sdk-parity/verify.mjs
```

Participants stay on `main`. If a participant falls behind, they compare their prompt with the example for the current step and rerun its check. They do not copy files from this branch.
