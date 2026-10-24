'use client'

import { useTranslations } from 'next-intl'
import type {
  GameAudioMode,
  DurationHint,
  SoundKey,
} from '@/lib/kie-api/kie-sound-service'
import TrackCard, { type GeneratedTrackItem } from './TrackCard'
import { ModeIcon } from './ModeTabs'

export type ResultsTab = 'session' | 'favorites' | 'examples'

interface ResultsPanelProps {
  activeTab: ResultsTab
  onChangeTab: (tab: ResultsTab) => void
  userTracks: GeneratedTrackItem[]
  showcaseTracks: GeneratedTrackItem[]
  favorites: string[]
  onToggleFavorite: (id: string) => void
  onUsePrompt: (preset: {
    prompt: string
    mode: GameAudioMode
    soundLoop: boolean
    soundTempo?: number
    soundKey?: SoundKey
    durationHint?: DurationHint
  }) => void
  isGenerating: boolean
  generationStage: 'queued' | 'generating' | 'finalizing'
  onCancelGeneration: () => void
  mode: GameAudioMode
}

export default function ResultsPanel({
  activeTab,
  onChangeTab,
  userTracks,
  showcaseTracks,
  favorites,
  onToggleFavorite,
  onUsePrompt,
  isGenerating,
  generationStage,
  onCancelGeneration,
  mode,
}: ResultsPanelProps) {
  const t = useTranslations('gameSoundGenerator.workbench')

  const allTracks = [...userTracks, ...showcaseTracks]
  const favoriteTracks = allTracks.filter((tr) => favorites.includes(tr.id))

  const tabs: Array<{ id: ResultsTab; label: string; count: number }> = [
    { id: 'session', label: t('tabs.session'), count: userTracks.length },
    {
      id: 'favorites',
      label: t('tabs.favorites'),
      count: favoriteTracks.length,
    },
    { id: 'examples', label: t('tabs.examples'), count: showcaseTracks.length },
  ]

  const stageLabel =
    generationStage === 'queued'
      ? t('status.stageQueued')
      : generationStage === 'finalizing'
      ? t('status.stageFinalizing')
      : t('status.stageGenerating')

  return (
    <div className="flex flex-col">
      {/* Top Tab Bar: This session / Favorites / Examples */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 pb-3.5">
        <div
          role="tablist"
          aria-label={t('resultsHeading')}
          className="inline-flex rounded-xl border border-slate-200 bg-slate-100 p-1"
        >
          {tabs.map((tab) => {
            const selected = activeTab === tab.id
            return (
              <button
                key={tab.id}
                type="button"
                role="tab"
                aria-selected={selected}
                onClick={() => onChangeTab(tab.id)}
                className={`inline-flex items-center gap-1.5 rounded-lg px-3.5 py-1.5 text-xs font-semibold transition ${
                  selected
                    ? 'bg-white text-slate-900 shadow-sm'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <span>{tab.label}</span>
                <span
                  className={`rounded-full px-1.5 py-0.5 text-[11px] ${
                    selected
                      ? 'bg-slate-900 text-white'
                      : 'bg-slate-200/80 text-slate-700'
                  }`}
                >
                  {tab.count}
                </span>
              </button>
            )
          })}
        </div>

        <span className="text-xs font-medium text-slate-600">
          {t('variationNote')}
        </span>
      </div>

      {/* Generating Skeleton Cards + Progress Stages */}
      {isGenerating && (
        <div
          role="status"
          aria-live="polite"
          className="mt-4 rounded-2xl border border-slate-300 bg-slate-50 p-4"
        >
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-2.5">
              <span className="h-4 w-4 animate-spin rounded-full border-2 border-slate-900 border-t-transparent" />
              <span className="text-sm font-semibold text-slate-900">
                {stageLabel}
              </span>
              <span className="text-xs text-slate-600">
                ({t('status.estimatedWait')})
              </span>
            </div>
            <button
              type="button"
              onClick={onCancelGeneration}
              className="rounded-lg border border-slate-300 bg-white px-2.5 py-1 text-xs font-semibold text-slate-700 transition hover:bg-slate-100 hover:text-slate-900"
            >
              {t('cancelGeneration')}
            </button>
          </div>

          {/* 3-Step Stage Bar */}
          <div className="mt-3 grid grid-cols-3 gap-2 text-xs font-medium">
            {(['queued', 'generating', 'finalizing'] as const).map(
              (step, idx) => {
                const currentIdx =
                  generationStage === 'queued'
                    ? 0
                    : generationStage === 'generating'
                    ? 1
                    : 2
                const reached = idx <= currentIdx
                return (
                  <div key={step} className="flex flex-col gap-1">
                    <div
                      className={`h-1.5 rounded-full transition-colors ${
                        reached ? 'bg-slate-900' : 'bg-slate-200'
                      }`}
                    />
                    <span
                      className={
                        reached ? 'font-semibold text-slate-900' : 'text-slate-500'
                      }
                    >
                      {step === 'queued'
                        ? t('status.stepQueued')
                        : step === 'generating'
                        ? t('status.stepGenerating')
                        : t('status.stepFinalizing')}
                    </span>
                  </div>
                )
              }
            )}
          </div>

          {/* 2 Skeleton Variation Cards */}
          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            {[1, 2].map((variant) => (
              <div
                key={variant}
                className="animate-pulse rounded-xl border border-slate-200 bg-white p-3.5"
              >
                <div className="flex items-center justify-between">
                  <span className="h-5 w-24 rounded-full bg-slate-200" />
                  <span className="h-4 w-10 rounded bg-slate-200" />
                </div>
                <div className="mt-3 h-4 w-3/4 rounded bg-slate-200" />
                <div className="mt-2 h-3 w-full rounded bg-slate-100" />
                <div className="mt-3 h-9 w-full rounded-lg bg-slate-100" />
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Tab Content */}
      {activeTab === 'session' && (
        <div className="mt-4">
          {userTracks.length > 0 ? (
            <div className="grid gap-4">
              {userTracks.map((track) => (
                <TrackCard
                  key={track.id}
                  track={track}
                  isFavorite={favorites.includes(track.id)}
                  onToggleFavorite={onToggleFavorite}
                  onUsePrompt={onUsePrompt}
                />
              ))}
            </div>
          ) : (
            <div>
              {!isGenerating && (
                <div className="mb-4 rounded-2xl border border-dashed border-slate-300 bg-slate-50/70 p-4">
                  <div className="flex items-center gap-3">
                    <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-white text-slate-800 shadow-sm">
                      <ModeIcon mode={mode} className="h-5 w-5" />
                    </span>
                    <div>
                      <h3 className="text-sm font-semibold text-slate-900">
                        {t('emptySessionTitle')}
                      </h3>
                      <p className="text-xs text-slate-600">
                        {t('emptySessionSubtitle')}
                      </p>
                    </div>
                  </div>
                </div>
              )}

              <div className="mb-2.5 flex items-center justify-between">
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-600">
                  {t('tryExampleTitle')}
                </h3>
              </div>

              <div className="grid gap-4">
                {showcaseTracks.slice(0, 3).map((sample) => (
                  <TrackCard
                    key={sample.id}
                    track={sample}
                    isFavorite={favorites.includes(sample.id)}
                    onToggleFavorite={onToggleFavorite}
                    onUsePrompt={onUsePrompt}
                  />
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {activeTab === 'favorites' && (
        <div className="mt-4">
          {favoriteTracks.length > 0 ? (
            <div className="grid gap-4">
              {favoriteTracks.map((track) => (
                <TrackCard
                  key={track.id}
                  track={track}
                  isFavorite={true}
                  onToggleFavorite={onToggleFavorite}
                  onUsePrompt={onUsePrompt}
                />
              ))}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-slate-300 bg-slate-50/60 py-14 text-center">
              <span className="flex h-11 w-11 items-center justify-center rounded-full bg-white text-slate-700 shadow-sm">
                ♥
              </span>
              <h3 className="mt-3 text-sm font-semibold text-slate-900">
                {t('emptyFavoritesTitle')}
              </h3>
              <p className="mt-1 max-w-sm text-xs leading-relaxed text-slate-600">
                {t('emptyFavoritesSubtitle')}
              </p>
            </div>
          )}
        </div>
      )}

      {activeTab === 'examples' && (
        <div className="mt-4 grid gap-4">
          {showcaseTracks.map((sample) => (
            <TrackCard
              key={sample.id}
              track={sample}
              isFavorite={favorites.includes(sample.id)}
              onToggleFavorite={onToggleFavorite}
              onUsePrompt={onUsePrompt}
            />
          ))}
        </div>
      )}
    </div>
  )
}
