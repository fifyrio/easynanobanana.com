import type { Metadata } from 'next';
import { getTranslations } from 'next-intl/server';
import McpConnectClient from '@/components/mcp/McpConnectClient';
import { buildMcpMetadata } from '@/lib/mcp-metadata';

export async function generateMetadata({
  params: { locale },
}: {
  params: { locale: string };
}): Promise<Metadata> {
  const t = await getTranslations({ locale, namespace: 'mcp.seo.Skill' });
  return buildMcpMetadata({
    locale,
    path: '/skills',
    title: t('title'),
    description: t('description'),
    keywords: t('keywords'),
  });
}

export default function SkillsPage() {
  return <McpConnectClient method="Skill" />;
}
