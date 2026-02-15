import {useEffect} from 'react'
import {useNavigate, useParams} from 'react-router-dom'
import {jamService} from '../services'
import {FullPageSpinner} from '../components'

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

  return <FullPageSpinner />
}
