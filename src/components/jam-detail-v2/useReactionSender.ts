import {useCallback, useEffect, useRef} from 'react'
import {
  closeReactionChannel,
  createReactionBatcher,
  joinReactionChannel,
  openReactionChannel,
  sendReaction,
  type ReactionKind,
} from '../../lib/realtime/jamReactions'

/**
 * Sends the audience's taps to the venue display. Taps are batched, and a
 * failed send is logged, never shown: the next tap simply tries again.
 */
export function useReactionSender(jamId: string | undefined, enabled: boolean) {
  const batcher = useRef<ReturnType<typeof createReactionBatcher> | null>(null)
  useEffect(() => {
    if (!jamId || !enabled) return
    const channel = openReactionChannel(jamId)
    joinReactionChannel(channel)
    const batch = createReactionBatcher(reaction => {
      sendReaction(channel, reaction).catch((error: unknown) => console.warn('[reactions] send failed', error))
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
