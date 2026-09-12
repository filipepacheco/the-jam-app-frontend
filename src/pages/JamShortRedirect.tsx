import {useEffect} from 'react'
import {useNavigate, useParams} from 'react-router-dom'
import {jamService} from '../services'

/**
 * Redirect page for short code URLs (/j/:code).
 * Resolves the short code to the jam's slug/id and redirects.
 */
export function JamShortRedirect() {
  const {code} = useParams<{ code: string }>()
  const navigate = useNavigate()

  useEffect(() => {
    if (!code) {
      navigate('/', {replace: true})
      return
    }

    // Backend resolves short codes via the same /jams/:identifier endpoint
    jamService.findOne(code).then(result => {
      const jam = result.data
      if (jam) {
        const target = jam.slug ? `/jams/${jam.slug}` : `/jams/${jam.id}`
        navigate(target, {replace: true})
      } else {
        navigate('/', {replace: true})
      }
    }).catch(() => {
      navigate('/', {replace: true})
    })
  }, [code, navigate])

  return (
    <div className="min-h-screen flex items-center justify-center bg-base-100">
      {/* Documented design-system exception (issue #50): a circle above a
          short bar. The canonical `Skeleton` primitive renders uniform
          full-width lines only, so it cannot reproduce this silhouette.
          Same reasoning as PageHeaderSkeleton.tsx. */}
      <div className="flex flex-col items-center gap-3 animate-pulse">
        <div className="skeleton h-12 w-12 rounded-full" />
        <div className="skeleton h-4 w-32 rounded" />
      </div>
    </div>
  )
}
