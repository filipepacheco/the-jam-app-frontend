import { next } from '@vercel/functions';
import { matchRoute, buildHomeJsonLd, buildBrowseJsonLd, buildAboutJsonLd, buildJamJsonLd, type JamData } from './site.config';

// --- Social media crawler detection ---
// These bots parse OG tags for link previews. They do NOT follow meta-refresh redirects.
const CRAWLER_UAS = [
  'WhatsApp',
  'facebookexternalhit',
  'Facebot',
  'TelegramBot',
  'Twitterbot',
  'LinkedInBot',
  'Discordbot',
  'Slackbot',
  'Slackbot-LinkExpanding',
];

function isCrawler(ua: string): boolean {
  const lower = ua.toLowerCase();
  return CRAWLER_UAS.some((bot) => lower.includes(bot.toLowerCase()));
}

// --- Search engine crawler detection ---
// Search engine bots follow meta-refresh redirects (causing infinite loops), so they receive
// the same content-rich HTML as social bots but WITHOUT the meta-refresh tag.
// This also fixes the duplicate-title/H1 issue: Googlebot gets a unique title and H1
// per jam page instead of the generic SPA shell.
const SEARCH_ENGINE_UAS = [
  'Googlebot',
  'bingbot',
  'Baiduspider',
  'YandexBot',
  'DuckDuckBot',
  'Applebot',
  'PetalBot',
  'Bytespider',
  // AI crawlers - serve clean HTML so AI systems can cite content accurately
  'GPTBot',
  'ClaudeBot',
  'Claude-Web',
  'anthropic-ai',
  'PerplexityBot',
  'CCBot',
];

function isSearchEngine(ua: string): boolean {
  const lower = ua.toLowerCase();
  return SEARCH_ENGINE_UAS.some((bot) => lower.includes(bot.toLowerCase()));
}

// --- API fetch ---

async function fetchJam(identifier: string): Promise<JamData | null> {
  const apiUrl = process.env.API_URL;
  if (!apiUrl) return null;

  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 3000);

    const res = await fetch(`${apiUrl}/jams/${encodeURIComponent(identifier)}`, {
      signal: controller.signal,
      headers: { Accept: 'application/json' },
    });
    clearTimeout(timeout);

    if (!res.ok) return null;

    const data = await res.json();
    return data as JamData;
  } catch {
    return null;
  }
}

// --- Portuguese default texts ---
// Deliberately not shared with the client's i18n text - middleware serves
// Portuguese to all bots regardless of ?lng=, avoiding the "alternative page
// with proper canonical tag" GSC errors ?lng= alternates used to cause.

const PT = {
  siteName: 'Jam App',
  homeTitle: 'Organize sua Jam Session ao Vivo | Jam App',
  homeDescription:
    'Crie e gerencie jam sessions ao vivo. Hosts organizam eventos, musicos se inscrevem em musicas e o publico acompanha tudo em tempo real.',
  homeFeatureList: [
    'Criar e gerenciar jam sessions ao vivo',
    'Painel publico em tempo real',
    'Inscricao de musicos por instrumento',
    'Controle de setlist e ordem das musicas',
    'QR code para compartilhar jams',
    'Importar playlists do Spotify',
  ],
  browseTitle: 'Encontre Jam Sessions Perto de Voce | Jam App',
  browseName: 'Explorar Jam Sessions',
  // <meta name="description"> text for the browse page
  browseDescription:
    'Encontre jam sessions e open mics perto de voce. Participe como musico ou acompanhe ao vivo pelo painel publico.',
  // CollectionPage.description in the JSON-LD - deliberately distinct from the
  // meta description above; both are already indexed, so neither may drift.
  browseCollectionDescription:
    'Encontre e participe de jam sessions ao vivo, open mics e eventos musicais na sua regiao.',
  homeOrganizationDescription:
    'Plataforma gratuita para organizar jam sessions ao vivo. Hosts gerenciam eventos, musicos se inscrevem e o publico acompanha em tempo real.',
  dashboardSuffix: 'Painel Ao Vivo',
  registerSuffix: 'Inscreva-se',
  fallbackJamDescription: 'Participe desta jam session no Jam App. Inscreva-se como musico ou acompanhe ao vivo.',
  aboutTitle: 'Sobre o Jam App | Jam App',
  aboutName: 'Sobre o Jam App',
  aboutDescription:
    'O Jam App e uma plataforma gratuita para organizar jam sessions ao vivo. Hosts gerenciam eventos, musicos se inscrevem por instrumento e o publico acompanha em tempo real.',
  aboutContactEmail: 'contato@jamapp.com.br',
  // Breadcrumb labels - Portuguese, matching the rest of the bot-facing text
  breadcrumbHome: 'Inicio',
  breadcrumbBrowse: 'Jam Sessions',
  breadcrumbAbout: 'Sobre',
};

