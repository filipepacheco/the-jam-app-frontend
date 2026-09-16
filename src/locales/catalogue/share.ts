import {message, plural, type CatalogueTree} from './index'

export const share = {
  title: message({"pt-BR": "Chamar alguém pra essa Jam", "en": "Share Jam", "es": "Compartir Jam"}),
  copy_link: message({"pt-BR": "Copiar Convite", "en": "Copy Link", "es": "Copiar Enlace"}),
  whatsapp: message({"pt-BR": "WhatsApp", "en": "WhatsApp", "es": "WhatsApp"}),
  instagram: message({"pt-BR": "Instagram", "en": "Instagram", "es": "Instagram"}),
  native_share: message({"pt-BR": "Mais Opções", "en": "More Options", "es": "Más Opciones"}),
  copied_success: message({"pt-BR": "Link copiado!", "en": "Link copied!", "es": "Enlace copiado!"}),
  instagram_hint: message({"pt-BR": "Link copiado - cole no Instagram", "en": "Link copied - paste it in Instagram", "es": "Enlace copiado - pégalo en Instagram"}),
  whatsapp_message: message({"pt-BR": "Junte-se a essa sessão de Jam! {{name}}", "en": "Check out this jam session: {{name}}", "es": "Mira esta sesión de jam: {{name}}"}),
  whatsapp_message_default: message({"pt-BR": "Confira essa sessão de jam!", "en": "Check out this jam session!", "es": "Mira esta sesión de jam!"}),
  default_title: message({"pt-BR": "Sessão de Jam", "en": "Jam Session", "es": "Sesión de Jam"}),
  share_button: message({"pt-BR": "Compartilhar", "en": "Share", "es": "Compartir"})
} as const satisfies CatalogueTree
