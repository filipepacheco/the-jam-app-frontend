/**
 * Profile Header Component
 * Beautiful header displaying user avatar, name, role, and member info
 */

import type {AuthUser} from '../types/auth.types'
import {getRoleLabel} from '../lib/auth'
import {useTranslation} from 'react-i18next'
import {translateDynamicValue} from '../lib/i18n/translationKeys'
import {useAppLanguage} from '../hooks'
import {formatDate} from '../lib/i18n/applicationLocale'
import {Badge} from './data-display'

interface ProfileHeaderProps {
  user: AuthUser
}

export function ProfileHeader({ user }: ProfileHeaderProps) {
  const { t } = useTranslation()
  const {currentLang} = useAppLanguage()
  // Get role-based colors
  const getRoleColorClasses = () => {
    switch (user.role) {
      case 'host':
        return {
          surface: 'from-primary to-primary/80 text-primary-content',
          avatar: 'bg-primary-content text-primary',
        }
      case 'user':
        return {
          surface: 'from-secondary to-secondary/80 text-secondary-content',
          avatar: 'bg-secondary-content text-secondary',
        }
      default:
        return {
          surface: 'from-neutral to-neutral/80 text-neutral-content',
          avatar: 'bg-neutral-content text-neutral',
        }
    }
  }

  const roleColorClasses = getRoleColorClasses()

  // Get initials from name
  const initials = (user.name || 'U')
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()

  // Format member since date
  const memberSince = user.supabaseUserId
    ? formatDate(new Date(), currentLang, {year: 'numeric', month: 'long'})
    : 'Recently joined'

  return (
    <div className={`card bg-gradient-to-r ${roleColorClasses.surface} shadow-xl`}>
      <div className="card-body items-center text-center">
        {/* Avatar Circle */}
        <div className="avatar placeholder mb-4">
          <div className={`${roleColorClasses.avatar} flex w-24 items-center justify-center rounded-full`}>
            <span className="text-4xl font-bold">{initials}</span>
          </div>
        </div>

        {/* Name */}
        <h1 className="card-title text-3xl font-bold">{user.name || 'Complete Your Profile'}</h1>

        {/* Role Badge */}
        <Badge tone="neutral" size="lg" className="mt-2">
          {getRoleLabel(user.role, t)}
        </Badge>

        {/* Member Since */}
        <p className="text-sm opacity-90 mt-3">
          Member since {memberSince}
        </p>

        {/* Additional Info Line */}
        {user.instrument && (
          <p className="text-sm opacity-90">
            🎸 {translateDynamicValue(t, 'schedule.instruments', user.instrument)}
            {user.level && ` • ${user.level}`}
          </p>
        )}
      </div>
    </div>
  )
}
