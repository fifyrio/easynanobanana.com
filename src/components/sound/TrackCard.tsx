'use client'

import { useState } from 'react'
import { useTranslations } from 'next-intl'
import type {
  GameAudioMode,
  DurationHint,
  SoundKey,
} from '@/lib/kie-api/kie-sound-service'
import { ModeIcon, normalizeSupportedMode } from './ModeTabs'

export interface GeneratedTrackItem {
  id: string
  taskId: string
  title: string
  prompt: string
  mode: GameAudioMode
  soundLoop: boolean
  soundTempo?: number
  soundKey?: SoundKey
  durationHint?: DurationHint
  duration?: number
  audioUrl: string
  createdAt: string
  isShowcase?: boolean
}

interface TrackCardProps {
  track: GeneratedTrackItem
  isFavorite: boolean
  onToggleFavorite: (id: string) => void
  onUsePrompt: (preset: {
    prompt: string
    mode: GameAudioMode
    soundLoop: boolean
    soundTempo?: number
    soundKey?: SoundKey
    durationHint?: DurationHint
  }) => void
}

export default function TrackCard({
  track,
  isFavorite,
  onToggleFavorite,
  onUsePrompt,
}: TrackCardProps) {
  const t = useTranslations('gameSoundGenerator.workbench')
  const [copied, setCopied] = useState(false)

  const handleCopyPrompt = async () => {
    try {
      await navigator.clipboard.writeText(track.prompt)
      setCopied(true)
      setTimeout(() => setCopied(false), 1800)
    } catch {
      // Fallback ignored
    }
  }

  const handleUsePrompt = () => {
    onUsePrompt({
      prompt: track.prompt,
      mode: normalizeSupportedMode(track.mode),
      soundLoop: track.soundLoop,
      soundTempo: track.soundTempo,
      soundKey: track.soundKey,
      durationHint:
        track.durationHint ||
        (track.duration && track.duration <= 6
          ? '5'
          : track.duration && track.duration <= 14
          ? '10'
          : 'auto'),
    })
  }

  return (
    <article className="flex flex-col justify-between rounded-2xl border border-slate-200 bg-white p-4 shadow-sm transition hover:border-slate-300">
      <div>
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex flex-wrap items-center gap-1.5">
            <span className="inline-flex items-center gap-1.5 rounded-full border border-slate-200 bg-slate-100 px-2.5 py-0.5 text-xs font-semibold text-slate-800">
              <ModeIcon mode={track.mode} className="h-3.5 w-3.5" />
              {t(`modes.${track.mode}.label`)}
            </span>

            {track.soundLoop && (
              <span className="rounded-full bg-emerald-100 px-2.5 py-0.5 text-xs font-semibold text-emerald-800">
                🔁 {t('loopBadge')}
              </span>
            )}

            {track.isShowcase && (
              <span className="rounded-full border border-slate-200 bg-slate-50 px-2.5 py-0.5 text-xs font-medium text-slate-600">
                {t('presetBadge')}
              </span>
            )}
          </div>

          <div className="flex items-center gap-1">
            <button
              type="button"
              aria-pressed={isFavorite}
              onClick={() => onToggleFavorite(track.id)}
              aria-label={t('favoriteAria')}
              title={t('favoriteAria')}
              className={`rounded-lg p-1.5 transition ${
                isFavorite
                  ? 'bg-rose-50 text-rose-600'
                  : 'text-slate-500 hover:bg-slate-100 hover:text-slate-900'
              }`}
            >
              <svg
                className="h-4 w-4"
                viewBox="0 0 24 24"
                fill={isFavorite ? 'currentColor' : 'none'}
                stroke="currentColor"
                strokeWidth={2}
                aria-hidden="true"
              >
                <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
              </svg>
            </button>

            <a
              href={track.audioUrl}
              download={`${track.id}.mp3`}
              target="_blank"
              rel="noopener noreferrer"
              aria-label={t('downloadMp3')}
              title={t('downloadMp3')}
              className="inline-flex items-center gap-1 rounded-lg border border-slate-200 bg-white px-2.5 py-1 text-xs font-semibold text-slate-700 transition hover:bg-slate-50 hover:text-slate-900"
            >
              <svg
                className="h-3.5 w-3.5"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth={2}
                aria-hidden="true"
              >
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                <polyline points="7 10 12 15 17 10" />
                <line x1="12" y1="15" x2="12" y2="3" />
              </svg>
              <span>MP3</span>
            </a>
          </div>
        </div>

        <h3 className="mt-3 text-base font-semibold text-slate-900">
          {track.title}
        </h3>
        <p className="mt-1 line-clamp-2 text-sm leading-relaxed text-slate-600">
          {track.prompt}
        </p>
      </div>

      <div className="mt-3.5">
        <audio
          controls
          loop={track.soundLoop}
          preload="metadata"
          src={track.audioUrl}
          className="h-10 w-full"
        />

        <div className="mt-2.5 flex flex-wrap items-center justify-between gap-2 border-t border-slate-100 pt-2.5 text-xs text-slate-600">
          <span className="font-medium">
            {track.duration ? `${track.duration}s` : 'MP3'}
            {track.soundTempo ? ` · ${track.soundTempo} BPM` : ''}
            {track.soundKey && track.soundKey !== 'Any'
              ? ` · Key ${track.soundKey}`
              : ''}
          </span>

          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={handleCopyPrompt}
              className="font-semibold text-slate-600 transition hover:text-slate-900"
            >
              {copied ? t('copiedPrompt') : t('copyPrompt')}
            </button>
            <button
              type="button"
              onClick={handleUsePrompt}
              className="font-semibold text-slate-900 underline decoration-slate-400 underline-offset-2 transition hover:decoration-slate-900"
            >
              {track.isShowcase ? t('useThisPrompt') : t('reuseSettings')}
            </button>
          </div>
        </div>
      </div>
    </article>
  )
}
