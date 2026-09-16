import {message, plural, type CatalogueTree} from './index'

export const nav = {
  home: message({"pt-BR": "Início", "en": "Home", "es": "Inicio"}),
  browse_jams: message({"pt-BR": "Explorar Jams", "en": "Browse Jams", "es": "Explorar Jams"}),
  jams: message({"pt-BR": "Jams", "en": "Jams", "es": "Jams"}),
  musicians: message({"pt-BR": "Músicos", "en": "Musicians", "es": "Músicos"}),
  music: message({"pt-BR": "Biblioteca Musical", "en": "Music", "es": "Música"}),
  music_library: message({"pt-BR": "Biblioteca Musical", "en": "Music Library", "es": "Biblioteca Musical"}),
  host_dashboard: message({"pt-BR": "Painel do Host", "en": "Host Dashboard", "es": "Panel de Control"}),
  create_jam: message({"pt-BR": "Criar Jam", "en": "Create Jam", "es": "Crear Jam"}),
  my_profile: message({"pt-BR": "Meu Perfil", "en": "My Profile", "es": "Mi Perfil"}),
  dashboard: message({"pt-BR": "Painel", "en": "Dashboard", "es": "Panel"}),
  logout: message({"pt-BR": "Sair", "en": "Logout", "es": "Cerrar Sesión"}),
  login_register: message({"pt-BR": "Entrar/Registrar", "en": "Login/Register", "es": "Iniciar Sesión/Registrarse"}),
  join: message({"pt-BR": "Participar", "en": "Join", "es": "Unirse"}),
  toggle_menu: message({"pt-BR": "Alternar menu de navegação", "en": "Toggle navigation menu", "es": "Alternar menu de navegación"}),
  main_navigation: message({"pt-BR": "Navegação principal", "en": "Main navigation", "es": "Navegación principal"}),
  footer_navigation: message({"pt-BR": "Navegação do rodapé", "en": "Footer navigation", "es": "Navegación del pie de página"}),
  user_menu: message({"pt-BR": "Menu do usuário", "en": "User menu", "es": "Menu del usuario"}),
  mobile_menu: message({"pt-BR": "Menu de navegação", "en": "Navigation menu", "es": "Menu de navegación"}),
  close_menu: message({"pt-BR": "Fechar menu", "en": "Close menu", "es": "Cerrar menu"}),
  login: message({"pt-BR": "Entrar", "en": "Login", "es": "Iniciar sesión"}),
  greeting: message({"pt-BR": "Ola, {{name}}", "en": "Hello, {{name}}", "es": "Hola, {{name}}"}),
  settings: message({"pt-BR": "Configurações", "en": "Settings", "es": "Configuración"}),
  for_hosts: message({"pt-BR": "Para anfitriões", "en": "For Hosts", "es": "Para anfitriones"}),
  about: message({"pt-BR": "Sobre o Jam App", "en": "About Jam App", "es": "Acerca de Jam App"})
} as const satisfies CatalogueTree
