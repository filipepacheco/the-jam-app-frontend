import {common} from './common'
import {roles} from './roles'
import {nav} from './nav'
import {auth} from './auth'
import {homepage} from './homepage'
import {jams} from './jams'
import {registration} from './registration'
import {timeline} from './timeline'
import {schedule} from './schedule'
import {errors} from './errors'
import {live_control} from './live_control'
import {music_form} from './music_form'
import {musician_form} from './musician_form'
import {musician_profile} from './musician_profile'
import {host_songs} from './host_songs'
import {profile} from './profile'
import {music_empty} from './music_empty'
import {music_library} from './music_library'
import {jam_management} from './jam_management'
import {dj_control} from './dj_control'
import {publicDashboard} from './publicDashboard'
import {searchableSelect} from './searchableSelect'
import {share} from './share'
import {seo} from './seo'
import {feedback} from './feedback'
import {feedback_page} from './feedback_page'
import {spotify} from './spotify'
import {promoVideo} from './promoVideo'
import {create_jam} from './create_jam'
import {about} from './about'
import {notFound} from './notFound'
import type {CatalogueKey} from './index'

export const catalogue = {
  common,
  roles,
  nav,
  auth,
  homepage,
  jams,
  registration,
  timeline,
  schedule,
  errors,
  live_control,
  music_form,
  musician_form,
  musician_profile,
  host_songs,
  profile,
  music_empty,
  music_library,
  jam_management,
  dj_control,
  publicDashboard,
  searchableSelect,
  share,
  seo,
  feedback,
  feedback_page,
  spotify,
  promoVideo,
  create_jam,
  about,
  notFound,
} as const

export type Catalogue = typeof catalogue
export type TranslationKey = CatalogueKey<Catalogue>
