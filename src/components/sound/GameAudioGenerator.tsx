'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { useTranslations } from 'next-intl'
import { useAuth } from '@/contexts/AuthContext'
import { supabase } from '@/lib/supabase'
import { Link } from '@/i18n/routing'
import type {
  GameAudioMode,
  DurationHint,
  SoundKey,
} from '@/lib/kie-api/kie-sound-service'
import ModeTabs, { ModeIcon, normalizeSupportedMode } from './ModeTabs'
import PromptPanel from './PromptPanel'
import OptionsPanel from './OptionsPanel'
import ResultsPanel, { type ResultsTab } from './ResultsPanel'
import type { GeneratedTrackItem } from './TrackCard'

export interface GameSoundPresetItem {
  id: string
  title: string
  caption: string
  mode: GameAudioMode
  soundLoop: boolean
  soundTempo?: number
  soundKey?: SoundKey
  durationHint: DurationHint
  duration?: number
  audioUrl: string
  prompt: string
}

interface GameAudioGeneratorProps {
  showcaseTracks: GameSoundPresetItem[]
  provider?: 'kie' | 'aisplice'
}

const MODE_DEFAULT_LOOP: Record<GameAudioMode, boolean> = {
  'sound-effects': false,
  'ambiance-loops': true,
  music: true,
  'audio-remix': true,
  'human-voice': false,
  'non-human-voice': false,
  'speech-clone': false,
  'speech-preset': false,
}

const FAVORITES_STORAGE_KEY = 'enb_game_sound_favorites_v1'
const HISTORY_STORAGE_KEY = 'enb_game_sound_history_v1'

