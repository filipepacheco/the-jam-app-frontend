import {message, plural, type CatalogueTree} from './index'

export const feedback = {
  button_text: message({"pt-BR": "Feedback", "en": "Feedback", "es": "Comentarios"}),
  button_label: message({"pt-BR": "Enviar feedback sobre o app", "en": "Send feedback about the app", "es": "Enviar comentarios sobre la app"}),
  close_modal: message({"pt-BR": "Fechar diálogo de feedback", "en": "Close feedback dialog", "es": "Cerrar diálogo de comentarios"}),
  modal_title: message({"pt-BR": "Compartilhe sua opinião", "en": "Share your feedback", "es": "Comparte tu opinión"}),
  modal_subtitle: message({"pt-BR": "Leva menos de um minuto e ajuda a melhorar o app.", "en": "It takes under a minute and helps us improve the app.", "es": "Toma menos de un minuto y nos ayuda a mejorar la app."}),
  rating_label: message({"pt-BR": "Como você avalia sua experiência?", "en": "How would you rate your experience?", "es": "¿Cómo calificarías tu experiencia?"}),
  rating_required: message({"pt-BR": "Escolha uma nota de 1 a 5 estrelas.", "en": "Choose a rating from 1 to 5 stars.", "es": "Elige una calificación de 1 a 5 estrellas."}),
  comment_label: message({"pt-BR": "Comentários adicionais (opcional)", "en": "Additional comments (optional)", "es": "Comentarios adicionales (opcional)"}),
  comment_placeholder: message({"pt-BR": "Conte o que você gostou ou o que podemos melhorar…", "en": "Tell us what you liked or what could be better…", "es": "Cuéntanos qué te gustó o qué podríamos mejorar…"}),
  character_count: message({"pt-BR": "{{count}}/500", "en": "{{count}}/500", "es": "{{count}}/500"}),
  submit_button: message({"pt-BR": "Enviar feedback", "en": "Send feedback", "es": "Enviar comentarios"}),
  submitting: message({"pt-BR": "Enviando…", "en": "Sending…", "es": "Enviando…"}),
  submit_failed: message({"pt-BR": "Não foi possível enviar seu feedback. Tente novamente.", "en": "We couldn't send your feedback. Try again.", "es": "No pudimos enviar tus comentarios. Inténtalo de nuevo."}),
  success_title: message({"pt-BR": "Obrigado!", "en": "Thank you!", "es": "¡Gracias!"}),
  success_message: message({"pt-BR": "Seu feedback nos ajuda a melhorar o app.", "en": "Your feedback helps us improve the app.", "es": "Tu opinión nos ayuda a mejorar la app."}),
  stars: {
    "1": message({"pt-BR": "Ruim", "en": "Poor", "es": "Malo"}),
    "2": message({"pt-BR": "Regular", "en": "Fair", "es": "Regular"}),
    "3": message({"pt-BR": "Bom", "en": "Good", "es": "Bueno"}),
    "4": message({"pt-BR": "Muito bom", "en": "Great", "es": "Muy bueno"}),
    "5": message({"pt-BR": "Excelente", "en": "Excellent", "es": "Excelente"})
  }
} as const satisfies CatalogueTree
