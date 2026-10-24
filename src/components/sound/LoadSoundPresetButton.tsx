'use client'

import type {
  GameAudioMode,
  DurationHint,
  SoundKey,
} from '@/lib/kie-api/kie-sound-service'

interface LoadSoundPresetButtonProps {
  label: string
  prompt: string
  mode: GameAudioMode
  soundLoop: boolean
  soundTempo?: number
  soundKey?: SoundKey
  durationHint?: DurationHint
}

export default function LoadSoundPresetButton({
  label,
  prompt,
  mode,
  soundLoop,
  soundTempo,
  soundKey,
  durationHint,
}: LoadSoundPresetButtonProps) {
  const handleClick = () => {
    if (typeof window !== 'undefined') {
      window.dispatchEvent(
        new CustomEvent('enb:load-game-sound-preset', {
          detail: {
            prompt,
            mode,
            soundLoop,
            soundTempo,
            soundKey,
            durationHint,
          },
        })
      )
      const el = document.getElementById('generator')
      if (el) {
        el.scrollIntoView({ behavior: 'smooth', block: 'start' })
      }
    }
  }

  return (
    <button
      type="button"
      onClick={handleClick}
      className="rounded-lg border border-slate-300 bg-slate-900 px-3.5 py-2 text-xs font-semibold text-white transition hover:bg-slate-800"
    >
      {label}
    </button>
  )
}
