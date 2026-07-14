'use client';

import { useState } from 'react';
import Image from 'next/image';
import Header from '@/components/common/Header';
import { useRouter } from '@/i18n/routing';

type Method = 'MCP' | 'CLI' | 'Skill';
type Agent = 'Claude' | 'ChatGPT' | 'Cursor' | 'OpenClaw' | 'Hermes';

interface Step {
  heading: string;
  desc: React.ReactNode;
  chip?: string; // copyable code / url
  button?: { label: string; href: string };
}

const MCP_URL = 'https://www.easynanobanana.com/api/mcp';

const METHOD_ROUTES: Record<Method, string> = {
  MCP: '/mcp',
  CLI: '/cli',
  Skill: '/skills',
};

const STEPS: Record<Method, Step[]> = {
  MCP: [
    {
      heading: 'Copy the Easy Nano Banana URL',
      desc: (
        <>
          Click the copy button next. You&apos;ll need it in the <strong>next step.</strong>
        </>
      ),
      chip: MCP_URL,
    },
    {
      heading: 'Open Settings → Connectors',
      desc: (
        <>
          Add a custom connector, name it <strong>Easy Nano Banana</strong> and <strong>paste the URL</strong>
        </>
      ),
      button: {
        label: 'Open Claude connectors',
        href: 'https://claude.ai/settings/connectors?modal=add-custom-connector',
      },
    },
    {
      heading: 'Connect and sign in',
      desc: (
        <>
          Click <strong>Add → Connect</strong>, sign in with your Easy Nano Banana account — you&apos;re all set,
          now just ask Claude to <strong>generate an image</strong>.
        </>
      ),
    },
  ],
  CLI: [
    {
      heading: 'Install & plug into your agent',
      desc: <>Works with all Agents. Then just say: &quot;Generate an image with Easy Nano Banana.&quot;</>,
      chip: 'npm install -g @easynanobanana.com/cli',
    },
    {
      heading: 'Sign in',
      desc: (
        <>
          Opens a browser, takes 5 seconds. Run <strong>easynanobanana auth login</strong> and you&apos;re authenticated.
        </>
      ),
      chip: 'easynanobanana auth login',
    },
    {
      heading: 'AI skills in one place',
      desc: <>Faceless video, batch images &amp; thumbnails — browse and install from the hub.</>,
      chip: 'npx skills add easynanobanana/skills',
    },
  ],
  Skill: [
    {
      heading: 'Add the skills',
      desc: <>One command pulls the faceless-video workflow skills into your agent.</>,
      chip: 'npx skills add easynanobanana/skills',
    },
    {
      heading: 'Sign in',
      desc: (
        <>
          Connects your account so the skills can submit jobs through the <strong>enb</strong> CLI.
        </>
      ),
      chip: 'easynanobanana auth login',
    },
    {
      heading: 'Plug skills into your agent',
      desc: <>Script → voiceover → batch images → final video, all in one conversation.</>,
      chip: '/easynanobanana:faceless-video',
    },
  ],
};

const METHODS: Method[] = ['MCP', 'CLI', 'Skill'];
const AGENTS: Agent[] = ['Claude', 'ChatGPT', 'Cursor', 'OpenClaw', 'Hermes'];

// Monochrome glyphs for the surrounding tiles (real inline SVGs, not emoji).
const SIDE_GLYPHS: React.ReactNode[] = [
  <path key="s" d="M12 2l1.8 6.2L20 10l-6.2 1.8L12 18l-1.8-6.2L4 10l6.2-1.8L12 2z" />,
  <path key="f" d="M4 4h16v16H4V4zm0 4h4M4 12h4M4 16h4M16 8h4M16 12h4M16 16h4" fill="none" stroke="currentColor" strokeWidth="1.6" />,
  <path key="i" d="M4 5h16v14H4V5zm3 9l3-3 3 3 2-2 3 3M8.5 9.5a1.5 1.5 0 100-3 1.5 1.5 0 000 3z" fill="none" stroke="currentColor" strokeWidth="1.6" />,
  <path key="r" d="M9 3v2m6-2v2M5 8h14v11H5V8zm4 4h.01M15 12h.01M9 16h6" fill="none" stroke="currentColor" strokeWidth="1.6" />,
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
          <div className="mb-10 flex items-end justify-center gap-3">
            {SIDE_GLYPHS.slice(0, 2).map((g, i) => (
              <div
                key={`l${i}`}
                className="flex h-16 w-16 items-center justify-center rounded-2xl border border-gray-200 bg-white text-gray-400 shadow-sm"
              >
                <svg viewBox="0 0 24 24" className="h-7 w-7" fill="currentColor">
                  {g}
                </svg>
              </div>
            ))}

            {/* Center: real brand logo */}
            <div className="flex h-24 w-24 -translate-y-2 items-center justify-center overflow-hidden rounded-2xl bg-gradient-to-br from-yellow-400 to-orange-400 shadow-lg shadow-yellow-200">
              <Image src="/images/logo.png" alt="Easy Nano Banana" width={72} height={72} className="h-16 w-16 object-contain" priority />
            </div>

            {SIDE_GLYPHS.slice(2, 4).map((g, i) => (
              <div
                key={`r${i}`}
                className="flex h-16 w-16 items-center justify-center rounded-2xl border border-gray-200 bg-white text-gray-400 shadow-sm"
              >
                <svg viewBox="0 0 24 24" className="h-7 w-7" fill="currentColor">
                  {g}
                </svg>
              </div>
            ))}
          </div>

          <h1 className="mb-6 text-4xl font-bold tracking-tight text-gray-900 md:text-5xl">
            Easy Nano Banana {method} for any AI
          </h1>
          <p className="mx-auto mb-8 max-w-2xl text-lg text-gray-600">
            Connect Easy Nano Banana to your workflow and generate cinematic images and faceless
            videos directly from your prompts.
          </p>

          <div className="flex flex-col items-center gap-3">
            <a
              href="/pricing"
              className="inline-flex items-center gap-2 rounded-full bg-yellow-100 px-5 py-3 text-sm font-medium text-yellow-800 ring-1 ring-yellow-200 transition-colors hover:bg-yellow-200"
            >
              🏷️ Connect MCP &amp; get free trial credits
              <span className="rounded-full bg-yellow-500 px-2 py-0.5 text-xs font-bold italic text-white">
                FREE TRIAL
              </span>
            </a>
            <a href="/settings/api-keys" className="text-sm text-gray-500 underline-offset-4 hover:text-yellow-600 hover:underline">
              Get your API key →
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
            {STEPS[method].map((step, i) => (
              <div key={i} className="md:px-6 first:md:pl-0">
                <div className="mb-5 flex h-8 w-8 items-center justify-center rounded-full bg-yellow-100 text-sm font-semibold text-yellow-700">
                  {i + 1}
                </div>
                <h3 className="mb-2 text-lg font-semibold text-gray-900">{step.heading}</h3>
                <p className="mb-5 text-sm leading-relaxed text-gray-600">{step.desc}</p>
                {step.chip && <CopyChip text={step.chip} />}
                {step.button && (
                  <a
                    href={step.button.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 rounded-lg bg-yellow-500 px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-yellow-600"
                  >
                    {step.button.label} ↗
                  </a>
                )}
              </div>
            ))}
          </div>
        </div>

        <p className="mt-8 text-center text-sm text-gray-500">
          If you are using Claude Code, Codex, OpenClaw, Hermes, it&apos;s better to use the{' '}
          <button onClick={() => goToMethod('CLI')} className="font-medium text-yellow-600 hover:underline">
            CLI ↗
          </button>
        </p>
      </div>
    </div>
  );
}
