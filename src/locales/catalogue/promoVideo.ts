import {message, plural, type CatalogueTree} from './index'

export const promoVideo = {
  appName: message({"pt-BR": "The Jam APP", "en": "The Jam APP", "es": "Jam App"}),
  tagline: message({"pt-BR": "Conecte. Apresente. Domine o palco.", "en": "Connect. Perform. Rock the stage.", "es": "Conecta. Actúa. Conquista el escenario."}),
  features: {
    title: message({"pt-BR": "Feito para Todos", "en": "Built for Everyone", "es": "Para Todos"}),
    hosts: {
      title: message({"pt-BR": "Anfitriões", "en": "Hosts", "es": "Anfitriones"}),
      description: message({"pt-BR": "Crie jams, gerencie filas e controle apresentações em tempo real", "en": "Create jams, manage queues, and control performances in real-time", "es": "Crea jams, gestiona colas y controla presentaciones en tiempo real"})
    },
    musicians: {
      title: message({"pt-BR": "Músicos", "en": "Musicians", "es": "Músicos"}),
      description: message({"pt-BR": "Cadastre-se em jams, escolha seu instrumento e suba ao palco", "en": "Register for jams, select your instrument, and join the stage", "es": "Registrate en jams, elige tu instrumento y sube al escenario"})
    },
    audience: {
      title: message({"pt-BR": "Público", "en": "Audience", "es": "Audiencia"}),
      description: message({"pt-BR": "Acompanhe dashboards ao vivo mostrando o que toca agora e o que vem a seguir", "en": "Watch live dashboards showing what's playing now and coming up next", "es": "Mira dashboards en vivo con lo que suena ahora y lo que viene"})
    }
  },
  howItWorks: {
    title: message({"pt-BR": "Como Funciona", "en": "How It Works", "es": "Como Funciona"}),
    step1: {
      title: message({"pt-BR": "Crie um Jam", "en": "Create a Jam", "es": "Crea un Jam"}),
      description: message({"pt-BR": "Configure sua sessão com listas de músicas", "en": "Set up your session with song lists", "es": "Configura tu sesión con listas de canciones"})
    },
    step2: {
      title: message({"pt-BR": "Músicos se Cadastram", "en": "Musicians Register", "es": "Músicos se Registran"}),
      description: message({"pt-BR": "Escolhem instrumentos e entram na fila", "en": "Pick instruments and join the lineup", "es": "Eligen instrumentos y se unen a la fila"})
    },
    step3: {
      title: message({"pt-BR": "Apresente ao Vivo", "en": "Perform Live", "es": "Actúa en Vivo"}),
      description: message({"pt-BR": "Suba ao palco e arrase", "en": "Take the stage and rock the house", "es": "Sube al escenario y arrasa"})
    }
  },
  dashboard: {
    title: message({"pt-BR": "Dashboard ao Vivo", "en": "Live Dashboard", "es": "Dashboard en Vivo"}),
    liveLabel: message({"pt-BR": "Ao Vivo - Jam de Sexta", "en": "Live - Friday Night Jam", "es": "En Vivo - Jam del Viernes"}),
    nowPlaying: message({"pt-BR": "Tocando Agora", "en": "Now Playing", "es": "Sonando Ahora"}),
    upNext: message({"pt-BR": "próxima", "en": "Up Next", "es": "Siguiente"}),
    scanToJoin: message({"pt-BR": "Escaneie para participar", "en": "Scan to join", "es": "Escanea para unirte"})
  },
  cta: {
    tagline: message({"pt-BR": "Seu palco está esperando", "en": "Your stage is waiting", "es": "Tu escenario te espera"}),
    button: message({"pt-BR": "Comece de Graça", "en": "Get Started Free", "es": "Empieza Gratis"})
  }
} as const satisfies CatalogueTree
