import {message, plural, type CatalogueTree} from './index'

export const musician_form = {
  edit_title: message({"pt-BR": "Editar músico", "en": "Edit Musician", "es": "Editar Músico"}),
  musician_id: message({"pt-BR": "ID do músico", "en": "Musician ID", "es": "ID del Músico"}),
  name_label: message({"pt-BR": "Nome", "en": "Name", "es": "Nombre"}),
  name_placeholder: message({"pt-BR": "Digite o nome do músico", "en": "Enter musician name", "es": "Ingresa el nombre del músico"}),
  instrument_label: message({"pt-BR": "Instrumento", "en": "Instrument", "es": "Instrumento"}),
  instrument_placeholder: message({"pt-BR": "ex.: Guitarra, Bateria, Baixo", "en": "e.g., Guitar, Drums, Bass", "es": "ej. Guitarra, Batería, Bajo"}),
  contact_label: message({"pt-BR": "Contato (Email/Principal)", "en": "Contact (Email/Primary)", "es": "Contacto (Email/Primario)"}),
  contact_placeholder: message({"pt-BR": "ex.: email@exemplo.com", "en": "e.g., email@example.com", "es": "ej. email@ejemplo.com"}),
  phone_label: message({"pt-BR": "Telefone", "en": "Phone", "es": "Teléfono"}),
  phone_placeholder: message({"pt-BR": "ex.: (55) 9 9123-4567", "en": "e.g., (555) 123-4567", "es": "ej. (555) 123-4567"}),
  name_required: message({"pt-BR": "Nome é obrigatório", "en": "Name is required", "es": "El nombre es obligatorio"}),
  instrument_required: message({"pt-BR": "Instrumento é obrigatório", "en": "Instrument is required", "es": "El instrumento es obligatorio"}),
  contact_required: message({"pt-BR": "Contato é obrigatório", "en": "Contact is required", "es": "El contacto es obligatorio"}),
  failed_to_update: message({"pt-BR": "Falha ao atualizar músico", "en": "Failed to update musician", "es": "Error al actualizar músico"}),
  bio_label: message({"pt-BR": "Biografia", "en": "Bio", "es": "Biografía"}),
  bio_placeholder: message({"pt-BR": "Sua história: bandas, gêneros, há quanto tempo toca...", "en": "What's your story? Bands, genres, how long you've been playing...", "es": "Tu historia: bandas, géneros, cuánto tiempo llevas tocando..."}),
  other_instruments_label: message({"pt-BR": "Outros instrumentos", "en": "Other instruments", "es": "Otros instrumentos"}),
  other_instruments_placeholder: message({"pt-BR": "ex. piano, ukulele, gaita", "en": "e.g. piano, ukulele, harmonica", "es": "ej. piano, ukulele, armónica"})
} as const satisfies CatalogueTree
