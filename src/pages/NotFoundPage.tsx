import {useTranslation} from 'react-i18next'
import {Link} from 'react-router-dom'
import {Home, Search} from 'lucide-react'
import {SEO} from '../components/SEO'
import Navbar from '../components/Navbar'

export function NotFoundPage() {
  const {t} = useTranslation()

  return (
    <>
      <SEO title={t('notFound.title')} noindex={true} />
      <Navbar />
      <div className="min-h-[70vh] flex items-center justify-center bg-base-100 px-4">
        <div className="text-center max-w-md">
          <p className="text-8xl font-bold text-primary mb-4">404</p>
          <h1 className="text-2xl font-bold text-base-content mb-2">
            {t('notFound.heading')}
          </h1>
          <p className="text-base-content/60 mb-8">
            {t('notFound.message')}
          </p>
          {/*
            Documented design-system exception (issue #50): these two
            recovery controls stay router `Link` elements with DaisyUI
            button classes. `Action` renders a `<button>` only, so it would
            drop the anchor semantics (middle-click, open in a new tab, the
            server fallback). `NavigationLink` keeps the anchor but carries
            the quiet pill treatment of the tab set, which removes the
            primary and outline emphasis this pair depends on. Adding a
            call-to-action emphasis to the navigation family is a
            design-system change, so it belongs to issue #58, not here.
            Same exception as the register anchor in Navbar.tsx.
          */}
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Link to="/" className="btn btn-primary gap-2">
              <Home className="w-4 h-4" />
              {t('notFound.goHome')}
            </Link>
            <Link to="/jams" className="btn btn-outline gap-2">
              <Search className="w-4 h-4" />
              {t('notFound.browseJams')}
            </Link>
          </div>
        </div>
      </div>
    </>
  )
}
