import {useEffect, useMemo, useSyncExternalStore} from 'react'
import {createMusicLibraryController, type MusicLibraryQueryPort} from '../lib/music/musicLibraryController'
import {musicLibraryQueryAdapter} from '../lib/music/musicLibraryAdapters'

export function useMusicLibraryController(
  isHost: boolean,
  queries: MusicLibraryQueryPort = musicLibraryQueryAdapter,
) {
  const controller = useMemo(() => createMusicLibraryController({isHost, queries}), [isHost, queries])
  const state = useSyncExternalStore(controller.subscribe, controller.getSnapshot, controller.getSnapshot)

  useEffect(() => {
    void controller.commands.load()
    return () => controller.dispose()
  }, [controller])

  return {state, commands: controller.commands}
}
