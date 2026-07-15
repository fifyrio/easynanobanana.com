import type { Metadata } from 'next';
import { getTranslations } from 'next-intl/server';
import McpConnectClient from '@/components/mcp/McpConnectClient';
import { buildMcpMetadata } from '@/lib/mcp-metadata';

export async function generateMetadata({
  params: { locale },
}: {
  params: { locale: string };
}): Promise<Metadata> {
  const t = await getTranslations({ locale, namespace: 'mcp.seo.CLI' });
  return buildMcpMetadata({
    locale,
    path: '/cli',
    title: t('title'),
    description: t('description'),
    keywords: t('keywords'),
  });
}

export default function CliPage() {
  return <McpConnectClient method="CLI" />;
}
