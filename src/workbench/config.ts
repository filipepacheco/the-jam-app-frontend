import { THEMES } from '../lib/uiConstants'
import type { WorkbenchAuthRole } from './fixtures'

export const WORKBENCH_LOCALES = [
  { value: 'pt', title: 'Português' },
  { value: 'en', title: 'English' },
  { value: 'es', title: 'Español' },
] as const

export const WORKBENCH_ROLES: ReadonlyArray<{ value: WorkbenchAuthRole; title: string }> = [
  { value: 'guest', title: 'Guest' },
  { value: 'viewer', title: 'Viewer' },
  { value: 'user', title: 'Musician' },
  { value: 'host', title: 'Host' },
]

export const WORKBENCH_ROUTES = [
  { value: '/', title: 'Home' },
  { value: '/jams', title: 'Jams' },
  { value: '/host', title: 'Host panel' },
] as const

export const WORKBENCH_VIEWPORTS = {
  navbarNarrow: { name: 'Navbar narrow', styles: { width: '320px', height: '844px' }, type: 'mobile' },
  phone: { name: 'Phone', styles: { width: '390px', height: '844px' }, type: 'mobile' },
  tablet: { name: 'Tablet', styles: { width: '768px', height: '1024px' }, type: 'tablet' },
  navbarDesktopThreshold: { name: 'Navbar desktop threshold', styles: { width: '1280px', height: '900px' }, type: 'desktop' },
  desktop: { name: 'Desktop', styles: { width: '1440px', height: '900px' }, type: 'desktop' },
  venue: { name: 'Venue display', styles: { width: '1920px', height: '1080px' }, type: 'desktop' },
} as const

export { THEMES as WORKBENCH_THEMES }
