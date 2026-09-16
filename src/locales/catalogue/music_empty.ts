import {message, plural, type CatalogueTree} from './index'

export const music_empty = {
  no_songs_found: message({"pt-BR": "Nenhuma música encontrada", "en": "No songs found", "es": "No se encontraron canciones"}),
  no_music_in_library: message({"pt-BR": "Nenhuma música na biblioteca", "en": "No music in library", "es": "No hay música en la biblioteca"}),
  try_adjusting_filters: message({"pt-BR": "Tente ajustar seus filtros", "en": "Try adjusting your filters", "es": "Intenta ajustar tus filtros"}),
  host_hint: message({"pt-BR": "Clique em \"Adicionar Música\" para começar a construir sua biblioteca musical", "en": "Click \"Add Song\" to start building your music library", "es": "Haz clic en \"Agregar Canción\" para empezar a construir tu biblioteca musical"}),
  empty_hint: message({"pt-BR": "A biblioteca musical está vazia. Volte mais tarde!", "en": "Music library is empty. Check back later!", "es": "La biblioteca musical está vacía. ¡Vuelve más tarde!"})
} as const satisfies CatalogueTree
