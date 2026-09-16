import {message, plural, type CatalogueTree} from './index'

export const host_songs = {
  back_to_manage: message({"pt-BR": "← Voltar para Gestão do Jam", "en": "← Back to Jam Management", "es": "← Volver a Gestión del Jam"}),
  title: message({"pt-BR": "🎵 Gerenciamento de Músicas", "en": "🎵 Songs Management", "es": "🎵 Gestión de Canciones"}),
  add_song_modal: message({"pt-BR": "Adicionar música ao Jam", "en": "Add Song to Jam", "es": "Agregar Canción al Jam"}),
  create_new: message({"pt-BR": "Criar nova música", "en": "Create New Song", "es": "Crear Nueva Canción"}),
  or_add_existing: message({"pt-BR": "Ou adicionar música existente", "en": "Or Add Existing Song", "es": "O Agregar Canción Existente"}),
  duration_sec: message({"pt-BR": "Duração (seg)", "en": "Duration (sec)", "es": "Duración (seg)"}),
  create_btn: message({"pt-BR": "Criar e adicionar música", "en": "Create & Add Song", "es": "Crear y Agregar Canción"}),
  add_btn: message({"pt-BR": "Adicionar música", "en": "Add Song", "es": "Agregar Canción"}),
  creating: message({"pt-BR": "Criando...", "en": "Creating...", "es": "Creando..."}),
  no_songs_available: message({"pt-BR": "Nenhuma outra música disponível. Crie uma nova acima.", "en": "No other songs available. Create a new one above.", "es": "No hay otras canciones disponibles. Crea una nueva arriba."}),
  remove_confirm: message({"pt-BR": "Remover esta música do jam?", "en": "Remove this song from the jam?", "es": "¿Quitar esta canción del jam?"}),
  order_updated: message({"pt-BR": "Ordem das músicas atualizada", "en": "Song order updated", "es": "Orden de canciones actualizado"}),
  song_added_success: message({"pt-BR": "Música \"{{title}}\" adicionada ao jam", "en": "Song \"{{title}}\" added to jam", "es": "Canción \"{{title}}\" agregada al jam"}),
  song_created_success: message({"pt-BR": "Música \"{{title}}\" criada e adicionada ao jam", "en": "Song \"{{title}}\" created and added to jam", "es": "Canción \"{{title}}\" creada y agregada al jam"}),
  song_removed_success: message({"pt-BR": "Música \"{{title}}\" removida do jam", "en": "Song \"{{title}}\" removed from jam", "es": "Canción \"{{title}}\" quitada del jam"}),
  failed_to_load: message({"pt-BR": "Falha ao carregar músicas do jam", "en": "Failed to load jam songs", "es": "Error al cargar canciones del jam"}),
  failed_to_create: message({"pt-BR": "Falha ao criar música", "en": "Failed to create song", "es": "Error al crear canción"}),
  failed_to_add: message({"pt-BR": "Falha ao adicionar música ao jam", "en": "Failed to add song to jam", "es": "Error al agregar canción al jam"}),
  failed_to_remove: message({"pt-BR": "Falha ao remover música", "en": "Failed to remove song", "es": "Error al quitar canción"}),
  title_artist_required: message({"pt-BR": "Título e artista são obrigatórios", "en": "Title and artist are required", "es": "El título y el artista son obligatorios"}),
  select_song_error: message({"pt-BR": "Por favor, selecione uma música", "en": "Please select a song", "es": "Por favor selecciona una canción"})
} as const satisfies CatalogueTree
