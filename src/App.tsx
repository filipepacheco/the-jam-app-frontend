import {lazy, Suspense, useEffect, useMemo} from 'react'
import {BrowserRouter, Route, Routes} from 'react-router-dom'
import {SpeedInsights} from '@vercel/speed-insights/react'
import {Analytics} from "@vercel/analytics/react"
import {useTranslation} from 'react-i18next'
import {useAppLanguage} from './hooks'
import {SWRConfig} from 'swr'
import {SWR_POLLING_DEFAULTS} from './config/swrDefaults'
import {apiClient} from './lib/api'
import {SITE_URL} from './lib/api'
import Navbar from './components/Navbar'
import {EnhancedHero} from './components/EnhancedHero'
import {HowItWorks} from './components/HowItWorks'
import {Testimonials} from './components/Testimonials'
import CallToAction from './components/CallToAction'
import Footer from './components/Footer'
import {SEO} from './components/SEO'
import {buildHomeJsonLd} from '../site.config'
// Keep eager (critical path)
import {LoginPage} from './pages/LoginPage'
import {BrowseJamsPage} from './pages/BrowseJamsPage'
import {JamRegisterPage} from './pages/JamRegisterPage'
import {JamShortRedirect} from './pages/JamShortRedirect'
import {SlugRedirect} from './pages/SlugRedirect'
import {PublicDashboardPage} from './pages/PublicDashboardPage'
import AuthCallbackPage from "./pages/tabs/AuthCallbackPage.tsx"
import {AuthProvider} from './contexts'
import {FullPageSpinner, OnboardingModal} from './components'
import {ErrorBoundary} from './components/ErrorBoundary'
import {useAuth} from './hooks'
import {NotFoundPage} from './pages/NotFoundPage'

// Lazy-loaded pages - Priority 1 (Host-only)
const HostDashboardPage = lazy(() => import('./pages/host/HostDashboardPage.tsx'))
const CreateJamPage = lazy(() => import('./pages/host/CreateJamPage.tsx'))
const JamManagementPage = lazy(() => import('./pages/host/JamManagementPage.tsx'))
const HostJamSongsPage = lazy(() => import('./pages/host/HostJamSongsPage.tsx'))
const FeedbackPage = lazy(() => import('./pages/host/FeedbackPage.tsx'))

// Lazy-loaded pages - Spotify integration
const SpotifyCallbackPage = lazy(() => import('./pages/SpotifyCallbackPage'))

// Lazy-loaded pages - Priority 2 (User-specific)
const MusicPage = lazy(() => import('./pages/MusicPage'))
const ProfilePage = lazy(() => import('./pages/ProfilePage'))
const MusiciansPage = lazy(() => import('./pages/host/MusiciansPage.tsx'))
const JamDetailPage = lazy(() => import('./pages/tabs/JamDetailPageV2.tsx'))
const AboutPage = lazy(() => import('./pages/AboutPage').then(m => ({ default: m.AboutPage })))

/**
 * SWR Fetcher Function
 * Converts API response format to standard data format that SWR expects
 */
async function swrFetcher<T>(url: string): Promise<T> {
  const response = await apiClient.get<T>(url)
  
  if (!response.success) {
    throw new Error(response.message || 'Failed to fetch data')
  }
  
  return response.data as T
}

/**
 * Route Loading Fallback Component
 * Displays a loading spinner while lazy-loaded routes are being fetched
 */
function RouteLoadingFallback() {
  return <FullPageSpinner />
}

/**
 * Home Page Component
 * Main landing page with hero, features, and call-to-action
 */
function HomePage() {
  const { t } = useTranslation()
  const { currentLang } = useAppLanguage()

  const siteUrl = SITE_URL

  const homeJsonLd = useMemo(() => buildHomeJsonLd(siteUrl, {
    description: t('seo.homepage.description_enhanced'),
    organizationDescription: t('seo.homepage.description_enhanced'),
    featureList: [
      t('seo.features.create_jams'),
      t('seo.features.live_dashboard'),
      t('seo.features.musician_registration'),
      t('seo.features.setlist_control'),
      t('seo.features.qr_sharing'),
      t('seo.features.spotify_import'),
    ],
    pageLanguage: currentLang === 'pt' ? 'pt-BR' : currentLang,
  }), [t, siteUrl, currentLang])

  return (
    <>
      <SEO
        title={t('seo.homepage.title')}
        description={t('seo.homepage.description_enhanced')}
        keywords={t('seo.homepage.keywords')}
        ogImage="/og-image.jpg"
        jsonLd={homeJsonLd}
      />
      <div className="min-h-screen">
        <Navbar />
        <EnhancedHero />
        <HowItWorks />
        <Testimonials />
        <CallToAction />
        <Footer />
      </div>
    </>
  )
}

