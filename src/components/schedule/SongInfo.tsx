/**
 * Song Info Component
 * Displays song details (title, artist, duration)
 */
import type {MusicResponseDto} from "../../types/api.types.ts";
import {useTranslation} from 'react-i18next'
import {InstrumentBadges} from './InstrumentBadges'

interface SongInfoProps {
    music: MusicResponseDto
}

export function SongInfo({music}: SongInfoProps) {
    const { t } = useTranslation()
    const {title, artist, duration, genre, neededDrums, neededKeys, neededVocals, neededGuitars, neededBass} = music;

    return (
        <div className="flex-1 min-w-0">
            <p className="truncate">
                <span className="font-semibold text-lg">{title || t('schedule.song_tba')}</span>
                <span className="text-sm text-base-content/70 ml-2">{t('common.by')} {artist || t('schedule.artist_tba')}</span>
                <span className="text-sm text-base-content/70 ml-1">({genre})</span>
            </p>
            <InstrumentBadges
                neededDrums={neededDrums}
                neededGuitars={neededGuitars}
                neededVocals={neededVocals}
                neededBass={neededBass}
                neededKeys={neededKeys}
                duration={duration}
                badgeSize="badge-md"
            />
        </div>
    )
}
