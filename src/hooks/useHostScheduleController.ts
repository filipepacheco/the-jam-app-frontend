import {useEffect, useRef, useSyncExternalStore} from 'react'
import type {JamResponseDto} from '../types/api.types'
import {
  createHostScheduleController,
  type HostScheduleController,
  type MusicCataloguePort,
} from '../lib/schedule/hostScheduleController'
import {
  approvedMusicCatalogueAdapter,
  createHostScheduleOperationsAdapter,
  mapJamToHostScheduleSnapshot,
} from '../lib/schedule/hostScheduleAdapters'

export function useHostScheduleController(
  jam: JamResponseDto,
  reloadJam: () => Promise<JamResponseDto | undefined>,
  catalogue: MusicCataloguePort = approvedMusicCatalogueAdapter,
) {
  const reloadJamRef = useRef(reloadJam)
  reloadJamRef.current = reloadJam
  const controllerRef = useRef<HostScheduleController | null>(null)
  if (!controllerRef.current) {
    controllerRef.current = createHostScheduleController({
      initialSnapshot: mapJamToHostScheduleSnapshot(jam),
      catalogue,
      operations: createHostScheduleOperationsAdapter(() => reloadJamRef.current()),
    })
  }
  const controller = controllerRef.current

  const state = useSyncExternalStore(
    controller.subscribe,
    controller.getSnapshot,
    controller.getSnapshot,
  )

  useEffect(() => {
    controller.commands.replaceSnapshot(mapJamToHostScheduleSnapshot(jam))
  }, [controller, jam])

  useEffect(() => () => controller.dispose(), [controller])

  return {state, commands: controller.commands}
}
