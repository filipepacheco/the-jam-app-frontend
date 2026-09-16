import {message, plural, type CatalogueTree} from './index'

export const music_library = {
  title: message({"pt-BR": "Biblioteca musical", "en": "Music Library", "es": "Biblioteca de Música"}),
  page_title: message({"pt-BR": "Biblioteca Musical", "en": "Music Library", "es": "Biblioteca de Música"}),
  results_heading: message({"pt-BR": "Resultados de músicas", "en": "Music results", "es": "Resultados de música"}),
  create_new: message({"pt-BR": "Criar nova música", "en": "Create New Song", "es": "Crear Nueva Canción"}),
  add_song: message({"pt-BR": "+ Adicionar Música", "en": "+ Add Song", "es": "+ Agregar Canción"}),
  suggest_song: message({"pt-BR": "Sugerir Música", "en": "Suggest Song", "es": "Sugerir Canción"}),
  suggested_songs: message({"pt-BR": "Músicas Sugeridas", "en": "Suggested Songs", "es": "Canciones Sugeridas"}),
  no_suggested: message({"pt-BR": "Nenhuma música sugerida pendente de revisão.", "en": "No suggested songs pending review.", "es": "No hay canciones sugeridas pendientes de revisión."}),
  search_placeholder: message({"pt-BR": "Pesquisar por título ou artista...", "en": "Search by title or artist...", "es": "Buscar por título o artista..."}),
  all_genres: message({"pt-BR": "Todos os gêneros", "en": "All Genres", "es": "Todos los Géneros"}),
  sort_title: message({"pt-BR": "Ordenar por título", "en": "Sort by Title", "es": "Ordenar por Título"}),
  sort_artist: message({"pt-BR": "Ordenar por artista", "en": "Sort by Artist", "es": "Ordenar por Artista"}),
  sort_date: message({"pt-BR": "Ordenar por data de adição", "en": "Sort by Date Added", "es": "Ordenar por Fecha"}),
  clear_filters: message({"pt-BR": "Limpar filtros", "en": "Clear Filters", "es": "Limpiar Filtros"}),
  tabs: {
    approved: message({"pt-BR": "Aprovadas", "en": "Approved", "es": "Aprobadas"}),
    suggested: message({"pt-BR": "Sugeridas", "en": "Suggested", "es": "Sugeridas"}),
    all: message({"pt-BR": "Todas as músicas", "en": "All Songs", "es": "Todas las Canciones"})
  },
  filters: {
    all: message({"pt-BR": "Todas as músicas", "en": "All Songs", "es": "Todas las Canciones"})
  },
  table: {
    duration: message({"pt-BR": "Duração", "en": "Duration", "es": "Duración"}),
    link: message({"pt-BR": "Link", "en": "Link", "es": "Enlace"}),
    status: message({"pt-BR": "Status", "en": "Status", "es": "Estado"}),
    musicians_needed: message({"pt-BR": "Músicos necessários", "en": "Musicians Needed", "es": "Músicos Necesarios"}),
    actions: message({"pt-BR": "Ações", "en": "Actions", "es": "Acciones"})
  },
  modals: {
    add_title: message({"pt-BR": "Adicionar nova música", "en": "Add New Song", "es": "Agregar Nueva Canción"}),
    suggest_title: message({"pt-BR": "Sugerir nova música", "en": "Suggest a New Song", "es": "Sugerir una Nueva Canción"}),
    edit_title: message({"pt-BR": "Editar \"{{title}}\"", "en": "Edit \"{{title}}\"", "es": "Editar \"{{title}}\""}),
    updating: message({"pt-BR": "Atualizando...", "en": "Updating...", "es": "Actualizando..."}),
    add_btn: message({"pt-BR": "Adicionar à biblioteca", "en": "Add to Library", "es": "Agregar a la Biblioteca"}),
    suggest_btn: message({"pt-BR": "Sugerir música", "en": "Suggest Song", "es": "Sugerir Canción"}),
    update_btn: message({"pt-BR": "Atualizar música", "en": "Update Song", "es": "Actualizar Canción"})
  },
  feedback: {
    approve_confirm: message({"pt-BR": "Aprovar \"{{title}}\" por {{artist}}?", "en": "Approve \"{{title}}\" by {{artist}}?", "es": "¿Aprobar \"{{title}}\" de {{artist}}?"}),
    approve_success: message({"pt-BR": "Música \"{{title}}\" aprovada!", "en": "Song \"{{title}}\" approved!", "es": "¡Canción \"{{title}}\" aprobada!"}),
    reject_confirm: message({"pt-BR": "Rejeitar \"{{title}}\" por {{artist}}? Isso a excluirá.", "en": "Reject \"{{title}}\" by {{artist}}? This will delete it.", "es": "¿Rechazar \"{{title}}\" de {{artist}}? Esto la eliminará."}),
    reject_success: message({"pt-BR": "Música \"{{title}}\" rejeitada!", "en": "Song \"{{title}}\" rejected!", "es": "¡Canción \"{{title}}\" rechazada!"}),
    delete_confirm: message({"pt-BR": "Tem certeza de que deseja excluir \"{{title}}\" por {{artist}}?", "en": "Are you sure you want to delete \"{{title}}\" by {{artist}}?", "es": "¿Estás seguro de que quieres eliminar \"{{title}}\" de {{artist}}?"}),
    delete_confirm_usage: message({"pt-BR": "\n\nEsta música foi executada {{count}} vezes.", "en": "\n\nThis song has been performed {{count}} times.", "es": "\n\nEsta canción ha sido interpretada {{count}} veces."}),
    delete_success: message({"pt-BR": "Música \"{{title}}\" excluída com sucesso!", "en": "Song \"{{title}}\" deleted successfully!", "es": "¡Canción \"{{title}}\" eliminada con éxito!"}),
    add_success: message({"pt-BR": "Música \"{{title}}\" adicionada com sucesso!", "en": "Song \"{{title}}\" added successfully!", "es": "¡Canción \"{{title}}\" agregada con éxito!"}),
    suggest_success: message({"pt-BR": "Música \"{{title}}\" sugerida! Aguardando aprovação do anfitrião.", "en": "Song \"{{title}}\" suggested! Awaiting host approval.", "es": "¡Canción \"{{title}}\" sugerida! Esperando aprobación del anfitrión."}),
    update_success: message({"pt-BR": "Música \"{{title}}\" atualizada com sucesso!", "en": "Song \"{{title}}\" updated successfully!", "es": "¡Canción \"{{title}}\" actualizada con éxito!"}),
    duplicate_error: message({"pt-BR": "Música \"{{title}}\" por {{artist}} já existe na biblioteca", "en": "Song \"{{title}}\" by {{artist}} already exists in the library", "es": "La canción \"{{title}}\" de {{artist}} ya existe en la biblioteca"}),
    invalid_duration: message({"pt-BR": "Formato de duração inválido. Use mm:ss (ex.: 4:30)", "en": "Invalid duration format. Use mm:ss (e.g., 4:30)", "es": "Formato de duración inválido. Usa mm:ss (ej., 4:30)"})
  },
  validation: {
    title_required: message({"pt-BR": "Título é obrigatório", "en": "Title is required", "es": "El título es obligatorio"}),
    artist_required: message({"pt-BR": "Artista é obrigatório", "en": "Artist is required", "es": "El artista es obligatorio"}),
    genre_required: message({"pt-BR": "Gênero é obrigatório", "en": "Genre is required", "es": "El género es obligatorio"})
  },
  quick_edit: {
    minutes: message({"pt-BR": "Minutos", "en": "Minutes", "es": "Minutos"}),
    seconds: message({"pt-BR": "Segundos", "en": "Seconds", "es": "Segundos"}),
    more_options: message({"pt-BR": "Mais opções", "en": "More options", "es": "Más opciones"})
  },
  pagination: {
    page_size: message({"pt-BR": "Resultados por página", "en": "Results per page", "es": "Resultados por página"}),
    page_number: message({"pt-BR": "Número da página", "en": "Page number", "es": "Número de página"}),
    first: message({"pt-BR": "Primeira página", "en": "First page", "es": "Primera página"}),
    previous: message({"pt-BR": "Página anterior", "en": "Previous page", "es": "Página anterior"}),
    next: message({"pt-BR": "Próxima página", "en": "Next page", "es": "Página siguiente"}),
    last: message({"pt-BR": "Última página", "en": "Last page", "es": "Última página"})
  },
  errors: {
    failed_to_load: message({"pt-BR": "Falha ao carregar músicas", "en": "Failed to load music", "es": "Error al cargar música"}),
    failed_to_approve: message({"pt-BR": "Falha ao aprovar música", "en": "Failed to approve song", "es": "Error al aprobar canción"}),
    failed_to_reject: message({"pt-BR": "Falha ao rejeitar música", "en": "Failed to reject song", "es": "Error al rechazar canción"}),
    failed_to_delete: message({"pt-BR": "Falha ao excluir música", "en": "Failed to delete song", "es": "Error al eliminar canción"}),
    failed_to_add: message({"pt-BR": "Falha ao adicionar música", "en": "Failed to add song", "es": "Error al agregar canción"}),
    failed_to_suggest: message({"pt-BR": "Falha ao sugerir música", "en": "Failed to suggest song", "es": "Error al sugerir canción"}),
    failed_to_update: message({"pt-BR": "Falha ao atualizar música", "en": "Failed to update song", "es": "Error al actualizar canción"})
  }
} as const satisfies CatalogueTree
