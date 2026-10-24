'use client'

import { useTranslations } from 'next-intl'
import type { GameAudioMode } from '@/lib/kie-api/kie-sound-service'

export type PrimaryCategory =
  | 'sound-effects'
  | 'ambiance-loops'
  | 'music'
  | 'voice'

export function ModeIcon({
  mode,
  className = 'h-5 w-5',
}: {
  mode: GameAudioMode | 'voice'
  className?: string
}) {
  switch (mode) {
    case 'sound-effects':
      return (
        <svg
          className={className}
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth={1.9}
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden="true"
        >
          <path d="M11 5L6 9H2v6h4l5 4V5z" />
          <path d="M15.54 8.46a5 5 0 0 1 0 7.07" />
          <path d="M19.07 4.93a10 10 0 0 1 0 14.14" />
        </svg>
      )
    case 'ambiance-loops':
      return (
        <svg
          className={className}
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth={1.9}
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden="true"
        >
          <path d="M2 12h2" />
          <path d="M6 8v8" />
          <path d="M10 5v14" />
          <path d="M14 9v6" />
          <path d="M18 7v10" />
          <path d="M22 12h-2" />
        </svg>
      )
    case 'music':
    case 'audio-remix':
      return (
        <svg
          className={className}
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth={1.9}
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden="true"
        >
          <path d="M9 18V5l12-2v13" />
          <circle cx="6" cy="18" r="3" />
          <circle cx="18" cy="16" r="3" />
        </svg>
      )
    case 'voice':
    case 'human-voice':
    case 'speech-clone':
    case 'speech-preset':
      return (
        <svg
          className={className}
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth={1.9}
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden="true"
        >
          <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z" />
          <path d="M19 10v2a7 7 0 0 1-14 0v-2" />
          <line x1="12" y1="19" x2="12" y2="23" />
          <line x1="8" y1="23" x2="16" y2="23" />
        </svg>
      )
    case 'non-human-voice':
      return (
        <svg
          className={className}
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth={1.9}
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden="true"
        >
          <rect x="3" y="11" width="18" height="10" rx="2" />
          <circle cx="12" cy="5" r="2" />
          <path d="M12 7v4" />
          <line x1="8" y1="16" x2="8" y2="16" />
          <line x1="16" y1="16" x2="16" y2="16" />
        </svg>
      )
  }
}

export function getPrimaryCategory(mode: GameAudioMode): PrimaryCategory {
  if (
    mode === 'human-voice' ||
    mode === 'non-human-voice' ||
    mode === 'speech-clone' ||
    mode === 'speech-preset'
  ) {
    return 'voice'
  }
  if (mode === 'ambiance-loops') return 'ambiance-loops'
  if (mode === 'music' || mode === 'audio-remix') return 'music'
  return 'sound-effects'
}

export function normalizeSupportedMode(mode: GameAudioMode): GameAudioMode {
  if (mode === 'audio-remix') return 'music'
  if (mode === 'speech-clone' || mode === 'speech-preset') return 'human-voice'
  return mode
}

interface ModeTabsProps {
  mode: GameAudioMode
  onSelectMode: (mode: GameAudioMode) => void
  provider?: 'kie' | 'aisplice'
}

export default function ModeTabs({
  mode,
  onSelectMode,
  provider = 'kie',
}: ModeTabsProps) {
  const t = useTranslations('gameSoundGenerator.workbench')
  const activeCategory = getPrimaryCategory(mode)

  const categories: Array<{
    id: PrimaryCategory
    targetMode: GameAudioMode
    disabled?: boolean
  }> = [
    {
      id: 'sound-effects',
      targetMode: 'sound-effects',
    },
    {
      id: 'ambiance-loops',
      targetMode: 'ambiance-loops',
      disabled: provider === 'aisplice',
    },
    {
      id: 'music',
      targetMode: 'music',
    },
    {
      id: 'voice',
      targetMode:
        mode === 'non-human-voice' ? 'non-human-voice' : 'human-voice',
      disabled: provider === 'aisplice',
    },
  ]

  const visibleCategories = categories.filter((c) => !c.disabled)

  return (
    <div>
      <div className="mb-2.5 flex items-center gap-2">
        <span className="flex h-6 w-6 items-center justify-center rounded-full bg-slate-900 text-xs font-bold text-white">
          1
        </span>
        <span className="text-sm font-semibold text-slate-900">
          {t('step1Label')}
        </span>
      </div>

      <div
        role="tablist"
        aria-label={t('step1Label')}
        className="grid grid-cols-2 gap-2.5"
      >
        {visibleCategories.map((cat) => {
          const isSelected = activeCategory === cat.id
          const labelKey =
            cat.id === 'voice'
              ? 'voiceCategory.label'
              : `modes.${cat.targetMode}.label`
          const descKey =
            cat.id === 'voice'
              ? 'voiceCategory.description'
              : `modes.${cat.targetMode}.description`

          return (
            <button
              key={cat.id}
              type="button"
              role="tab"
              aria-selected={isSelected}
              onClick={() => onSelectMode(cat.targetMode)}
              className={`flex flex-col items-start rounded-xl border p-3.5 text-left transition focus:outline-none focus:ring-2 focus:ring-slate-900/20 ${
                isSelected
                  ? 'border-slate-900 bg-slate-900 text-white shadow-sm'
                  : 'border-slate-200 bg-white text-slate-900 hover:border-slate-300 hover:bg-slate-50'
              }`}
            >
              <div className="flex w-full items-center justify-between gap-2">
                <span
                  className={`flex h-8 w-8 items-center justify-center rounded-lg ${
                    isSelected
                      ? 'bg-[#FFD84D] text-slate-900'
                      : 'bg-slate-100 text-slate-700'
                  }`}
                >
                  <ModeIcon
                    mode={cat.id === 'voice' ? 'voice' : cat.targetMode}
                    className="h-4 w-4"
                  />
                </span>
                {isSelected && (
                  <span className="h-2 w-2 rounded-full bg-[#FFD84D]" />
                )}
              </div>
              <span className="mt-2.5 text-sm font-semibold leading-snug">
                {t(labelKey)}
              </span>
              <span
                className={`mt-1 line-clamp-2 text-xs leading-relaxed ${
                  isSelected ? 'text-slate-300' : 'text-slate-600'
                }`}
              >
                {t(descKey)}
              </span>
            </button>
          )
        })}
      </div>

      {/* Secondary Voice Type Selector when Voice is active */}
      {activeCategory === 'voice' && provider !== 'aisplice' && (
        <div className="mt-3 rounded-xl border border-slate-200 bg-slate-50 p-2.5">
          <div className="mb-1.5 text-xs font-medium text-slate-700">
            {t('voiceCategory.subLabel')}
          </div>
          <div
            role="group"
            aria-label={t('voiceCategory.subLabel')}
            className="grid grid-cols-2 gap-2"
          >
            {(['human-voice', 'non-human-voice'] as const).map((vMode) => {
              const active = mode === vMode
              return (
                <button
                  key={vMode}
                  type="button"
                  aria-pressed={active}
                  onClick={() => onSelectMode(vMode)}
                  className={`flex items-center gap-2 rounded-lg border px-3 py-2 text-left text-xs font-semibold transition ${
                    active
                      ? 'border-slate-900 bg-white text-slate-900 shadow-sm'
                      : 'border-transparent text-slate-600 hover:bg-white/60 hover:text-slate-900'
                  }`}
                >
                  <ModeIcon mode={vMode} className="h-4 w-4 shrink-0" />
                  <span className="truncate">{t(`modes.${vMode}.label`)}</span>
                </button>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}
