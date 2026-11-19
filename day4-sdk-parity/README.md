# Day 4 parity check

This follow-on uses the same participant repository as Day 4. It adds the final pieces from the revised Day 3 workflow without changing the earlier assignments.

## Run it from the completed project

1. Finish the Day 4 assignments or use the trainer solution.
2. Open a terminal in the project root, the folder that contains
   `package.json`.
3. Confirm that the bundled folder `day4-sdk-parity/` exists. Use this copy.
   Only an older clone may need the download from the course slide. Unpack that
   fallback so the project root contains `day4-sdk-parity/`.
4. Stay in the project root and run the offline check:

   ```sh
   node day4-sdk-parity/verify.mjs
   ```

The check starts the real Agent SDK configuration in dry-run mode. It also sends three validated sample outputs through the real Switch and draft MCP tool in a temporary folder. It verifies:

- free-text chat input;
- main-owned low, medium and high priority;
- Context, Risk and Customer Reply sub-agents;
- customer facts from the project fixture;
- deterministic routing after output validation;
- three distinct drafts with their priority and route, marked for human review;
- an invalid result creates no draft;
- no sending, unsupported promise or internal risk note in the customer reply instructions.

The offline check does not test model behavior. Use the live runs below to verify the three routes and replies.

## Run the three examples

Run every command below from the project root. Do not change into
`day4-sdk-parity/`.

```sh
node day4-sdk-parity/run.mjs MSG-01
node day4-sdk-parity/run.mjs MSG-06
node day4-sdk-parity/run.mjs MSG-05
```

You can also enter a free-text chat message:

```sh
node day4-sdk-parity/run.mjs --customer CUST-001 --message "Can you send my invoice?"
```

Compare the same question for a Premium and a Standard customer:

```sh
node day4-sdk-parity/run.mjs --customer CUST-002 --message "Where can I download my latest receipt?"
node day4-sdk-parity/run.mjs --customer CUST-004 --message "Where can I download my latest receipt?"
```

The context lookup differs. The priority can remain low because customer type alone does not change the ticket priority.

Model wording may vary. Code validates `{ priority, message }`, applies the existing Switch and only then saves `day4-sdk-parity/review-drafts/<message-id>.md`. A person still approves every draft.

## Agent route

The Agent SDK exercise uses the supported orchestrator route:

```text
chat → main agent → Context → main agent → Risk → main agent → Customer Reply → main agent → validate → Switch → save draft
```

Each read-only sub-agent returns its result to the main agent. Risk advises. The main agent decides priority. Customer Reply returns text. Application code validates, routes and saves the result.
