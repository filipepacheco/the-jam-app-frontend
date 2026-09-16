import {message, plural, type CatalogueTree} from './index'

export const profile = {
  title: message({"pt-BR": "Perfil", "en": "Profile", "es": "Perfil"}),
  edit_profile: message({"pt-BR": "Editar perfil", "en": "Edit Profile", "es": "Editar Perfil"}),
  update_success: message({"pt-BR": "Perfil atualizado com sucesso!", "en": "Profile updated successfully!", "es": "¡Perfil actualizado con éxito!"}),
  update_failed: message({"pt-BR": "Falha ao atualizar perfil", "en": "Failed to update profile", "es": "Error al actualizar perfil"}),
  contact_info: message({"pt-BR": "Informações de contato", "en": "Contact Information", "es": "Información de Contacto"}),
  musician_profile: message({"pt-BR": "Perfil do músico", "en": "Musician Profile", "es": "Perfil de Músico"}),
  host_info: message({"pt-BR": "Informações do anfitrião", "en": "Host Information", "es": "Información de Anfitrión"}),
  name_label: message({"pt-BR": "Nome", "en": "Name", "es": "Nombre"}),
  email_label: message({"pt-BR": "Email", "en": "Email", "es": "Correo"}),
  phone_label: message({"pt-BR": "Telefone", "en": "Phone", "es": "Teléfono"}),
  contact_label: message({"pt-BR": "Contato (Email/Mensagens)", "en": "Contact (Email/Messaging)", "es": "Contacto (Email/Mensajería)"}),
  instrument_label: message({"pt-BR": "Instrumento", "en": "Instrument", "es": "Instrumento"}),
  genre_label: message({"pt-BR": "Gênero", "en": "Genre", "es": "Género"}),
  level_label: message({"pt-BR": "Nível", "en": "Level", "es": "Nivel"}),
  host_name_label: message({"pt-BR": "Nome do anfitrião", "en": "Host Name", "es": "Nombre del Anfitrión"}),
  host_contact_label: message({"pt-BR": "Contato do anfitrião", "en": "Host Contact", "es": "Contacto del Anfitrión"}),
  name_required: message({"pt-BR": "Nome é obrigatório", "en": "Name is required", "es": "El nombre es obligatorio"}),
  phone_required: message({"pt-BR": "Telefone é obrigatório", "en": "Phone is required", "es": "El teléfono es obligatorio"}),
  bio_label: message({"pt-BR": "Biografia", "en": "Bio", "es": "Biografía"}),
  other_instruments_label: message({"pt-BR": "Outros instrumentos", "en": "Other instruments", "es": "Otros instrumentos"})
} as const satisfies CatalogueTree