const HOME_BODY = `
  <main>
    <h1>Organize sua Jam Session ao Vivo</h1>
    <p>A forma mais facil de organizar uma noite de jam. O anfitriao monta o setlist, os musicos se inscrevem e o publico acompanha tudo numa tela ao vivo.</p>
    <section>
      <h2>Como funciona</h2>
      <ul>
        <li>Hosts criam jam sessions com data, local e setlist</li>
        <li>Musicos se inscrevem por instrumento: guitarra, baixo, bateria, teclado, vocais</li>
        <li>O publico acompanha ao vivo pelo painel publico em tempo real</li>
        <li>Controle de setlist e ordem das musicas durante o evento</li>
        <li>Compartilhe a jam via QR code ou link curto</li>
        <li>Importe playlists do Spotify para montar o setlist</li>
      </ul>
    </section>
    <section>
      <h2>Para quem e o Jam App?</h2>
      <ul>
        <li><strong>Anfitrioes</strong>: organize eventos musicais, aprove inscricoes e controle o setlist ao vivo</li>
        <li><strong>Musicos</strong>: encontre jams, inscreva-se em musicas e gerencie sua agenda de performances</li>
        <li><strong>Publico</strong>: acompanhe qual musica esta tocando agora e quem esta no palco</li>
      </ul>
    </section>
    <section>
      <h2>Recursos</h2>
      <ul>
        <li>Criacao e gerenciamento de jam sessions ao vivo</li>
        <li>Painel publico em tempo real para a plateia</li>
        <li>Inscricao de musicos por instrumento</li>
        <li>Controle completo de setlist e ordem das musicas</li>
        <li>QR code e links curtos para compartilhamento rapido</li>
        <li>Importacao de playlists do Spotify</li>
        <li>Suporte a multiplos idiomas: portugues, ingles e espanhol</li>
      </ul>
    </section>
    <nav>
      <a href="/jams">Explorar Jam Sessions</a>
      <a href="/register">Criar Conta Gratis</a>
    </nav>
  </main>`;

const BROWSE_BODY = `
  <main>
    <h1>Encontre Jam Sessions Perto de Voce</h1>
    <p>Explore jam sessions ao vivo, open mics e eventos musicais. Veja o setlist, os musicos inscritos e acompanhe o evento em tempo real.</p>
    <p>Navegue pelas jam sessions ativas, filtre por status e encontre a proxima jam perto de voce. Inscricao gratuita para musicos.</p>
    <nav>
      <a href="/">Pagina Inicial</a>
      <a href="/register">Criar Conta</a>
    </nav>
  </main>`;

const ABOUT_BODY = `
  <main>
    <h1>Sobre o Jam App</h1>
    <p>O Jam App e uma plataforma gratuita feita para quem ama musica ao vivo. Facilitamos a organizacao de jam sessions, open mics e eventos musicais - sem planilhas, sem grupos de WhatsApp, apenas uma ferramenta simples que funciona.</p>
    <section>
      <h2>Por que criamos isso?</h2>
      <p>Viamos anfitrioes fazendo malabarismos com grupos de WhatsApp, planilhas e listas de papel para organizar uma noite de jam. Musicos nao sabiam que musicas iam tocar ate chegar no palco. O publico ficava perdido sem saber o que estava acontecendo. O Jam App resolve tudo isso num so lugar.</p>
    </section>
    <section>
      <h2>Feito para tres papeis</h2>
      <ul>
        <li><strong>Anfitrioes</strong>: criem jams, montem o setlist, aprovem inscricoes e controlem o show ao vivo</li>
        <li><strong>Musicos</strong>: encontrem jams, inscrevam-se por instrumento e acompanhem a agenda</li>
        <li><strong>Publico</strong>: acompanhem ao vivo pelo painel publico, sem precisar de conta</li>
      </ul>
    </section>
    <section>
      <h2>No que acreditamos</h2>
      <ul>
        <li><strong>Gratuito para todos</strong>: sem planos pagos, sem limite de jams ou musicos</li>
        <li><strong>Privacidade em primeiro lugar</strong>: coletamos apenas o necessario para o app funcionar</li>
      </ul>
    </section>
    <nav>
      <a href="/">Pagina Inicial</a>
      <a href="/jams">Explorar Jam Sessions</a>
      <p>Contato: contato@jamapp.com.br</p>
    </nav>
  </main>`;

// --- HTML generation ---

