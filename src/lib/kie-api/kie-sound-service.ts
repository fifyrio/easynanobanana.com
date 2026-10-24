/**
 * KIE Game Sound & Music Generation Service (ai-music-api/sounds)
 *
 * Sibling to KIEImageService & KIEVideoService. Uses KIE's /api/v1/jobs
 * createTask and recordInfo endpoints with model `ai-music-api/sounds` (Suno V6 Sounds).
 *
 * Docs: https://docs.kie.ai/suno-api/generate-sounds
 */

import type { KIECreateTaskResponse } from './types'

export const SOUND_KEYS = [
  'Any',
  'Cm',
  'C#m',
  'Dm',
  'D#m',
  'Em',
  'Fm',
  'F#m',
  'Gm',
  'G#m',
  'Am',
  'A#m',
  'Bm',
  'C',
  'C#',
  'D',
  'D#',
  'E',
  'F',
  'F#',
  'G',
  'G#',
  'A',
  'A#',
  'B',
] as const

export type SoundKey = (typeof SOUND_KEYS)[number]

export type SoundModelVersion = 'V6' | 'V6_MINI' | 'V6_WILD'

export type GameAudioMode =
  | 'sound-effects'
  | 'ambiance-loops'
  | 'music'
  | 'audio-remix'
  | 'human-voice'
  | 'non-human-voice'
  | 'speech-clone'
  | 'speech-preset'

export const GAME_AUDIO_MODES: readonly GameAudioMode[] = [
  'sound-effects',
  'ambiance-loops',
  'music',
  'audio-remix',
  'human-voice',
  'non-human-voice',
  'speech-clone',
  'speech-preset',
] as const

export type DurationHint = 'auto' | '5' | '10'

export interface CreateSoundTaskOptions {
  /** User description of the sound or music (max 500 characters). */
  prompt: string
  /** Optional Ludo-style generation mode that shapes the prompt & defaults. */
  mode?: GameAudioMode
  /** Optional UI duration hint ('auto' | '5' | '10'). Note: KIE input does not take a duration field. */
  durationHint?: DurationHint
  /** Whether the generated sound loops seamlessly. */
  soundLoop?: boolean
  /** Tempo in BPM (1-300). Omit for automatic tempo. */
  soundTempo?: number
  /** Musical key (default 'Any'). */
  soundKey?: SoundKey
  /** Model version (default 'V6'). */
  modelVersion?: SoundModelVersion
  /** Whether to capture lyrics subtitles (default false). */
  grabLyrics?: boolean
}

export interface KIESoundClip {
  id: string
  audio_url: string
  stream_audio_url?: string
  image_url?: string
  duration?: number
  title?: string
  tags?: string
  prompt?: string
  createTime?: number
  model_name?: string
}

export interface KIESoundTaskDetails {
  taskId: string
  model: string
  state: 'waiting' | 'queuing' | 'generating' | 'success' | 'fail' | 'failed'
  resultJson?: string
  failCode?: string | null
  failMsg?: string | null
  costTime?: number
  completeTime?: number
  createTime?: number
  creditsConsumed?: number
  consumeCredits?: number
  response?: {
    code?: number
    msg?: string
    task_id?: string
    data?: KIESoundClip[]
  }
}

export interface KIESoundTaskDetailsResponse {
  code: number
  msg?: string
  message?: string
  data: KIESoundTaskDetails
}

export interface NormalizedSoundClip {
  id: string
  audioUrl: string
  streamAudioUrl?: string
  imageUrl?: string
  duration?: number
  title?: string
  tags?: string
}

export interface KIESoundServiceConfig {
  apiToken?: string
  baseUrl?: string
  callbackUrl?: string
}

const KIE_SOUNDS_MODEL = 'ai-music-api/sounds'
const KIE_JOBS_BASE_URL = 'https://api.kie.ai/api/v1/jobs'
const MAX_PROMPT_LENGTH = 500

