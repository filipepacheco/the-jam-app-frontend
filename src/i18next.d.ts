import 'i18next'
import type {Catalogue} from './locales/catalogue/catalogue'
import type {TranslationResource} from './locales/catalogue'

declare module 'i18next' {
  interface CustomTypeOptions {
    defaultNS: 'translation'
    returnNull: false
    returnObjects: false
    resources: {
      translation: TranslationResource<Catalogue>
    }
  }
}
