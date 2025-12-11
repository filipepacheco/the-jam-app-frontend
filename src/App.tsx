import {BrowserRouter, Navigate, Route, Routes} from 'react-router-dom'
import {SpeedInsights} from '@vercel/speed-insights/react'
import {Analytics} from "@vercel/analytics/react"
import Navbar from './components/Navbar'
import Hero from './components/Hero'
import Features from './components/Features'
import CallToAction from './components/CallToAction'
import Footer from './components/Footer'

// Test pages
import {TestPage} from './pages/TestPage'
import {HookTestPage} from './pages/HookTestPage'
import {ErrorHandlingTestPage} from './pages/ErrorHandlingTestPage'
import {AuthTestPage} from './pages/AuthTestPage'
import {AuthContextTestPage} from './pages/AuthContextTestPage'
import {RouteGuardsExamplePage} from './pages/RouteGuardsExamplePage'
import {LocalStoragePersistenceTestPage} from './pages/LocalStoragePersistenceTestPage'
import {AuthFlowTestPage} from './pages/AuthFlowTestPage'
import {PostLoginBehaviorTestPage} from './pages/PostLoginBehaviorTestPage'

// Phase 5: Auth Flow Pages
import {LoginPage} from './pages/LoginPage'
import {BrowseJamsPage} from './pages/BrowseJamsPage'
import {JamDetailPage} from './pages/JamDetailPage'
import {JamRegisterPage} from './pages/JamRegisterPage'
import {TestDataSeedPage} from './pages/TestDataSeedPage'
import {HostJamSongsPage} from './pages/HostJamSongsPage'
import {HostTestSongsPage} from './pages/HostTestSongsPage'
import {HostDashboardPage} from './pages/HostDashboardPage'
import {CreateJamPage} from './pages/CreateJamPage'
import {JamManagementPage} from './pages/JamManagementPage'
import {MusicPage} from './pages/MusicPage'
import {MusiciansPage} from './pages/MusiciansPage'
import {ProfilePage} from './pages/ProfilePage'

import {AuthProvider} from './contexts/AuthContext'
import {OnboardingModal} from "./components";
import AuthCallbackPage from "./pages/AuthCallbackPage.tsx";
import {useAuth} from "./hooks";

/**
 * Home Page Component
 * Main landing page with hero, features, and call-to-action
 */
function HomePage() {
  return (
    <div className="min-h-screen">
      <Navbar />
      <Hero />
      <Features />
      <CallToAction />
      <Footer />
    </div>
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
        <AppContent />
        <OnboardingWrapper />
      </AuthProvider>
      <SpeedInsights />
        <Analytics/>
    </BrowserRouter>
  )
}

export default App
