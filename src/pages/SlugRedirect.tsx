import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { jamService } from '../services'
import { FullPageSpinner } from '../components'
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

    jamService.findOne(slug).then(result => {
      const jam = result.data
      if (jam) {
        const target = jam.slug ? `/jams/${jam.slug}` : `/jams/${jam.id}`
        navigate(target, { replace: true })
      } else {
        setNotFound(true)
      }
    }).catch(() => {
      setNotFound(true)
    })
  }, [slug, navigate])

  if (notFound) return <NotFoundPage />
  return <FullPageSpinner />
}
