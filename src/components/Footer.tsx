import { useTranslation } from 'react-i18next'
import { useLocation, useNavigate } from 'react-router-dom'
import { NavigationLink } from './Navigation'
import {authPath} from '../utils/navigationUtils'

function Footer() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const location = useLocation()

  const routes = [
    { path: '/jams', label: t('nav.jams') },
    { path: '/host/dashboard', label: t('nav.for_hosts') },
    { path: '/about', label: t('nav.about') },
    { path: authPath('/register', location), label: t('auth.sign_up') },
  ]

  return (
    <footer className="bg-base-300 px-4 py-5 text-base-content sm:px-6 sm:py-6 lg:px-8">
      <div className="mx-auto flex w-full max-w-6xl flex-col items-center gap-2 sm:gap-3">
      {/* These are destinations, not operations, so they use NavigationLink.
          It renders a native anchor, so the href stays intact for
          modifier-click and for the server fallback, while the onClick
          handler keeps client-side routing. See
          docs/design-system/canonical-navigation.md. */}
      <nav aria-label={t('nav.footer_navigation')} className="flex flex-wrap justify-center gap-x-3 gap-y-0 sm:gap-x-4">
        {routes.map((route) => (
          <NavigationLink
            key={route.path}
            href={route.path}
            onClick={(e) => { e.preventDefault(); navigate(route.path) }}
          >
            {route.label}
          </NavigationLink>
        ))}
        {/* A real document outside the router: no onClick, so the browser
            performs the navigation itself. */}
        <NavigationLink href="/privacy.html">
          {t('common.privacy_policy')}
        </NavigationLink>
      </nav>
      <aside className="text-center">
        <p className="max-w-sm text-xs leading-relaxed sm:text-sm">
          {t('common.copyright')} &copy; {new Date().getFullYear()} - {t('common.app_name')}. {t('common.all_rights_reserved')}
        </p>
      </aside>
      </div>
    </footer>
  )
}

export default Footer
