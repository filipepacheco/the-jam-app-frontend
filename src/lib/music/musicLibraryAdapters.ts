import {musicService} from '../../services'
import type {MusicLibraryMutationPort, MusicLibraryQueryPort} from './musicLibraryController'

export const musicLibraryQueryAdapter: MusicLibraryQueryPort = {
  async list({skip, take, status}) {
    const response = await musicService.findAll(skip, take, status)
    return {items: response.data, meta: response.meta}
  },
}

export const musicLibraryMutationAdapter: MusicLibraryMutationPort = {
  async update(id, data) {
    const response = await musicService.update(id, data)
    return response.success ? {ok: true} : {ok: false, error: response.error ? {message: response.error} : {message: '', reason: 'unknown'}}
  },
  async remove(id) {
    const response = await musicService.remove(id)
    return response.success ? {ok: true} : {ok: false, error: response.error ? {message: response.error} : {message: '', reason: 'unknown'}}
  },
}
