import {message, plural, type CatalogueTree} from './index'

export const homepage = {
  hero: {
    title: message({"pt-BR": "Organize Jams sem Bagunça", "en": "Run Your Jam Without the Chaos", "es": "Organiza tu Noche de Jam sin Caos"}),
    subtitle: message({"pt-BR": "Para anfitriões, músicos e casas de show", "en": "For hosts, musicians, and venues", "es": "Para anfitriones, músicos y locales"}),
    description: message({"pt-BR": "O anfitrião monta o setlist.\nOs músicos se inscrevem nas músicas.\nO público acompanha tudo numa tela ao vivo.\nSem grupo de WhatsApp. Sem planilha. Só música.", "en": "Hosts build the setlist.\nMusicians sign up for songs.\nThe audience watches it all on a live screen.\nNo group chats. No spreadsheets. Just music.", "es": "El anfitrión arma el setlist.\nLos músicos se inscriben en las canciones.\nEl público lo sigue todo en una pantalla en vivo.\nSin grupos de WhatsApp. Sin planillas. Solo música."}),
    cta_button: message({"pt-BR": "Começar", "en": "Get Started", "es": "Empezar"}),
    cta_secondary: message({"pt-BR": "Explorar Jams", "en": "Browse Jams", "es": "Explorar Jams"}),
    live_label: message({"pt-BR": "AO VIVO", "en": "LIVE", "es": "EN VIVO"}),
    mock_jam_name: message({"pt-BR": "Jam de Sexta", "en": "Friday Night Jam", "es": "Jam del Viernes"})
  },
  stats: {
    title: message({"pt-BR": "Já sendo usado em noites de jam", "en": "Already being used in jam", "es": "Ya se usa en noches de jam"}),
    sessions: message({"pt-BR": "Jams Criados", "en": "Jams Created", "es": "Jams Creados"}),
    musicians: message({"pt-BR": "Músicos", "en": "Musicians", "es": "Músicos"}),
    songs: message({"pt-BR": "Músicas Tocadas", "en": "Songs Played", "es": "Canciones Tocadas"})
  },
  how_it_works: {
    title: message({"pt-BR": "Como Funciona", "en": "How It Works", "es": "Cómo Funciona"}),
    subtitle: message({"pt-BR": "Da criação ao palco em três passos", "en": "From setup to showtime in three steps", "es": "De la creación al escenario en tres pasos"}),
    step1_title: message({"pt-BR": "Crie um Jam", "en": "Create a Jam", "es": "Crea un Jam"}),
    step1_desc: message({"pt-BR": "Escolha uma data, adicione músicas e compartilhe o link. Os músicos encontram seu jam e veem quais vagas estão abertas.", "en": "Pick a date, add songs, and share the link. Musicians can find your jam and see what slots are open.", "es": "Elige una fecha, agrega canciones y comparte el link. Los músicos pueden encontrar tu jam y ver qué puestos están libres."}),
    step2_title: message({"pt-BR": "Músicos se Inscrevem", "en": "Musicians Sign Up", "es": "Los Músicos se Inscriben"}),
    step2_desc: message({"pt-BR": "Eles escolhem a música, o instrumento, e você aprova quem toca o quê. Tudo antes da noite começar.", "en": "They pick a song, choose their instrument, and you approve who plays what. All before the night starts.", "es": "Eligen una canción, su instrumento, y vos aprobás quién toca qué. Todo antes de que empiece la noche."}),
    step3_title: message({"pt-BR": "Dê o Play", "en": "Go Live", "es": "Dale Play"}),
    step3_desc: message({"pt-BR": "O painel ao vivo mostra o que tá tocando agora, o que vem a seguir e quem tá no palco. Coloque numa tela pro público.", "en": "Hit play. The live dashboard shows what's happening now, what's next, and who's on stage. Put it on a screen for the crowd.", "es": "El panel en vivo muestra qué suena ahora, qué sigue y quién está en escena. Ponelo en una pantalla para el público."})
  },
  testimonials: {
    title: message({"pt-BR": "Por que as pessoas usam", "en": "Why people use it", "es": "Por qué lo usan"}),
    subtitle: message({"pt-BR": "Opiniões de hosts e músicos", "en": "Feedback from hosts and musicians", "es": "Opiniones reales de anfitriones y músicos"}),
    host_quote: message({"pt-BR": "Eu gastava 30 minutos antes de cada jam organizando quem toca o quê. Agora já tá tudo pronto quando eu chego.", "en": "I used to spend 30 minutes before every jam sorting out who plays what. Now it's already done when I walk in.", "es": "Antes gastaba 30 minutos antes de cada jam organizando quién toca qué. Ahora ya está todo listo cuando llego."}),
    host_name: message({"pt-BR": "Anfitrião de jam", "en": "Jam host", "es": "Anfitrión de jam"}),
    host_role: message({"pt-BR": "Organizador semanal", "en": "Weekly jam organizer", "es": "Organizador semanal"}),
    musician_quote: message({"pt-BR": "Consigo ver quais músicas ainda precisam de guitarrista e me inscrever direto do celular. Muito melhor do que ficar perguntando.", "en": "I can see which songs still need a guitarist and sign up right from my phone. Way better than asking around.", "es": "Puedo ver qué canciones necesitan guitarrista e inscribirme desde el celular. Mucho mejor que andar preguntando."}),
    musician_name: message({"pt-BR": "Músico", "en": "Musician", "es": "Músico"}),
    musician_role: message({"pt-BR": "Guitarrista", "en": "Guitarist", "es": "Guitarrista"}),
    venue_quote: message({"pt-BR": "Colocamos o painel ao vivo na TV do bar. O pessoal adora ver o que vem a seguir.", "en": "We put the live dashboard on the bar TV. People love seeing what's coming up next.", "es": "Pusimos el panel en vivo en la tele del bar. A la gente le encanta ver qué viene después."}),
    venue_name: message({"pt-BR": "Dono do bar", "en": "Venue host", "es": "Dueño de local"}),
    venue_role: message({"pt-BR": "Bar", "en": "Bar owner", "es": "Bar"})
  },
  call_to_action: {
    title: message({"pt-BR": "Quer experimentar?", "en": "Ready to try it?", "es": "Listo para probarlo?"}),
    description: message({"pt-BR": "Crie seu primeiro jam em alguns minutos. Adicione as músicas, compartilhe o link e deixe os músicos se inscreverem.", "en": "Create your first jam in a couple of minutes. Add your songs, share the link, and let musicians sign up.", "es": "Crea tu primer jam en un par de minutos. Agrega las canciones, comparte el link y dejá que los músicos se inscriban."}),
    cta_button: message({"pt-BR": "Criar um Jam", "en": "Create a Jam", "es": "Crear un Jam"}),
    browse_jams: message({"pt-BR": "Explorar Jams", "en": "Browse Jams", "es": "Explorar Jams"})
  }
} as const satisfies CatalogueTree
