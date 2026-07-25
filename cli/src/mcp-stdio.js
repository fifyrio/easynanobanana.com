'use strict';

const readline = require('readline');
const { getCredits, generateImage } = require('./api');

/**
 * Minimal MCP server over the stdio transport (newline-delimited JSON-RPC 2.0).
 * Agents like Claude Code spawn `easynanobanana mcp` and talk to it on stdin/stdout.
 * stdout carries ONLY protocol messages; diagnostics go to stderr.
 */

const PROTOCOL_VERSION = '2024-11-05';
const SERVER_INFO = { name: 'easynanobanana', version: '0.1.0' };

const TOOLS = [
  {
    name: 'generate_image',
    description: 'Generate a single AI image from a text prompt. Costs 5 credits. Returns a public image URL.',
    inputSchema: {
      type: 'object',
      properties: {
        prompt: { type: 'string', description: 'Full text prompt describing the image.' },
        aspectRatio: { type: 'string', enum: ['1:1', '9:16', '16:9'] },
      },
      required: ['prompt'],
    },
  },
  {
    name: 'get_credits',
    description: 'Get the remaining credit balance for the authenticated account.',
    inputSchema: { type: 'object', properties: {} },
  },
];

function send(msg) {
  process.stdout.write(JSON.stringify(msg) + '\n');
}
function result(id, res) {
  send({ jsonrpc: '2.0', id, result: res });
}
function error(id, code, message) {
  send({ jsonrpc: '2.0', id, error: { code, message } });
}
function toolText(text, isError = false) {
  return { content: [{ type: 'text', text }], isError };
}

async function handleToolCall(cfg, id, params) {
  const name = params && params.name;
  const args = (params && params.arguments) || {};
  try {
    if (name === 'get_credits') {
      const { credits } = await getCredits(cfg);
      return result(id, toolText(`You have ${credits} credits remaining.`));
    }
    if (name === 'generate_image') {
      const prompt = typeof args.prompt === 'string' ? args.prompt.trim() : '';
      if (!prompt) return result(id, toolText('Error: prompt is required.', true));
      const data = await generateImage(cfg, prompt, args.aspectRatio);
      return result(
        id,
        toolText(`Image generated (${data.creditsCharged} credits, ${data.creditsRemaining} left):\n${data.imageUrl}`)
      );
    }
    return error(id, -32602, `Unknown tool: ${name}`);
  } catch (err) {
    return result(id, toolText(`Error: ${err.message}`, true));
  }
}

function runMcpServer(cfg) {
  if (!cfg.apiKey) {
    process.stderr.write('easynanobanana: no API key. Run `easynanobanana auth login` first.\n');
  }
  const rl = readline.createInterface({ input: process.stdin });

  rl.on('line', async (line) => {
    const trimmed = line.trim();
    if (!trimmed) return;
    let msg;
    try {
      msg = JSON.parse(trimmed);
    } catch {
      return error(null, -32700, 'Parse error');
    }

    const { id = null, method, params } = msg;
    switch (method) {
      case 'initialize':
        return result(id, { protocolVersion: PROTOCOL_VERSION, capabilities: { tools: {} }, serverInfo: SERVER_INFO });
      case 'notifications/initialized':
      case 'notifications/cancelled':
        return; // notifications get no response
      case 'ping':
        return result(id, {});
      case 'tools/list':
        return result(id, { tools: TOOLS });
      case 'tools/call':
        return handleToolCall(cfg, id, params);
      default:
        if (id !== null) return error(id, -32601, `Method not found: ${method}`);
    }
  });

  // On stdin EOF, let the event loop drain (in-flight tool calls finish) and
  // the process exits naturally. Do NOT force-exit here — it would truncate a
  // pending response.
  rl.on('close', () => {});
}

module.exports = { runMcpServer };
