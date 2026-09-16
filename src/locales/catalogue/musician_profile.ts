import {message, plural, type CatalogueTree} from './index'

export const musician_profile = {
  loading: message({"pt-BR": "Carregando perfil…", "en": "Loading profile…", "es": "Cargando perfil…"}),
  title: message({"pt-BR": "Perfil do Músico", "en": "Musician Profile", "es": "Perfil del Músico"}),
  bio: message({"pt-BR": "Sobre", "en": "About", "es": "Sobre"}),
  other_instruments: message({"pt-BR": "Outros instrumentos", "en": "Other instruments", "es": "Otros instrumentos"}),
  jams_played: message({"pt-BR": "Jams", "en": "Jams", "es": "Jams"}),
  songs_played: message({"pt-BR": "Músicas", "en": "Songs", "es": "Canciones"}),
  instruments_played: message({"pt-BR": "Já tocou", "en": "Played on", "es": "Ya tocó"}),
  member_since: message({"pt-BR": "Membro desde {{date}}", "en": "Member since {{date}}", "es": "Miembro desde {{date}}"})
} as const satisfies CatalogueTree