function buildOgHtml(opts: {
  title: string;
  description: string;
  url: string;
  image?: string;
  type?: string;
  locale?: string;
  jsonLd?: Record<string, unknown> | Record<string, unknown>[];
  bodyHtml?: string;
  noRedirect?: boolean;
}): string {
  const {
    title,
    description,
    url,
    image = '',
    type = 'website',
    locale = 'pt_BR',
    jsonLd,
    bodyHtml,
    noRedirect = false,
  } = opts;

  const esc = (s: string) =>
    s.replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

  const imageTag = image
    ? `<meta property="og:image" content="${esc(image)}" />\n    <meta property="og:image:width" content="1200" />\n    <meta property="og:image:height" content="630" />\n    <meta name="twitter:image" content="${esc(image)}" />`
    : '';

  const jsonLdTag = jsonLd
    ? `<script type="application/ld+json">${JSON.stringify(
        Array.isArray(jsonLd)
          ? { '@context': 'https://schema.org', '@graph': jsonLd }
          : { '@context': 'https://schema.org', ...jsonLd },
      )}</script>`
    : '';

  const body = bodyHtml ?? `<p>Redirecionando para <a href="${esc(url)}">${esc(title)}</a>...</p>`;

  // Only redirect real browsers (social bot UA edge case). Search engines follow
  // meta-refresh and would create infinite redirect loops - omit for them.
  const metaRefresh = noRedirect
    ? ''
    : `\n  <meta http-equiv="refresh" content="0;url=${esc(url)}" />`;

  // No hreflang tags: the middleware serves Portuguese to all crawlers regardless of ?lng=,
  // so ?lng= alternates cause "alternative page with proper canonical tag" errors in GSC.

  return `<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="utf-8" />
  <title>${esc(title)}</title>
  <meta name="description" content="${esc(description)}" />
  <link rel="canonical" href="${esc(url)}" />

  <!-- Open Graph -->
  <meta property="og:type" content="${esc(type)}" />
  <meta property="og:title" content="${esc(title)}" />
  <meta property="og:description" content="${esc(description)}" />
  <meta property="og:url" content="${esc(url)}" />
  <meta property="og:site_name" content="${esc(PT.siteName)}" />
  <meta property="og:locale" content="${esc(locale)}" />
  ${imageTag}

  <!-- Twitter Card -->
  <meta name="twitter:card" content="summary_large_image" />
  <meta name="twitter:title" content="${esc(title)}" />
  <meta name="twitter:description" content="${esc(description)}" />

  ${jsonLdTag}${metaRefresh}
</head>
<body>
  ${body}
</body>
</html>`;
}

// --- Middleware handler ---

export default function middleware(request: Request) {
  const ua = request.headers.get('user-agent') || '';
  const crawlerRequest = isCrawler(ua);
  const searchEngineRequest = !crawlerRequest && isSearchEngine(ua);

  if (!crawlerRequest && !searchEngineRequest) return next();

  const url = new URL(request.url);
  const route = matchRoute(url.pathname);
  if (!route) return next();

  const siteUrl = process.env.SITE_URL || url.origin;
  const ogImage = `${siteUrl}/og-image.jpg`;
  // Search engines follow meta-refresh - skip the redirect to prevent infinite loops
  const noRedirect = searchEngineRequest;

  switch (route.kind) {
    case 'home': {
      // Ensure trailing slash on canonical home URL
      const homeUrl = siteUrl.endsWith('/') ? siteUrl : `${siteUrl}/`;
      return new Response(
        buildOgHtml({
          title: PT.homeTitle,
          description: PT.homeDescription,
          url: homeUrl,
          image: ogImage,
          jsonLd: buildHomeJsonLd(siteUrl, {
            description: PT.homeDescription,
            organizationDescription: PT.homeOrganizationDescription,
            featureList: PT.homeFeatureList,
            pageLanguage: 'pt-BR',
          }),
          bodyHtml: HOME_BODY,
          noRedirect,
        }),
        { headers: htmlHeaders() },
      );
    }

    case 'browse':
      return new Response(
        buildOgHtml({
          title: PT.browseTitle,
          description: PT.browseDescription,
          url: `${siteUrl}/jams`,
          image: ogImage,
          jsonLd: buildBrowseJsonLd(siteUrl, {
            name: PT.browseName,
            description: PT.browseCollectionDescription,
            breadcrumbs: { home: PT.breadcrumbHome, browse: PT.breadcrumbBrowse },
          }),
          bodyHtml: BROWSE_BODY,
          noRedirect,
        }),
        { headers: htmlHeaders() },
      );

    case 'about':
      return new Response(
        buildOgHtml({
          title: PT.aboutTitle,
          description: PT.aboutDescription,
          url: `${siteUrl}/about`,
          image: ogImage,
          jsonLd: buildAboutJsonLd(siteUrl, {
            name: PT.aboutName,
            description: PT.aboutDescription,
            contactEmail: PT.aboutContactEmail,
            breadcrumbs: { home: PT.breadcrumbHome, about: PT.breadcrumbAbout },
          }),
          bodyHtml: ABOUT_BODY,
          noRedirect,
        }),
        { headers: htmlHeaders() },
      );

    case 'jam-detail':
    case 'jam-dashboard':
    case 'jam-register':
      return handleJamRoute(route.identifier, route.kind, siteUrl, ogImage, url.pathname, noRedirect);

    case 'short-code':
      return handleJamRoute(route.code, 'jam-detail', siteUrl, ogImage, url.pathname, noRedirect);

    case 'slug':
      return handleJamRoute(route.slug, 'jam-detail', siteUrl, ogImage, url.pathname, noRedirect);
  }
}

