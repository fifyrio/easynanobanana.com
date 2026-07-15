'use client';

import { useState } from 'react';
import Image from 'next/image';
import { useTranslations } from 'next-intl';
import Header from '@/components/common/Header';
import { useRouter } from '@/i18n/routing';

type Method = 'MCP' | 'CLI' | 'Skill';
type Agent = 'Claude' | 'ChatGPT' | 'Cursor' | 'OpenClaw' | 'Hermes';

const MCP_URL = 'https://www.easynanobanana.com/api/mcp';

const METHOD_ROUTES: Record<Method, string> = {
  MCP: '/mcp',
  CLI: '/cli',
  Skill: '/skills',
};

// Non-translatable per-step structure: code chips and the connector link.
// Headings/descriptions come from the `mcp.steps.*` i18n namespace by index.
interface StepStruct {
  chip?: string;
  buttonHref?: string;
}

const STEP_STRUCT: Record<Method, StepStruct[]> = {
  MCP: [
    { chip: MCP_URL },
    { buttonHref: 'https://claude.ai/settings/connectors?modal=add-custom-connector' },
    {},
  ],
  CLI: [
    { chip: 'npm install -g @easynanobanana.com/cli' },
    { chip: 'easynanobanana auth login' },
    { chip: 'npx skills add easynanobanana/skills' },
  ],
  Skill: [
    { chip: 'npx skills add easynanobanana/skills' },
    { chip: 'easynanobanana auth login' },
    { chip: '/easynanobanana:faceless-video' },
  ],
};

const METHODS: Method[] = ['MCP', 'CLI', 'Skill'];
const AGENTS: Agent[] = ['Claude', 'ChatGPT', 'Cursor', 'OpenClaw', 'Hermes'];

// Marketing feature images (generated via scripts/generate-mcp-feature-images.ts, on R2).
const FEATURES: { key: string; img: string }[] = [
  { key: 'scene', img: 'https://pub-103b451e48574bbfb1a3ca707ebe5cff.r2.dev/images/image-mcp-feature-scene-1784072113572-ahd4jj.png' },
  { key: 'batch', img: 'https://pub-103b451e48574bbfb1a3ca707ebe5cff.r2.dev/images/image-mcp-feature-batch-1784072169859-dx5wol.png' },
  { key: 'thumbnail', img: 'https://pub-103b451e48574bbfb1a3ca707ebe5cff.r2.dev/images/image-mcp-feature-thumbnail-1784072191777-isict5.png' },
  { key: 'video', img: 'https://pub-103b451e48574bbfb1a3ca707ebe5cff.r2.dev/images/image-mcp-feature-video-1784072213330-y2c8e4.png' },
];

// Real agent/app icon tiles (each webp already has its own background + rounding).
const SIDE_LOGOS = [
  { src: '/images/mcp-logos/claude-logo.webp', alt: 'Claude' },
  { src: '/images/mcp-logos/openai-logo.webp', alt: 'ChatGPT' },
  { src: '/images/mcp-logos/perplexity-logo.webp', alt: 'Perplexity' },
  { src: '/images/mcp-logos/cursor-logo.webp', alt: 'Cursor' },
  { src: '/images/mcp-logos/openclaw-logo.webp', alt: 'OpenClaw' },
  { src: '/images/mcp-logos/hermes-logo.webp', alt: 'Hermes' },
];

function CopyChip({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);
  const copy = async () => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      setCopied(false);
    }
  };
  return (
    <button
      onClick={copy}
      className="inline-flex max-w-full items-center gap-3 rounded-lg border border-yellow-200 bg-yellow-50 px-4 py-2.5 font-mono text-sm text-yellow-800 transition-colors hover:border-yellow-400"
    >
      <span className="truncate">{text}</span>
      <span className="shrink-0 text-yellow-500">{copied ? '✓' : '⧉'}</span>
    </button>
  );
}

interface McpConnectClientProps {
  method: Method;
}

