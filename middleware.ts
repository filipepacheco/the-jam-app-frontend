import { next } from '@vercel/functions';

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

// --- Route matching ---

const STATIC_ROUTES = new Set([
  'login',
  'register',
  'profile',
  'music',
  'musicians',
  'host',
  'auth',
  'privacy',
  'robots.txt',
  'sitemap.xml',
  'llms.txt',
  'og-image.jpg',
  'jams',
  'about',
]);

type RouteMatch =
  | { type: 'home' }
  | { type: 'browse' }
  | { type: 'jam-detail'; identifier: string }
  | { type: 'jam-dashboard'; identifier: string }
  | { type: 'jam-register'; identifier: string }
  | { type: 'short-code'; code: string }
  | { type: 'slug'; slug: string }
  | null;

function matchRoute(pathname: string): RouteMatch {
  if (pathname === '/') return { type: 'home' };
  if (pathname === '/jams' || pathname === '/jams/') return { type: 'browse' };

  // /jams/:jamId/dashboard
  const dashboardMatch = pathname.match(/^\/jams\/([^/]+)\/dashboard\/?$/);
  if (dashboardMatch) return { type: 'jam-dashboard', identifier: dashboardMatch[1] };

  // /jams/:jamId/register
  const registerMatch = pathname.match(/^\/jams\/([^/]+)\/register\/?$/);
  if (registerMatch) return { type: 'jam-register', identifier: registerMatch[1] };

  // /jams/:jamId
  const jamMatch = pathname.match(/^\/jams\/([^/]+)\/?$/);
  if (jamMatch) return { type: 'jam-detail', identifier: jamMatch[1] };

  // /j/:code
  const shortMatch = pathname.match(/^\/j\/([^/]+)\/?$/);
  if (shortMatch) return { type: 'short-code', code: shortMatch[1] };

  // /:slug (exclude static routes and files with extensions)
  const slugMatch = pathname.match(/^\/([^/]+)\/?$/);
  if (slugMatch) {
    const segment = slugMatch[1];
    if (STATIC_ROUTES.has(segment)) return null;
    if (segment.includes('.')) return null;
    return { type: 'slug', slug: segment };
  }

  return null;
}

// --- API fetch ---

interface JamData {
  name: string;
  description: string | null;
  slug: string | null;
  shortCode: string | null;
  status: string;
  hostName: string | null;
  location: string | null;
  date: string | null;
}

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

