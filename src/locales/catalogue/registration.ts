import {message, plural, type CatalogueTree} from './index'

export const registration = {
  your_registrations: message({"pt-BR": "Suas inscrições nesta apresentação", "en": "Your registrations for this performance", "es": "Tus inscripciones en esta actuación"}),
  withdraw: message({"pt-BR": "Retirar inscrição", "en": "Withdraw", "es": "Retirar inscripción"}),
  withdraw_instrument: message({"pt-BR": "Retirar minha inscrição de {{instrument}}", "en": "Withdraw my {{instrument}} registration", "es": "Retirar mi inscripción de {{instrument}}"}),
  withdraw_failed: message({"pt-BR": "Não foi possível retirar sua inscrição. Tente novamente.", "en": "Could not withdraw your registration. Try again.", "es": "No se pudo retirar tu inscripción. Inténtalo de nuevo."}),
  withdraw_success: message({"pt-BR": "Inscrição retirada.", "en": "Registration withdrawn.", "es": "Inscripción retirada."}),
  statuses: {
    pending: message({"pt-BR": "Pendente", "en": "Pending", "es": "Pendiente"}),
    approved: message({"pt-BR": "Aprovado", "en": "Approved", "es": "Aprobado"}),
    rejected: message({"pt-BR": "Rejeitado", "en": "Rejected", "es": "Rechazado"})
  }
} as const satisfies CatalogueTree