const MODE_PREFIXES: Record<GameAudioMode, string> = {
  'sound-effects':
    'Game sound effect asset, crisp foley and impact transients, clean isolation, no vocals, no speech: ',
  'ambiance-loops':
    'Seamless looping game environmental ambiance soundscape, steady atmospheric texture, no abrupt start or ending, no vocals, no speech: ',
  music:
    'Instrumental video game soundtrack music, rich arrangement, clear mix, no vocals, no speech: ',
  'audio-remix':
    'Creative game audio remix variation, layered rhythmic and tonal motifs, dynamic game-ready texture, no vocals: ',
  'human-voice':
    'Game character voice acting cue, expressive vocal delivery and character persona: ',
  'non-human-voice':
    'Stylized non-human game creature / robotic / sci-fi entity vocalization and synthetic speech texture: ',
  'speech-clone':
    'Consistent game dialogue voice sample with clear articulation and studio voice-over tone: ',
  'speech-preset':
    'Polished game narrator and NPC preset voice-over cue, clean broadcast studio clarity: ',
}

const DURATION_CUES: Record<DurationHint, string> = {
  auto: '',
  '5': ' Concise ~5-second cue.',
  '10': ' Compact ~10-second phrase.',
}

/**
 * Composes a mode-aware prompt while strictly respecting KIE's 500-character limit.
 */
export function buildGameSoundPrompt(
  rawPrompt: string,
  mode: GameAudioMode = 'sound-effects',
  durationHint: DurationHint = 'auto'
): string {
  const cleaned = rawPrompt.trim().replace(/\s+/g, ' ')
  if (!cleaned) {
    throw new Error('Prompt is required')
  }

  const prefix = MODE_PREFIXES[mode] || ''
  const suffix = DURATION_CUES[durationHint] || ''

  // Avoid duplicating prefix if caller already supplied a full technical prompt
  const lower = cleaned.toLowerCase()
  const alreadyDetailed =
    lower.startsWith('instrumental') ||
    lower.startsWith('game sound') ||
    lower.startsWith('seamless looping')

  const combined = alreadyDetailed
    ? `${cleaned}${suffix}`
    : `${prefix}${cleaned}${suffix}`

  if (combined.length <= MAX_PROMPT_LENGTH) {
    return combined
  }

  return combined.slice(0, MAX_PROMPT_LENGTH).trim()
}

export interface SoundProvider {
  createTask(options: CreateSoundTaskOptions): Promise<{
    taskId: string
    effectivePrompt: string
  }>
  getTaskStatus(taskId: string): Promise<{
    state: KIESoundTaskDetails['state']
    clips: NormalizedSoundClip[]
    failMsg?: string
    creditsConsumed?: number
    costTime?: number
  }>
}

export class KIESoundService implements SoundProvider {
  private apiToken: string
  private baseUrl: string
  private callbackUrl: string

  constructor(config?: KIESoundServiceConfig) {
    this.apiToken =
      config?.apiToken ||
      process.env.KIE_API_TOKEN ||
      process.env.KIE_API_KEY ||
      ''
    this.baseUrl = config?.baseUrl || KIE_JOBS_BASE_URL
    this.callbackUrl = config?.callbackUrl || ''
  }

  async createTask(options: CreateSoundTaskOptions): Promise<{
    taskId: string
    effectivePrompt: string
  }> {
    return this.createSoundTask(options)
  }

