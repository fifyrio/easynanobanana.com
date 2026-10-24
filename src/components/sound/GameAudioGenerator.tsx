'use client'

import { useState, useEffect, useRef } from 'react'
import { useTranslations } from 'next-intl'
import { useAuth } from '@/contexts/AuthContext'
import { supabase } from '@/lib/supabase'
import { Link } from '@/i18n/routing'
import type {
  GameAudioMode,
  DurationHint,
  SoundKey,
} from '@/lib/kie-api/kie-sound-service'

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

interface GeneratedTrackItem {
  id: string
  taskId: string
  title: string
  prompt: string
  mode: GameAudioMode
  soundLoop: boolean
  soundTempo?: number
  soundKey?: SoundKey
  duration?: number
  audioUrl: string
  createdAt: string
  isShowcase?: boolean
}

interface GameAudioGeneratorProps {
  showcaseTracks: GameSoundPresetItem[]
}

const MODES: Array<{
  id: GameAudioMode
  defaultLoop: boolean
}> = [
  { id: 'sound-effects', defaultLoop: false },
  { id: 'ambiance-loops', defaultLoop: true },
  { id: 'music', defaultLoop: true },
  { id: 'audio-remix', defaultLoop: true },
  { id: 'human-voice', defaultLoop: false },
  { id: 'non-human-voice', defaultLoop: false },
  { id: 'speech-clone', defaultLoop: false },
  { id: 'speech-preset', defaultLoop: false },
]

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

const FAVORITES_STORAGE_KEY = 'enb_game_sound_favorites_v1'
const HISTORY_STORAGE_KEY = 'enb_game_sound_history_v1'

function ModeIcon({
  mode,
  className = 'h-5 w-5',
}: {
  mode: GameAudioMode
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
      return (
        <svg
          className={className}
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth={1.9}
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M9 18V5l12-2v13" />
          <circle cx="6" cy="18" r="3" />
          <circle cx="18" cy="16" r="3" />
        </svg>
      )
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
        >
          <polyline points="16 3 21 3 21 8" />
          <line x1="4" y1="20" x2="21" y2="3" />
          <polyline points="21 16 21 21 16 21" />
          <line x1="15" y1="15" x2="21" y2="21" />
          <line x1="4" y1="4" x2="9" y2="9" />
        </svg>
      )
    case 'human-voice':
      return (
        <svg
          className={className}
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth={1.9}
          strokeLinecap="round"
          strokeLinejoin="round"
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
        >
          <rect x="3" y="11" width="18" height="10" rx="2" />
          <circle cx="12" cy="5" r="2" />
          <path d="M12 7v4" />
          <line x1="8" y1="16" x2="8" y2="16" />
          <line x1="16" y1="16" x2="16" y2="16" />
        </svg>
      )
    case 'speech-clone':
      return (
        <svg
          className={className}
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth={1.9}
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
          <circle cx="9" cy="7" r="4" />
          <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
          <path d="M16 3.13a4 4 0 0 1 0 7.75" />
        </svg>
      )
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
        >
          <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
        </svg>
      )
  }
}

