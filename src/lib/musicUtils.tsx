/**
 * Music Utility Functions
 * Reusable helper functions for music operations
 */
import type {OAuthProvider} from "./supabase";

export const providerIcons: Record<OAuthProvider, any> = {
  google: <svg aria-label="Google logo" width="16" height="16" xmlns="http://www.w3.org/2000/svg"
  viewBox="0 0 512 512">
  <g>
      <path d="m0 0H512V512H0" fill="#fff"></path>
      <path fill="#34a853" d="M153 292c30 82 118 95 171 60h62v48A192 192 0 0190 341"></path>
      <path fill="#4285f4" d="m386 400a140 175 0 0053-179H260v74h102q-7 37-38 57"></path>
      <path fill="#fbbc02" d="m90 341a208 200 0 010-171l63 49q-12 37 0 73"></path>
      <path fill="#ea4335" d="m153 219c22-69 116-109 179-50l55-54c-78-75-230-72-297 55"></path>
      </g>
      </svg>,
  github: <svg aria-label="GitHub logo" width="16" height="16" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24">
  <path fill="white"
  d="M12,2A10,10 0 0,0 2,12C2,16.42 4.87,20.17 8.84,21.5C9.34,21.58 9.5,21.27 9.5,21C9.5,20.77 9.5,20.14 9.5,19.31C6.73,19.91 6.14,17.97 6.14,17.97C5.68,16.81 5.03,16.5 5.03,16.5C4.12,15.88 5.1,15.9 5.1,15.9C6.1,15.97 6.63,16.93 6.63,16.93C7.5,18.45 8.97,18 9.54,17.76C9.63,17.11 9.89,16.67 10.17,16.42C7.95,16.17 5.62,15.31 5.62,11.5C5.62,10.39 6,9.5 6.65,8.79C6.55,8.54 6.2,7.5 6.75,6.15C6.75,6.15 7.59,5.88 9.5,7.17C10.29,6.95 11.15,6.84 12,6.84C12.85,6.84 13.71,6.95 14.5,7.17C16.41,5.88 17.25,6.15 17.25,6.15C17.8,7.5 17.45,8.54 17.35,8.79C18,9.5 18.38,10.39 18.38,11.5C18.38,15.32 16.04,16.16 13.81,16.41C14.17,16.72 14.5,17.33 14.5,18.26C14.5,19.6 14.5,20.68 14.5,21C14.5,21.27 14.66,21.59 15.17,21.5C19.14,20.16 22,16.42 22,12A10,10 0 0,0 12,2Z"></path>
      </svg>,
  discord: <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor"
  className="bi bi-discord" viewBox="0 0 16 16">
  <path
      d="M13.545 2.907a13.2 13.2 0 0 0-3.257-1.011.05.05 0 0 0-.052.025c-.141.25-.297.577-.406.833a12.2 12.2 0 0 0-3.658 0 8 8 0 0 0-.412-.833.05.05 0 0 0-.052-.025c-1.125.194-2.22.534-3.257 1.011a.04.04 0 0 0-.021.018C.356 6.024-.213 9.047.066 12.032q.003.022.021.037a13.3 13.3 0 0 0 3.995 2.02.05.05 0 0 0 .056-.019q.463-.63.818-1.329a.05.05 0 0 0-.01-.059l-.018-.011a9 9 0 0 1-1.248-.595.05.05 0 0 1-.02-.066l.015-.019q.127-.095.248-.195a.05.05 0 0 1 .051-.007c2.619 1.196 5.454 1.196 8.041 0a.05.05 0 0 1 .053.007q.121.1.248.195a.05.05 0 0 1-.004.085 8 8 0 0 1-1.249.594.05.05 0 0 0-.03.03.05.05 0 0 0 .003.041c.24.465.515.909.817 1.329a.05.05 0 0 0 .056.019 13.2 13.2 0 0 0 4.001-2.02.05.05 0 0 0 .021-.037c.334-3.451-.559-6.449-2.366-9.106a.03.03 0 0 0-.02-.019m-8.198 7.307c-.789 0-1.438-.724-1.438-1.612s.637-1.613 1.438-1.613c.807 0 1.45.73 1.438 1.613 0 .888-.637 1.612-1.438 1.612m5.316 0c-.788 0-1.438-.724-1.438-1.612s.637-1.613 1.438-1.613c.807 0 1.451.73 1.438 1.613 0 .888-.631 1.612-1.438 1.612"/>
      </svg>,
  spotify: <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor"
  className="bi bi-spotify" viewBox="0 0 16 16">
  <path
      d="M8 0a8 8 0 1 0 0 16A8 8 0 0 0 8 0m3.669 11.538a.5.5 0 0 1-.686.165c-1.879-1.147-4.243-1.407-7.028-.77a.499.499 0 0 1-.222-.973c3.048-.696 5.662-.397 7.77.892a.5.5 0 0 1 .166.686m.979-2.178a.624.624 0 0 1-.858.205c-2.15-1.321-5.428-1.704-7.972-.932a.625.625 0 0 1-.362-1.194c2.905-.881 6.517-.454 8.986 1.063a.624.624 0 0 1 .206.858m.084-2.268C10.154 5.56 5.9 5.419 3.438 6.166a.748.748 0 1 1-.434-1.432c2.825-.857 7.523-.692 10.492 1.07a.747.747 0 1 1-.764 1.288"/>
      </svg>,
}

