import {useTranslation} from 'react-i18next'

function Footer() {
  const { t } = useTranslation()
  return (
    <footer className="footer footer-center bg-base-300 text-base-content p-4 sm:p-8 lg:p-10">
      <aside>
        <p className="text-xs sm:text-sm">
          {t('common.copyright')} © {new Date().getFullYear()} - {t('common.app_name')}. {t('common.all_rights_reserved')}
        </p>
      </aside>
    </footer>
  )
}

export default Footer

