import type {RealtimeChannel} from '@supabase/supabase-js'
import {supabase} from '../supabase/config'

/**
 * Audience reactions travel on a Supabase Realtime broadcast channel for each
 * Jam: phones send, the venue display listens. Nothing is stored. A payload is
 * only a known kind and a small count, so it can carry no text or personal
 * data, and both sides drop anything else. The channel is public, so anyone
 * with the anon key can send; the display caps what it shows.
 */
export const REACTIONS = ['clap', 'fire', 'heart', 'rock'] as const
export type ReactionKind = typeof REACTIONS[number]

export const REACTION_EMOJI: Record<ReactionKind, string> = {clap: '👏', fire: '🔥', heart: '❤️', rock: '🤘'}

/** Taps of one kind in one window travel as one message with this count, at most. */
export const MAX_BATCH = 10
export const BATCH_MS = 400

const EVENT = 'reaction'

export interface Reaction {
  kind: ReactionKind
  count: number
}

export const reactionChannelName = (jamId: string) => `jam-reactions:${jamId}`

export function isReaction(value: unknown): value is Reaction {
  if (typeof value !== 'object' || value === null) return false
  const {kind, count} = value as Record<string, unknown>
  return typeof kind === 'string'
    && (REACTIONS as readonly string[]).includes(kind)
    && typeof count === 'number'
    && Number.isInteger(count)
    && count >= 1
    && count <= MAX_BATCH
}

export function openReactionChannel(jamId: string): RealtimeChannel {
  return supabase.channel(reactionChannelName(jamId), {config: {broadcast: {self: false, ack: false}}})
}

/** Joins the channel; a failure is logged (Realtime off, or private channels only). */
export function joinReactionChannel(channel: RealtimeChannel) {
  channel.subscribe((status, error) => {
    if (status === 'CHANNEL_ERROR' || status === 'TIMED_OUT') console.warn(`[reactions] ${status}`, error)
  })
}

export function closeReactionChannel(channel: RealtimeChannel) {
  void supabase.removeChannel(channel)
}

export function onReaction(channel: RealtimeChannel, listener: (reaction: Reaction) => void) {
  return channel.on('broadcast', {event: EVENT}, ({payload}: {payload?: unknown}) => {
    if (isReaction(payload)) listener({kind: payload.kind, count: payload.count})
  })
}

export async function sendReaction(channel: RealtimeChannel, reaction: Reaction) {
  const status = await channel.send({type: 'broadcast', event: EVENT, payload: reaction})
  if (status !== 'ok') throw new Error(`Reaction not sent: ${status}`)
}

/**
 * Merges taps into one message for each kind and window, so a fast thumb
 * sends a few messages, not dozens. Taps over MAX_BATCH in a window are dropped.
 */
export function createReactionBatcher(send: (reaction: Reaction) => void, windowMs = BATCH_MS) {
  const pending = new Map<ReactionKind, number>()
  let timer: ReturnType<typeof setTimeout> | undefined
  const flush = () => {
    timer = undefined
    pending.forEach((count, kind) => send({kind, count}))
    pending.clear()
  }
  return {
    tap(kind: ReactionKind) {
      pending.set(kind, Math.min((pending.get(kind) ?? 0) + 1, MAX_BATCH))
      timer ??= setTimeout(flush, windowMs)
    },
    dispose() {
      clearTimeout(timer)
      timer = undefined
      pending.clear()
    },
  }
}

/** Reactions as the venue display consumes them: live from the channel, or from a review story. */
export interface ReactionFeed {
  subscribe(listener: (reaction: Reaction) => void): () => void
}

export function createReactionFeed() {
  const listeners = new Set<(reaction: Reaction) => void>()
  return {
    subscribe(listener: (reaction: Reaction) => void) {
      listeners.add(listener)
      return () => {
        listeners.delete(listener)
      }
    },
    emit(reaction: Reaction) {
      listeners.forEach(listener => listener(reaction))
    },
  }
}
