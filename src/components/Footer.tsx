import { useTranslation } from 'react-i18next'
import { useNavigate } from 'react-router-dom'
import { NavigationLink } from './Navigation'

function Footer() {
  const { t } = useTranslation()
  const navigate = useNavigate()

  const routes = [
    { path: '/jams', label: t('nav.jams') },
    { path: '/host/dashboard', label: t('nav.for_hosts') },
    { path: '/about', label: t('nav.about') },
    { path: '/register', label: t('auth.sign_up') },
  ]

  return (
    <footer className="footer footer-center bg-base-300 text-base-content p-4 sm:p-8 lg:p-10">
      {/* These are destinations, not operations, so they use NavigationLink.
          It renders a native anchor, so the href stays intact for
          modifier-click and for the server fallback, while the onClick
          handler keeps client-side routing. See
          docs/design-system/canonical-navigation.md. */}
      <nav aria-label={t('nav.footer_navigation')} className="flex flex-wrap justify-center gap-2 sm:gap-4">
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
      <aside>
        <p className="text-xs sm:text-sm">
          {t('common.copyright')} &copy; {new Date().getFullYear()} - {t('common.app_name')}. {t('common.all_rights_reserved')}
        </p>
      </aside>
    </footer>
  )
}

export default Footer
