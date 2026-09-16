import {message, plural, type CatalogueTree} from './index'

export const notFound = {
  title: message({"pt-BR": "Página não encontrada", "en": "Page Not Found", "es": "Pagina no encontrada"}),
  heading: message({"pt-BR": "Página não encontrada", "en": "Page Not Found", "es": "Pagina no encontrada"}),
  message: message({"pt-BR": "A página que você procura não existe ou foi movida.", "en": "The page you're looking for doesn't exist or has been moved.", "es": "La pagina que buscas no existe o ha sido movida."}),
  goHome: message({"pt-BR": "Ir para o início", "en": "Go Home", "es": "Ir al inicio"}),
  browseJams: message({"pt-BR": "Explorar Jams", "en": "Browse Jams", "es": "Explorar Jams"})
} as const satisfies CatalogueTree
