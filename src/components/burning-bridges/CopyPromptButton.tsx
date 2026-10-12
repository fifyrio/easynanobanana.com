'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';

export default function CopyPromptButton({ prompt, namespace = 'aiBurningBridges.prompts' }: { prompt: string; namespace?: string }) {
  const t = useTranslations(namespace);
  const [status, setStatus] = useState<'idle' | 'copied' | 'failed'>('idle');

  return (
    <div>
      <button type="button" className="rounded-lg border border-amber-300 px-4 py-2 text-sm font-semibold hover:bg-amber-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-amber-600"
        onClick={async () => {
          try {
            await navigator.clipboard.writeText(prompt);
            setStatus('copied');
          } catch {
            setStatus('failed');
          }
        }}>
        {status === 'copied' ? t('copied') : t('copy')}
      </button>
      <p role="status" className="mt-2 text-xs text-slate-600">{status === 'failed' ? t('copyFailed') : status === 'copied' ? t('copied') : ''}</p>
    </div>
  );
}
