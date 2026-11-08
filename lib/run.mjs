import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { parseMessages } from './messages.mjs';
import { route } from './switch.mjs';
import { withUserSettingsEnv } from './user-settings-env.mjs';
import {
  backendLabel,
  assertSuccessfulResult,
  failedResultMessage,
  findClaudeBinary,
  formatCommand,
  runClaudeCode,
  selectBackend,
  toClaudeArgs,
} from './backend.mjs';

const packageDirectory = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const messagesPath = path.join(packageDirectory, 'docs', 'customer-messages.md');

export async function runLesson(lesson) {
  try {
    await runLessonUnsafe(lesson);
  } catch (error) {
    console.error(`Error: ${error.message}`);
    process.exitCode = 1;
  }
}

async function runLessonUnsafe({ buildOptions, dryRunNote }) {
  let backendArgument;
  const args = [];
  const inputArgs = process.argv.slice(2);
  for (let index = 0; index < inputArgs.length; index += 1) {
    const arg = inputArgs[index];
    if (arg === '--backend') {
      backendArgument = inputArgs[index + 1];
      if (!backendArgument) {
        throw new Error('--backend needs claude-code, sdk, or sdk-login.');
      }
      index += 1;
    } else if (arg.startsWith('--backend=')) {
      backendArgument = arg.slice('--backend='.length);
      if (!backendArgument) {
        throw new Error('--backend needs claude-code, sdk, or sdk-login.');
      }
    } else {
      args.push(arg);
    }
  }
  const [id, ...lessonArgs] = args;
  const dryRun = lessonArgs.includes('--dry-run');
  const unexpectedArgs = lessonArgs.filter((arg) => arg !== '--dry-run');

  if (!id || unexpectedArgs.length > 0) {
    throw new Error('Usage: node <lesson>/agent.mjs MSG-0N [--dry-run]');
  }

  const markdown = await readFile(messagesPath, 'utf8');
  const message = parseMessages(markdown).find((item) => item.id === id);

  if (!message) {
    throw new Error(`No customer message found for ${id}`);
  }

  const prompt = `Customer message ${message.id}\nCustomer: ${message.customer}\nSubject: ${message.subject}\n\n${message.message}`;
  await runQuery({ prompt, options: buildOptions(), dryRun, dryRunNote, backendArgument });
}

// On main the options are still {}: a live run would then get every tool and the participant's own Claude settings.
export function assertOptionsBuilt(options) {
  if (Object.keys(options ?? {}).length === 0) {
    throw new Error('Step 1 is not built yet: the agent options are still {}. Do Build 1 to 3 in SOLO.md first, or add --dry-run.');
  }
}

export function assertBackendAccess(backend) {
  if (backend === 'sdk' && !process.env.ANTHROPIC_API_KEY) {
    throw new Error('The sdk backend needs ANTHROPIC_API_KEY. Use the default claude-code backend or set a key for this shell.');
  }
  if (backend === 'claude-code') {
    const binary = findClaudeBinary();
    if (!binary) {
      throw new Error('Claude Code is not on PATH. Install it from https://code.claude.com/docs/en/setup.');
    }
    if (!binary.native) {
      throw new Error('The claude.cmd shim cannot run without a shell. Install the native Claude Code CLI from https://code.claude.com/docs/en/setup.');
    }
    return binary.command;
  }
  return null;
}

