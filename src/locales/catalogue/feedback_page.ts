import {message, plural, type CatalogueTree} from './index'

export const feedback_page = {
  title: message({"pt-BR": "Feedback dos Usuários", "en": "User Feedback", "es": "Comentarios de Usuarios"}),
  loading: message({"pt-BR": "Carregando feedback...", "en": "Loading feedback...", "es": "Cargando comentarios..."}),
  load_error: message({"pt-BR": "Falha ao carregar feedback", "en": "Failed to load feedback", "es": "Error al cargar comentarios"}),
  no_feedback: message({"pt-BR": "Nenhum feedback recebido ainda.", "en": "No feedback received yet.", "es": "No se han recibido comentarios aun."}),
  anonymous: message({"pt-BR": "Anônimo", "en": "Anonymous", "es": "Anonimo"}),
  stats: {
    total: message({"pt-BR": "Total de Feedback", "en": "Total Feedback", "es": "Total de Comentarios"}),
    average: message({"pt-BR": "Avaliação Media", "en": "Average Rating", "es": "Calificación Promedio"})
  },
  pagination: message({"pt-BR": "Página {{page}} de {{totalPages}}", "en": "Page {{page}} of {{totalPages}}", "es": "Pagina {{page}} de {{totalPages}}"})
} as const satisfies CatalogueTree
