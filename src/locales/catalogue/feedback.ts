import {message, plural, type CatalogueTree} from './index'

export const feedback = {
  button_text: message({"pt-BR": "Feedback", "en": "Feedback", "es": "Comentarios"}),
  button_label: message({"pt-BR": "Enviar feedback sobre o app", "en": "Send feedback about the app", "es": "Enviar comentarios sobre la app"}),
  close_modal: message({"pt-BR": "Fechar diálogo de feedback", "en": "Close feedback dialog", "es": "Cerrar diálogo de comentarios"}),
  modal_title: message({"pt-BR": "Compartilhe sua Opinião", "en": "Share Your Feedback", "es": "Comparte tu Opinion"}),
  modal_subtitle: message({"pt-BR": "Ajude-nos a melhorar compartilhando sua experiencia", "en": "Help us improve by sharing your experience", "es": "Ayudanos a mejorar compartiendo tu experiencia"}),
  rating_label: message({"pt-BR": "Como você avalia sua experiencia?", "en": "How would you rate your experience?", "es": "Como calificarías tu experiencia?"}),
  rating_required: message({"pt-BR": "Por favor selecione uma avaliação", "en": "Please select a rating", "es": "Por favor selecciona una calificación"}),
  comment_label: message({"pt-BR": "Comentários adicionais (opcional)", "en": "Additional comments (optional)", "es": "Comentarios adicionales (opcional)"}),
  comment_placeholder: message({"pt-BR": "Conte-nos o que você gostou ou o que podemos melhorar...", "en": "Tell us what you liked or what could be better...", "es": "Cuéntanos que te gusto o que podríamos mejorar..."}),
  character_count: message({"pt-BR": "{{count}}/500", "en": "{{count}}/500", "es": "{{count}}/500"}),
  submit_button: message({"pt-BR": "Enviar Feedback", "en": "Submit Feedback", "es": "Enviar Comentarios"}),
  submitting: message({"pt-BR": "Enviando...", "en": "Submitting...", "es": "Enviando..."}),
  submit_failed: message({"pt-BR": "Falha ao enviar feedback. Por favor tente novamente.", "en": "Failed to submit feedback. Please try again.", "es": "Error al enviar comentarios. Por favor intenta de nuevo."}),
  success_title: message({"pt-BR": "Obrigado!", "en": "Thank you!", "es": "Gracias!"}),
  success_message: message({"pt-BR": "Seu feedback nos ajuda a melhorar o app.", "en": "Your feedback helps us improve the app.", "es": "Tu opinion nos ayuda a mejorar la app."}),
  stars: {
    "1": message({"pt-BR": "Ruim", "en": "Poor", "es": "Malo"}),
    "2": message({"pt-BR": "Regular", "en": "Fair", "es": "Regular"}),
    "3": message({"pt-BR": "Bom", "en": "Good", "es": "Bueno"}),
    "4": message({"pt-BR": "Muito bom", "en": "Great", "es": "Muy bueno"}),
    "5": message({"pt-BR": "Excelente", "en": "Excellent", "es": "Excelente"})
  }
} as const satisfies CatalogueTree
