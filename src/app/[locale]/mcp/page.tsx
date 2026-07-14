import type { Metadata } from 'next';
import McpConnectClient from '@/components/mcp/McpConnectClient';
import { buildMcpMetadata } from '@/lib/mcp-metadata';

export async function generateMetadata({
  params: { locale },
}: {
  params: { locale: string };
}): Promise<Metadata> {
  return buildMcpMetadata({
    locale,
    path: '/mcp',
    title: 'Easy Nano Banana MCP — AI Image & Faceless Video for Any Agent',
    description:
      'Connect Easy Nano Banana MCP to Claude, ChatGPT, Cursor or any agent. Generate cinematic images and faceless videos straight from your prompts.',
    keywords: 'nano banana mcp, ai image mcp, faceless video workflow, claude connector, ai agent image generation',
  });
}

export default function McpPage() {
  return <McpConnectClient method="MCP" />;
}
