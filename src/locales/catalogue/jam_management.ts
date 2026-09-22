import {message, plural, type CatalogueTree} from './index'

export const jam_management = {
  loading_jam: message({"pt-BR": "Carregando detalhes do jam...", "en": "Loading jam details...", "es": "Cargando detalles del jam..."}),
  error_loading: message({"pt-BR": "Erro ao carregar o Jam", "en": "Error Loading Jam", "es": "Error al cargar Jam"}),
  back_to_dashboard: message({"pt-BR": "← Voltar ao painel", "en": "← Back to Dashboard", "es": "← Volver al Panel"}),
  manage_title: message({"pt-BR": "Gerenciar", "en": "Manage", "es": "Gestionar"}),
  view_public_dashboard: message({"pt-BR": "Dashboard ao vivo", "en": "View Dashboard", "es": "Ver Dashboard"}),
  tabs: {
    overview: message({"pt-BR": "Visão geral", "en": "Overview", "es": "Resumen"}),
    schedule: message({"pt-BR": "Escalas", "en": "Schedule", "es": "Programación"}),
    live_control: message({"pt-BR": "Ordenação", "en": "Live Control", "es": "Control en Vivo"}),
    live_control_short: message({"pt-BR": "Ordem", "en": "Order", "es": "Orden"}),
    registrations: message({"pt-BR": "Registros", "en": "Registrations", "es": "Registros"}),
    dashboard: message({"pt-BR": "Painel público", "en": "Dashboard", "es": "Panel"}),
    analytics: message({"pt-BR": "Análises", "en": "Analytics", "es": "Analíticas"})
  },
  overview: {
    actions_controls: message({"pt-BR": "Ações e controles", "en": "Actions & Controls", "es": "Acciones y Controles"}),
    actions: {
      activate: message({"pt-BR": "Ativar Jam", "en": "Activate Jam", "es": "Activar Jam"}),
      start: message({"pt-BR": "Iniciar Jam", "en": "Start Jam", "es": "Iniciar Jam"}),
      finish: message({"pt-BR": "Finalizar Jam", "en": "Finish Jam", "es": "Finalizar Jam"}),
      prepare_again: message({"pt-BR": "Preparar Jam novamente", "en": "Prepare Jam again", "es": "Preparar Jam de nuevo"})
    },
    edit_jam: message({"pt-BR": "Editar Jam", "en": "Edit Jam", "es": "Editar Jam"}),
    view_public: message({"pt-BR": "Ver página pública", "en": "View Public Page", "es": "Ver Página Pública"}),
    activate_jam: message({"pt-BR": "Ativar", "en": "Activate", "es": "Activar"}),
    start_jam: message({"pt-BR": "Começar a Jam!", "en": "Start Live", "es": "Iniciar Live"}),
    end_jam: message({"pt-BR": "Finalizar", "en": "End Jam", "es": "Finalizar Jam"}),
    reactivate_jam: message({"pt-BR": "Reativar Jam", "en": "Reactivate Jam", "es": "Reactivar Jam"}),
    confirm_start: message({"pt-BR": "Tem certeza de que deseja iniciar esta sessão de jam?", "en": "Are you sure you want to start this jam session?", "es": "¿Estás seguro de que quieres iniciar esta sesión de jam?"}),
    confirm_end: message({"pt-BR": "Tem certeza de que deseja encerrar esta sessão de jam? Esta ação não pode ser desfeita.", "en": "Are you sure you want to end this jam session? This action cannot be undone.", "es": "¿Estás seguro de que quieres finalizar esta sesión de jam? Esta acción no se puede deshacer."}),
    confirm_status_change: message({"pt-BR": "Tem certeza de que deseja alterar o status do jam?", "en": "Are you sure you want to change the jam status?", "es": "¿Estás seguro de que quieres cambiar el estado del jam?"}),
    status_updated: message({"pt-BR": "Status do jam atualizado para {{status}}", "en": "Jam status updated to {{status}}", "es": "Estado del jam actualizado a {{status}}"}),
    stats: {
      performances: message({"pt-BR": "Apresentações", "en": "Performances", "es": "Actuaciones"}),
      registrations: message({"pt-BR": "Inscrições", "en": "Registrations", "es": "Registros"}),
      musicians: message({"pt-BR": "Músicos", "en": "Musicians", "es": "Músicos"})
    },
    details: message({"pt-BR": "Detalhes", "en": "Details", "es": "Detalles"}),
    no_description: message({"pt-BR": "Sem descrição", "en": "No description", "es": "Sin descripción"}),
    date_not_set: message({"pt-BR": "Não definido", "en": "Not set", "es": "No establecida"})
  },
  registrations: {
    title: message({"pt-BR": "Gerenciamento de inscrições", "en": "Registrations Management", "es": "Gestión de Registros"}),
    no_registrations: message({"pt-BR": "Nenhuma inscrição ainda.", "en": "No registrations yet.", "es": "No hay registros aún."})
  },
  schedule: {
    title: message({"pt-BR": "Músicos Escalados", "en": "Song Setlist", "es": "Lista de Canciones"}),
    add_new_song: message({"pt-BR": "Adicionar Música", "en": "Add Song", "es": "Agregar canción"}),
    suggested_songs: message({"pt-BR": "Músicas sugeridas (pendentes de aprovação)", "en": "Suggested Songs (Pending Approval)", "es": "Canciones Sugeridas (Pendientes de Aprobación)"}),
    add_entry_modal: message({"pt-BR": "Adicionar entrada de apresentação", "en": "Add Performance Entry", "es": "Agregar Entrada de Actuación"}),
    song_label: message({"pt-BR": "Música *", "en": "Song *", "es": "Canción *"}),
    order_label: message({"pt-BR": "Ordem", "en": "Order", "es": "Orden"}),
    order_auto: message({"pt-BR": "#{{count}} (atribuído automaticamente)", "en": "#{{count}} (auto-assigned)", "es": "#{{count}} (asignado auto)"}),
    select_song: message({"pt-BR": "Selecione uma música...", "en": "Select a song...", "es": "Selecciona una canción..."}),
    add_to_schedule: message({"pt-BR": "Adicionar à programação", "en": "Add to Schedule", "es": "Agregar a Programación"}),
    confirm_delete: message({"pt-BR": "Tem certeza de que deseja excluir esta entrada da programação?", "en": "Are you sure you want to delete this schedule entry?", "es": "¿Estás seguro de que quieres eliminar esta entrada?"}),
    confirm_delete_named: message({"pt-BR": "Excluir {{name}} da programação?", "en": "Delete {{name}} from the Schedule?", "es": "¿Eliminar {{name}} de la programación?"}),
    confirm_reject_reg: message({"pt-BR": "Tem certeza de que deseja rejeitar esta inscrição?", "en": "Are you sure you want to reject this registration?", "es": "¿Estás seguro de que quieres rechazar este registro?"}),
    no_schedule_yet: message({"pt-BR": "Nenhuma programação de apresentações ainda", "en": "No performance schedule yet", "es": "No hay programación aún"}),
    add_entry_hint: message({"pt-BR": "Clique em \"Adicionar entrada\" para criar sua primeira programação.", "en": "Click \"Add Entry\" to create your first schedule.", "es": "Haz clic en \"Agregar Entrada\" para crear tu primera programación."}),
    add_songs_first: message({"pt-BR": "Adicione músicas ao seu jam primeiro e então crie sua programação.", "en": "Add songs to your jam first, then create your schedule.", "es": "Agrega canciones a tu jam primero, luego crea tu programación."}),
    notes_saved: message({"pt-BR": "Notas salvas", "en": "Notes saved", "es": "Notas guardadas"}),
    status_updated: message({"pt-BR": "Status atualizado", "en": "Status updated", "es": "Estado actualizado"}),
    added_success: message({"pt-BR": "Música adicionada à programação", "en": "Song added to schedule", "es": "Canción agregada a la programación"}),
    registration_approved: message({"pt-BR": "Músico aprovado", "en": "Musician approved", "es": "Músico aprobado"}),
    deleted_success: message({"pt-BR": "Música removida da programação", "en": "Song removed from schedule", "es": "Canción eliminada de la programación"}),
    registration_removed: message({"pt-BR": "Inscrição removida", "en": "Registration removed", "es": "Inscripción eliminada"}),
    confirm_delete_title: message({"pt-BR": "Excluir música", "en": "Delete song", "es": "Eliminar canción"}),
    confirm_reject_title: message({"pt-BR": "Remover inscrição", "en": "Remove registration", "es": "Eliminar inscripción"}),
    musicians_registered: message({"pt-BR": "Músicos inscritos", "en": "Musicians registered", "es": "Músicos inscritos"})
  },
  dashboard: {
    title: message({"pt-BR": "Visão pública do painel", "en": "Public Dashboard View", "es": "Vista del Panel Público"}),
    description: message({"pt-BR": "Isso mostrará o que o público e os músicos veem no painel público.", "en": "This will show what the audience and musicians see on the public dashboard.", "es": "Esto mostrará lo que el público y los músicos ven en el panel público."}),
    open_btn: message({"pt-BR": "Abrir visão pública", "en": "Open Public View", "es": "Abrir Vista Pública"})
  },
  analytics: {
    title: message({"pt-BR": "Análises", "en": "Analytics", "es": "Analíticas"}),
    total_songs: message({"pt-BR": "Total de músicas", "en": "Total Songs", "es": "Total de Canciones"}),
    unique_musicians: message({"pt-BR": "Músicos únicos", "en": "Unique Musicians", "es": "Músicos Únicos"}),
    performances: message({"pt-BR": "Apresentações", "en": "Performances", "es": "Actuaciones"}),
    finished_message: message({"pt-BR": "Esta sessão de jam foi concluída. Exportação de análises em breve!", "en": "This jam session has been completed. Export analytics coming soon!", "es": "Esta sesión de jam ha finalizado. ¡Analíticas de exportación próximamente!"})
  },
  host_dashboard: {
    title: message({"pt-BR": "Painel do Host", "en": "Host Dashboard", "es": "Panel del Anfitrión"}),
    create_jam_btn: message({"pt-BR": "+ Criar novo Jam", "en": "+ Create New Jam", "es": "+ Crear Nuevo Jam"}),
    failed_to_load: message({"pt-BR": "Falha ao carregar os jams do host", "en": "Failed to load host jams", "es": "Error al cargar los jams del anfitrión"}),
    confirm_delete: message({"pt-BR": "Tem certeza de que deseja excluir este jam?", "en": "Are you sure you want to delete this jam?", "es": "¿Estás seguro de que deseas eliminar este jam?"}),
    delete_success: message({"pt-BR": "Jam excluído com sucesso", "en": "Jam deleted successfully", "es": "Jam eliminado con éxito"}),
    delete_failed: message({"pt-BR": "Falha ao excluir o jam", "en": "Failed to delete jam", "es": "Error al eliminar el jam"}),
    loading_jams: message({"pt-BR": "Carregando seus jams...", "en": "Loading your jams...", "es": "Cargando tus jams..."}),
    no_jams_title: message({"pt-BR": "Crie seu primeiro Jam", "en": "Create your first Jam", "es": "Crea tu primer Jam"}),
    no_jams_desc: message({"pt-BR": "Você ainda não tem sessões de jam. Crie seu primeiro jam para começar.", "en": "You have no jam sessions yet. Create your first jam to get started.", "es": "Aún no tienes sesiones de jam. Crea tu primer jam para comenzar."}),
    more_actions: message({"pt-BR": "Mais ações do Jam", "en": "More Jam actions", "es": "Más acciones del Jam"}),
    stats: {
      total_jams: message({"pt-BR": "Total de Jams", "en": "Total Jams", "es": "Total de Jams"}),
      musicians: message({"pt-BR": "Músicos", "en": "Musicians", "es": "Músicos"}),
      registrations: message({"pt-BR": "Inscrições", "en": "Registrations", "es": "Inscripciones"}),
      songs: message({"pt-BR": "Músicas", "en": "Songs", "es": "Músicas"}),
      upcoming: message({"pt-BR": "Próximos", "en": "Upcoming", "es": "Próximos"})
    },
    categories: {
      planned: message({"pt-BR": "Planejados", "en": "Planned", "es": "Planeados"}),
      in_progress: message({"pt-BR": "Em andamento", "en": "In Progress", "es": "En Curso"}),
      past: message({"pt-BR": "Passados", "en": "Past", "es": "Pasados"})
    },
    statuses: {
      live: message({"pt-BR": "Ao vivo", "en": "Live", "es": "En vivo"}),
      active: message({"pt-BR": "Programado", "en": "Active", "es": "Activo"}),
      inactive: message({"pt-BR": "Inativo", "en": "Inactive", "es": "Inactivo"}),
      finished: message({"pt-BR": "Concluído", "en": "Finished", "es": "Finalizado"})
    },
    songs_count: message({"pt-BR": "{{count}} músicas", "en": "{{count}} songs", "es": "{{count}} canciones"}),
    musicians_count: message({"pt-BR": "{{count}} músicos", "en": "{{count}} musicians", "es": "{{count}} músicos"}),
    registrations_count: message({"pt-BR": "{{count}} inscrições", "en": "{{count}} registrations", "es": "{{count}} inscripciones"}),
    view_public: message({"pt-BR": "Ver página pública", "en": "View Public", "es": "Ver Público"}),
    manage_btn: message({"pt-BR": "Gerenciar", "en": "Manage", "es": "Gestionar"}),
    delete_btn: message({"pt-BR": "Excluir", "en": "Delete", "es": "Eliminar"})
  },
  musicians: {
    title: message({"pt-BR": "Diretório de Músicos", "en": "Musicians Directory", "es": "Directorio de Músicos"}),
    subtitle: message({"pt-BR": "Gerencie e visualize todos os músicos no seu sistema", "en": "Manage and view all musicians in your system", "es": "Gestiona y visualiza todos los músicos en tu sistema"}),
    loading: message({"pt-BR": "Carregando músicos", "en": "Loading musicians", "es": "Cargando músicos"}),
    failed_to_load: message({"pt-BR": "Falha ao carregar músicos", "en": "Failed to load musicians", "es": "Error al cargar músicos"}),
    update_success: message({"pt-BR": "Músico atualizado com sucesso", "en": "Musician updated successfully", "es": "Músico actualizado con éxito"}),
    update_failed: message({"pt-BR": "Falha ao atualizar músico", "en": "Failed to update musician", "es": "Error al actualizar músico"}),
    search_label: message({"pt-BR": "Buscar Músicos", "en": "Search Musicians", "es": "Buscar Músicos"}),
    search_placeholder: message({"pt-BR": "Pesquisar por nome, instrumento ou contato...", "en": "Search by name, instrument, or contact...", "es": "Buscar por nombre, instrumento o contacto..."}),
    filter_label: message({"pt-BR": "Filtrar por Nível", "en": "Filter by Level", "es": "Filtrar por Nivel"}),
    options: {
      all_levels: message({"pt-BR": "Todos os níveis", "en": "All Levels", "es": "Todos los niveles"})
    },
    results_count: message({"pt-BR": "Mostrando {{shown}} de {{total}} músicos", "en": "Showing {{shown}} of {{total}} musicians", "es": "Mostrando {{shown}} de {{total}} músicos"}),
    no_musicians_title: message({"pt-BR": "Nenhum músico ainda", "en": "No musicians yet", "es": "Aún no hay músicos"}),
    no_musicians: message({"pt-BR": "Os músicos aparecerão aqui assim que se registrarem.", "en": "Musicians will appear here once they register.", "es": "Los músicos aparecerán aquí una vez que se registren."}),
    no_match_title: message({"pt-BR": "Nenhum músico correspondente", "en": "No matching musicians", "es": "No hay músicos coincidentes"}),
    no_match: message({"pt-BR": "Nenhum músico corresponde aos seus critérios de pesquisa.", "en": "No musicians match your search criteria.", "es": "Ningún músico coincide con tus criterios de búsqueda."}),
    clear_filters: message({"pt-BR": "Limpar filtros", "en": "Clear filters", "es": "Limpiar filtros"}),
    table: {
      name: message({"pt-BR": "Nome", "en": "Name", "es": "Nombre"}),
      instrument: message({"pt-BR": "Instrumento", "en": "Instrument", "es": "Instrumento"}),
      level: message({"pt-BR": "Nível", "en": "Level", "es": "Nivel"}),
      contact: message({"pt-BR": "Contato", "en": "Contact", "es": "Contacto"}),
      phone: message({"pt-BR": "Telefone", "en": "Phone", "es": "Teléfono"}),
      joined: message({"pt-BR": "Registrado", "en": "Joined", "es": "Registrado"}),
      actions: message({"pt-BR": "Ações", "en": "Actions", "es": "Acciones"})
    },
    actions: {
      edit: message({"pt-BR": "Editar", "en": "Edit", "es": "Editar"})
    }
  }
} as const satisfies CatalogueTree
