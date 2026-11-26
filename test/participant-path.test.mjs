import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { test } from 'node:test';

const read = (path) => readFileSync(path, 'utf8');
const startCommand = 'claude --setting-sources project,user --strict-mcp-config --no-chrome';

test('participant docs give one route with a check for each build step', () => {
  const solo = read('SOLO.md');
  const participantPart = solo.slice(0, solo.indexOf('\n## Trainer'));
  const scripts = JSON.parse(read('package.json')).scripts;

  for (const heading of ['## SOLO 0 ·', '## SOLO 1 ·', '### SOLO 1b ·', '### SOLO 1c ·', '## SOLO 1M ·', '## SOLO 2 ·', '## SOLO 3 ·', '## SOLO 4 ·', '## SOLO 5 ·']) {
    assert.ok(solo.includes(heading), `SOLO.md has ${heading}`);
  }
  for (const step of [1, 2, 3]) {
    assert.ok(scripts[`check:${step}`] && scripts[`lesson${step}`], `step ${step} has a check and a lesson script`);
    assert.match(participantPart, new RegExp(`npm run check:${step} until it passes`), `SOLO ${step} stops on its check`);
    assert.match(participantPart, new RegExp(`npm run lesson${step} -- MSG-\\d\\d once`), `SOLO ${step} has one real run`);
  }
  assert.doesNotMatch(participantPart, /git (?:checkout|switch)|trainer evidence|reference folder/i, 'participants need no branch and no trainer material');
  assert.ok(read('README.md').includes(`cd aetherlink-day4-n8n-to-agent\nnpm ci\n${startCommand}`));
  const setup = read('docs/SETUP.md');
  for (const platform of ['Windows PowerShell', 'WSL', 'Linux and macOS']) {
    const section = setup.split('## ' + platform + '\n')[1].split('\n## ')[0];
    assert.ok(section.includes('npm run verify\n' + startCommand + '\n```'), platform + ' runs shell checks before opening Claude Code');
  }
  assert.equal(JSON.parse(read('.claude/settings.json')).autoMemoryEnabled, false);
});

test('participants inspect completed runs and execute only missing evidence in Terminal 2', () => {
  const sections = read('SOLO.md').split(/\n(?=##+ SOLO )/);
  for (const step of ['1', '1b', '2', '3']) {
    const section = sections.find(text => text.startsWith('#') && text.split('\n')[0].includes('SOLO ' + step + ' ·'));
    assert.match(section, /Inspect the actual output Claude Code already showed/);
    assert.match(section, /In Terminal 2, run only commands whose results are missing/);
    if (step === '1b') {
      const brief = section.slice(0, section.indexOf('<details>'));
      assert.match(brief, /carry out the dry run and both separate chats/);
      assert.match(brief, /show the commands and actual output/);
      assert.match(brief, /fresh T-202 chat/);
    }
  }
});

test('the sanitized n8n source defines the complete app contract', () => {
  const workflow = JSON.parse(read('n8n/support-triage.json'));
  const names = workflow.nodes.map(({ name }) => name);
  const source = JSON.stringify(workflow);
  const parameters = Object.fromEntries(workflow.nodes.map(({ name, parameters }) => [name, parameters]));

  for (const name of ['Customer Context Agent', 'Risk Agent', 'Customer Reply Agent', 'Structured Output Parser', 'Switch']) {
    assert.ok(names.includes(name), `${name} is missing`);
  }
  assert.match(source, /ticket_id/);
  assert.match(source, /priority/);
  assert.match(source, /message/);
  assert.match(source, /ignoreCase/);
  assert.doesNotMatch(source, /credentials|webhookId|cachedResultUrl/);
  assert.equal(parameters['Simple Memory'].sessionKey, '={{ $json.ticket_id }}');
  assert.deepEqual(JSON.parse(parameters['Structured Output Parser'].jsonSchemaExample), { priority: '', message: '' });
  assert.equal(parameters.Switch.options.ignoreCase, true);
  assert.deepEqual(
    ['low', 'medium', 'high'].map((name) => parameters[name].assignments.assignments[0].value),
    ['auto_reply', 'investigate', 'escalate'],
  );

  const systemMessage = parameters['AI Agent'].options.systemMessage;
  const context = systemMessage.indexOf('Ask it first');
  const risk = systemMessage.indexOf('before you decide');
  const reply = systemMessage.indexOf('Ask it last');
  assert.ok(context >= 0 && risk >= 0 && reply >= 0);
});
