import {message, plural, type CatalogueTree} from './index'

export const errors = {
  generic_error: message({"pt-BR": "Ocorreu um erro. Por favor, tente novamente.", "en": "An error occurred. Please try again.", "es": "Ocurrió un error. Inténtalo de nuevo."}),
  registration_error_title: message({"pt-BR": "Erro de registro", "en": "Registration Error", "es": "Error de Registro"}),
  failed_to_load_musicians: message({"pt-BR": "Falha ao carregar músicos", "en": "Failed to load musicians", "es": "Fallo al cargar músicos"}),
  please_select_musician: message({"pt-BR": "Por favor, selecione um músico", "en": "Please select a musician", "es": "Por favor selecciona un músico"}),
  please_select_instrument: message({"pt-BR": "Por favor, selecione um instrumento", "en": "Please select an instrument", "es": "Por favor selecciona un instrumento"}),
  failed_to_register_musician: message({"pt-BR": "Falha ao registrar músico", "en": "Failed to register musician", "es": "Fallo al registrar músico"}),
  failed_to_enroll: message({"pt-BR": "Falha ao inscrever", "en": "Failed to enroll", "es": "Fallo al inscribirse"}),
  no_token_found: message({"pt-BR": "Nenhum token de autenticação encontrado. Por favor, faça login novamente.", "en": "No authentication token found. Please log in again.", "es": "No se encontró token. Inicia sesión de nuevo."}),
  action_failed: message({"pt-BR": "Ação falhou", "en": "Action failed", "es": "Acción fallida"}),
  failed_to_execute_action: message({"pt-BR": "Falha ao executar ação", "en": "Failed to execute action", "es": "Fallo al ejecutar acción"}),
  no_song_playing: message({"pt-BR": "Nenhuma música tocando no momento", "en": "No song currently playing", "es": "No hay canción sonando"}),
  invalid_email_phone: message({"pt-BR": "Por favor, insira um email ou telefone válido", "en": "Please enter a valid email or phone number", "es": "Ingresa un correo o teléfono válido"}),
  must_agree_terms: message({"pt-BR": "Você deve concordar com os termos antes de se inscrever", "en": "You must agree to the terms before registering", "es": "Debes aceptar los términos antes de registrarte"}),
  queue_empty: message({"pt-BR": "Não é possível reordenar fila vazia", "en": "Cannot reorder empty queue", "es": "No se puede reordenar una cola vacía"}),
  duplicate_ids: message({"pt-BR": "Músicas duplicadas detectadas", "en": "Duplicate songs detected", "es": "Canciones duplicadas detectadas"}),
  reorder_failed: message({"pt-BR": "Falha ao reordenar a fila", "en": "Failed to reorder queue", "es": "Fallo al reordenar la cola"}),
  connection_error: message({"pt-BR": "Erro de conexão. Por favor, tente novamente.", "en": "Connection error. Please try again.", "es": "Error de conexión. Por favor, inténtalo de nuevo."}),
  access_denied: message({"pt-BR": "Acesso Negado", "en": "Access Denied", "es": "Acceso Denegado"}),
  insufficient_permission: message({"pt-BR": "Você não tem permissão para acessar esta página. Papel necessário: {{role}}", "en": "You don't have permission to access this page. Required role: {{role}}", "es": "No tienes permiso para acceder a esta página. Rol requerido: {{role}}"}),
  jam_id_not_provided: message({"pt-BR": "ID do Jam não fornecido", "en": "Jam ID not provided", "es": "ID del Jam no proporcionado"}),
  failed_to_load_jam: message({"pt-BR": "Falha ao carregar o jam", "en": "Failed to load jam", "es": "Fallo al cargar el jam"})
} as const satisfies CatalogueTree