export default function McpConnectClient({ method }: McpConnectClientProps) {
  const router = useRouter();
  const t = useTranslations('mcp');
  const [agent, setAgent] = useState<Agent>('Claude');

  const goToMethod = (m: Method) => {
    if (m !== method) router.push(METHOD_ROUTES[m]);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />

      <div className="mx-auto max-w-6xl px-4 py-16 sm:px-6 lg:px-8">
        {/* Hero */}
        <div className="mb-12 text-center">
          <div className="mb-10 flex items-end justify-center gap-2 sm:gap-3">
            {SIDE_LOGOS.slice(0, 3).map((l) => (
              <div
                key={l.src}
                className="relative h-12 w-12 overflow-hidden rounded-2xl shadow-sm sm:h-16 sm:w-16"
              >
                <Image src={l.src} alt={l.alt} fill sizes="64px" className="object-cover" />
              </div>
            ))}

            {/* Center: our brand logo */}
            <div className="flex h-20 w-20 -translate-y-2 items-center justify-center overflow-hidden rounded-2xl bg-gradient-to-br from-yellow-400 to-orange-400 shadow-lg shadow-yellow-200 sm:h-24 sm:w-24">
              <Image src="/images/logo.png" alt="Easy Nano Banana" width={72} height={72} className="h-14 w-14 object-contain sm:h-16 sm:w-16" priority />
            </div>

            {SIDE_LOGOS.slice(3, 6).map((l) => (
              <div
                key={l.src}
                className="relative h-12 w-12 overflow-hidden rounded-2xl shadow-sm sm:h-16 sm:w-16"
              >
                <Image src={l.src} alt={l.alt} fill sizes="64px" className="object-cover" />
              </div>
            ))}
          </div>

          <h1 className="mb-6 text-4xl font-bold tracking-tight text-gray-900 md:text-5xl">
            {t('hero.titleTemplate', { method })}
          </h1>
          <p className="mx-auto mb-8 max-w-2xl text-lg text-gray-600">{t('hero.subtitle')}</p>

          <div className="flex flex-col items-center gap-3">
            <a
              href="/pricing"
              className="inline-flex items-center gap-2 rounded-full bg-yellow-100 px-5 py-3 text-sm font-medium text-yellow-800 ring-1 ring-yellow-200 transition-colors hover:bg-yellow-200"
            >
              🏷️ {t('hero.trial')}
              <span className="rounded-full bg-yellow-500 px-2 py-0.5 text-xs font-bold italic text-white">
                {t('hero.trialBadge')}
              </span>
            </a>
            <a href="/settings/api-keys" className="text-sm text-gray-500 underline-offset-4 hover:text-yellow-600 hover:underline">
              {t('hero.getKey')}
            </a>
          </div>
        </div>

        {/* Panel */}
        <div className="rounded-3xl border border-gray-200 bg-white p-6 shadow-sm sm:p-8">
          {/* Tab bars */}
          <div className="mb-10 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="inline-flex rounded-full bg-gray-100 p-1">
              {METHODS.map((m) => (
                <button
                  key={m}
                  onClick={() => goToMethod(m)}
                  className={`rounded-full px-4 py-1.5 text-sm font-medium transition-colors ${
                    method === m ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-900'
                  }`}
                >
                  {m}
                </button>
              ))}
            </div>

            <div className="inline-flex flex-wrap rounded-full bg-gray-100 p-1">
              {AGENTS.map((a) => (
                <button
                  key={a}
                  onClick={() => setAgent(a)}
                  className={`rounded-full px-3 py-1.5 text-sm font-medium transition-colors ${
                    agent === a ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-900'
                  }`}
                >
                  {a}
                </button>
              ))}
            </div>
          </div>

          {/* Steps */}
          <div className="grid gap-8 md:grid-cols-3 md:divide-x md:divide-gray-100">
            {STEP_STRUCT[method].map((s, i) => (
              <div key={i} className="md:px-6 first:md:pl-0">
                <div className="mb-5 flex h-8 w-8 items-center justify-center rounded-full bg-yellow-100 text-sm font-semibold text-yellow-700">
                  {i + 1}
                </div>
                <h3 className="mb-2 text-lg font-semibold text-gray-900">{t(`steps.${method}.${i}.heading`)}</h3>
                <p className="mb-5 text-sm leading-relaxed text-gray-600">{t(`steps.${method}.${i}.desc`)}</p>
                {s.chip && <CopyChip text={s.chip} />}
                {s.buttonHref && (
                  <a
                    href={s.buttonHref}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 rounded-lg bg-yellow-500 px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-yellow-600"
                  >
                    {t('openConnectors')} ↗
                  </a>
                )}
              </div>
            ))}
          </div>
        </div>

        <p className="mt-8 text-center text-sm text-gray-500">
          {t('footer')}{' '}
          <button onClick={() => goToMethod('CLI')} className="font-medium text-yellow-600 hover:underline">
            {t('footerCliLink')}
          </button>
        </p>

        {/* Features */}
        <div className="mt-24">
          <div className="mb-12 text-center">
            <h2 className="mb-3 text-3xl font-bold tracking-tight text-gray-900 md:text-4xl">
              {t('features.heading')}
            </h2>
            <p className="mx-auto max-w-2xl text-gray-600">{t('features.subheading')}</p>
          </div>

          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {FEATURES.map((f) => (
              <div
                key={f.key}
                className="group overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm transition-shadow hover:shadow-md"
              >
                <div className="relative aspect-square overflow-hidden bg-gray-100">
                  <Image
                    src={f.img}
                    alt={t(`features.${f.key}.title`)}
                    fill
                    sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
                    className="object-cover transition-transform duration-300 group-hover:scale-105"
                  />
                </div>
                <div className="p-5">
                  <h3 className="mb-1.5 text-base font-semibold text-gray-900">{t(`features.${f.key}.title`)}</h3>
                  <p className="text-sm leading-relaxed text-gray-600">{t(`features.${f.key}.desc`)}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
