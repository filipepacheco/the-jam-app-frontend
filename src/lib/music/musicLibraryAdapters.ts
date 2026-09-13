import {musicService} from '../../services'
import type {MusicLibraryQueryPort} from './musicLibraryController'

export const musicLibraryQueryAdapter: MusicLibraryQueryPort = {
  async list({skip, take, status}) {
    const response = await musicService.findAll(skip, take, status)
    return {items: response.data, meta: response.meta}
  },
}
