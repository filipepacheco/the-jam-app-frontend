import {message, plural, type CatalogueTree} from './index'

export const timeline = {
  start: message({"pt-BR": "Início", "en": "Start", "es": "Inicio"}),
  finish: message({"pt-BR": "Fim", "en": "Finish", "es": "Fin"}),
  jam_started_at: message({"pt-BR": "Jam começou!", "en": "Jam started!", "es": "¡El Jam comenzó!"})
} as const satisfies CatalogueTree
