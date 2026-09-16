import {message, plural, type CatalogueTree} from './index'

export const registration = {
  statuses: {
    pending: message({"pt-BR": "Pendente", "en": "Pending", "es": "Pendiente"}),
    approved: message({"pt-BR": "Aprovado", "en": "Approved", "es": "Aprobado"}),
    rejected: message({"pt-BR": "Rejeitado", "en": "Rejected", "es": "Rechazado"})
  }
} as const satisfies CatalogueTree
