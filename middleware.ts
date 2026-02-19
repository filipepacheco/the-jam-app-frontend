import { next } from '@vercel/functions';

// --- Crawler detection ---

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
  'Googlebot',
  'bingbot',
  'Baiduspider',
  'YandexBot',
  'DuckDuckBot',
  'Applebot',
  'PetalBot',
  'Bytespider',
];

function isCrawler(ua: string): boolean {
  const lower = ua.toLowerCase();
  return CRAWLER_UAS.some((bot) => lower.includes(bot.toLowerCase()));
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
    // Backend returns the jam object directly (no wrapper)
    return data as JamData;
  } catch {
    return null;
  }
}

// --- Portuguese default texts ---

const PT = {
  siteName: 'The Jam App',
  homeTitle: 'The Jam App - Organize suas Jam Sessions',
  homeDescription:
    'Crie e gerencie jam sessions ao vivo. Hosts organizam eventos, musicos se inscrevem em musicas e o publico acompanha tudo em tempo real.',
  browseTitle: 'Jam Sessions - The Jam App',
  browseDescription:
    'Encontre jam sessions perto de voce. Participe como musico ou acompanhe ao vivo pelo painel publico.',
  dashboardSuffix: 'Painel Ao Vivo',
  registerSuffix: 'Inscreva-se',
  fallbackJamDescription: 'Participe desta jam session no The Jam App.',
};

const HOME_BODY = `
  <main>
    <h1>The Jam App - Organize suas Jam Sessions</h1>
    <p>Crie e gerencie jam sessions ao vivo. Hosts organizam eventos, musicos se inscrevem em musicas e o publico acompanha tudo em tempo real.</p>
    <section>
      <h2>Como funciona</h2>
      <ul>
        <li>Hosts criam jam sessions com data, local e setlist</li>
        <li>Musicos se inscrevem por instrumento (guitarra, baixo, bateria, teclado, vocais)</li>
        <li>O publico acompanha ao vivo pelo painel publico em tempo real</li>
        <li>Controle de setlist e ordem das musicas durante o evento</li>
        <li>Compartilhe a jam via QR code ou link curto</li>
        <li>Importe playlists do Spotify para montar o setlist</li>
      </ul>
    </section>
    <section>
      <h2>Para quem e?</h2>
      <ul>
        <li><strong>Hosts</strong>: organize eventos musicais, aprove inscricoes e controle o setlist ao vivo</li>
        <li><strong>Musicos</strong>: encontre jams, inscreva-se em musicas e gerencie sua agenda de performances</li>
        <li><strong>Publico</strong>: acompanhe qual musica esta tocando agora e quem esta no palco</li>
      </ul>
    </section>
  </main>`;

const BROWSE_BODY = `
  <main>
    <h1>Jam Sessions - The Jam App</h1>
    <p>Encontre jam sessions perto de voce. Participe como musico ou acompanhe ao vivo pelo painel publico.</p>
    <p>Navegue pelas jam sessions ativas, veja o setlist, os musicos inscritos e acompanhe o evento em tempo real.</p>
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

  return `<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="utf-8" />
  <title>${esc(title)}</title>
  <meta name="description" content="${esc(description)}" />

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

  ${jsonLdTag}

  <!-- Redirect real browsers immediately -->
  <meta http-equiv="refresh" content="0;url=${esc(url)}" />
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
      offers: {
        '@type': 'Offer',
        price: '0',
        priceCurrency: 'BRL',
      },
      featureList: [
        'Criar e gerenciar jam sessions ao vivo',
        'Painel publico em tempo real para o publico',
        'Inscricao de musicos por instrumento',
        'Controle de setlist e ordem das musicas',
        'QR code para compartilhar jams',
        'Importar playlists do Spotify',
      ],
      author: {
        '@type': 'Organization',
        name: 'Jam App',
        url: siteUrl,
      },
    },
    {
      '@type': 'Organization',
      name: 'Jam App',
      url: siteUrl,
      logo: ogImage,
      sameAs: [],
    },
  ];
}

// --- Middleware handler ---

export default function middleware(request: Request) {
  const ua = request.headers.get('user-agent') || '';
  if (!isCrawler(ua)) return next();

  const url = new URL(request.url);
  const route = matchRoute(url.pathname);
  if (!route) return next();

  const siteUrl = process.env.SITE_URL || url.origin;
  const ogImage = `${siteUrl}/og-image.jpg`;

  switch (route.type) {
    case 'home':
      return new Response(
        buildOgHtml({
          title: PT.homeTitle,
          description: PT.homeDescription,
          url: siteUrl,
          image: ogImage,
          jsonLd: homeStructuredData(siteUrl, ogImage),
          bodyHtml: HOME_BODY,
        }),
        { headers: htmlHeaders() },
      );

    case 'browse':
      return new Response(
        buildOgHtml({
          title: PT.browseTitle,
          description: PT.browseDescription,
          url: `${siteUrl}/jams`,
          image: ogImage,
          bodyHtml: BROWSE_BODY,
        }),
        { headers: htmlHeaders() },
      );

    case 'jam-detail':
    case 'jam-dashboard':
    case 'jam-register':
      return handleJamRoute(route.identifier, route.type, siteUrl, ogImage, url.pathname);

    case 'short-code':
      return handleJamRoute(route.code, 'jam-detail', siteUrl, ogImage, url.pathname);

    case 'slug':
      return handleJamRoute(route.slug, 'jam-detail', siteUrl, ogImage, url.pathname);
  }
}

async function handleJamRoute(
  identifier: string,
  variant: 'jam-detail' | 'jam-dashboard' | 'jam-register',
  siteUrl: string,
  ogImage: string,
  pathname: string,
): Promise<Response> {
  const jam = await fetchJam(identifier);

  let title: string;
  let description: string;
  let canonicalUrl: string;

  let bodyHtml: string | undefined;

  if (jam) {
    const baseName = jam.name;
    const jamPath = jam.slug ? `/${jam.slug}` : `/jams/${identifier}`;

    switch (variant) {
      case 'jam-dashboard':
        title = `${baseName} - ${PT.dashboardSuffix} - ${PT.siteName}`;
        canonicalUrl = `${siteUrl}${jamPath}/dashboard`;
        break;
      case 'jam-register':
        title = `${PT.registerSuffix} - ${baseName} - ${PT.siteName}`;
        canonicalUrl = `${siteUrl}${jamPath}/register`;
        break;
      default:
        title = `${baseName} - ${PT.siteName}`;
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
    if (jam.date) details.push(`<li>Data: ${esc(new Date(jam.date).toLocaleDateString('pt-BR'))}</li>`);
    if (jam.hostName) details.push(`<li>Host: ${esc(jam.hostName)}</li>`);
    if (jam.status) details.push(`<li>Status: ${esc(jam.status)}</li>`);

    bodyHtml = `
  <main>
    <h1>${esc(title)}</h1>
    <p>${esc(description)}</p>
    ${details.length > 0 ? `<ul>${details.join('')}</ul>` : ''}
  </main>`;
  } else {
    // API failed or jam not found - use generic Portuguese fallback
    title = `Jam Session - ${PT.siteName}`;
    description = PT.fallbackJamDescription;
    canonicalUrl = `${siteUrl}${pathname}`;
  }

  return new Response(
    buildOgHtml({ title, description, url: canonicalUrl, image: ogImage, bodyHtml }),
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
  matcher: [
    '/',
    '/jams',
    '/jams/:path*',
    '/j/:path*',
    '/:slug',
  ],
};
