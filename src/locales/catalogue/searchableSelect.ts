import {message, plural, type CatalogueTree} from './index'

export const searchableSelect = {
  placeholder: message({"pt-BR": "Selecione uma opção...", "en": "Select an option...", "es": "Selecciona una opción..."}),
  noResults: message({"pt-BR": "Nenhum resultado encontrado", "en": "No results found", "es": "No se encontraron resultados"}),
  search: message({"pt-BR": "Pesquisar...", "en": "Search...", "es": "Buscar..."})
} as const satisfies CatalogueTree
