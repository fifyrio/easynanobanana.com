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
    path: '/cli',
    title: 'Easy Nano Banana CLI — Run AI Image & Video from the Command Line',
    description:
      'Install the Easy Nano Banana CLI and generate images and faceless videos from Claude Code, Codex, Cursor or any MCP-compatible agent.',
    keywords: 'nano banana cli, ai image cli, claude code image, faceless video cli, ai agent command line',
  });
}

export default function CliPage() {
  return <McpConnectClient method="CLI" />;
}
