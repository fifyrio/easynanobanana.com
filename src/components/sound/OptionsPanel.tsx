'use client'

import { useState } from 'react'
import { useTranslations } from 'next-intl'
import type {
  GameAudioMode,
  DurationHint,
  SoundKey,
} from '@/lib/kie-api/kie-sound-service'

const MUSICAL_KEYS: SoundKey[] = [
  'Any',
  'Am',
  'Cm',
  'Dm',
  'Em',
  'Fm',
  'Gm',
  'C',
  'D',
  'E',
  'F',
  'G',
  'A',
]

interface OptionsPanelProps {
  mode: GameAudioMode
  durationHint: DurationHint
  onChangeDuration: (next: DurationHint) => void
  soundLoop: boolean
  onChangeLoop: (next: boolean) => void
  soundTempo: string
  onChangeTempo: (next: string) => void
  soundKey: SoundKey
  onChangeKey: (next: SoundKey) => void
  provider?: 'kie' | 'aisplice'
}

export default function OptionsPanel({
  mode,
  durationHint,
  onChangeDuration,
  soundLoop,
  onChangeLoop,
  soundTempo,
  onChangeTempo,
  soundKey,
  onChangeKey,
  provider = 'kie',
}: OptionsPanelProps) {
  const t = useTranslations('gameSoundGenerator.workbench')
  const [showAdvanced, setShowAdvanced] = useState(false)

  const supportsLoop = provider !== 'aisplice'
  const showMusicalAdvanced =
    provider !== 'aisplice' &&
    (mode === 'music' || mode === 'ambiance-loops' || soundLoop)

  const durationOptions: Array<{ value: DurationHint; label: string }> = [
    { value: 'auto', label: t('durationAuto') },
    { value: '5', label: '5s' },
    { value: '10', label: '10s' },
  ]

  const hasCustomAdvanced =
    Boolean(soundTempo && soundTempo.trim()) || soundKey !== 'Any'

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <span className="flex h-6 w-6 items-center justify-center rounded-full bg-slate-900 text-xs font-bold text-white">
          3
        </span>
        <span className="text-sm font-semibold text-slate-900">
          {t('step3Label')}
        </span>
      </div>

      {/* Duration Segmented Buttons */}
      <div>
        <span
          id="duration-group-label"
          className="mb-1.5 block text-xs font-semibold text-slate-700"
        >
          {t('durationLabel')}
        </span>
        <div
          role="group"
          aria-labelledby="duration-group-label"
          className="grid grid-cols-3 gap-2 rounded-xl border border-slate-200 bg-slate-100 p-1"
        >
          {durationOptions.map((opt) => {
            const active = durationHint === opt.value
            return (
              <button
                key={opt.value}
                type="button"
                aria-pressed={active}
                onClick={() => onChangeDuration(opt.value)}
                className={`rounded-lg py-2 text-xs font-semibold transition ${
                  active
                    ? 'bg-white text-slate-900 shadow-sm'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                {opt.label}
              </button>
            )
          })}
        </div>
      </div>

      {/* Seamless Loop Checkbox with Explanation */}
      {supportsLoop ? (
        <label className="flex cursor-pointer items-start gap-3 rounded-xl border border-slate-200 bg-slate-50/70 p-3.5 transition hover:border-slate-300">
          <input
            type="checkbox"
            checked={soundLoop}
            onChange={(e) => onChangeLoop(e.target.checked)}
            className="mt-0.5 h-4 w-4 rounded border-slate-300 text-slate-900 focus:ring-slate-900"
          />
          <div className="min-w-0 flex-1">
            <div className="text-sm font-semibold text-slate-900">
              {t('loopLabel')}
            </div>
            <p className="mt-0.5 text-xs leading-relaxed text-slate-600">
              {t('loopDescription')}
            </p>
          </div>
        </label>
      ) : (
        <p className="rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2.5 text-xs text-slate-600">
          {t('loopUnavailableNote')}
        </p>
      )}

      {/* Collapsible Advanced Musical Controls (BPM / Key) — only for Music / Loop on KIE */}
      {showMusicalAdvanced && (
        <div className="rounded-xl border border-slate-200 bg-white">
          <button
            type="button"
            aria-expanded={showAdvanced || hasCustomAdvanced}
            onClick={() => setShowAdvanced((v) => !v)}
            className="flex w-full items-center justify-between px-3.5 py-2.5 text-left text-xs font-semibold text-slate-800 hover:bg-slate-50"
          >
            <span className="flex items-center gap-1.5">
              <span>{t('advancedLabel')}</span>
              {hasCustomAdvanced && (
                <span className="rounded-md bg-slate-900 px-1.5 py-0.5 text-[11px] font-medium text-white">
                  {soundTempo ? `${soundTempo} BPM` : ''}
                  {soundTempo && soundKey !== 'Any' ? ' · ' : ''}
                  {soundKey !== 'Any' ? soundKey : ''}
                </span>
              )}
            </span>
            <svg
              className={`h-4 w-4 text-slate-500 transition-transform ${
                showAdvanced || hasCustomAdvanced ? 'rotate-180' : ''
              }`}
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth={2}
              aria-hidden="true"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M19 9l-7 7-7-7"
              />
            </svg>
          </button>

          {(showAdvanced || hasCustomAdvanced) && (
            <div className="border-t border-slate-200 p-3.5">
              <p className="mb-3 text-xs leading-relaxed text-slate-600">
                {t('tempoKeyHelp')}
              </p>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label
                    htmlFor="game-sound-tempo"
                    className="mb-1 block text-xs font-semibold text-slate-700"
                  >
                    {t('tempoLabel')}
                  </label>
                  <input
                    id="game-sound-tempo"
                    type="number"
                    min={40}
                    max={240}
                    placeholder={t('durationAuto')}
                    value={soundTempo}
                    onChange={(e) => onChangeTempo(e.target.value)}
                    className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 placeholder-slate-400 focus:border-slate-900 focus:outline-none"
                  />
                </div>
                <div>
                  <label
                    htmlFor="game-sound-key"
                    className="mb-1 block text-xs font-semibold text-slate-700"
                  >
                    {t('keyLabel')}
                  </label>
                  <select
                    id="game-sound-key"
                    value={soundKey}
                    onChange={(e) => onChangeKey(e.target.value as SoundKey)}
                    className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 focus:border-slate-900 focus:outline-none"
                  >
                    {MUSICAL_KEYS.map((k) => (
                      <option key={k} value={k}>
                        {k}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
