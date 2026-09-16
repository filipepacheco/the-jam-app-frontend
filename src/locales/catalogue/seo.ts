import {message, plural, type CatalogueTree} from './index'

export const seo = {
  homepage: {
    title: message({"pt-BR": "Organize suas Jams", "en": "Organize your Jams", "es": "Organiza tus Jams"}),
    description: message({"pt-BR": "Organize sessões de jam com setlist ao vivo, inscrição de músicos e painel público para a plateia. Grátis para anfitriões e músicos.", "en": "Organize jam sessions with a live setlist, musician sign-ups, and a public dashboard for the audience. Free for hosts and musicians.", "es": "Organiza sesiones de jam con setlist en vivo, inscripción de músicos y un panel público para el público. Gratis para anfitriones y músicos."}),
    description_enhanced: message({"pt-BR": "O jeito mais fácil de organizar uma noite de jam. O anfitrião monta o setlist, os músicos se inscrevem e o público acompanha tudo numa tela ao vivo.", "en": "The easiest way to run a jam. Hosts build the setlist, musicians sign up for songs, and the audience follows along on a live screen. No spreadsheets needed.", "es": "La forma más fácil de organizar una noche de jam. El anfitrión arma el setlist, los músicos se inscriben y el público sigue todo en una pantalla en vivo."}),
    keywords: message({"pt-BR": "sessão de jam, noite de jam, música ao vivo, setlist, inscrição de músicos, organizador de jam, evento musical", "en": "jam session, jam, open mic, live music, setlist, musician sign up, jam organizer, music event", "es": "sesión de jam, noche de jam, música en vivo, setlist, inscripción de músicos, organizador de jam, evento musical"})
  },
  browse: {
    title: message({"pt-BR": "Encontre Jam Sessions Perto de Você", "en": "Browse Jam Sessions Near You", "es": "Encuentra Jam Sessions Cerca de Ti"}),
    description: message({"pt-BR": "Encontre e participe de jam sessions ao vivo, open mics e eventos musicais na sua região. Veja as próximas jams, inscreva-se em músicas e conecte-se com músicos locais.", "en": "Find and join live jam sessions, open mics, and music events in your area. Browse upcoming jams, sign up for songs, and connect with local musicians.", "es": "Encuentra y unete a jam sessions en vivo, open mics y eventos musicales en tu zona. Explora las próximas jams, registrate en canciones y conecta con músicos locales."}),
    keywords: message({"pt-BR": "jam sessions, eventos musicais, open mic, noite de jam, encontrar jam sessions, eventos de música ao vivo", "en": "jam sessions, live music events, open mic nights, music meetups, jam, find jam sessions, local music events", "es": "jam sessions, eventos musicales, open mic, noche de jam, encontrar jam sessions, eventos de musica en vivo"})
  },
  jam: {
    fallback_description: message({"pt-BR": "Jam session no Jam App. Participe como músico ou acompanhe ao vivo.", "en": "Jam session on Jam App. Join as a musician or watch live.", "es": "Jam session en Jam App. Participa como músico o mira en vivo."})
  },
  features: {
    create_jams: message({"pt-BR": "Criar e gerenciar jam sessions ao vivo", "en": "Create and manage live jam sessions", "es": "Crear y gestionar jam sessions en vivo"}),
    live_dashboard: message({"pt-BR": "Painel público em tempo real para o público", "en": "Real-time public dashboard for the audience", "es": "Panel publico en tiempo real para el publico"}),
    musician_registration: message({"pt-BR": "Inscrição de músicos por instrumento", "en": "Musician registration by instrument", "es": "Registro de musicos por instrumento"}),
    setlist_control: message({"pt-BR": "Controle de setlist e ordem das músicas", "en": "Setlist control and song ordering", "es": "Control de setlist y orden de canciones"}),
    qr_sharing: message({"pt-BR": "QR code para compartilhar jams", "en": "QR code sharing for jams", "es": "Codigo QR para compartir jams"}),
    spotify_import: message({"pt-BR": "Importar playlists do Spotify", "en": "Import playlists from Spotify", "es": "Importar playlists de Spotify"})
  }
} as const satisfies CatalogueTree