export  const providerLabels: Record<OAuthProvider, string> = {
  google: 'Google',
  github: 'GitHub',
  discord: 'Discord',
  spotify: 'Spotify',
}

/**
 * Parse duration from mm:ss to seconds
 */
export function parseDuration(mmss: string): number | null {
  if (!mmss) return null
  const parts = mmss.split(':')
  if (parts.length !== 2) return null
  const mins = parseInt(parts[0], 10)
  const secs = parseInt(parts[1], 10)
  if (isNaN(mins) || isNaN(secs)) return null
  return mins * 60 + secs
}

/**
 * Check if a song already exists in the list (for duplicate detection)
 */
export function isDuplicate(
  musicList: Array<{ id: string; title: string; artist: string }>,
  title: string,
  artist: string,
  excludeId?: string
): boolean {
  return musicList.some(
    (music) =>
      music.id !== excludeId &&
      music.title.toLowerCase() === title.toLowerCase() &&
      music.artist.toLowerCase() === artist.toLowerCase()
  )
}

/**
 * Filter and sort music based on multiple criteria
 */
export interface MusicFilterOptions {
  status: 'all' | 'approved' | 'suggested'
  searchTerm: string
  genreFilter: string
  sortBy: 'title' | 'artist' | 'date'
}

export function filterAndSortMusic<T extends { id: string; title: string; artist: string; genre?: string; status?: string; createdAt: string }>(
  musicList: T[],
  options: MusicFilterOptions
): T[] {
  let filtered = [...musicList]

  // Apply status filter
  if (options.status === 'approved') {
    filtered = filtered.filter((music) => music.status === 'APPROVED' || !music.status)
  } else if (options.status === 'suggested') {
    filtered = filtered.filter((music) => music.status === 'SUGGESTED')
  }

  // Apply search filter
  if (options.searchTerm) {
    const search = options.searchTerm.toLowerCase()
    filtered = filtered.filter(
      (music) =>
        music.title.toLowerCase().includes(search) ||
        music.artist.toLowerCase().includes(search)
    )
  }

  // Apply genre filter
  if (options.genreFilter) {
    filtered = filtered.filter((music) => music.genre === options.genreFilter)
  }

  // Apply sort
  filtered.sort((a, b) => {
    if (options.sortBy === 'title') {
      return a.title.localeCompare(b.title)
    } else if (options.sortBy === 'artist') {
      return a.artist.localeCompare(b.artist)
    } else {
      // date
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    }
  })

  return filtered
}

