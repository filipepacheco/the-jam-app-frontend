import {lazy, Suspense} from 'react'
import {BrowserRouter, Navigate, Route, Routes} from 'react-router-dom'
import {SpeedInsights} from '@vercel/speed-insights/react'
import {Analytics} from "@vercel/analytics/react"
import {useTranslation} from 'react-i18next'
import Navbar from './components/Navbar'
import { EnhancedHero } from './components/EnhancedHero'
import Features from './components/Features'
import { Stats } from './components/Stats'
import { HowItWorks } from './components/HowItWorks'
import { Testimonials } from './components/Testimonials'
import CallToAction from './components/CallToAction'
import Footer from './components/Footer'
import {SEO} from './components/SEO'

// Lazy-loaded pages - Priority 1 (Host-only)
const HostDashboardPage = lazy(() => import('./pages/HostDashboardPage'))
const CreateJamPage = lazy(() => import('./pages/CreateJamPage'))
const JamManagementPage = lazy(() => import('./pages/JamManagementPage'))
const JamDJControlPage = lazy(() => import('./pages/JamDJControlPage'))
const HostJamSongsPage = lazy(() => import('./pages/HostJamSongsPage'))

// Lazy-loaded pages - Priority 2 (User-specific)
const MusicPage = lazy(() => import('./pages/MusicPage'))
const ProfilePage = lazy(() => import('./pages/ProfilePage'))
const MusiciansPage = lazy(() => import('./pages/MusiciansPage'))
const JamDetailPage = lazy(() => import('./pages/JamDetailPage'))

// Lazy-loaded pages - Priority 3 (Test pages)
const TestPage = lazy(() => import('./pages/TestPage'))
const TestDataSeedPage = lazy(() => import('./pages/TestDataSeedPage'))
const HostTestSongsPage = lazy(() => import('./pages/HostTestSongsPage'))
const PostLoginBehaviorTestPage = lazy(() => import('./pages/PostLoginBehaviorTestPage'))
const AuthFlowTestPage = lazy(() => import('./pages/AuthFlowTestPage'))
const HookTestPage = lazy(() => import('./pages/HookTestPage'))
const ErrorHandlingTestPage = lazy(() => import('./pages/ErrorHandlingTestPage'))
const AuthTestPage = lazy(() => import('./pages/AuthTestPage'))
const AuthContextTestPage = lazy(() => import('./pages/AuthContextTestPage'))
const RouteGuardsExamplePage = lazy(() => import('./pages/RouteGuardsExamplePage'))
const LocalStoragePersistenceTestPage = lazy(() => import('./pages/LocalStoragePersistenceTestPage'))

// Keep eager (critical path)
import {LoginPage} from './pages/LoginPage'
import {BrowseJamsPage} from './pages/BrowseJamsPage'
import {JamRegisterPage} from './pages/JamRegisterPage'
import {PublicDashboardPage} from './pages/PublicDashboardPage'
import AuthCallbackPage from "./pages/AuthCallbackPage.tsx"
import {AuthProvider, JamProvider} from './contexts'
import {OnboardingModal} from './components/OnboardingModal'
import {useAuth} from './hooks/useAuth'

/**
 * Route Loading Fallback Component
 * Displays a loading spinner while lazy-loaded routes are being fetched
 */
function RouteLoadingFallback() {
  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="loading loading-spinner loading-lg"></div>
    </div>
  )
}

/**
 * Home Page Component
 * Main landing page with hero, features, and call-to-action
 */
function HomePage() {
  const { t } = useTranslation()

  return (
    <>
      <SEO
        title={t('seo.homepage.title')}
        description={t('seo.homepage.description_enhanced')}
        keywords={t('seo.homepage.keywords')}
        ogImage="/og-image.jpg"
      />
      <div className="min-h-screen">
        <Navbar />
        <EnhancedHero />
        <Stats />
        <Features />
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
  // Check URL params for different test modes FIRST
  const searchParams = new URLSearchParams(window.location.search)
  const isTestMode = searchParams.get('test') === 'true'
  const isHookTestMode = searchParams.get('hooks') === 'true'
  const isErrorTestMode = searchParams.get('errors') === 'true'
  const isAuthTestMode = searchParams.get('auth') === 'true'
  const isAuthContextTestMode = searchParams.get('authContext') === 'true'
  const isRouteGuardsTestMode = searchParams.get('routeGuards') === 'true'
  const isLocalStorageTestMode = searchParams.get('localStorage') === 'true'
  const isAuthFlowTestMode = searchParams.get('authFlow') === 'true'
  const isPostLoginTestMode = searchParams.get('postLoginTest') === 'true'

  // Return test pages if in test mode
  if (isTestMode) return <TestPage />
  if (isHookTestMode) return <HookTestPage />
  if (isErrorTestMode) return <ErrorHandlingTestPage />
  if (isAuthTestMode) return <AuthTestPage />
  if (isAuthContextTestMode) return <AuthContextTestPage />
  if (isRouteGuardsTestMode) return <RouteGuardsExamplePage />
  if (isLocalStorageTestMode) return <LocalStoragePersistenceTestPage />
  if (isAuthFlowTestMode) return <AuthFlowTestPage />
  if (isPostLoginTestMode) return <PostLoginBehaviorTestPage />

  // Normal app routing
  return (
    <Suspense fallback={<RouteLoadingFallback />}>
      <Routes>
      {/* Public Routes */}
      <Route path="/" element={<HomePage />} />
      <Route path="/login" element={<LoginPage />} />
      <Route path="/register" element={<LoginPage />} />
      <Route path="/auth/callback" element={<AuthCallbackPage />} />

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
      <Route path="/test/host-songs" element={
        <>
          <Navbar />
          <HostTestSongsPage />
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
      <Route path="/host/jams/:id/dj-control" element={
        <>
          <Navbar />
          <JamDJControlPage />
        </>
      } />
      <Route path="/test/seed-data" element={
        <>
          <Navbar />
          <TestDataSeedPage />
        </>
      } />
      <Route path="/post-login-test" element={<PostLoginBehaviorTestPage />} />

      {/* Catch-all - redirect to home */}
      <Route path="*" element={<Navigate to="/" replace />} />
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
 * Root component with AuthProvider and BrowserRouter wrapper
 */
function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <JamProvider>
          <AppContent />
          <OnboardingWrapper />
        </JamProvider>
      </AuthProvider>
      <SpeedInsights />
        <Analytics/>
    </BrowserRouter>
  )
}

export default App
