import {useEffect, useState} from 'react'
import {closeReactionChannel, createReactionFeed, joinReactionChannel, onReaction, openReactionChannel, type ReactionFeed} from '../../lib/realtime/jamReactions'

/**
 * Listens to the room's reactions while the venue display shows the classic
 * layout. The feed is stable, so the stage subscribes once; each reaction is
 * an event, never React state.
 */
export function useAudienceReactions(jamId: string | undefined, enabled: boolean): ReactionFeed {
  const [feed] = useState(createReactionFeed)
  useEffect(() => {
    if (!jamId || !enabled) return
    const channel = openReactionChannel(jamId)
    onReaction(channel, feed.emit)
    joinReactionChannel(channel)
    return () => closeReactionChannel(channel)
  }, [jamId, enabled, feed])
  return feed
}

/** Claps sent during the applause `active` names, counted live (at most every 150 ms). */
export function useClapCount(feed: ReactionFeed | null | undefined, active: string | null) {
  const [claps, setClaps] = useState({active, count: 0})
  if (claps.active !== active) setClaps({active, count: 0})

  useEffect(() => {
    if (!feed || !active) return
    let pending = 0
    let timer: ReturnType<typeof setTimeout> | undefined
    const unsubscribe = feed.subscribe(({kind, count}) => {
      if (kind !== 'clap') return
      pending += count
      timer ??= setTimeout(() => {
        timer = undefined
        const added = pending
        pending = 0
        setClaps(current => current.active === active ? {active, count: current.count + added} : current)
      }, 150)
    })
    return () => {
      unsubscribe()
      clearTimeout(timer)
    }
  }, [feed, active])

  return claps.active === active ? claps.count : 0
}