  async createSoundTask(options: CreateSoundTaskOptions): Promise<{
    taskId: string
    effectivePrompt: string
  }> {
    if (!this.apiToken) {
      throw new Error('KIE_API_TOKEN is required to create a sound task')
    }

    const mode = options.mode || 'sound-effects'
    const durationHint = options.durationHint || 'auto'
    const effectivePrompt = buildGameSoundPrompt(
      options.prompt,
      mode,
      durationHint
    )

    const soundLoop =
      typeof options.soundLoop === 'boolean'
        ? options.soundLoop
        : mode === 'ambiance-loops' || mode === 'music'

    const soundKey: SoundKey =
      options.soundKey && SOUND_KEYS.includes(options.soundKey)
        ? options.soundKey
        : 'Any'

    const input: Record<string, unknown> = {
      prompt: effectivePrompt,
      model: options.modelVersion || 'V6',
      sound_loop: soundLoop,
      sound_key: soundKey,
      grab_lyrics: Boolean(options.grabLyrics ?? false),
    }

    if (
      typeof options.soundTempo === 'number' &&
      Number.isFinite(options.soundTempo) &&
      options.soundTempo >= 1 &&
      options.soundTempo <= 300
    ) {
      input.sound_tempo = Math.round(options.soundTempo)
    }

    const requestBody: Record<string, unknown> = {
      model: KIE_SOUNDS_MODEL,
      input,
    }

    if (this.callbackUrl) {
      requestBody.callBackUrl = this.callbackUrl
    }

    const response = await fetch(`${this.baseUrl}/createTask`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${this.apiToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(requestBody),
    })

    if (!response.ok) {
      const errorText = await response.text()
      throw new Error(
        `KIE API request failed (${response.status}): ${errorText}`
      )
    }

    const data: KIECreateTaskResponse = await response.json()
    const apiMessage = data.message || data.msg || 'Unknown error'

    if (data.code !== 200 || !data.data?.taskId) {
      throw new Error(`KIE API error (code ${data.code}): ${apiMessage}`)
    }

    return {
      taskId: data.data.taskId,
      effectivePrompt,
    }
  }

  async getTaskStatus(taskId: string): Promise<{
    state: KIESoundTaskDetails['state']
    clips: NormalizedSoundClip[]
    failMsg?: string
    creditsConsumed?: number
    costTime?: number
  }> {
    if (!this.apiToken) {
      throw new Error('KIE_API_TOKEN is required to check sound task status')
    }

    const response = await fetch(
      `${this.baseUrl}/recordInfo?taskId=${encodeURIComponent(taskId)}`,
      {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${this.apiToken}`,
        },
        cache: 'no-store',
      }
    )

    if (!response.ok) {
      const errorText = await response.text()
      throw new Error(
        `KIE recordInfo failed (${response.status}): ${errorText}`
      )
    }

    const payload: KIESoundTaskDetailsResponse = await response.json()
    const apiMessage = payload.msg || payload.message || 'Unknown error'

    if (payload.code !== 200 || !payload.data) {
      throw new Error(`KIE API error (code ${payload.code}): ${apiMessage}`)
    }

    const details = payload.data
    const rawClips = KIESoundService.extractClips(details)

    return {
      state: details.state,
      clips: rawClips,
      failMsg: details.failMsg || undefined,
      creditsConsumed: details.creditsConsumed ?? details.consumeCredits,
      costTime: details.costTime,
    }
  }

  static extractClips(details: KIESoundTaskDetails): NormalizedSoundClip[] {
    let items: KIESoundClip[] = []

    if (Array.isArray(details.response?.data)) {
      items = details.response!.data!
    } else if (details.resultJson) {
      try {
        const parsed = JSON.parse(details.resultJson)
        if (Array.isArray(parsed?.data)) {
          items = parsed.data
        } else if (Array.isArray(parsed)) {
          items = parsed
        }
      } catch {
        // Ignore malformed resultJson
      }
    }

    return items
      .filter((item) => Boolean(item && (item.audio_url || item.stream_audio_url)))
      .map((item, idx) => ({
        id: item.id || `${details.taskId}-${idx + 1}`,
        audioUrl: item.audio_url || item.stream_audio_url || '',
        streamAudioUrl: item.stream_audio_url,
        imageUrl: item.image_url,
        duration:
          typeof item.duration === 'number' ? item.duration : undefined,
        title: item.title,
        tags: item.tags,
      }))
  }
}
