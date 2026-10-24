'use client'

import { useTranslations } from 'next-intl'
import type {
  GameAudioMode,
  DurationHint,
  SoundKey,
} from '@/lib/kie-api/kie-sound-service'
import type { GameSoundPresetItem } from './GameAudioGenerator'
import { getPrimaryCategory, normalizeSupportedMode } from './ModeTabs'

interface PromptPanelProps {
  mode: GameAudioMode
  prompt: string
  onChangePrompt: (next: string) => void
  showcaseTracks: GameSoundPresetItem[]
  onApplyPreset: (preset: {
    prompt: string
    mode: GameAudioMode
    soundLoop: boolean
    soundTempo?: number
    soundKey?: SoundKey
    durationHint?: DurationHint
  }) => void
}

const VOICE_PRESETS: Array<{
  id: string
  mode: GameAudioMode
  soundLoop: boolean
  durationHint: DurationHint
  prompt: string
  titleKey: string
}> = [
  {
    id: 'voice-knight-rally',
    mode: 'human-voice',
    soundLoop: false,
    durationHint: '5',
    titleKey: 'voiceChips.knightRally',
    prompt:
      'Battle-hardened knight commander shouting an urgent tactical rally cry with echo in a stone courtyard.',
  },
  {
    id: 'voice-rogue-ai',
    mode: 'non-human-voice',
    soundLoop: false,
    durationHint: '5',
    titleKey: 'voiceChips.rogueAi',
    prompt:
      'Glitching synthetic spaceship AI core issuing a cold containment breach warning with subtle vocoder harmonics.',
  },
]

export default function PromptPanel({
  mode,
  prompt,
  onChangePrompt,
  showcaseTracks,
  onApplyPreset,
}: PromptPanelProps) {
  const t = useTranslations('gameSoundGenerator.workbench')
  const activeCat = getPrimaryCategory(mode)

  // Sort showcase tracks so chips matching the selected category come first
  const sortedShowcases = [...showcaseTracks].sort((a, b) => {
    const aMatch =
      getPrimaryCategory(normalizeSupportedMode(a.mode)) === activeCat ? 0 : 1
    const bMatch =
      getPrimaryCategory(normalizeSupportedMode(b.mode)) === activeCat ? 0 : 1
    return aMatch - bMatch
  })

  const chips =
    activeCat === 'voice'
      ? [
          ...VOICE_PRESETS.map((vp) => ({
            id: vp.id,
            title: t(vp.titleKey),
            prompt: vp.prompt,
            mode: vp.mode,
            soundLoop: vp.soundLoop,
            durationHint: vp.durationHint,
            soundTempo: undefined,
            soundKey: 'Any' as SoundKey,
          })),
          ...sortedShowcases.slice(0, 2).map((s) => ({
            id: s.id,
            title: s.title,
            prompt: s.prompt,
            mode: normalizeSupportedMode(s.mode),
            soundLoop: s.soundLoop,
            durationHint: s.durationHint,
            soundTempo: s.soundTempo,
            soundKey: s.soundKey,
          })),
        ]
      : sortedShowcases.slice(0, 4).map((s) => ({
          id: s.id,
          title: s.title,
          prompt: s.prompt,
          mode: normalizeSupportedMode(s.mode),
          soundLoop: s.soundLoop,
          durationHint: s.durationHint,
          soundTempo: s.soundTempo,
          soundKey: s.soundKey,
        }))

  return (
    <div>
      <div className="mb-2.5 flex items-center justify-between">
        <label
          htmlFor="game-sound-description"
          className="flex items-center gap-2 text-sm font-semibold text-slate-900"
        >
          <span className="flex h-6 w-6 items-center justify-center rounded-full bg-slate-900 text-xs font-bold text-white">
            2
          </span>
          <span>{t('step2Label')}</span>
        </label>
        <span className="text-xs font-medium text-slate-600">
          {prompt.length}/500
        </span>
      </div>

      <textarea
        id="game-sound-description"
        rows={4}
        maxLength={500}
        value={prompt}
        onChange={(e) => onChangePrompt(e.target.value)}
        placeholder={t(`modes.${mode}.placeholder`)}
        className="w-full resize-none rounded-xl border border-slate-300 bg-white p-3.5 text-sm leading-relaxed text-slate-900 placeholder-slate-500 shadow-sm transition focus:border-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-900/15"
      />

      {/* Quick Idea Chips (Syncs all parameters) */}
      <div className="mt-2.5">
        <div className="mb-1.5 text-xs font-medium text-slate-600">
          {t('quickPromptsLabel')}
        </div>
        <div className="flex flex-wrap gap-1.5">
          {chips.map((chip) => {
            const isActivePrompt = prompt.trim() === chip.prompt.trim()
            return (
              <button
                key={chip.id}
                type="button"
                aria-pressed={isActivePrompt}
                onClick={() =>
                  onApplyPreset({
                    prompt: chip.prompt,
                    mode: chip.mode,
                    soundLoop: chip.soundLoop,
                    soundTempo: chip.soundTempo,
                    soundKey: chip.soundKey,
                    durationHint: chip.durationHint,
                  })
                }
                className={`rounded-lg border px-2.5 py-1.5 text-xs font-medium transition ${
                  isActivePrompt
                    ? 'border-slate-900 bg-slate-900 text-white'
                    : 'border-slate-200 bg-slate-50 text-slate-700 hover:border-slate-300 hover:bg-slate-100 hover:text-slate-900'
                }`}
              >
                {chip.title}
              </button>
            )
          })}
        </div>
      </div>

      {/* Collapsible Prompt Tips */}
      <details className="mt-3 rounded-xl border border-slate-200 bg-slate-50/70 px-3.5 py-2.5 text-xs text-slate-700">
        <summary className="cursor-pointer font-semibold text-slate-800">
          {t('promptTipsTitle')}
        </summary>
        <p className="mt-1.5 leading-relaxed text-slate-600">
          {t('promptTipsFormula')}
        </p>
      </details>
    </div>
  )
}