/**
 * App Content Component
 * Routes and page rendering
 */
function AppContent() {
    // Normal app routing
  return (
    <Suspense fallback={<RouteLoadingFallback />}>
      <Routes>
      {/* Public Routes */}
      <Route path="/" element={<HomePage />} />
      <Route path="/login" element={<LoginPage />} />
      <Route path="/register" element={<LoginPage />} />
      <Route path="/auth/callback" element={<AuthCallbackPage />} />
      <Route path="/auth/spotify/callback" element={
        <SpotifyCallbackPage />
      } />

      {/* Short Code Redirect */}
      <Route path="/j/:code" element={<JamShortRedirect />} />

      {/* Jam Routes */}
      <Route path="/jams" element={
        <>
          <Navbar />
          <BrowseJamsPage />
        </>
      } />
      <Route path="/jams/:jamId" element={
        <>
          <Navbar />
          <JamDetailPage />
        </>
      } />
      <Route path="/jams/:jamId/register" element={
        <>
          <Navbar />
          <JamRegisterPage />
        </>
      } />
      <Route path="/jams/:jamId/dashboard" element={
        <PublicDashboardPage />
      } />
      <Route path="/music" element={
        <>
          <Navbar />
          <MusicPage />
        </>
      } />
      <Route path="/profile" element={
        <>
          <Navbar />
          <ProfilePage />
        </>
      } />
      <Route path="/musicians" element={
        <>
          <Navbar />
          <MusiciansPage />
        </>
      } />
      <Route path="/host/jams/:id/songs" element={
        <>
          <Navbar />
          <HostJamSongsPage />
        </>
      } />
      <Route path="/host/dashboard" element={
        <>
          <Navbar />
          <HostDashboardPage />
        </>
      } />
      <Route path="/host/create-jam" element={
        <>
          <Navbar />
          <CreateJamPage />
        </>
      } />
      <Route path="/host/jams/:id/edit" element={
        <>
          <Navbar />
          <CreateJamPage />
        </>
      } />
      <Route path="/host/jams/:id/manage" element={
        <>
          <Navbar />
          <JamManagementPage />
        </>
      } />
      <Route path="/host/feedback" element={
        <>
          <Navbar />
          <FeedbackPage />
        </>
      } />

      {/* About page */}
      <Route path="/about" element={<AboutPage />} />

      {/* Root-level slug redirect (jamapp.com.br/my-slug -> /jams/my-slug) */}
      <Route path="/:slug" element={<SlugRedirect />} />

      {/* Catch-all - 404 page */}
      <Route path="*" element={<NotFoundPage />} />
      </Routes>
    </Suspense>
  )
}

/**
 * Onboarding Modal Wrapper
 * Shows onboarding modal for new users after OAuth login
 */
function OnboardingWrapper() {
  const { isNewUser, clearNewUserFlag } = useAuth()

  return (
    <OnboardingModal
      isOpen={isNewUser}
      onClose={clearNewUserFlag}
    />
  )
}

/**
 * App Component
 * Root component with AuthProvider, SWRConfig, and BrowserRouter wrapper
 */
function App() {
  useEffect(() => {
    document.dispatchEvent(new Event('app-rendered'))
  }, [])

  return (
    <ErrorBoundary>
    <BrowserRouter>
      <SWRConfig
        value={{
          fetcher: swrFetcher,
          ...SWR_POLLING_DEFAULTS,
        }}
      >
        <AuthProvider>
          <AppContent />
          <OnboardingWrapper />
        </AuthProvider>
      </SWRConfig>
      <SpeedInsights />
      <Analytics/>
    </BrowserRouter>
    </ErrorBoundary>
  )
}

export default App