export function printEvent(event) {
  if (event.type === 'system' && event.subtype === 'init') {
    const tools = event.tools?.join(', ') ?? 'none';
    const servers = event.mcp_servers?.map((server) => server.name ?? server).join(', ') ?? 'none';
    console.log(`[system:init] model ${event.model ?? 'unknown'} · tools ${tools} · MCP ${servers}`);
  }

  if (event.type === 'assistant') {
    for (const block of event.message.content) {
      if (block.type === 'text') {
        console.log(`[assistant] ${block.text}`);
      } else if (block.type === 'tool_use') {
        if (block.name === 'Agent') {
          console.log(`[tool_use] Agent → ${block.input.subagent_type ?? 'subagent'}`);
        } else if (block.name.startsWith('mcp__')) {
          console.log(`[tool_use] ${block.name}`);
        } else {
          console.log(`[tool_use] ${block.name}`);
        }
      }
    }
  }

  if (event.type === 'user') {
    const results = event.message?.content?.filter((block) => block.type === 'tool_result') ?? [];
    for (const block of results) {
      const text = typeof block.content === 'string' ? block.content : JSON.stringify(block.content ?? '');
      console.log(`[tool_result] ${text.replace(/\s+/g, ' ').slice(0, 160)}`);
    }
  }

  if (event.type === 'result' && event.subtype === 'error_max_structured_output_retries') {
    console.error('Structured output failed: the model could not satisfy the schema after maximum retries (error_max_structured_output_retries).');
  }

  if (event.type === 'result') {
    const failure = failedResultMessage(event);
    if (failure) {
      console.error(failure);
    }
    const duration = event.duration_ms === undefined ? '' : ` · ${event.duration_ms} ms`;
    const cost = event.total_cost_usd === undefined ? '' : ` · $${event.total_cost_usd}`;
    console.log(`[result] ${event.subtype ?? 'completed'} · ${event.num_turns ?? 0} turns${duration}${cost}`);
  }

  if (event.type === 'result' && event.structured_output !== undefined) {
    console.log('Structured output:');
    console.log(JSON.stringify(event.structured_output, null, 2));

    const priority = event.structured_output?.priority;
    const selectedRoute = route(priority);

    if (selectedRoute) {
      console.log(`Switch → ${priority} → ${selectedRoute.action} (${selectedRoute.team})`);
    }
  }
}

export async function runQuery({ prompt, options, dryRun, dryRunNote, backendArgument }) {
  return runWithBackend({ prompt, options, dryRun, dryRunNote, backendArgument });
}

// Only the lesson's own MCP servers: without this, every subagent also gets the claude.ai connectors
// of the participant's account (Step 2 and the assignment cost dollars instead of cents).
export function sdkQueryOptions(options, backend, env = process.env) {
  const baseEnv = backend === 'sdk-login' ? withUserSettingsEnv(env) : { ...env };
  return {
    ...options,
    settingSources: ['project'],
    strictMcpConfig: true,
    extraArgs: { ...options.extraArgs, 'no-chrome': null },
    env: {
      ...baseEnv,
      ...options.env,
      CLAUDE_CODE_DISABLE_AUTO_MEMORY: '1',
    },
  };
}

export async function runWithBackend({ prompt, options, dryRun, dryRunNote, backendArgument }) {
  const backend = selectBackend({ argument: backendArgument });
  const claudeArgs = toClaudeArgs(prompt, options);

  console.log(`backend: ${backendLabel(backend)}`);
  if (dryRun) {
    console.log(prompt);
    console.log(JSON.stringify(options, null, 2));
    console.log(`Claude Code equivalent: ${formatCommand('claude', claudeArgs)}`);
    if (dryRunNote) {
      console.log(dryRunNote);
    }
    console.log('dry run — no model call, not model evidence');
    return { sessionId: null, result: null };
  }

  const command = assertBackendAccess(backend);
  assertOptionsBuilt(options);

  if (backend === 'claude-code') {
    return runClaudeCode({ command, prompt, options, onEvent: printEvent });
  }

  const { query } = await import('@anthropic-ai/claude-agent-sdk');
  let sessionId = null;
  let result = null;

  const savedApiKey = process.env.ANTHROPIC_API_KEY;
  if (backend === 'sdk-login') {
    delete process.env.ANTHROPIC_API_KEY;
  }
  try {
    for await (const event of query({ prompt, options: sdkQueryOptions(options, backend) })) {
      sessionId = event.session_id ?? sessionId;
      printEvent(event);
      assertSuccessfulResult(event);

      if (event.type === 'result') {
        result = event.structured_output ?? event.result;
      }
    }
  } catch (error) {
    if (backend === 'sdk-login' && /not logged in|login|authentication/i.test(error.message)) {
      throw new Error('Not logged in. Run `claude` once and log in.');
    }
    throw error;
  } finally {
    if (backend === 'sdk-login' && savedApiKey !== undefined) {
      process.env.ANTHROPIC_API_KEY = savedApiKey;
    }
  }

  return { sessionId, result };
}