const PT = {
  siteName: 'Jam App',
  homeTitle: 'Organize sua Jam Session ao Vivo | Jam App',
  homeDescription:
    'Crie e gerencie jam sessions ao vivo. Hosts organizam eventos, musicos se inscrevem em musicas e o publico acompanha tudo em tempo real.',
  browseTitle: 'Encontre Jam Sessions Perto de Voce | Jam App',
  browseDescription:
    'Encontre jam sessions e open mics perto de voce. Participe como musico ou acompanhe ao vivo pelo painel publico.',
  dashboardSuffix: 'Painel Ao Vivo',
  registerSuffix: 'Inscreva-se',
  fallbackJamDescription: 'Participe desta jam session no Jam App. Inscreva-se como musico ou acompanhe ao vivo.',
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

  // Hreflang tags for language alternatives
  const baseUrl = url.split('?')[0];
  const hreflangTags = [
    `<link rel="alternate" hreflang="pt-BR" href="${esc(baseUrl)}?lng=pt" />`,
    `<link rel="alternate" hreflang="en" href="${esc(baseUrl)}?lng=en" />`,
    `<link rel="alternate" hreflang="es" href="${esc(baseUrl)}?lng=es" />`,
    `<link rel="alternate" hreflang="x-default" href="${esc(baseUrl)}" />`,
  ].join('\n  ');

  return `<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="utf-8" />
  <title>${esc(title)}</title>
  <meta name="description" content="${esc(description)}" />
  <link rel="canonical" href="${esc(url)}" />

  <!-- Hreflang -->
  ${hreflangTags}

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

// --- Structured data ---

function homeStructuredData(siteUrl: string, ogImage: string): Record<string, unknown>[] {
  return [
    {
      '@type': 'WebSite',
      name: 'Jam App',
      alternateName: 'The Jam App',
      url: siteUrl,
      description: PT.homeDescription,
      inLanguage: 'pt-BR',
      potentialAction: {
        '@type': 'SearchAction',
        target: {
          '@type': 'EntryPoint',
          urlTemplate: `${siteUrl}/jams?q={search_term_string}`,
        },
        'query-input': 'required name=search_term_string',
      },
    },
    {
      '@type': 'WebApplication',
      name: 'Jam App',
      alternateName: 'The Jam App',
      url: siteUrl,
      description: PT.homeDescription,
      applicationCategory: 'EntertainmentApplication',
      operatingSystem: 'Any',
      browserRequirements: 'Requires JavaScript',
      inLanguage: ['pt-BR', 'en', 'es'],
      image: ogImage,
      featureList:
        'Criar e gerenciar jam sessions ao vivo, Painel publico em tempo real, Inscricao de musicos por instrumento, Controle de setlist e ordem das musicas, QR code para compartilhar jams, Importar playlists do Spotify',
      offers: {
        '@type': 'Offer',
        price: '0',
        priceCurrency: 'BRL',
        availability: 'https://schema.org/OnlineOnly',
      },
      author: {
        '@type': 'Organization',
        name: 'Jam App',
        url: siteUrl,
      },
    },
    {
      '@type': 'Organization',
      name: 'Jam App',
      alternateName: 'The Jam App',
      url: siteUrl,
      description:
        'Plataforma gratuita para organizar jam sessions ao vivo. Hosts gerenciam eventos, musicos se inscrevem e o publico acompanha em tempo real.',
      logo: {
        '@type': 'ImageObject',
        url: `${siteUrl}/web/icons8-concert-color-512.png`,
        width: 512,
        height: 512,
      },
      contactPoint: {
        '@type': 'ContactPoint',
        contactType: 'customer service',
        url: siteUrl,
      },
    },
  ];
}

function browseStructuredData(siteUrl: string): Record<string, unknown>[] {
  return [
    {
      '@type': 'CollectionPage',
      name: 'Explorar Jam Sessions',
      description:
        'Encontre e participe de jam sessions ao vivo, open mics e eventos musicais na sua regiao.',
      url: `${siteUrl}/jams`,
      isPartOf: {
        '@type': 'WebSite',
        name: 'Jam App',
        url: siteUrl,
      },
    },
    {
      '@type': 'BreadcrumbList',
      itemListElement: [
        { '@type': 'ListItem', position: 1, name: 'Inicio', item: siteUrl },
        { '@type': 'ListItem', position: 2, name: 'Jam Sessions', item: `${siteUrl}/jams` },
      ],
    },
  ];
}

function jamStructuredData(
  jam: JamData,
  canonicalUrl: string,
  siteUrl: string,
  ogImage: string,
): Record<string, unknown>[] {
  const eventStatusMap: Record<string, string> = {
    ACTIVE: 'https://schema.org/EventScheduled',
    INACTIVE: 'https://schema.org/EventPostponed',
    LIVE: 'https://schema.org/EventScheduled',
    FINISHED: 'https://schema.org/EventPast',
  };

  const event: Record<string, unknown> = {
    '@type': 'MusicEvent',
    name: jam.name,
    url: canonicalUrl,
    description:
      jam.description ?? 'Jam session no Jam App. Participe como musico ou acompanhe ao vivo.',
    eventStatus: eventStatusMap[jam.status] ?? 'https://schema.org/EventScheduled',
    // attendanceMode matches location type: offline only when a physical venue is known
    eventAttendanceMode: jam.location
      ? 'https://schema.org/OfflineEventAttendanceMode'
      : 'https://schema.org/OnlineEventAttendanceMode',
    image: ogImage,
    organizer: {
      '@type': 'Organization',
      name: jam.hostName ?? 'Jam App',
      url: siteUrl,
    },
  };

  // startDate is required for Google Event rich results - skip MusicEvent if missing
  if (!jam.date) {
    return [
      {
        '@type': 'BreadcrumbList',
        itemListElement: [
          { '@type': 'ListItem', position: 1, name: 'Inicio', item: siteUrl },
          { '@type': 'ListItem', position: 2, name: 'Jam Sessions', item: `${siteUrl}/jams` },
          { '@type': 'ListItem', position: 3, name: jam.name, item: canonicalUrl },
        ],
      },
    ];
  }

  event.startDate = new Date(jam.date).toISOString();

  // Free event - helps Google show pricing in rich results
  event.offers = {
    '@type': 'Offer',
    price: '0',
    priceCurrency: 'BRL',
    availability: 'https://schema.org/InStock',
    url: canonicalUrl,
  };

  // location is required for Google Event rich results; VirtualLocation is the fallback
  if (jam.location) {
    event.location = { '@type': 'Place', name: jam.location };
  } else {
    event.location = { '@type': 'VirtualLocation', url: canonicalUrl };
  }

  return [
    event,
    {
      '@type': 'BreadcrumbList',
      itemListElement: [
        { '@type': 'ListItem', position: 1, name: 'Inicio', item: siteUrl },
        { '@type': 'ListItem', position: 2, name: 'Jam Sessions', item: `${siteUrl}/jams` },
        { '@type': 'ListItem', position: 3, name: jam.name, item: canonicalUrl },
      ],
    },
  ];
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

  switch (route.type) {
    case 'home': {
      // Ensure trailing slash on canonical home URL
      const homeUrl = siteUrl.endsWith('/') ? siteUrl : `${siteUrl}/`;
      return new Response(
        buildOgHtml({
          title: PT.homeTitle,
          description: PT.homeDescription,
          url: homeUrl,
          image: ogImage,
          jsonLd: homeStructuredData(siteUrl, ogImage),
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
          jsonLd: browseStructuredData(siteUrl),
          bodyHtml: BROWSE_BODY,
          noRedirect,
        }),
        { headers: htmlHeaders() },
      );

    case 'jam-detail':
    case 'jam-dashboard':
    case 'jam-register':
      return handleJamRoute(route.identifier, route.type, siteUrl, ogImage, url.pathname, noRedirect);

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
      jsonLd = jamStructuredData(jam, jamCanonicalUrl, siteUrl, ogImage);
    }
  } else {
    // Jam not found - return 404 to prevent soft 404 issues with search engines
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
      buildOgHtml({ title, description, url: canonicalUrl, image: ogImage, bodyHtml, noRedirect }),
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
