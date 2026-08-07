# AGENTS.md - AI Coding Agent Guide

This document provides essential information for AI coding agents working on the Karaoke Jam Frontend project.

## Project Overview

**Karaoke Jam Frontend** is a React-based web application for managing karaoke jam sessions. It allows hosts to create and manage jam events, musicians to register and join performances, and provides a live public dashboard for venues to display the current song queue and performer information.

### Key Features
- **Jam Management**: Create, edit, and manage jam sessions
- **Musician Registration**: Register for jams with instrument selection
- **Live Public Dashboard**: Real-time display for venues showing current/next songs and performers
- **DJ Control Panel**: Host interface for managing song queues and performance status
- **Multi-language Support**: English, Spanish, and Portuguese (pt, pt-BR, pt-PT)
- **Spotify Integration**: Import/export playlists via Spotify API
- **Offline Support**: Queue actions when offline, auto-flush on reconnection

## Technology Stack

| Category | Technology |
|----------|------------|
| Framework | React 19 + TypeScript |
| Build Tool | Vite (using `rolldown-vite@7.2.2` for improved performance) |
| Styling | Tailwind CSS v4 + DaisyUI v5 |
| Routing | React Router v7 |
| State Management | React Context + SWR for data fetching |
| Auth | Supabase Auth (OAuth/Email) + Backend JWT |
| HTTP Client | Axios |
| i18n | i18next + react-i18next |
| Animation | Framer Motion |
| Video | Remotion (for promotional videos) |
| Testing | Vitest + React Testing Library |
| Deployment | Vercel |

## Project Structure

```
src/
├── components/           # Reusable UI components
│   ├── publicDashboard/  # Live dashboard display components
│   ├── dj-control/       # DJ control panel components (legacy)
│   ├── dj-control-v2/    # Redesigned DJ control (active development)
│   ├── jam-detail-v2/    # Redesigned jam detail components
│   ├── schedule/         # Schedule management components
│   ├── forms/            # Form components
│   └── Alerts/           # Alert components
├── contexts/             # React contexts (AuthContext)
├── hooks/                # Custom React hooks (barrel export: index.ts)
├── lib/                  # Core infrastructure
│   ├── api/              # API client and configuration
│   ├── auth/             # Auth utilities and role checks
│   ├── supabase/         # Supabase client setup
│   ├── schedule/         # Schedule helpers
│   └── spotify/          # Spotify PKCE auth
├── locales/              # i18n translation files (en.json, es.json, pt.json)
├── pages/                # Page components (route-level)
│   ├── host/             # Host-specific pages
│   └── tabs/             # Tab-based layouts and design variations
├── services/             # API service layer
├── types/                # TypeScript type definitions
├── utils/                # Helper utilities
├── config/               # Configuration files
├── i18n.ts               # i18next configuration
├── App.tsx               # Root router and providers
└── main.tsx              # App entry point
```

## Build and Development Commands

```bash
# Install dependencies
npm install

# Development server (runs on http://localhost:5173)
npm run dev

# Type checking and production build
npm run build

# Linting
npm run lint

# Preview production build
npm run preview

# Testing
npm test                    # Run tests in watch mode
npm run test:run           # Run tests once
npm run test:coverage      # Run tests with coverage
npm run test:i18n          # Run i18n smoke tests
```

## Environment Configuration

Copy `.env.example` to `.env` and configure:

```env
# Backend API
VITE_API_URL=http://localhost:3000

# SEO - Production site URL
VITE_SITE_URL=https://jamapp.com.br

# Supabase OAuth
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key-here

# Spotify Integration
VITE_SPOTIFY_CLIENT_ID=your-spotify-client-id
```

## Architecture Patterns

### Provider Hierarchy (App.tsx)
```
BrowserRouter
  └── SWRConfig
      └── AuthProvider
          └── Routes
```

### Two-Tier Authentication
1. **Supabase Layer**: OAuth/Email auth, session management
2. **Backend Sync Layer**: `/auth/sync-user` returns JWT for API calls

JWT is stored in `localStorage` (`auth_token`) and attached to all API requests via Axios interceptor.

### API Response Standardization
All API responses follow the format:
```typescript
{ data: T, success: boolean, message?: string, error?: string }
```

Always check `success` before accessing `data`.

### SWR Configuration
- `revalidateOnFocus: true` - Auto-refresh when tab regains focus
- `revalidateOnReconnect: true` - Auto-refresh after reconnection  
- `dedupingInterval: 2000` - Deduplicate requests within 2 seconds
- `errorRetryCount: 3` with 5-second intervals

### Data Fetching Pattern
```typescript
// Using SWR (preferred)
const { data, error, isLoading } = useSWR(
  jamId ? `/api/jams/${jamId}` : null,
  (url) => jamService.getJam(jamId)
)

// For mutations, use service directly
const result = await jamService.updateJam(id, updates)
if (!result.success) {
  // Handle error
}
```

