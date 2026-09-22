import {message, plural, type CatalogueTree} from './index'

export const auth = {
  sign_in: message({"pt-BR": "Entrar", "en": "Sign In", "es": "Iniciar Sesión"}),
  sign_up: message({"pt-BR": "Registrar", "en": "Sign Up", "es": "Registrarse"}),
  create_account: message({"pt-BR": "Criar Conta", "en": "Create Account", "es": "Crear Cuenta"}),
  login_error_title: message({"pt-BR": "Erro ao Entrar", "en": "Login Error", "es": "Error de Inicio de Sesión"}),
  email_phone_label: message({"pt-BR": "Email ou Telefone", "en": "Email or Phone Number", "es": "Correo o Teléfono"}),
  email_phone_placeholder: message({"pt-BR": "usuario@exemplo.com ou 1234567890", "en": "user@example.com or 1234567890", "es": "usuario@ejemplo.com o 1234567890"}),
  phone_hint: message({"pt-BR": "Números devem ter pelo menos 10 dígitos", "en": "Phone numbers should have at least 10 digits", "es": "Los números deben tener al menos 10 dígitos"}),
  auth_failed: message({"pt-BR": "Autenticação falhou", "en": "Authentication failed", "es": "Autenticación fallida"}),
  oauth_failed: message({"pt-BR": "Falha no OAuth", "en": "OAuth login failed", "es": "Fallo inicio con OAuth"}),
  logging_in: message({"pt-BR": "Entrando...", "en": "Logging in...", "es": "Iniciando sesión..."}),
  logging_out: message({"pt-BR": "Saindo...", "en": "Logging out...", "es": "Cerrando sesión..."}),
  signing_in: message({"pt-BR": "Entrando...", "en": "Signing in...", "es": "Iniciando sesión..."}),
  creating_account: message({"pt-BR": "Criando conta...", "en": "Creating account...", "es": "Creando cuenta..."}),
  already_have_account: message({"pt-BR": "Já tem conta? Entrar", "en": "Already have an account? Sign In", "es": "¿Ya tienes cuenta? Iniciar Sesión"}),
  dont_have_account: message({"pt-BR": "Não tem conta? Registrar", "en": "Don't have an account? Sign Up", "es": "¿No tienes cuenta? Registrarse"}),
  welcome_guest: message({"pt-BR": "Olá, usuário convidado!", "en": "Hi, Guest user!", "es": "¡Hola, Invitado!"}),
  complete_profile: message({"pt-BR": "Complete seu perfil", "en": "Complete your profile", "es": "Completa tu perfil"}),
  terms_agreement: message({"pt-BR": "Ao continuar, você concorda em criar ou acessar sua conta de músico", "en": "By continuing, you agree to create or access your musician account", "es": "Al continuar, aceptas crear o acceder a tu cuenta de músico"}),
  name_placeholder: message({"pt-BR": "Seu nome", "en": "Your name", "es": "Tu nombre"}),
  email_placeholder: message({"pt-BR": "usuario@exemplo.com", "en": "user@example.com", "es": "usuario@ejemplo.com"}),
  password_placeholder: message({"pt-BR": "••••••••", "en": "••••••••", "es": "••••••••"}),
  password_hint: message({"pt-BR": "Mínimo 6 caracteres", "en": "Minimum 6 characters", "es": "Mínimo 6 caracteres"}),
  continue_with: message({"pt-BR": "Continuar com {{provider}}", "en": "Continue with {{provider}}", "es": "Continuar con {{provider}}"}),
  welcome_user: message({"pt-BR": "Olá, {{name}}!", "en": "Hi, {{name}}!", "es": "Hola, {{name}}!"}),
  register_page_title: message({"pt-BR": "Criar Conta", "en": "Create Account", "es": "Crear Cuenta"}),
  register_page_subtitle: message({"pt-BR": "Junte-se à comunidade de jam sessions", "en": "Join the jam session community", "es": "Únete a la comunidad de jam sessions"}),
  register_how_it_works: message({"pt-BR": "Como funciona:", "en": "How it works:", "es": "Cómo funciona:"}),
  register_how_it_works_desc: message({"pt-BR": "Insira seu email ou telefone para criar sua conta. Seu perfil de músico será criado automaticamente no primeiro login!", "en": "Enter your email or phone to create your account. Your musician profile will be created automatically on your first login!", "es": "Ingresa tu correo o teléfono para crear tu cuenta. ¡Tu perfil de músico se creará automáticamente en tu primer inicio de sesión!"}),
  login_here: message({"pt-BR": "Entrar aqui →", "en": "Login here →", "es": "Inicia sesión aquí →"}),
  back_to_home: message({"pt-BR": "← Voltar ao Início", "en": "← Back to Home", "es": "← Volver al Inicio"}),
  login_page_title: message({"pt-BR": "The Jam App", "en": "Jam App", "es": "The Jam App"}),
  login_page_supabase_desc: message({"pt-BR": "Entre com seu email ou conta social", "en": "Sign in to your account with your email or social account", "es": "Inicia sesión en tu cuenta con tu correo o red social"}),
  login_page_simple_desc: message({"pt-BR": "Entre ou crie sua conta de músico", "en": "Login or create your musician account", "es": "Inicia sesión o crea tu cuenta de músico"}),
  completing_sign_in: message({"pt-BR": "Concluindo entrada...", "en": "Completing sign in...", "es": "Completando inicio de sesión..."}),
  go_home: message({"pt-BR": "Ir para o Início", "en": "Go Home", "es": "Ir al Inicio"}),
  try_again: message({"pt-BR": "Tentar Novamente", "en": "Try Again", "es": "Reintentar"}),
  email_verification: {
    title: message({"pt-BR": "Verifique seu Email", "en": "Check Your Email", "es": "Revisa tu Correo"}),
    description: message({"pt-BR": "Enviamos um link de verificação para seu email. Por favor, clique no link para verificar sua conta e completar o login.", "en": "We sent a verification link to your email address. Please click the link to verify your account and complete the sign-in process.", "es": "Enviamos un enlace de verificación a tu correo electrónico. Por favor, haz clic en el enlace para verificar tu cuenta y completar el inicio de sesión."}),
    check_spam: message({"pt-BR": "Se não encontrar o email, verifique sua pasta de spam.", "en": "If you don't see the email, check your spam folder.", "es": "Si no ves el correo, revisa tu carpeta de spam."}),
    back_to_login: message({"pt-BR": "Voltar ao Login", "en": "Back to Login", "es": "Volver al Login"})
  },
  sign_up_errors: {
    email_already_registered: message({"pt-BR": "Este email já está cadastrado. Entre na sua conta ou redefina sua senha.", "en": "This email is already registered. Sign in or reset your password.", "es": "Este correo ya está registrado. Inicia sesión o restablece tu contraseña."}),
    unexpected_response: message({"pt-BR": "Não foi possível criar sua conta. Tente novamente.", "en": "We couldn't create your account. Please try again.", "es": "No pudimos crear tu cuenta. Inténtalo de nuevo."})
  },
  errors: {
    configuration: message({"pt-BR": "A autenticação não está configurada. Tente novamente mais tarde.", "en": "Authentication is not configured. Please try again later.", "es": "La autenticación no está configurada. Inténtalo de nuevo más tarde."}),
    profile_load_failed: message({"pt-BR": "Não foi possível carregar seu perfil. Tente entrar novamente.", "en": "We couldn't load your profile. Please sign in again.", "es": "No pudimos cargar tu perfil. Inicia sesión nuevamente."}),
    session_missing: message({"pt-BR": "Não foi possível iniciar sua sessão. Tente novamente.", "en": "We couldn't start your session. Please try again.", "es": "No pudimos iniciar tu sesión. Inténtalo de nuevo."}),
    login_failed: message({"pt-BR": "Não foi possível entrar. Tente novamente.", "en": "We couldn't sign you in. Please try again.", "es": "No pudimos iniciar sesión. Inténtalo de nuevo."}),
    oauth_failed: message({"pt-BR": "Não foi possível entrar com esta conta. Tente novamente.", "en": "We couldn't sign you in with that account. Please try again.", "es": "No pudimos iniciar sesión con esa cuenta. Inténtalo de nuevo."}),
    password_reset_failed: message({"pt-BR": "Não foi possível enviar o email de redefinição. Tente novamente.", "en": "We couldn't send the password reset email. Please try again.", "es": "No pudimos enviar el correo de restablecimiento. Inténtalo de nuevo."}),
    not_authenticated: message({"pt-BR": "Sua sessão expirou. Entre novamente para continuar.", "en": "Your session has expired. Please sign in again to continue.", "es": "Tu sesión expiró. Inicia sesión nuevamente para continuar."}),
    profile_update_failed: message({"pt-BR": "Não foi possível atualizar seu perfil. Tente novamente.", "en": "We couldn't update your profile. Please try again.", "es": "No pudimos actualizar tu perfil. Inténtalo de nuevo."})
  },
  error: {
    title: message({"pt-BR": "Falha na Autenticação", "en": "Authentication Failed", "es": "Autenticación Fallida"}),
    timeout: message({"pt-BR": "A autenticação está demorando muito. Por favor, tente novamente.", "en": "Authentication is taking too long. Please try again.", "es": "La autenticación está tardando demasiado. Por favor, inténtalo de nuevo."})
  }
} as const satisfies CatalogueTree
