import { useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { jamService } from '../services'
import { FullPageSpinner } from '../components'

/**
 * Redirect page for root-level slug URLs (/:slug).
 * Tries to resolve the slug as a jam, redirects to /jams/:slug if found,
 * otherwise redirects to home.
 */
export function SlugRedirect() {
  const { slug } = useParams<{ slug: string }>()
  const navigate = useNavigate()

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
        navigate('/', { replace: true })
      }
    }).catch(() => {
      navigate('/', { replace: true })
    })
  }, [slug, navigate])

  return <FullPageSpinner />
}
