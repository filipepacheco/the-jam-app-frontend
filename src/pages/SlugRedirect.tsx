import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { jamService } from '../services'
import {getJamPath} from '../utils/jamUrl'
import { NotFoundPage } from './NotFoundPage'

/**
 * Redirect page for root-level slug URLs (/:slug).
 * Tries to resolve the slug as a jam, redirects to /jams/:slug if found,
 * otherwise shows 404.
 */
export function SlugRedirect() {
  const { slug } = useParams<{ slug: string }>()
  const navigate = useNavigate()
  const [notFound, setNotFound] = useState(false)

  useEffect(() => {
    if (!slug) {
      navigate('/', { replace: true })
      return
    }

    jamService.findOne(slug).then(jam => {
      if (jam) {
        const target = getJamPath(jam)
        navigate(target, { replace: true })
      } else {
        setNotFound(true)
      }
    }).catch(() => {
      setNotFound(true)
    })
  }, [slug, navigate])

  if (notFound) return <NotFoundPage />
  return (
    <div className="min-h-screen flex items-center justify-center bg-base-100">
      <div className="flex flex-col items-center gap-3 animate-pulse">
        <div className="skeleton h-12 w-12 rounded-full" />
        <div className="skeleton h-4 w-32 rounded" />
      </div>
    </div>
  )
}
