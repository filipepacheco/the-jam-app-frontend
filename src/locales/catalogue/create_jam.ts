import {message, plural, type CatalogueTree} from './index'

export const create_jam = {
  title_create: message({"pt-BR": "Criar Novo Jam", "en": "Create New Jam", "es": "Crear Nuevo Jam"}),
  title_edit: message({"pt-BR": "Editar \"{{name}}\"", "en": "Edit \"{{name}}\"", "es": "Editar \"{{name}}\""}),
  back_to_dashboard: message({"pt-BR": "Voltar ao Painel", "en": "Back to Dashboard", "es": "Volver al Panel"}),
  spotify_import_title: message({"pt-BR": "Importar do Spotify", "en": "Import from Spotify", "es": "Importar desde Spotify"}),
  spotify_import_desc: message({"pt-BR": "Crie um jam automaticamente a partir de uma playlist do Spotify", "en": "Create a jam automatically from a Spotify playlist", "es": "Crea un jam automaticamente desde una playlist de Spotify"}),
  spotify_import_btn: message({"pt-BR": "Importar Playlist", "en": "Import Playlist", "es": "Importar Playlist"}),
  or_manually: message({"pt-BR": "ou preencha manualmente", "en": "or fill in manually", "es": "o completa manualmente"}),
  sections: {
    details: message({"pt-BR": "Detalhes e Descrição", "en": "Details & Description", "es": "Detalles y Descripción"}),
    advanced: message({"pt-BR": "Configurações Avançadas", "en": "Advanced Settings", "es": "Configuración Avanzada"})
  },
  spotify_import_inline: message({"pt-BR": "Tem uma playlist do Spotify? Importe para criar seu jam.", "en": "Have a Spotify playlist? Import it to create your jam.", "es": "Tienes una playlist de Spotify? Importala para crear tu jam."}),
  form: {
    spotify_playlist_url: message({"pt-BR": "URL da Playlist do Spotify", "en": "Spotify Playlist URL", "es": "URL de la Playlist de Spotify"}),
    placeholder_spotify_playlist_url: message({"pt-BR": "https://open.spotify.com/playlist/...", "en": "https://open.spotify.com/playlist/...", "es": "https://open.spotify.com/playlist/..."}),
    spotify_import_hint: message({"pt-BR": "Ao adicionar uma playlist, as músicas serão importadas automaticamente depois que o jam for criado.", "en": "If you add a playlist, its songs will be imported automatically after the jam is created.", "es": "Si agregas una playlist, sus canciones se importarán automáticamente después de crear el jam."}),
    jam_name: message({"pt-BR": "Nome do Jam", "en": "Jam Name", "es": "Nombre del Jam"}),
    description: message({"pt-BR": "Descrição", "en": "Description", "es": "Descripción"}),
    date: message({"pt-BR": "Data", "en": "Date", "es": "Fecha"}),
    time: message({"pt-BR": "Horário", "en": "Time", "es": "Hora"}),
    location: message({"pt-BR": "Local", "en": "Location", "es": "Ubicación"}),
    host_name: message({"pt-BR": "Nome do Anfitrião", "en": "Host Name", "es": "Nombre del Anfitrión"}),
    host_contact: message({"pt-BR": "Contato do Anfitrião", "en": "Host Contact", "es": "Contacto del Anfitrión"}),
    auto_approve_registrations: message({"pt-BR": "Aprovar inscrições automaticamente", "en": "Automatically approve registrations", "es": "Aprobar inscripciones automáticamente"}),
    auto_approve_registrations_hint: message({"pt-BR": "Novas inscrições serão aprovadas sem intervenção do anfitrião.", "en": "New registrations will be approved without host intervention.", "es": "Las nuevas inscripciones se aprobarán sin intervención del anfitrión."}),
    status: message({"pt-BR": "Status", "en": "Status", "es": "Estado"}),
    placeholder_name: message({"pt-BR": "ex., Noite de Jazz 2025", "en": "e.g., Jazz Night 2025", "es": "ej., Noche de Jazz 2025"}),
    placeholder_description: message({"pt-BR": "Breve descrição da sua sessão de jam...", "en": "Brief description of your jam session...", "es": "Breve descripción de tu sesión de jam..."}),
    placeholder_location: message({"pt-BR": "ex., Estúdio A, Rua da Música 123", "en": "e.g., Studio A, 123 Music St", "es": "ej., Estudio A, Calle Musica 123"}),
    placeholder_contact: message({"pt-BR": "Email ou telefone", "en": "Email or phone", "es": "Email o telefono"}),
    status_active: message({"pt-BR": "Programado", "en": "Active", "es": "Activo"}),
    status_inactive: message({"pt-BR": "Inativo", "en": "Inactive", "es": "Inactivo"}),
    status_live: message({"pt-BR": "Ao Vivo", "en": "Live", "es": "En Vivo"}),
    status_finished: message({"pt-BR": "Finalizado", "en": "Finished", "es": "Finalizado"}),
    slug: message({"pt-BR": "URL personalizada", "en": "Custom URL", "es": "URL personalizada"}),
    slug_hint: message({"pt-BR": "Deixe vazio para gerar automaticamente", "en": "Leave empty to auto-generate from the name", "es": "Dejar vacío para generar automaticamente"}),
    placeholder_slug: message({"pt-BR": "noite-de-jazz", "en": "friday-night-rock", "es": "noche-de-jazz"})
  },
  actions: {
    cancel: message({"pt-BR": "Cancelar", "en": "Cancel", "es": "Cancelar"}),
    delete: message({"pt-BR": "Excluir Jam", "en": "Delete Jam", "es": "Eliminar Jam"}),
    create: message({"pt-BR": "Criar Jam", "en": "Create Jam", "es": "Crear Jam"}),
    update: message({"pt-BR": "Atualizar Jam", "en": "Update Jam", "es": "Actualizar Jam"}),
    saving: message({"pt-BR": "Salvando...", "en": "Saving...", "es": "Guardando..."}),
    retry_spotify_import: message({"pt-BR": "Tentar novamente", "en": "Try again", "es": "Intentar de nuevo"}),
    retrying_spotify_import: message({"pt-BR": "Tentando importar novamente...", "en": "Retrying import...", "es": "Reintentando importación..."}),
    continue_without_import: message({"pt-BR": "Continuar sem importar", "en": "Continue without importing", "es": "Continuar sin importar"}),
    confirm_delete: message({"pt-BR": "Sim, Excluir", "en": "Yes, Delete", "es": "Si, Eliminar"})
  },
  validation: {
    name_required: message({"pt-BR": "O nome do jam é obrigatório", "en": "Jam name is required", "es": "El nombre del jam es obligatorio"}),
    location_required: message({"pt-BR": "O local é obrigatório", "en": "Location is required", "es": "La ubicación es obligatoria"}),
    host_id_required: message({"pt-BR": "O ID do anfitrião é obrigatório", "en": "Host musician ID is required", "es": "El ID del anfitrión es obligatorio"}),
    date_required: message({"pt-BR": "A data é obrigatória", "en": "Date is required", "es": "La fecha es obligatoria"}),
    time_required: message({"pt-BR": "O horário é obrigatório", "en": "Time is required", "es": "La hora es obligatoria"}),
    date_required_with_time: message({"pt-BR": "A data é obrigatório quando um horário e especificado", "en": "Date is required when time is specified", "es": "La fecha es obligatoria cuando se especifica una hora"})
  },
  messages: {
    create_success: message({"pt-BR": "Jam \"{{name}}\" criado com sucesso!", "en": "Jam \"{{name}}\" created successfully!", "es": "Jam \"{{name}}\" creado exitosamente!"}),
    create_import_success: message({"pt-BR": "Jam \"{{name}}\" criado e músicas do Spotify importadas com sucesso!", "en": "Jam \"{{name}}\" created and its Spotify songs imported successfully!", "es": "Jam \"{{name}}\" creado y sus canciones de Spotify importadas exitosamente!"}),
    spotify_import_error: message({"pt-BR": "Não foi possível importar a playlist do Spotify", "en": "The Spotify playlist could not be imported", "es": "No se pudo importar la playlist de Spotify"}),
    spotify_import_pending: message({"pt-BR": "Jam criado, mas não foi possível importar as músicas do Spotify. Tente novamente ou continue para o painel.", "en": "Jam created, but its Spotify songs could not be imported. Try again or continue to the dashboard.", "es": "El jam se creó, pero no se pudieron importar las canciones de Spotify. Inténtalo de nuevo o continúa al panel."}),
    update_success: message({"pt-BR": "Jam \"{{name}}\" atualizado com sucesso!", "en": "Jam \"{{name}}\" updated successfully!", "es": "Jam \"{{name}}\" actualizado exitosamente!"}),
    delete_success: message({"pt-BR": "Jam excluído com sucesso!", "en": "Jam deleted successfully!", "es": "Jam eliminado exitosamente!"}),
    load_error: message({"pt-BR": "Falha ao carregar o jam", "en": "Failed to load jam", "es": "Error al cargar el jam"}),
    save_error: message({"pt-BR": "Falha ao salvar o jam", "en": "Failed to save jam", "es": "Error al guardar el jam"}),
    delete_error: message({"pt-BR": "Falha ao excluir o jam", "en": "Failed to delete jam", "es": "Error al eliminar el jam"}),
    confirm_delete: message({"pt-BR": "Tem certeza de que deseja excluir este jam? Esta ação não pode ser desfeita.", "en": "Are you sure you want to delete this jam? This action cannot be undone.", "es": "Estas seguro de que quieres eliminar este jam? Esta acción no se puede deshacer."}),
    confirm_delete_title: message({"pt-BR": "Excluir Jam", "en": "Delete Jam", "es": "Eliminar Jam"})
  },
  info: {
    create_hint: message({"pt-BR": "Crie uma nova sessão de jam. Você pode adicionar músicas e gerenciar inscrições depois.", "en": "Create a new jam session. You can add songs and manage registrations later.", "es": "Crea una nueva sesión de jam. Podrás agregar canciones y gestionar inscripciones después."}),
    edit_hint: message({"pt-BR": "Atualize os detalhes do jam. As alterações serão salvas imediatamente.", "en": "Update the jam details. Changes will be saved immediately.", "es": "Actualiza los detalles del jam. Los cambios se guardaran inmediatamente."})
  }
} as const satisfies CatalogueTree
