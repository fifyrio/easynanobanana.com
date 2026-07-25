import { NextRequest, NextResponse } from 'next/server';
import { verifyApiKey } from '@/lib/api-keys';
import { createServiceClient } from '@/lib/supabase-server';
import { getBalance } from '@/lib/credits';
import {
  generateImageSync,
  InsufficientCreditsError,
  ModerationRejectedError,
  ModerationUnavailableError,
  IMAGE_CREDIT_COST,
  type AspectRatio,
} from '@/lib/mcp/generate-image-sync';

export const maxDuration = 120;

const PROTOCOL_VERSION = '2024-11-05';
const SERVER_INFO = { name: 'easynanobanana', version: '0.1.0' };

const TOOLS = [
  {
    name: 'generate_image',
    description:
      'Generate a single AI image from a text prompt. Costs 5 credits. Returns a public image URL.',
    inputSchema: {
      type: 'object',
      properties: {
        prompt: { type: 'string', description: 'Full text prompt describing the image.' },
        aspectRatio: { type: 'string', enum: ['1:1', '9:16', '16:9'], description: 'Image aspect ratio.' },
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

function rpcResult(id: unknown, result: unknown) {
  return NextResponse.json({ jsonrpc: '2.0', id, result });
}
function rpcError(id: unknown, code: number, message: string, status = 200) {
  return NextResponse.json({ jsonrpc: '2.0', id, error: { code, message } }, { status });
}
function toolText(text: string, isError = false) {
  return { content: [{ type: 'text', text }], isError };
}

export async function POST(request: NextRequest) {
  const verified = await verifyApiKey(request.headers.get('x-api-key'));
  if (!verified) {
    return rpcError(null, -32001, 'Invalid or missing API key (X-API-Key header)', 401);
  }

  let body: { jsonrpc?: string; id?: unknown; method?: string; params?: any };
  try {
    body = await request.json();
  } catch {
    return rpcError(null, -32700, 'Parse error');
  }

  const { id = null, method, params } = body;

  switch (method) {
    case 'initialize':
      return rpcResult(id, {
        protocolVersion: PROTOCOL_VERSION,
        capabilities: { tools: {} },
        serverInfo: SERVER_INFO,
      });

    // Notifications carry no id and expect no result.
    case 'notifications/initialized':
    case 'notifications/cancelled':
      return new NextResponse(null, { status: 202 });

    case 'ping':
      return rpcResult(id, {});

    case 'tools/list':
      return rpcResult(id, { tools: TOOLS });

    case 'tools/call': {
      const toolName = params?.name;
      const args = params?.arguments ?? {};
      try {
        if (toolName === 'get_credits') {
          const credits = await getBalance(createServiceClient(), verified.userId);
          return rpcResult(id, toolText(`You have ${credits} credits remaining.`));
        }

        if (toolName === 'generate_image') {
          const prompt = typeof args.prompt === 'string' ? args.prompt.trim() : '';
          if (!prompt) return rpcResult(id, toolText('Error: prompt is required.', true));
          const ratio: AspectRatio = ['1:1', '9:16', '16:9'].includes(args.aspectRatio)
            ? args.aspectRatio
            : '1:1';
          const result = await generateImageSync(verified.userId, prompt, ratio);
          return rpcResult(
            id,
            toolText(
              `Image generated (${IMAGE_CREDIT_COST} credits, ${result.creditsRemaining} left):\n${result.imageUrl}`
            )
          );
        }

        return rpcError(id, -32602, `Unknown tool: ${toolName}`);
      } catch (err) {
        if (err instanceof InsufficientCreditsError) {
          return rpcResult(id, toolText(`Insufficient credits: need ${err.required}, have ${err.available}.`, true));
        }
        if (err instanceof ModerationRejectedError) {
          return rpcResult(id, toolText('Prompt rejected by content policy.', true));
        }
        if (err instanceof ModerationUnavailableError) {
          return rpcResult(id, toolText('Content moderation temporarily unavailable. Please retry.', true));
        }
        console.error('mcp tools/call error:', err);
        return rpcResult(id, toolText('Image generation failed. Please try again.', true));
      }
    }

    default:
      return rpcError(id, -32601, `Method not found: ${method}`);
  }
}

// Some clients probe with GET; advertise that this is a POST JSON-RPC endpoint.
export async function GET() {
  return NextResponse.json({
    server: SERVER_INFO,
    transport: 'streamable-http',
    hint: 'POST JSON-RPC 2.0 with an X-API-Key header.',
  });
}
