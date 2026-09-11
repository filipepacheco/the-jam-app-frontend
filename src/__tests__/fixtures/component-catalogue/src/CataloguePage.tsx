import {lazy} from 'react'
import type {JSX} from 'react'
import {useNavigate} from 'react-router-dom'

import * as Library from './index.ts'
import {ReExportedWidget} from './public.ts'

const DynamicDefault = lazy(() => import('./DynamicSet.tsx'))

export const CataloguePage = (): JSX.Element => {
  const navigate = useNavigate()

  function LocalBadge(): JSX.Element {
    return <span>{window.location.hostname}</span>
  }

  return (
    <main onClick={() => navigate('/')}>
      <Library.DefaultPanel />
      <ReExportedWidget />
      <DynamicDefault />
      <LocalBadge />
    </main>
  )
}
