import { useMemo } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { useCarouselCycle } from '../../../hooks'
import { NowPlayingPanel } from './NowPlayingPanel'
import { UpNextPanel } from './UpNextPanel'
import { QRCodePanel } from './QRCodePanel'
import { StartingSoonPanel } from './StartingSoonPanel'
import { FinishedPanel } from './FinishedPanel'
import { CarouselIndicator } from './CarouselIndicator'
import type { DashboardSongDto, JamStatus } from '../../../types/api.types'
import type { ReactNode } from 'react'

interface CarouselDashboardProps {
  jamStatus: JamStatus | null
  currentSong: DashboardSongDto | null
  nextSongs: DashboardSongDto[]
  jamId?: string
  slug?: string | null
  intervalMs: number
}

interface Panel {
  key: string
  content: ReactNode
}

export function CarouselDashboard({
  jamStatus,
  currentSong,
  nextSongs,
  jamId,
  slug,
  intervalMs,
}: CarouselDashboardProps) {
  const panels = useMemo<Panel[]>(() => {
    // FINISHED: single static panel
    if (jamStatus === 'FINISHED') {
      return [{ key: 'finished', content: <FinishedPanel /> }]
    }

    // No current song: starting soon + QR
    if (!currentSong) {
      const result: Panel[] = [
        { key: 'starting', content: <StartingSoonPanel song={nextSongs[0] ?? null} /> },
      ]
      result.push({ key: 'qr', content: <QRCodePanel jamId={jamId} slug={slug} /> })
      return result
    }

    // Playing: now playing + optional up next + QR
    const result: Panel[] = [
      { key: `now-${currentSong.id}`, content: <NowPlayingPanel song={currentSong} /> },
    ]

    if (nextSongs[0]) {
      result.push({
        key: `next-${nextSongs[0].id}`,
        content: <UpNextPanel song={nextSongs[0]} />,
      })
    }

    result.push({ key: 'qr', content: <QRCodePanel jamId={jamId} slug={slug} /> })

    return result
  }, [jamStatus, currentSong, nextSongs, jamId, slug])

  const isFinished = jamStatus === 'FINISHED'

  const { activeIndex, goTo } = useCarouselCycle({
    panelCount: panels.length,
    intervalMs,
    enabled: !isFinished,
  })

  const activePanel = panels[activeIndex]

  return (
    <div className="relative pt-20 pb-8 px-4 md:px-8 z-10 flex flex-col min-h-[calc(100vh-5rem)]">
      <div className="flex-1 flex items-center justify-center">
        <AnimatePresence mode="wait">
          <motion.div
            key={activePanel.key}
            initial={{ opacity: 0, scale: 0.96 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.96 }}
            transition={{ duration: 0.4 }}
            className="w-full max-w-6xl mx-auto"
          >
            {activePanel.content}
          </motion.div>
        </AnimatePresence>
      </div>

      <CarouselIndicator
        count={panels.length}
        activeIndex={activeIndex}
        onSelect={goTo}
      />
    </div>
  )
}
