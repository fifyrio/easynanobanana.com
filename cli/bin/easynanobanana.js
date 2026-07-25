#!/usr/bin/env node
'use strict';

const readline = require('readline');
const { loadConfig, saveConfig, CONFIG_PATH } = require('../src/config');
const { getCredits, generateImage } = require('../src/api');
const { runMcpServer } = require('../src/mcp-stdio');

const USAGE = `easynanobanana — AI image generation for your agent or terminal

Usage:
  easynanobanana auth login [--key <API_KEY>] [--url <BASE_URL>]
  easynanobanana auth status
  easynanobanana generate "<prompt>" [--ratio 1:1|9:16|16:9]
  easynanobanana credits
  easynanobanana mcp            Run as an MCP server (for Claude Code / Codex / Cursor)

Get an API key at https://www.easynanobanana.com/settings/api-keys
Env overrides: EASYNANOBANANA_API_KEY, EASYNANOBANANA_API_URL`;

/** Parse `--flag value` pairs and collect positional args. */
function parseArgs(argv) {
  const flags = {};
  const positional = [];
  for (let i = 0; i < argv.length; i += 1) {
    const a = argv[i];
    if (a.startsWith('--')) {
      const key = a.slice(2);
      const next = argv[i + 1];
      if (next && !next.startsWith('--')) {
        flags[key] = next;
        i += 1;
      } else {
        flags[key] = true;
      }
    } else {
      positional.push(a);
    }
  }
  return { flags, positional };
}

function prompt(question) {
  const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
  return new Promise((resolve) => rl.question(question, (ans) => { rl.close(); resolve(ans.trim()); }));
}

async function cmdAuthLogin(flags) {
  let key = typeof flags.key === 'string' ? flags.key : '';
  if (!key) {
    console.log('Get your API key at https://www.easynanobanana.com/settings/api-keys');
    key = await prompt('Paste your API key: ');
  }
  if (!key) {
    console.error('No key provided.');
    process.exit(1);
  }
  const patch = { apiKey: key };
  if (typeof flags.url === 'string') patch.apiUrl = flags.url;
  saveConfig(patch);

  // Verify by hitting the credits endpoint.
  try {
    const { credits } = await getCredits(loadConfig());
    console.log(`✓ Authenticated. ${credits} credits available.`);
    console.log(`  Saved to ${CONFIG_PATH}`);
  } catch (err) {
    console.error(`Saved key, but verification failed: ${err.message}`);
    process.exit(1);
  }
}

async function cmdAuthStatus() {
  const cfg = loadConfig();
  if (!cfg.apiKey) {
    console.log('Not authenticated. Run `easynanobanana auth login`.');
    return;
  }
  const masked = `${cfg.apiKey.slice(0, 12)}…${cfg.apiKey.slice(-4)}`;
  console.log(`API key: ${masked}`);
  console.log(`API URL: ${cfg.apiUrl}`);
  try {
    const { credits } = await getCredits(cfg);
    console.log(`Credits: ${credits}`);
  } catch (err) {
    console.error(`Could not fetch credits: ${err.message}`);
  }
}

async function cmdGenerate(positional, flags) {
  const promptText = positional.join(' ').trim();
  if (!promptText) {
    console.error('Usage: easynanobanana generate "<prompt>" [--ratio 1:1]');
    process.exit(1);
  }
  const ratio = typeof flags.ratio === 'string' ? flags.ratio : '1:1';
  try {
    const data = await generateImage(loadConfig(), promptText, ratio);
    console.log(data.imageUrl);
    console.error(`(${data.creditsCharged} credits used, ${data.creditsRemaining} remaining)`);
  } catch (err) {
    console.error(`Error: ${err.message}`);
    process.exit(1);
  }
}

async function cmdCredits() {
  try {
    const { credits } = await getCredits(loadConfig());
    console.log(`${credits} credits`);
  } catch (err) {
    console.error(`Error: ${err.message}`);
    process.exit(1);
  }
}

async function main() {
  const argv = process.argv.slice(2);
  const { flags, positional } = parseArgs(argv);
  const [command, sub] = positional;

  switch (command) {
    case 'auth':
      if (sub === 'login') return cmdAuthLogin(flags);
      if (sub === 'status') return cmdAuthStatus();
      console.error('Usage: easynanobanana auth <login|status>');
      return process.exit(1);
    case 'generate':
      return cmdGenerate(positional.slice(1), flags);
    case 'credits':
      return cmdCredits();
    case 'mcp':
      return runMcpServer(loadConfig());
    case undefined:
    case 'help':
    case '--help':
    case '-h':
      console.log(USAGE);
      return;
    default:
      console.error(`Unknown command: ${command}\n`);
      console.log(USAGE);
      return process.exit(1);
  }
}

main();