export default function GameAudioGenerator({
  showcaseTracks,
  provider = 'kie',
}: GameAudioGeneratorProps) {
  const t = useTranslations('gameSoundGenerator.workbench')
  const { user, profile, signInWithGoogle, refreshProfile } = useAuth()

  const [mode, setMode] = useState<GameAudioMode>('sound-effects')
  const [prompt, setPrompt] = useState('')
  const [durationHint, setDurationHint] = useState<DurationHint>('auto')
  const [soundLoop, setSoundLoop] = useState(false)
  const [soundTempo, setSoundTempo] = useState<string>('')
  const [soundKey, setSoundKey] = useState<SoundKey>('Any')

  // Results & persistence states
  const [activeTab, setActiveTab] = useState<ResultsTab>('session')
  const [favorites, setFavorites] = useState<string[]>([])
  const [userTracks, setUserTracks] = useState<GeneratedTrackItem[]>([])

  // Task polling states
  const [isGenerating, setIsGenerating] = useState(false)
  const [generationStage, setGenerationStage] = useState<
    'queued' | 'generating' | 'finalizing'
  >('queued')
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [isInsufficientCredits, setIsInsufficientCredits] = useState(false)

  const cancelPollRef = useRef(false)
  const resultsRef = useRef<HTMLDivElement | null>(null)

  // Load favorites and history from localStorage
  useEffect(() => {
    if (typeof window === 'undefined') return
    try {
      const savedFavs = localStorage.getItem(FAVORITES_STORAGE_KEY)
      if (savedFavs) setFavorites(JSON.parse(savedFavs))
      const savedHistory = localStorage.getItem(HISTORY_STORAGE_KEY)
      if (savedHistory) setUserTracks(JSON.parse(savedHistory))
    } catch {
      // Ignore storage read errors
    }
  }, [])

  const applyPresetToForm = useCallback(
    (preset: {
      prompt: string
      mode: GameAudioMode
      soundLoop: boolean
      soundTempo?: number
      soundKey?: SoundKey
      durationHint?: DurationHint
    }) => {
      const normalizedMode = normalizeSupportedMode(preset.mode)
      setMode(normalizedMode)
      setPrompt(preset.prompt)
      setSoundLoop(
        provider === 'aisplice' ? false : Boolean(preset.soundLoop)
      )
      if (preset.soundTempo && provider !== 'aisplice') {
        setSoundTempo(String(preset.soundTempo))
      } else {
        setSoundTempo('')
      }
      if (preset.soundKey && provider !== 'aisplice') {
        setSoundKey(preset.soundKey)
      } else {
        setSoundKey('Any')
      }
      if (
        preset.durationHint === '5' ||
        preset.durationHint === '10' ||
        preset.durationHint === 'auto'
      ) {
        setDurationHint(preset.durationHint)
      } else {
        setDurationHint('auto')
      }
      setErrorMessage(null)
    },
    [provider]
  )

  // Listen for custom "load preset into workbench" events from the showcase cards below
  useEffect(() => {
    const handleLoadPreset = (e: Event) => {
      const custom = e as CustomEvent<{
        prompt: string
        mode: GameAudioMode
        soundLoop: boolean
        soundTempo?: number
        soundKey?: SoundKey
        durationHint?: DurationHint
      }>
      if (!custom.detail) return
      applyPresetToForm(custom.detail)
    }
    window.addEventListener('enb:load-game-sound-preset', handleLoadPreset)
    return () =>
      window.removeEventListener('enb:load-game-sound-preset', handleLoadPreset)
  }, [applyPresetToForm])

  const handleSelectMode = (nextMode: GameAudioMode) => {
    const normalized = normalizeSupportedMode(nextMode)
    setMode(normalized)
    if (provider === 'aisplice') {
      setSoundLoop(false)
    } else {
      setSoundLoop(MODE_DEFAULT_LOOP[normalized] ?? false)
    }
  }

  const toggleFavorite = (trackId: string) => {
    setFavorites((prev) => {
      const next = prev.includes(trackId)
        ? prev.filter((id) => id !== trackId)
        : [...prev, trackId]
      try {
        localStorage.setItem(FAVORITES_STORAGE_KEY, JSON.stringify(next))
      } catch {
        // Ignore storage errors
      }
      return next
    })
  }

  const handleCancelGeneration = () => {
    cancelPollRef.current = true
    setIsGenerating(false)
  }

  const handleGenerate = async () => {
    setErrorMessage(null)
    setIsInsufficientCredits(false)

    if (!user) {
      await signInWithGoogle()
      return
    }

    if (!prompt.trim()) {
      setErrorMessage(t('errors.emptyPrompt'))
      return
    }

    cancelPollRef.current = false
    setIsGenerating(true)
    setGenerationStage('queued')
    setActiveTab('session')

    try {
      const {
        data: { session },
      } = await supabase.auth.getSession()
      const token = session?.access_token
      if (!token) {
        setErrorMessage(t('errors.authRequired'))
        setIsGenerating(false)
        return
      }

      const response = await fetch('/api/sound/generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          prompt: prompt.trim(),
          mode,
          durationHint,
          soundLoop: provider === 'aisplice' ? false : soundLoop,
          soundTempo:
            provider !== 'aisplice' && soundTempo
              ? Number(soundTempo)
              : undefined,
          soundKey: provider !== 'aisplice' ? soundKey : 'Any',
          provider,
        }),
      })

      const data = await response.json()

      if (!response.ok || !data.taskId) {
        if (response.status === 402) {
          setIsInsufficientCredits(true)
          setErrorMessage(t('errors.insufficientCredits'))
        } else {
          setErrorMessage(data.message || data.error || t('errors.failed'))
        }
        setIsGenerating(false)
        return
      }

      await refreshProfile()
      const taskId: string = data.taskId
      setGenerationStage('generating')

      // Scroll results into view on smaller viewports when generation starts
      if (
        typeof window !== 'undefined' &&
        window.innerWidth < 1024 &&
        resultsRef.current
      ) {
        resultsRef.current.scrollIntoView({
          behavior: 'smooth',
          block: 'start',
        })
      }

      // Poll task-status every 4s up to 45 times (3 minutes)
      for (let attempt = 0; attempt < 45; attempt++) {
        await new Promise((r) => setTimeout(r, 4000))
        if (cancelPollRef.current) {
          return
        }

        if (attempt >= 4) {
          setGenerationStage('finalizing')
        }

        const pollRes = await fetch(
          `/api/sound/task-status?taskId=${encodeURIComponent(taskId)}`,
          { cache: 'no-store' }
        )
        const pollData = await pollRes.json()

        if (pollData.status === 'completed' && Array.isArray(pollData.clips)) {
          const newItems: GeneratedTrackItem[] = pollData.clips.map(
            (
              clip: {
                id: string
                audioUrl: string
                duration?: number
                title?: string
              },
              idx: number
            ) => ({
              id: clip.id || `${taskId}-${idx + 1}`,
              taskId,
              title: clip.title
                ? `${clip.title} (#${idx + 1})`
                : `${t(`modes.${mode}.label`)} #${idx + 1}`,
              prompt: prompt.trim(),
              mode,
              soundLoop: provider === 'aisplice' ? false : soundLoop,
              soundTempo:
                provider !== 'aisplice' && soundTempo
                  ? Number(soundTempo)
                  : undefined,
              soundKey: provider !== 'aisplice' ? soundKey : 'Any',
              durationHint,
              duration: clip.duration,
              audioUrl: clip.audioUrl,
              createdAt: new Date().toISOString(),
            })
          )

          setUserTracks((prev) => {
            const combined = [...newItems, ...prev].slice(0, 24)
            try {
              localStorage.setItem(
                HISTORY_STORAGE_KEY,
                JSON.stringify(combined)
              )
            } catch {
              // Ignore
            }
            return combined
          })

          setIsGenerating(false)
          return
        }

        if (pollData.status === 'failed') {
          setErrorMessage(pollData.error || t('errors.failed'))
          await refreshProfile()
          setIsGenerating(false)
          return
        }
      }

      setErrorMessage(t('errors.timeout'))
    } catch (err: unknown) {
      setErrorMessage(err instanceof Error ? err.message : t('errors.failed'))
    } finally {
      setIsGenerating(false)
    }
  }

  const showcaseAsTracks: GeneratedTrackItem[] = showcaseTracks.map((item) => ({
    id: item.id,
    taskId: item.id,
    title: item.title,
    prompt: item.prompt,
    mode: item.mode,
    soundLoop: item.soundLoop,
    soundTempo: item.soundTempo,
    soundKey: item.soundKey,
    durationHint: item.durationHint,
    duration: item.duration,
    audioUrl: item.audioUrl,
    createdAt: '',
    isShowcase: true,
  }))

  return (
    <div
      id="generator"
      className="scroll-mt-24 rounded-3xl border border-slate-200 bg-white shadow-sm"
    >
      <div className="grid lg:grid-cols-[430px_1fr]">
        {/* Left Column: Create Panel (Steps 1 → 2 → 3 + Sticky Generate Footer) */}
        <div className="flex flex-col justify-between border-b border-slate-200 p-5 sm:p-6 lg:border-b-0 lg:border-r">
          <div className="space-y-6">
            <ModeTabs
              mode={mode}
              onSelectMode={handleSelectMode}
              provider={provider}
            />

            <PromptPanel
              mode={mode}
              prompt={prompt}
              onChangePrompt={setPrompt}
              showcaseTracks={showcaseTracks}
              onApplyPreset={applyPresetToForm}
            />

            <OptionsPanel
              mode={mode}
              durationHint={durationHint}
              onChangeDuration={setDurationHint}
              soundLoop={soundLoop}
              onChangeLoop={setSoundLoop}
              soundTempo={soundTempo}
              onChangeTempo={setSoundTempo}
              soundKey={soundKey}
              onChangeKey={setSoundKey}
              provider={provider}
            />
          </div>

          {/* Sticky Bottom CTA Bar */}
          <div className="sticky bottom-0 z-20 -mx-5 mt-6 border-t border-slate-200 bg-white/95 px-5 pb-2 pt-4 backdrop-blur sm:-mx-6 sm:px-6">
            {errorMessage && (
              <div
                role="alert"
                className="mb-3 flex flex-wrap items-center justify-between gap-2 rounded-xl border border-red-200 bg-red-50 px-3.5 py-2.5 text-xs font-medium text-red-800"
              >
                <span>{errorMessage}</span>
                {isInsufficientCredits && (
                  <Link
                    href="/pricing"
                    className="font-semibold underline hover:no-underline"
                  >
                    {t('getMoreCredits')}
                  </Link>
                )}
              </div>
            )}

            <button
              type="button"
              disabled={isGenerating}
              onClick={handleGenerate}
              className="flex w-full items-center justify-center gap-2.5 rounded-xl bg-[#FFD84D] px-6 py-3.5 text-sm font-semibold text-slate-900 shadow-sm transition hover:bg-amber-300 focus:outline-none focus:ring-2 focus:ring-slate-900/20 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {isGenerating ? (
                <>
                  <span className="h-4 w-4 animate-spin rounded-full border-2 border-slate-900 border-t-transparent" />
                  <span>{t('status.generating')}</span>
                </>
              ) : !user ? (
                <span>{t('signInToGenerate')}</span>
              ) : (
                <>
                  <ModeIcon mode={mode} className="h-4 w-4 text-slate-900" />
                  <span>
                    {t('generateButtonPrefix')} {t(`modes.${mode}.label`)}
                  </span>
                </>
              )}
            </button>

            <div className="mt-2 flex items-center justify-center gap-1.5 text-xs font-medium text-slate-600">
              <span>{t('creditSummary')}</span>
              {user && profile && (
                <>
                  <span aria-hidden="true">·</span>
                  <span>
                    {t('balanceLabel')}: {profile.credits ?? 0}
                  </span>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Right Column: Results Panel */}
        <div ref={resultsRef} className="p-5 sm:p-6">
          <ResultsPanel
            activeTab={activeTab}
            onChangeTab={setActiveTab}
            userTracks={userTracks}
            showcaseTracks={showcaseAsTracks}
            favorites={favorites}
            onToggleFavorite={toggleFavorite}
            onUsePrompt={applyPresetToForm}
            isGenerating={isGenerating}
            generationStage={generationStage}
            onCancelGeneration={handleCancelGeneration}
            mode={mode}
          />
        </div>
      </div>
    </div>
  )
}
