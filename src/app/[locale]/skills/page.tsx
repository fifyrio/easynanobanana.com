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
    path: '/skills',
    title: 'Easy Nano Banana Skills — Faceless Video Workflow for Any Agent',
    description:
      'Add the Easy Nano Banana skills to your agent: script to voiceover to batch images to final faceless video, all in one conversation.',
    keywords: 'nano banana skills, faceless video skill, ai agent skills, claude skill, ai video workflow',
  });
}

export default function SkillsPage() {
  return <McpConnectClient method="Skill" />;
}