## Code Style Guidelines

### Styling (Tailwind + DaisyUI)
- **DO NOT use raw Tailwind color classes** for text (use semantic daisyUI colors)
- Prefer semantic colors: `bg-primary`, `bg-base-100`, `text-base-content`
- Override order: component classes → modifiers → Tailwind utilities → `!` (last resort)
- Both systems use variant prefixes (e.g., `sm:`, `hover:`, `dark:`)

### Component Patterns
- Use PascalCase for component files (e.g., `JamCard.tsx`)
- Prefer named exports over default exports
- Create index files (`index.ts`) for barrel exports when directory has multiple components
- V2 components represent design iterations - keep both versions until V2 is production-ready

### TypeScript
- Strict type checking enabled
- Never use `any` type - create proper interfaces
- Always type props, return values, and API responses
- Type definitions in `src/types/` - centralize shared types

### ESLint Rules
- `no-console` warns except for `console.warn` and `console.error`
- React Hooks exhaustive-deps warnings enabled
- TypeScript no-explicit-any: warn

## Internationalization (i18n)

### Supported Languages
- English (en)
- Spanish (es)  
- Portuguese (pt, pt-BR, pt-PT)

### Adding New Text
1. Add keys to ALL locale files simultaneously: `src/locales/{en,es,pt}.json`
2. Use hierarchical keys: `section.subsection.key` (e.g., `modals.schedule.title`)
3. Use `useTranslation()` hook

### Usage
```typescript
const { t } = useTranslation()
t('jams.browse.title')
t('welcome.message', { name: userName })
```

**Missing keys are logged to `window.__MISSING_I18N_KEYS__`** for debugging.

## Testing

### Test Setup
- **Framework**: Vitest
- **Environment**: happy-dom
- **Location**: `src/__tests__/`
- **Setup File**: `src/__tests__/setup.ts`

### Running Tests
```bash
npm test                    # Watch mode
npm run test:run           # Single run
npm run test:coverage      # With coverage report
npm run test:i18n          # i18n smoke tests only
```

### Test Coverage Thresholds
- Lines: 70%
- Functions: 70%
- Branches: 70%
- Statements: 70%

### Development Test Pages
Access via URL parameters during development:
- `?test=true` - Services test page
- `?hooks=true` - Hooks test page
- `?errors=true` - Error handling test page
- `?auth=true` - Auth test page

## Key Files Reference

| File | Purpose |
|------|---------|
| `.github/copilot-instructions.md` | Project-specific rules and guidelines |
| `.github/llms-summary.md` | Tailwind v4 + DaisyUI v5 styling guide |
| `.github/swagger.json` | Backend API specification |
| `src/CLAUDE.md` | Detailed architecture documentation |
| `src/lib/api/client.ts` | Axios client with interceptors |
| `src/types/api.types.ts` | API TypeScript definitions |
| `src/contexts/AuthContext.tsx` | Authentication state management |
| `src/i18n.ts` | i18next configuration |

## Security Considerations

- JWT tokens stored in `localStorage`
- API requests include `Authorization: Bearer {token}` header
- 401 responses trigger automatic token refresh
- Failed refresh redirects to `/login`
- Role-based access control via `RoleBasedRoute` component
- OAuth providers: Google, GitHub, Discord, Spotify

## Deployment

- **Platform**: Vercel
- **Configuration**: `vercel.json` (SPA routing rules)
- **Production Integrations**: 
  - Vercel Analytics (`@vercel/analytics`)
  - Vercel Speed Insights (`@vercel/speed-insights`)
- Build output: `dist/` directory

## Common Issues

### 401 Unauthorized
- Check Supabase session validity
- Verify JWT in localStorage (`auth_token`)
- Check `/auth/sync-user` response in network tab

### i18n Keys Missing
- Check `window.__MISSING_I18N_KEYS__` in console
- Verify all three locale files have matching key structure
- Use URL param `?lng=en` to force language

### Polling Not Updating
- Check page visibility (pauses when tab hidden)
- Verify SWR `shouldRetryOnError` configuration
- Check network tab for dashboard requests (should poll every 5 seconds)

## Documentation References

- **CLAUDE.md** (root and src/): Detailed architecture and implementation notes
- **docs/**: Additional documentation including migration plans
- **Component CLAUDE.md files**: Component-specific guidelines throughout src/

Always refer to existing documentation before making assumptions about the codebase.

## Agent skills

### Issue tracker

Issues are tracked as GitHub Issues in `filipepacheco/the-jam-app-frontend`. See `docs/agents/issue-tracker.md`.

### Domain docs

Single-context layout — `CONTEXT.md` + `docs/adr/` at the repo root. See `docs/agents/domain.md`.