export default function GameAudioGenerator({
  showcaseTracks,
}: GameAudioGeneratorProps) {
  const t = useTranslations('gameSoundGenerator.workbench')
  const { user, profile, signInWithGoogle, refreshProfile } = useAuth()

  const [mode, setMode] = useState<GameAudioMode>('sound-effects')
  const [isModeDropdownOpen, setIsModeDropdownOpen] = useState(false)
  const [prompt, setPrompt] = useState('')
  const [durationStep, setDurationStep] = useState<0 | 1 | 2>(0) // 0=Auto, 1=5s, 2=10s
  const [soundLoop, setSoundLoop] = useState(false)
  const [soundTempo, setSoundTempo] = useState<string>('')
  const [soundKey, setSoundKey] = useState<SoundKey>('Any')
  const [showAdvanced, setShowAdvanced] = useState(false)

  // Grid & toolbar states
  const [selectMultiple, setSelectMultiple] = useState(false)
  const [selectedIds, setSelectedIds] = useState<string[]>([])
  const [filterMode, setFilterMode] = useState<'all' | 'favorites' | GameAudioMode>('all')
  const [isFilterOpen, setIsFilterOpen] = useState(false)
  const [favorites, setFavorites] = useState<string[]>([])
  const [userTracks, setUserTracks] = useState<GeneratedTrackItem[]>([])

  // Task polling states
  const [isGenerating, setIsGenerating] = useState(false)
  const [statusMessage, setStatusMessage] = useState<string | null>(null)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  const dropdownRef = useRef<HTMLDivElement | null>(null)
  const filterRef = useRef<HTMLDivElement | null>(null)

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

  // Close dropdowns on outside click
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setIsModeDropdownOpen(false)
      }
      if (
        filterRef.current &&
        !filterRef.current.contains(event.target as Node)
      ) {
        setIsFilterOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

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
      setMode(custom.detail.mode)
      setPrompt(custom.detail.prompt)
      setSoundLoop(custom.detail.soundLoop)
      if (custom.detail.soundTempo) {
        setSoundTempo(String(custom.detail.soundTempo))
      } else {
        setSoundTempo('')
      }
      if (custom.detail.soundKey) {
        setSoundKey(custom.detail.soundKey)
      }
      if (custom.detail.durationHint === '5') setDurationStep(1)
      else if (custom.detail.durationHint === '10') setDurationStep(2)
      else setDurationStep(0)
    }
    window.addEventListener('enb:load-game-sound-preset', handleLoadPreset)
    return () =>
      window.removeEventListener('enb:load-game-sound-preset', handleLoadPreset)
  }, [])

  const handleSelectMode = (nextMode: GameAudioMode) => {
    setMode(nextMode)
    setIsModeDropdownOpen(false)
    const found = MODES.find((m) => m.id === nextMode)
    if (found) {
      setSoundLoop(found.defaultLoop)
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

  const toggleSelectTrack = (trackId: string) => {
    setSelectedIds((prev) =>
      prev.includes(trackId)
        ? prev.filter((id) => id !== trackId)
        : [...prev, trackId]
    )
  }

  const durationHint: DurationHint =
    durationStep === 1 ? '5' : durationStep === 2 ? '10' : 'auto'

  const handleGenerate = async () => {
    setErrorMessage(null)

    if (!prompt.trim()) {
      setErrorMessage(t('errors.emptyPrompt'))
      return
    }

    if (!user) {
      await signInWithGoogle()
      return
    }

    setIsGenerating(true)
    setStatusMessage(t('status.submitting'))

    try {
      const {
        data: { session },
      } = await supabase.auth.getSession()
      const token = session?.access_token
      if (!token) {
        setErrorMessage(t('errors.authRequired'))
        setIsGenerating(false)
        setStatusMessage(null)
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
          soundLoop,
          soundTempo: soundTempo ? Number(soundTempo) : undefined,
          soundKey,
        }),
      })

      const data = await response.json()

      if (!response.ok || !data.taskId) {
        if (response.status === 402) {
          setErrorMessage(t('errors.insufficientCredits'))
        } else {
          setErrorMessage(data.message || data.error || t('errors.failed'))
        }
        setIsGenerating(false)
        setStatusMessage(null)
        return
      }

      await refreshProfile()
      const taskId: string = data.taskId
      setStatusMessage(t('status.generating'))

      // Poll task-status every 4s up to 45 times (3 minutes)
      for (let attempt = 0; attempt < 45; attempt++) {
        await new Promise((r) => setTimeout(r, 4000))
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
              title: `${t(`modes.${mode}.label`)} #${idx + 1}`,
              prompt: prompt.trim(),
              mode,
              soundLoop,
              soundTempo: soundTempo ? Number(soundTempo) : undefined,
              soundKey,
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
          setStatusMessage(null)
          return
        }

        if (pollData.status === 'failed') {
          setErrorMessage(pollData.error || t('errors.failed'))
          await refreshProfile()
          setIsGenerating(false)
          setStatusMessage(null)
          return
        }
      }

      setErrorMessage(t('errors.timeout'))
    } catch (err: unknown) {
      setErrorMessage(
        err instanceof Error ? err.message : t('errors.failed')
      )
    } finally {
      setIsGenerating(false)
      setStatusMessage(null)
    }
  }

  // Merge user-generated tracks with preloaded showcase tracks
  const showcaseAsTracks: GeneratedTrackItem[] = showcaseTracks.map((item) => ({
    id: item.id,
    taskId: item.id,
    title: item.title,
    prompt: item.prompt,
    mode: item.mode,
    soundLoop: item.soundLoop,
    soundTempo: item.soundTempo,
    soundKey: item.soundKey,
    duration: item.duration,
    audioUrl: item.audioUrl,
    createdAt: '',
    isShowcase: true,
  }))

  const allTracks = [...userTracks, ...showcaseAsTracks]

  const filteredTracks = allTracks.filter((track) => {
    if (filterMode === 'all') return true
    if (filterMode === 'favorites') return favorites.includes(track.id)
    return track.mode === filterMode
  })

  return (
    <div
      id="generator"
      className="overflow-hidden rounded-3xl border border-slate-800/80 bg-white shadow-[0_28px_80px_rgba(15,23,42,0.18)]"
    >
      {/* Top Purple-Blue Gradient Header Banner (Ludo Reference) */}
      <div className="bg-gradient-to-r from-[#5B3DF5] via-[#6E44FF] to-[#3B68F7] px-6 py-5 text-white sm:px-8">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3.5">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-white/15 backdrop-blur-sm">
              <ModeIcon mode="sound-effects" className="h-6 w-6 text-white" />
            </div>
            <div>
              <h2 className="text-xl font-bold tracking-tight sm:text-2xl">
                {t('headerTitle')}
              </h2>
              <p className="text-xs text-indigo-100 sm:text-sm">
                {t('headerSubtitle')}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2.5 text-xs font-medium text-indigo-100">
            <span className="rounded-full bg-white/15 px-3 py-1 backdrop-blur-sm">
              {t('creditBadge')}
            </span>
            {user && profile && (
              <span className="rounded-full bg-amber-400/20 px-3 py-1 text-amber-200 ring-1 ring-amber-300/40">
                💎 {profile.credits ?? 0}
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Dark Navy 3-Column Workbench Section */}
      <div className="bg-[#15192B] px-6 py-7 text-slate-100 sm:px-8">
        <div className="grid gap-6 lg:grid-cols-[1.05fr_1.55fr_1fr]">
          {/* Column 1: Generation Mode Dropdown */}
          <div className="flex flex-col justify-between">
            <div ref={dropdownRef} className="relative">
              <label className="mb-2.5 block text-sm font-semibold text-slate-200">
                {t('generationModeLabel')}
              </label>

              <button
                type="button"
                onClick={() => setIsModeDropdownOpen((v) => !v)}
                aria-expanded={isModeDropdownOpen}
                className="flex w-full items-start justify-between gap-3 rounded-xl border border-[#313856] bg-[#222842] p-4 text-left transition hover:border-indigo-400/70 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                <div className="flex items-start gap-3">
                  <div className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-indigo-500/20 text-indigo-300">
                    <ModeIcon mode={mode} className="h-5 w-5" />
                  </div>
                  <div>
                    <div className="text-sm font-semibold text-white">
                      {t(`modes.${mode}.label`)}
                    </div>
                    <p className="mt-0.5 text-xs leading-relaxed text-slate-300">
                      {t(`modes.${mode}.description`)}
                    </p>
                  </div>
                </div>
                <svg
                  className={`mt-1 h-4 w-4 shrink-0 text-slate-400 transition-transform ${
                    isModeDropdownOpen ? 'rotate-180' : ''
                  }`}
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth={2}
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M19 9l-7 7-7-7"
                  />
                </svg>
              </button>

              {/* 8-Mode Dropdown Menu */}
              {isModeDropdownOpen && (
                <div className="absolute left-0 right-0 top-full z-30 mt-2 max-h-[380px] overflow-y-auto rounded-xl border border-[#363E61] bg-[#1E243B] p-1.5 shadow-2xl">
                  {MODES.map((item) => {
                    const active = item.id === mode
                    return (
                      <button
                        key={item.id}
                        type="button"
                        onClick={() => handleSelectMode(item.id)}
                        className={`flex w-full items-start gap-3 rounded-lg p-3 text-left transition ${
                          active
                            ? 'bg-indigo-600/30 text-white ring-1 ring-indigo-400/50'
                            : 'text-slate-200 hover:bg-[#28304E]'
                        }`}
                      >
                        <div
                          className={`mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ${
                            active
                              ? 'bg-indigo-500 text-white'
                              : 'bg-[#2B3353] text-indigo-300'
                          }`}
                        >
                          <ModeIcon mode={item.id} className="h-4 w-4" />
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="text-sm font-semibold">
                            {t(`modes.${item.id}.label`)}
                          </div>
                          <p className="mt-0.5 text-xs leading-snug text-slate-300">
                            {t(`modes.${item.id}.description`)}
                          </p>
                        </div>
                      </button>
                    )
                  })}
                </div>
              )}
            </div>

            <div className="mt-4 flex items-center justify-between pt-2">
              <a
                href="#how-title"
                className="inline-flex items-center gap-1.5 text-xs font-medium text-slate-300 transition hover:text-white"
              >
                <span className="flex h-4 w-4 items-center justify-center rounded-full border border-slate-400 text-[10px]">
                  ?
                </span>
                {t('howItWorksLink')}
              </a>

              <button
                type="button"
                onClick={() => setShowAdvanced((v) => !v)}
                className="text-xs font-medium text-indigo-300 hover:text-indigo-200"
              >
                {showAdvanced ? t('hideMusicalControls') : t('showMusicalControls')}
              </button>
            </div>
          </div>

          {/* Column 2: Description Textarea + Quick Chips */}
          <div>
            <div className="mb-2.5 flex items-center justify-between">
              <label
                htmlFor="game-sound-description"
                className="text-sm font-semibold text-slate-200"
              >
                {t('descriptionLabel')}
              </label>
              <span className="text-xs text-slate-400">
                {prompt.length}/500
              </span>
            </div>

            <textarea
              id="game-sound-description"
              rows={4}
              maxLength={500}
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder={t(`modes.${mode}.placeholder`)}
              className="w-full resize-none rounded-xl border border-[#313856] bg-[#222842] p-4 text-sm text-white placeholder-slate-400 transition focus:border-indigo-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/50"
            />

            {/* Quick Idea Chips */}
            <div className="mt-2.5 flex flex-wrap items-center gap-1.5">
              <span className="mr-1 text-[11px] font-medium text-slate-400">
                {t('quickPromptsLabel')}
              </span>
              {showcaseTracks.slice(0, 3).map((sample) => (
                <button
                  key={sample.id}
                  type="button"
                  onClick={() => {
                    setMode(sample.mode)
                    setPrompt(sample.prompt)
                    setSoundLoop(sample.soundLoop)
                  }}
                  className="rounded-lg border border-[#313856] bg-[#1E243B] px-2.5 py-1 text-[11px] text-slate-300 transition hover:border-indigo-400 hover:text-white"
                >
                  {sample.title}
                </button>
              ))}
            </div>
          </div>

          {/* Column 3: Duration Slider + Loop Toggle (+ Optional Tempo/Key) */}
          <div className="flex flex-col justify-between space-y-5 rounded-xl border border-[#2A314D] bg-[#1B2035] p-4">
            {/* Duration (seconds) Slider: Auto / 5s / 10s */}
            <div>
              <div className="mb-2 flex items-center justify-between">
                <label
                  htmlFor="game-sound-duration"
                  className="text-sm font-semibold text-slate-200"
                >
                  {t('durationLabel')}
                </label>
                <span className="rounded bg-indigo-500/20 px-2 py-0.5 text-xs font-semibold text-indigo-300">
                  {durationStep === 0
                    ? t('durationAuto')
                    : durationStep === 1
                    ? '5s'
                    : '10s'}
                </span>
              </div>
              <input
                id="game-sound-duration"
                type="range"
                min={0}
                max={2}
                step={1}
                value={durationStep}
                onChange={(e) =>
                  setDurationStep(Number(e.target.value) as 0 | 1 | 2)
                }
                className="h-2 w-full cursor-pointer appearance-none rounded-lg bg-[#2E3654] accent-[#6E44FF]"
              />
              <div className="mt-1.5 flex justify-between text-xs font-medium text-slate-400">
                <button
                  type="button"
                  onClick={() => setDurationStep(0)}
                  className={
                    durationStep === 0 ? 'font-semibold text-white' : ''
                  }
                >
                  {t('durationAuto')}
                </button>
                <button
                  type="button"
                  onClick={() => setDurationStep(1)}
                  className={
                    durationStep === 1 ? 'font-semibold text-white' : ''
                  }
                >
                  5s
                </button>
                <button
                  type="button"
                  onClick={() => setDurationStep(2)}
                  className={
                    durationStep === 2 ? 'font-semibold text-white' : ''
                  }
                >
                  10s
                </button>
              </div>
            </div>

            {/* Loop Switch: Off / On */}
            <div>
              <label className="mb-2 block text-sm font-semibold text-slate-200">
                {t('loopLabel')}
              </label>
              <div className="flex items-center gap-3">
                <span
                  className={`text-xs font-medium ${
                    !soundLoop ? 'text-white' : 'text-slate-400'
                  }`}
                >
                  {t('loopOff')}
                </span>
                <button
                  type="button"
                  role="switch"
                  aria-checked={soundLoop}
                  onClick={() => setSoundLoop((v) => !v)}
                  className={`relative inline-flex h-6 w-12 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out ${
                    soundLoop ? 'bg-[#6E44FF]' : 'bg-[#313856]'
                  }`}
                >
                  <span
                    className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                      soundLoop ? 'translate-x-6' : 'translate-x-0'
                    }`}
                  />
                </button>
                <span
                  className={`text-xs font-medium ${
                    soundLoop ? 'text-white' : 'text-slate-400'
                  }`}
                >
                  {t('loopOn')}
                </span>
              </div>
            </div>

            {/* Optional Tempo & Key Controls */}
            {showAdvanced && (
              <div className="grid grid-cols-2 gap-3 border-t border-[#2E3654] pt-3">
                <div>
                  <label className="mb-1 block text-xs font-medium text-slate-300">
                    {t('tempoLabel')}
                  </label>
                  <input
                    type="number"
                    min={40}
                    max={240}
                    placeholder={t('durationAuto')}
                    value={soundTempo}
                    onChange={(e) => setSoundTempo(e.target.value)}
                    className="w-full rounded-lg border border-[#313856] bg-[#222842] px-2.5 py-1.5 text-xs text-white placeholder-slate-400 focus:border-indigo-400 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-xs font-medium text-slate-300">
                    {t('keyLabel')}
                  </label>
                  <select
                    value={soundKey}
                    onChange={(e) => setSoundKey(e.target.value as SoundKey)}
                    className="w-full rounded-lg border border-[#313856] bg-[#222842] px-2.5 py-1.5 text-xs text-white focus:border-indigo-400 focus:outline-none"
                  >
                    {MUSICAL_KEYS.map((k) => (
                      <option key={k} value={k}>
                        {k}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* White Action Bar, Pro Tips Banner & Audio Grid */}
      <div className="bg-white px-6 py-6 sm:px-8">
        {/* Toolbar Row: Select Multiple + Filter Grid + Centered Generate Button */}
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex flex-wrap items-center gap-2.5">
            <button
              type="button"
              onClick={() => {
                setSelectMultiple((v) => !v)
                setSelectedIds([])
              }}
              className={`inline-flex items-center gap-2 rounded-lg border px-3.5 py-2 text-xs font-semibold transition ${
                selectMultiple
                  ? 'border-indigo-600 bg-indigo-50 text-indigo-700'
                  : 'border-indigo-200 bg-white text-indigo-700 hover:bg-indigo-50/60'
              }`}
            >
              <svg
                className="h-4 w-4"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth={2}
              >
                <rect x="3" y="3" width="18" height="18" rx="2" />
                <path d="M9 12l2 2 4-4" />
              </svg>
              {t('selectMultiple')}
              {selectMultiple && selectedIds.length > 0 && (
                <span className="rounded-full bg-indigo-600 px-1.5 py-0.2 text-[10px] text-white">
                  {selectedIds.length}
                </span>
              )}
            </button>

            {/* Filter Grid Dropdown */}
            <div ref={filterRef} className="relative">
              <button
                type="button"
                onClick={() => setIsFilterOpen((v) => !v)}
                className="inline-flex items-center gap-2 rounded-lg border border-indigo-200 bg-white px-3.5 py-2 text-xs font-semibold text-indigo-700 transition hover:bg-indigo-50/60"
              >
                <svg
                  className="h-4 w-4"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth={2}
                >
                  <polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3" />
                </svg>
                {t('filterGrid')}
                {filterMode !== 'all' && (
                  <span className="rounded bg-indigo-100 px-1.5 py-0.5 text-[10px] text-indigo-800">
                    {filterMode === 'favorites'
                      ? t('filterFavorites')
                      : t(`modes.${filterMode}.label`)}
                  </span>
                )}
              </button>

              {isFilterOpen && (
                <div className="absolute left-0 top-full z-20 mt-1.5 w-52 rounded-xl border border-slate-200 bg-white p-1.5 shadow-xl">
                  <button
                    type="button"
                    onClick={() => {
                      setFilterMode('all')
                      setIsFilterOpen(false)
                    }}
                    className={`flex w-full items-center justify-between rounded-lg px-3 py-2 text-left text-xs font-medium ${
                      filterMode === 'all'
                        ? 'bg-indigo-50 text-indigo-700'
                        : 'text-slate-700 hover:bg-slate-50'
                    }`}
                  >
                    <span>{t('filterAll')}</span>
                    <span className="text-[11px] text-slate-400">
                      {allTracks.length}
                    </span>
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setFilterMode('favorites')
                      setIsFilterOpen(false)
                    }}
                    className={`flex w-full items-center justify-between rounded-lg px-3 py-2 text-left text-xs font-medium ${
                      filterMode === 'favorites'
                        ? 'bg-indigo-50 text-indigo-700'
                        : 'text-slate-700 hover:bg-slate-50'
                    }`}
                  >
                    <span>♥ {t('filterFavorites')}</span>
                    <span className="text-[11px] text-slate-400">
                      {favorites.length}
                    </span>
                  </button>
                  <div className="my-1 border-t border-slate-100" />
                  {MODES.map((m) => (
                    <button
                      key={m.id}
                      type="button"
                      onClick={() => {
                        setFilterMode(m.id)
                        setIsFilterOpen(false)
                      }}
                      className={`flex w-full items-center justify-between rounded-lg px-3 py-1.5 text-left text-xs ${
                        filterMode === m.id
                          ? 'bg-indigo-50 font-semibold text-indigo-700'
                          : 'text-slate-600 hover:bg-slate-50'
                      }`}
                    >
                      <span>{t(`modes.${m.id}.label`)}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Primary Generate Button */}
          <button
            type="button"
            disabled={isGenerating}
            onClick={handleGenerate}
            className="inline-flex items-center justify-center gap-2.5 rounded-xl bg-gradient-to-r from-[#5B3DF5] via-[#6E44FF] to-[#3B68F7] px-7 py-3 text-sm font-semibold text-white shadow-md transition hover:opacity-95 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isGenerating ? (
              <>
                <span className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                <span>{statusMessage || t('status.generating')}</span>
              </>
            ) : (
              <>
                <ModeIcon mode={mode} className="h-4 w-4 text-white" />
                <span>
                  {t('generateButtonPrefix')} {t(`modes.${mode}.label`)}
                </span>
              </>
            )}
          </button>

          <div className="hidden text-xs text-slate-400 lg:block">
            {t('variationNote')}
          </div>
        </div>

        {/* Status or Error Banner */}
        {errorMessage && (
          <div className="mt-4 flex flex-wrap items-center justify-between gap-3 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-xs text-red-700">
            <span>{errorMessage}</span>
            <Link
              href="/pricing"
              className="font-semibold underline hover:no-underline"
            >
              {t('getMoreCredits')}
            </Link>
          </div>
        )}

        {/* Audio Generator Pro Tips Banner (Ludo Reference) */}
        <div className="mt-5 flex items-center gap-3 rounded-xl border border-indigo-100 bg-[#F3F0FF] px-4 py-3 text-xs text-indigo-950">
          <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-indigo-600/15 text-indigo-700">
            💡
          </span>
          <p className="leading-relaxed">
            <strong className="font-semibold">{t('proTipTitle')}</strong>{' '}
            {t('proTipText')}
          </p>
        </div>

        {/* Audio Results Grid */}
        {filteredTracks.length === 0 ? (
          <div className="mt-8 flex flex-col items-center justify-center rounded-2xl border border-dashed border-slate-200 py-14 text-center">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-indigo-50 text-indigo-500">
              <ModeIcon mode={mode} className="h-6 w-6" />
            </div>
            <h3 className="mt-3 text-base font-semibold text-slate-800">
              {t('emptyTitle')}
            </h3>
            <p className="mt-1 max-w-md text-xs text-slate-500">
              {t('emptySubtitle')}
            </p>
          </div>
        ) : (
          <div className="mt-6 grid gap-4 md:grid-cols-2">
            {filteredTracks.map((track) => {
              const isFav = favorites.includes(track.id)
              const isSelected = selectedIds.includes(track.id)
              return (
                <div
                  key={track.id}
                  className={`flex flex-col justify-between rounded-2xl border p-4 transition ${
                    isSelected
                      ? 'border-indigo-500 bg-indigo-50/30 ring-2 ring-indigo-500/20'
                      : 'border-slate-200 bg-slate-50/60 hover:border-indigo-200'
                  }`}
                >
                  <div>
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-center gap-2.5">
                        {selectMultiple && (
                          <input
                            type="checkbox"
                            checked={isSelected}
                            onChange={() => toggleSelectTrack(track.id)}
                            className="h-4 w-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                          />
                        )}
                        <span className="inline-flex items-center gap-1.5 rounded-full bg-indigo-100 px-2.5 py-0.5 text-[11px] font-semibold text-indigo-800">
                          <ModeIcon mode={track.mode} className="h-3.5 w-3.5" />
                          {t(`modes.${track.mode}.label`)}
                        </span>
                        {track.soundLoop && (
                          <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-semibold text-emerald-800">
                            🔁 {t('loopBadge')}
                          </span>
                        )}
                        {track.isShowcase && (
                          <span className="rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-semibold text-amber-900">
                            {t('presetBadge')}
                          </span>
                        )}
                      </div>

                      <div className="flex items-center gap-1.5">
                        <button
                          type="button"
                          onClick={() => toggleFavorite(track.id)}
                          aria-label={t('favoriteAria')}
                          className={`rounded-lg p-1.5 transition ${
                            isFav
                              ? 'bg-rose-50 text-rose-600'
                              : 'text-slate-400 hover:bg-slate-200/60 hover:text-slate-600'
                          }`}
                        >
                          <svg
                            className="h-4 w-4"
                            viewBox="0 0 24 24"
                            fill={isFav ? 'currentColor' : 'none'}
                            stroke="currentColor"
                            strokeWidth={2}
                          >
                            <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
                          </svg>
                        </button>

                        <a
                          href={track.audioUrl}
                          download={`${track.id}.mp3`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="rounded-lg p-1.5 text-slate-500 transition hover:bg-slate-200/60 hover:text-slate-800"
                          title={t('downloadMp3')}
                        >
                          <svg
                            className="h-4 w-4"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth={2}
                          >
                            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                            <polyline points="7 10 12 15 17 10" />
                            <line x1="12" y1="15" x2="12" y2="3" />
                          </svg>
                        </a>
                      </div>
                    </div>

                    <h3 className="mt-2.5 text-sm font-semibold text-slate-900">
                      {track.title}
                    </h3>
                    <p className="mt-1 line-clamp-2 text-xs text-slate-600">
                      {track.prompt}
                    </p>
                  </div>

                  <div className="mt-3.5 pt-2">
                    <audio
                      controls
                      loop={track.soundLoop}
                      preload="metadata"
                      src={track.audioUrl}
                      className="h-9 w-full"
                    />
                    <div className="mt-2 flex items-center justify-between text-[11px] text-slate-500">
                      <span>
                        {track.duration ? `${track.duration}s` : 'MP3'}
                        {track.soundTempo ? ` · ${track.soundTempo} BPM` : ''}
                        {track.soundKey && track.soundKey !== 'Any'
                          ? ` · Key ${track.soundKey}`
                          : ''}
                      </span>
                      <button
                        type="button"
                        onClick={() => {
                          setMode(track.mode)
                          setPrompt(track.prompt)
                          setSoundLoop(track.soundLoop)
                        }}
                        className="font-semibold text-indigo-600 hover:text-indigo-800"
                      >
                        {t('reuseSettings')}
                      </button>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