async function handleJamRoute(
  identifier: string,
  variant: 'jam-detail' | 'jam-dashboard' | 'jam-register',
  siteUrl: string,
  ogImage: string,
  pathname: string,
  noRedirect: boolean,
): Promise<Response> {
  const jam = await fetchJam(identifier);

  let title: string;
  let description: string;
  let canonicalUrl: string;
  let bodyHtml: string | undefined;
  let jsonLd: Record<string, unknown>[] | undefined;

  if (jam) {
    const jamPath = jam.slug ? `/jams/${jam.slug}` : `/jams/${identifier}`;

    switch (variant) {
      case 'jam-dashboard':
        title = `${jam.name} - ${PT.dashboardSuffix} | ${PT.siteName}`;
        canonicalUrl = `${siteUrl}${jamPath}/dashboard`;
        break;
      case 'jam-register':
        title = `${PT.registerSuffix} - ${jam.name} | ${PT.siteName}`;
        canonicalUrl = `${siteUrl}${jamPath}/register`;
        break;
      default:
        title = `${jam.name} | ${PT.siteName}`;
        canonicalUrl = `${siteUrl}${jamPath}`;
        break;
    }

    const parts: string[] = [];
    if (jam.description) parts.push(jam.description);
    if (jam.location) parts.push(`Local: ${jam.location}`);
    if (jam.hostName) parts.push(`Host: ${jam.hostName}`);
    description = parts.length > 0 ? parts.join(' | ') : PT.fallbackJamDescription;

    const esc = (s: string) =>
      s.replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

    const details: string[] = [];
    if (jam.location) details.push(`<li>Local: ${esc(jam.location)}</li>`);
    if (jam.date)
      details.push(`<li>Data: ${esc(new Date(jam.date).toLocaleDateString('pt-BR'))}</li>`);
    if (jam.hostName) details.push(`<li>Host: ${esc(jam.hostName)}</li>`);
    if (jam.status) details.push(`<li>Status: ${esc(jam.status)}</li>`);

    // H1 is the jam name - not the full title string - so Googlebot sees unique content per page
    bodyHtml = `
  <main>
    <h1>${esc(jam.name)}</h1>
    <p>${esc(description)}</p>
    ${details.length > 0 ? `<ul>${details.join('')}</ul>` : ''}
  </main>`;

    // MusicEvent schema on detail and dashboard pages (not registration page)
    // Always use the canonical jam detail URL for the event, not dashboard/register variants
    if (variant !== 'jam-register') {
      const jamCanonicalUrl = `${siteUrl}${jamPath}`;
      jsonLd = buildJamJsonLd(jam, jamCanonicalUrl, siteUrl, {
        fallbackDescription: PT.fallbackJamDescription,
        breadcrumbs: { home: PT.breadcrumbHome, browse: PT.breadcrumbBrowse },
      });
    }
  } else {
    // Jam not found - return 404 to prevent soft 404 issues with search engines.
    // Always set noRedirect: true for 404 pages to prevent meta-refresh self-redirect loops.
    title = `Pagina nao encontrada | ${PT.siteName}`;
    description = PT.fallbackJamDescription;
    canonicalUrl = `${siteUrl}${pathname}`;
    bodyHtml = `
  <main>
    <h1>Pagina nao encontrada</h1>
    <p>A jam session que voce procura nao foi encontrada.</p>
    <nav>
      <a href="/">Pagina Inicial</a>
      <a href="/jams">Explorar Jam Sessions</a>
    </nav>
  </main>`;

    return new Response(
      buildOgHtml({ title, description, url: canonicalUrl, image: ogImage, bodyHtml, noRedirect: true }),
      { status: 404, headers: htmlHeaders() },
    );
  }

  return new Response(
    buildOgHtml({ title, description, url: canonicalUrl, image: ogImage, bodyHtml, jsonLd, noRedirect }),
    { headers: htmlHeaders() },
  );
}

function htmlHeaders(): Record<string, string> {
  return {
    'Content-Type': 'text/html; charset=utf-8',
    'Cache-Control': 'public, s-maxage=300, stale-while-revalidate=600',
    Vary: 'User-Agent',
  };
}

// --- Vercel matcher config ---

export const config = {
  matcher: ['/', '/jams', '/jams/:path*', '/j/:path*', '/:slug'],
};
