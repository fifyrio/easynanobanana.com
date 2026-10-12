'use client';

import { useEffect, useRef, useState } from 'react';
import Image from 'next/image';
import { useTranslations } from 'next-intl';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabase';
import LoginModal from '@/components/ui/LoginModal';

interface PresetOption { id: string; name: string }

export default function VideoEffectGenerator({ presets, initialPreset, effectType, namespace }: {
  presets: PresetOption[];
  initialPreset: string;
  effectType: 'ai-burning-bridges' | 'ai-crying';
  namespace: 'aiBurningBridges' | 'aiCrying';
}) {
  const t = useTranslations(`${namespace}.generator`);
  const { user, profile, refreshProfile } = useAuth();
  const [presetId, setPresetId] = useState(initialPreset);
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [video, setVideo] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [showLogin, setShowLogin] = useState(false);
  const [downloading, setDownloading] = useState(false);
  const controller = useRef<AbortController | null>(null);

  useEffect(() => {
    if (!file) { setPreview(null); return; }
    const url = URL.createObjectURL(file);
    setPreview(url);
    return () => URL.revokeObjectURL(url);
  }, [file]);
  useEffect(() => () => controller.current?.abort(), []);

  async function generate() {
    if (!file) { setError(t('uploadFirst')); return; }
    if (!user) { setShowLogin(true); return; }
    if (!profile || (profile.credits ?? 0) < 100) { setError(t('creditsError', { required: 100 })); return; }
    const abort = new AbortController();
    controller.current = abort;
    setBusy(true);
    setError('');
    setVideo(null);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.access_token) { setShowLogin(true); return; }
      const headers = { Authorization: `Bearer ${session.access_token}` };
      const form = new FormData();
      form.append('file', file);
      const upload = await fetch('/api/upload-image', { method: 'POST', body: form, signal: abort.signal });
      const image = await upload.json();
      if (!upload.ok || !image.imageUrl) throw new Error(t('uploadError'));
      const response = await fetch('/api/video/generate', {
        method: 'POST', signal: abort.signal,
        headers: { ...headers, 'Content-Type': 'application/json' },
        body: JSON.stringify({ effectType, presetId,
          sourceImageUrl: image.imageUrl, referenceImageUrls: [image.imageUrl], aspectRatio: '9:16' }),
      });
      const result = await response.json();
      if (response.status === 401) { setShowLogin(true); return; }
      if (response.status === 402) throw new Error(t('creditsError', { required: result.required ?? 100 }));
      if (!response.ok || !result.success || !result.data?.taskId) throw new Error(result.error || t('failed'));
      await refreshProfile();
      for (let attempt = 0; attempt < 48; attempt++) {
        await new Promise<void>((resolve, reject) => {
          const stop = () => { clearTimeout(timer); reject(new DOMException('Aborted', 'AbortError')); };
          const timer = setTimeout(() => { abort.signal.removeEventListener('abort', stop); resolve(); }, 5000);
          abort.signal.addEventListener('abort', stop, { once: true });
          if (abort.signal.aborted) stop();
        });
        const statusResponse = await fetch(`/api/video/task-status?taskId=${encodeURIComponent(result.data.taskId)}`, {
          headers, signal: abort.signal, cache: 'no-store',
        });
        if (statusResponse.status === 401) { setShowLogin(true); return; }
        if (!statusResponse.ok) continue;
        const status = await statusResponse.json();
        if (status.data?.status === 'completed' && status.data.videoUrl) {
          setVideo(status.data.videoUrl);
          await refreshProfile();
          return;
        }
        if (status.data?.status === 'failed') {
          await refreshProfile();
          throw new Error(status.data.errorMessage || t('failed'));
        }
      }
      setError(t('timeout'));
    } catch (err) {
      if (!abort.signal.aborted) setError(err instanceof Error ? err.message : t('failed'));
    } finally {
      if (!abort.signal.aborted) setBusy(false);
    }
  }

  async function download() {
    if (!video) return;
    setDownloading(true);
    try {
      const response = await fetch(video);
      if (!response.ok) throw new Error('Download failed');
      const url = URL.createObjectURL(await response.blob());
      const link = document.createElement('a');
      link.href = url;
      link.download = `${effectType.replace(/^ai-/, '')}-${presetId}.mp4`;
      link.click();
      setTimeout(() => URL.revokeObjectURL(url), 1000);
    } catch {
      setError(t('downloadError'));
    } finally {
      setDownloading(false);
    }
  }

  return (
    <section id="generator" aria-labelledby="generator-title" className="scroll-mt-28 rounded-3xl border border-amber-200 bg-white p-5 shadow-xl shadow-amber-100/40 sm:p-8">
      <h2 id="generator-title" className="text-2xl font-semibold">{t('title')}</h2>
      <p className="mt-2 text-sm leading-relaxed text-slate-600">{t('description')}</p>
      <div className="mt-6 grid gap-6 md:grid-cols-2">
        <div>
          <label htmlFor="effect-image" className="block text-sm font-semibold">{t('upload')}</label>
          <input id="effect-image" type="file" accept="image/jpeg,image/png,image/webp" disabled={busy}
            className="mt-3 block w-full text-sm file:mr-3 file:rounded-lg file:border-0 file:bg-amber-100 file:px-3 file:py-2 file:text-slate-900"
            onChange={(event) => {
              const next = event.target.files?.[0];
              event.target.value = '';
              if (!next) return;
              if (!['image/jpeg', 'image/png', 'image/webp'].includes(next.type)) { setError(t('fileError')); return; }
              setFile(next); setVideo(null); setError('');
            }} />
          <p className="mt-2 text-xs text-slate-500">{t('uploadHint')}</p>
          {preview && <Image src={preview} alt={t('previewAlt')} width={496} height={864} unoptimized className="mt-4 h-64 w-full rounded-xl bg-amber-50 object-contain" />}
          <label htmlFor="effect-preset" className="mt-5 block text-sm font-semibold">{t('preset')}</label>
          <select id="effect-preset" value={presetId} disabled={busy} onChange={(event) => { setPresetId(event.target.value); setVideo(null); }}
            className="mt-2 w-full rounded-xl border border-amber-200 bg-white p-3">
            {presets.map((preset) => <option key={preset.id} value={preset.id}>{preset.name}</option>)}
          </select>
          <button type="button" disabled={busy} onClick={generate} className="mt-5 w-full rounded-xl bg-[#FFD84D] px-5 py-3 font-semibold text-slate-900 hover:bg-amber-300 disabled:opacity-60">
            {busy ? t('generating') : t('generate')}
          </button>
          <p className="mt-2 text-center text-xs text-slate-600">{t('cost', { credits: 100 })}</p>
        </div>
        <div className="flex min-h-64 flex-col justify-center rounded-2xl bg-[#FFFBF0] p-4">
          {video ? <>
            <video src={video} controls playsInline className="mx-auto max-h-96 w-full rounded-xl" />
            <button type="button" disabled={downloading} onClick={download} className="mt-4 rounded-xl border border-amber-300 bg-white px-4 py-3 font-semibold disabled:opacity-60">{downloading ? t('downloading') : t('download')}</button>
            <a href={video} target="_blank" rel="noreferrer" className="mt-2 text-center text-sm underline">{t('openVideo')}</a>
          </> : <p role="status" className="text-center text-sm leading-relaxed text-slate-600">{busy ? t('waiting') : t('empty')}</p>}
          {error && <p role="alert" className="mt-4 rounded-xl bg-red-50 p-3 text-sm text-red-700">{error}</p>}
        </div>
      </div>
      <p className="mt-5 border-t border-amber-100 pt-4 text-xs leading-relaxed text-slate-500">{t('limitations')}</p>
      <LoginModal isOpen={showLogin} onClose={() => setShowLogin(false)} />
    </section>
  );
}
