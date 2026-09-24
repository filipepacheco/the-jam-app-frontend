import {useCallback, useEffect, useRef} from 'react'
import {
  cleanName,
  closeReactionChannel,
  createReactionBatcher,
  joinReactionChannel,
  openReactionChannel,
  sendReaction,
  type ReactionKind,
} from '../../lib/realtime/jamReactions'

/**
 * Sends the audience's taps to the venue display, with the account name the
 * big screen shows (none for a guest). Taps are batched, and a failed send is
 * logged, never shown: the next tap simply tries again.
 */
export function useReactionSender(jamId: string | undefined, enabled: boolean, name: string | null = null) {
  const batcher = useRef<ReturnType<typeof createReactionBatcher> | null>(null)
  // A later name change reaches the next batch without a new channel.
  const sender = useRef(name)
  useEffect(() => {
    sender.current = name
  })
  useEffect(() => {
    if (!jamId || !enabled) return
    const channel = openReactionChannel(jamId)
    joinReactionChannel(channel)
    const batch = createReactionBatcher(reaction => {
      const named = cleanName(sender.current)
      sendReaction(channel, named ? {...reaction, name: named} : reaction).catch((error: unknown) => console.warn('[reactions] send failed', error))
    })
    batcher.current = batch
    return () => {
      batch.dispose()
      if (batcher.current === batch) batcher.current = null
      closeReactionChannel(channel)
    }
  }, [jamId, enabled])
  return useCallback((kind: ReactionKind) => batcher.current?.tap(kind), [])
}
