import {message, plural, type CatalogueTree} from './index'

export const roles = {
  host: message({"pt-BR": "Organizador", "en": "Host/Organizer", "es": "Anfitrion/Organizador"}),
  user: message({"pt-BR": "Músico", "en": "Musician", "es": "Musico"}),
  viewer: message({"pt-BR": "Espectador", "en": "Viewer", "es": "Espectador"})
} as const satisfies CatalogueTree
