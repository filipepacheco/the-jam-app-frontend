import {useTranslation} from 'react-i18next'
import {Link} from 'react-router-dom'
import {Music, Users, Monitor, Globe, Mail, Shield} from 'lucide-react'
import {SEO} from '../components/SEO'
import Navbar from '../components/Navbar'
import Footer from '../components/Footer'
import {SITE_URL} from '../lib/api'
import {buildAboutJsonLd} from '../../site.config'

export function AboutPage() {
  const {t} = useTranslation()
  const siteUrl = SITE_URL

  const aboutJsonLd = buildAboutJsonLd(siteUrl, {
    name: t('about.seo_title'),
    description: t('about.seo_description'),
    contactEmail: 'contato@jamapp.com.br',
    breadcrumbs: {
      home: t('about.breadcrumb_home'),
      about: t('about.breadcrumb_about'),
    },
  })

  return (
    <>
      <SEO
        title={t('about.seo_title')}
        description={t('about.seo_description')}
        canonical={`${siteUrl}/about`}
        jsonLd={aboutJsonLd}
      />
      <Navbar />
      <main className="min-h-screen bg-base-100">
        {/* Hero */}
        <section className="py-16 sm:py-24 px-4">
          <div className="max-w-3xl mx-auto text-center">
            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-base-content mb-6">
              {t('about.title')}
            </h1>
            <p className="text-lg sm:text-xl text-base-content/70 leading-relaxed">
              {t('about.intro')}
            </p>
          </div>
        </section>

        {/* Mission */}
        <section className="py-12 px-4 bg-base-200/50">
          <div className="max-w-3xl mx-auto">
            <h2 className="text-2xl sm:text-3xl font-bold text-base-content mb-6">
              {t('about.mission_title')}
            </h2>
            <p className="text-base-content/70 text-lg leading-relaxed mb-4">
              {t('about.mission_p1')}
            </p>
            <p className="text-base-content/70 text-lg leading-relaxed">
              {t('about.mission_p2')}
            </p>
          </div>
        </section>

        {/* Who it's for */}
        <section className="py-12 px-4">
          <div className="max-w-3xl mx-auto">
            <h2 className="text-2xl sm:text-3xl font-bold text-base-content mb-8">
              {t('about.who_title')}
            </h2>
            <div className="grid gap-6 sm:grid-cols-2">
              <div className="sm:col-span-2 p-6 rounded-xl bg-base-200/50">
                <h3 className="flex items-center gap-2 font-bold text-base-content mb-2">
                  <Music className="w-5 h-5 text-primary" />
                  {t('about.who_hosts')}
                </h3>
                <p className="text-sm text-base-content/70">{t('about.who_hosts_desc')}</p>
              </div>
              <div className="p-6 rounded-xl bg-base-200/30">
                <h3 className="flex items-center gap-2 font-bold text-base-content mb-2">
                  <Users className="w-5 h-5 text-secondary" />
                  {t('about.who_musicians')}
                </h3>
                <p className="text-sm text-base-content/70">{t('about.who_musicians_desc')}</p>
              </div>
              <div className="p-6 rounded-xl bg-base-200/30">
                <h3 className="flex items-center gap-2 font-bold text-base-content mb-2">
                  <Monitor className="w-5 h-5 text-accent" />
                  {t('about.who_audience')}
                </h3>
                <p className="text-sm text-base-content/70">{t('about.who_audience_desc')}</p>
              </div>
            </div>
          </div>
        </section>

        {/* Values */}
        <section className="py-12 px-4 bg-base-200/50">
          <div className="max-w-3xl mx-auto">
            <h2 className="text-2xl sm:text-3xl font-bold text-base-content mb-8">
              {t('about.values_title')}
            </h2>
            <div className="grid gap-6 sm:grid-cols-2">
              <div className="flex gap-4">
                <Globe className="w-6 h-6 text-primary shrink-0 mt-1" />
                <div>
                  <h3 className="font-bold text-base-content mb-1">{t('about.value_free')}</h3>
                  <p className="text-sm text-base-content/70">{t('about.value_free_desc')}</p>
                </div>
              </div>
              <div className="flex gap-4">
                <Shield className="w-6 h-6 text-primary shrink-0 mt-1" />
                <div>
                  <h3 className="font-bold text-base-content mb-1">{t('about.value_privacy')}</h3>
                  <p className="text-sm text-base-content/70">{t('about.value_privacy_desc')}</p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Contact */}
        <section className="py-12 px-4">
          <div className="max-w-3xl mx-auto text-center">
            <h2 className="text-2xl sm:text-3xl font-bold text-base-content mb-4">
              {t('about.contact_title')}
            </h2>
            <p className="text-base-content/70 mb-6">
              {t('about.contact_text')}
            </p>
            <a
              href="mailto:contato@jamapp.com.br"
              className="btn btn-primary gap-2"
            >
              <Mail className="w-4 h-4" />
              contato@jamapp.com.br
            </a>
          </div>
        </section>

        {/* CTA */}
        <section className="py-12 px-4 bg-base-200/50">
          <div className="max-w-3xl mx-auto text-center">
            <h2 className="text-2xl font-bold text-base-content mb-4">
              {t('about.cta_title')}
            </h2>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <Link to="/jams" className="btn btn-primary">
                {t('about.cta_explore')}
              </Link>
              <Link to="/register" className="btn btn-outline">
                {t('about.cta_register')}
              </Link>
            </div>
          </div>
        </section>

        <Footer />
      </main>
    </>
  )
}
