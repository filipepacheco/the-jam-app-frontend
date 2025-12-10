/**
 * Test Data Seeding Component
 * This page helps populate the database with test data for development
 */

import {useState} from 'react'
import {musicService} from '../services/musicService'
import {musicianService} from '../services/musicianService'
import {registrationService} from '../services/registrationService'
import {scheduleService} from '../services/scheduleService'
import type {CreateMusicDto, CreateMusicianDto, CreateRegistrationDto, CreateScheduleDto,} from '../types/api.types'

interface SeedResult {
  type: 'success' | 'error'
  message: string
}

export function TestDataSeedPage() {
  const [jamId, setJamId] = useState('c049d8af-d44e-4b4f-ab97-5006e38d66ff') // First jam from API
  const [loading, setLoading] = useState(false)
  const [results, setResults] = useState<SeedResult[]>([])

  const seedTestData = async () => {
    if (!jamId) {
      setResults([{ type: 'error', message: 'Please provide a Jam ID' }])
      return
    }

    setLoading(true)
    setResults([])
    const newResults: SeedResult[] = []

    try {
      // Create test musicians
      const musicians = await Promise.all([
        musicianService.create({
          name: 'John Doe',
          contact: 'john@example.com',
          instrument: 'GUITARRA',
          level: 'INTERMEDIATE',
        } as CreateMusicianDto),
        musicianService.create({
          name: 'Jane Smith',
          contact: 'jane@example.com',
          instrument: 'BATERIA',
          level: 'ADVANCED',
        } as CreateMusicianDto),
        musicianService.create({
          name: 'Mike Johnson',
          contact: 'mike@example.com',
          instrument: 'BAIXO',
          level: 'BEGINNER',
        } as CreateMusicianDto),
        musicianService.create({
          name: 'Sarah Williams',
          contact: 'sarah@example.com',
          instrument: 'VOCAL',
          level: 'ADVANCED',
        } as CreateMusicianDto),
      ])

      newResults.push({
        type: 'success',
        message: `✓ Created ${musicians.length} test musicians`,
      })

      // Create test songs
      const songs = await Promise.all([
        musicService.create({
          title: 'Bluesette',
          artist: 'Toots Thielemans',
          genre: 'JAZZ',
          duration: 240,
        } as CreateMusicDto),
        musicService.create({
          title: 'All The Things You Are',
          artist: 'Jerome Kern',
          genre: 'JAZZ',
          duration: 320,
        } as CreateMusicDto),
        musicService.create({
          title: 'Girl from Ipanema',
          artist: 'Tom Jobim',
          genre: 'BOSSA_NOVA',
          duration: 280,
        } as CreateMusicDto),
      ])

      newResults.push({
        type: 'success',
        message: `✓ Created ${songs.length} test songs`,
      })

      // Link songs to the jam
      const linkedMusics = await Promise.all([
        musicService.linkToJam(songs[0].data.id, jamId),
        musicService.linkToJam(songs[1].data.id, jamId),
        musicService.linkToJam(songs[2].data.id, jamId),
      ])

      newResults.push({
        type: 'success',
        message: `✓ Linked ${linkedMusics.length} songs to jam`,
      })

      // Create registrations linking musicians to the jam
      const registrations = await Promise.all([
        registrationService.create({
          musicianId: musicians[0].data.id,
          jamMusicId: (linkedMusics[0].data as Record<string, unknown>)?.id as string,
        } as unknown as CreateRegistrationDto),
        registrationService.create({
          musicianId: musicians[1].data.id,
          jamMusicId: (linkedMusics[1].data as Record<string, unknown>)?.id as string,
        } as unknown as CreateRegistrationDto),
        registrationService.create({
          musicianId: musicians[2].data.id,
          jamMusicId: (linkedMusics[2].data as Record<string, unknown>)?.id as string,
        } as unknown as CreateRegistrationDto),
        registrationService.create({
          musicianId: musicians[3].data.id,
          jamMusicId: (linkedMusics[0].data as Record<string, unknown>)?.id as string,
        } as unknown as CreateRegistrationDto),
      ])

      newResults.push({
        type: 'success',
        message: `✓ Created ${registrations.length} test registrations`,
      })

      // Create performance schedules
      const schedules = await Promise.all([
        scheduleService.create({
          jamId,
          musicId: songs[0].data.id,
          registrationId: registrations[0].data.id,
          order: 1,
          status: 'IN_PROGRESS',
        } as CreateScheduleDto),
        scheduleService.create({
          jamId,
          musicId: songs[1].data.id,
          registrationId: registrations[1].data.id,
          order: 2,
          status: 'SCHEDULED',
        } as CreateScheduleDto),
        scheduleService.create({
          jamId,
          musicId: songs[2].data.id,
          registrationId: registrations[2].data.id,
          order: 3,
          status: 'SCHEDULED',
        } as CreateScheduleDto),
        scheduleService.create({
          jamId,
          musicId: songs[0].data.id,
          registrationId: registrations[3].data.id,
          order: 4,
          status: 'SCHEDULED',
        } as CreateScheduleDto),
      ])

      newResults.push({
        type: 'success',
        message: `✓ Created ${schedules.length} test schedules`,
      })

      newResults.push({
        type: 'success',
        message: '✓ Test data seeding complete! Go to /jams to see the results.',
      })
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unknown error'
      newResults.push({
        type: 'error',
        message: `✗ Error: ${message}`,
      })
    } finally {
      setLoading(false)
      setResults(newResults)
    }
  }

  return (
    <div className="min-h-screen bg-base-100 p-4">
      <div className="container mx-auto max-w-2xl">
        <div className="card bg-base-200 shadow-lg">
          <div className="card-body">
            <h1 className="card-title text-2xl mb-4">🎸 Test Data Seeding</h1>
            <p className="text-base-content/70 mb-6">
              This tool creates test musicians, songs, registrations, and schedules to help
              you test the jam session features.
            </p>

            {/* Jam ID Input */}
            <div className="form-control mb-6">
              <label className="label">
                <span className="label-text font-semibold">Jam ID</span>
              </label>
              <input
                type="text"
                value={jamId}
                onChange={(e) => setJamId(e.target.value)}
                placeholder="Enter jam ID"
                className="input input-bordered"
              />
              <label className="label">
                <span className="label-text-alt text-xs text-base-content/60">
                  Default is the first jam from the API
                </span>
              </label>
            </div>

            {/* Seed Button */}
            <button
              onClick={seedTestData}
              disabled={loading}
              className="btn btn-primary btn-lg mb-6"
            >
              {loading ? (
                <>
                  <span className="loading loading-spinner"></span>
                  Seeding...
                </>
              ) : (
                '🌱 Seed Test Data'
              )}
            </button>

            {/* Results */}
            {results.length > 0 && (
              <div className="space-y-2">
                <h3 className="font-semibold mb-3">Results:</h3>
                {results.map((result, index) => (
                  <div
                    key={index}
                    className={`alert ${
                      result.type === 'success' ? 'alert-success' : 'alert-error'
                    }`}
                  >
                    <div>
                      <span>{result.message}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Info Box */}
            <div className="alert alert-info mt-6">
              <div>
                <p className="font-semibold mb-2">Test Data Created:</p>
                <ul className="list-disc list-inside text-sm space-y-1">
                  <li>4 musicians with different instruments</li>
                  <li>3 songs in different genres</li>
                  <li>4 registrations (musician → song links)</li>
                  <li>4 performance schedule entries</li>
                </ul>
              </div>
            </div>

            {/* Navigation */}
            <div className="card-actions justify-start mt-6">
              <a href="/jams" className="btn btn-outline">
                Go to Browse Jams
              </a>
              <a href={`/jams/${jamId}`} className="btn btn-outline">
                View Jam Details
              </a>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default TestDataSeedPage

