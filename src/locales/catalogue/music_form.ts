import {message, plural, type CatalogueTree} from './index'

export const music_form = {
  title: message({"pt-BR": "Título", "en": "Title", "es": "Título"}),
  title_placeholder: message({"pt-BR": "Digite o título", "en": "Enter the title", "es": "Ingresa el título"}),
  artist: message({"pt-BR": "Artista", "en": "Artist", "es": "Artista"}),
  artist_placeholder: message({"pt-BR": "Digite o artista", "en": "Enter the artist", "es": "Ingresa el artista"}),
  description: message({"pt-BR": "Descrição", "en": "Description", "es": "Descripción"}),
  link: message({"pt-BR": "Link (Spotify)", "en": "Link (Spotify)", "es": "Enlace (Spotify)"}),
  duration_label: message({"pt-BR": "Duração (mm:ss)", "en": "Duration (mm:ss)", "es": "Duración (mm:ss)"}),
  description_placeholder: message({"pt-BR": "Opcional. Adicione notas sobre esta música (ex.: estilo, andamento, clima)", "en": "Optional. Add notes about this song (e.g., style, tempo, mood)", "es": "Opcional. Añade notas sobre esta canción (ej. estilo, tempo, humor)"}),
  description_hint: message({"pt-BR": "Opcional. Uma breve descrição da música.", "en": "Optional. A brief description of the song.", "es": "Opcional. Una breve descripción de la canción."}),
  link_placeholder: message({"pt-BR": "ex.: https://www.youtube.com/watch?v=...", "en": "e.g., https://www.youtube.com/watch?v=...", "es": "ej. https://www.youtube.com/watch?v=..."}),
  link_hint: message({"pt-BR": "Opcional. Link para a música (ex.: YouTube, Spotify)", "en": "Optional. Link to the song (e.g., YouTube, Spotify)", "es": "Opcional. Enlace a la canción (ej. YouTube, Spotify)"}),
  info_label: message({"pt-BR": "Informações adicionais", "en": "Additional information", "es": "Información adicional"}),
  info_placeholder: message({"pt-BR": "Opcional. Adicione outras informações úteis sobre esta música", "en": "Optional. Add any other useful information about this song", "es": "Opcional. Añade cualquier otra información útil sobre esta canción"}),
  info_hint: message({"pt-BR": "Opcional. Detalhes extras para músicos e anfitriões.", "en": "Optional. Extra details for musicians and hosts.", "es": "Opcional. Detalles adicionales para músicos y anfitriones."}),
  select_genre: message({"pt-BR": "Selecione um gênero...", "en": "Select a genre...", "es": "Selecciona un género..."}),
  duration_placeholder: message({"pt-BR": "ex.: 4:30", "en": "e.g., 4:30", "es": "ej. 4:30"}),
  duration_hint: message({"pt-BR": "Opcional. Formato: minutos:segundos (ex.: 4:30)", "en": "Optional. Format: minutes:seconds (e.g., 4:30)", "es": "Opcional. Formato: minutos:segundos (ej. 4:30)"}),
  musicians_needed: message({"pt-BR": "Músicos necessários", "en": "Musicians Needed", "es": "Músicos Necesarios"}),
  drummers: message({"pt-BR": "Bateristas", "en": "Drummers", "es": "Bateristas"}),
  guitarists: message({"pt-BR": "Guitarristas", "en": "Guitarists", "es": "Guitarristas"}),
  vocalists: message({"pt-BR": "Vocalistas", "en": "Vocalists", "es": "Vocalistas"}),
  bassists: message({"pt-BR": "Baixistas", "en": "Bassists", "es": "Bajistas"}),
  keyboardists: message({"pt-BR": "Tecladistas", "en": "Keyboardists", "es": "Teclistas"})
} as const satisfies CatalogueTree
