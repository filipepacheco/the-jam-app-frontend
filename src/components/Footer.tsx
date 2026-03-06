import { useTranslation } from 'react-i18next'

function Footer() {
  const { t } = useTranslation()
  return (
    <footer className="footer footer-center bg-base-300 text-base-content p-4 sm:p-8 lg:p-10">
      <nav className="flex flex-wrap justify-center gap-4 text-xs sm:text-sm">
        <a href="/jams" className="link link-hover">{t('nav.jams')}</a>
        <a href="/about" className="link link-hover">{t('nav.about')}</a>
        <a href="/register" className="link link-hover">{t('auth.sign_up')}</a>
        <a href="/privacy.html" className="link link-hover">{t('common.privacy_policy')}</a>
      </nav>
      <aside>
        <p className="text-xs sm:text-sm">
          {t('common.copyright')} © {new Date().getFullYear()} - {t('common.app_name')}. {t('common.all_rights_reserved')}
        </p>
      </aside>
    </footer>
  )
}

export default Footer

