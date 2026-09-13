import {useEffect, useMemo, useSyncExternalStore} from 'react'
import {createMusicLibraryController, type MusicLibraryMutationPort, type MusicLibraryQueryPort} from '../lib/music/musicLibraryController'
import {musicLibraryMutationAdapter, musicLibraryQueryAdapter} from '../lib/music/musicLibraryAdapters'

export function useMusicLibraryController(
  isHost: boolean,
  queries: MusicLibraryQueryPort = musicLibraryQueryAdapter,
  operations: MusicLibraryMutationPort = musicLibraryMutationAdapter,
) {
  const controller = useMemo(() => createMusicLibraryController({isHost, queries, operations}), [isHost, queries, operations])
  const state = useSyncExternalStore(controller.subscribe, controller.getSnapshot, controller.getSnapshot)

  useEffect(() => {
    void controller.commands.load()
    return () => controller.dispose()
  }, [controller])

  return {state, commands: controller.commands}
}
