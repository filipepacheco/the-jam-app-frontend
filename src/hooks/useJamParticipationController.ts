import {useEffect, useMemo, useRef, useSyncExternalStore} from 'react'
import type {JamResponseDto} from '../types/api.types'
import {createJamParticipationController, type JamParticipationController} from '../lib/jam-participation/jamParticipationController'
import {mapJamToParticipationContext} from '../lib/jam-participation/jamParticipationAdapters'

export function useJamParticipationController(
  jam: JamResponseDto | null | undefined,
  isAuthenticated: boolean,
  musicianId: string | null,
) {
  const nextContext = useMemo(() => jam
    ? mapJamToParticipationContext({jam, isAuthenticated, musicianId})
    : {jamId: '', participationOpen: false, isAuthenticated, musicianId, performances: []},
  [jam, isAuthenticated, musicianId])
  const controllerRef = useRef<JamParticipationController | null>(null)
  if (!controllerRef.current) controllerRef.current = createJamParticipationController(nextContext)
  const controller = controllerRef.current
  const state = useSyncExternalStore(controller.subscribe, controller.getSnapshot, controller.getSnapshot)

  useEffect(() => controller.commands.replaceContext(nextContext), [controller, nextContext])
  useEffect(() => () => controller.dispose(), [controller])

  return {state, commands: controller.commands}
}
