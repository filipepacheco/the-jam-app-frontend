/**
 * Profile Header Component
 * Beautiful header displaying user avatar, name, role, and member info
 */

import type {AuthUser} from '../types/auth.types'
import {getRoleLabel} from '../lib/auth'
import {useTranslation} from 'react-i18next'

interface ProfileHeaderProps {
  user: AuthUser
}

export function ProfileHeader({ user }: ProfileHeaderProps) {
  const { t } = useTranslation()
  // Get role-based colors
  const getRoleBgColor = () => {
    switch (user.role) {
      case 'host':
        return 'from-primary to-primary/80'
      case 'user':
        return 'from-secondary to-secondary/80'
      default:
        return 'from-neutral to-neutral/80'
    }
  }

  const getRoleBadgeColor = () => {
    switch (user.role) {
      case 'host':
        return 'badge-secondary'
      case 'user':
        return 'badge-primary'
      default:
        return 'badge-neutral'
    }
  }

  // Get initials from name
  const initials = (user.name || 'U')
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()

  // Format member since date
  const memberSince = user.supabaseUserId
    ? new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long' })
    : 'Recently joined'

  return (
    <div className={`card bg-gradient-to-r ${getRoleBgColor()} text-primary-content shadow-xl`}>
      <div className="card-body items-center text-center">
        {/* Avatar Circle */}
        <div className="avatar placeholder mb-4">
          <div className="bg-white text-primary rounded-full w-24 flex items-center justify-center">
            <span className="text-4xl font-bold">{initials}</span>
          </div>
        </div>

        {/* Name */}
        <h1 className="card-title text-3xl font-bold">{user.name || 'Complete Your Profile'}</h1>

        {/* Role Badge */}
        <div className={`badge badge-lg ${getRoleBadgeColor()} badge-outline text-white border-white mt-2`}>
          {getRoleLabel(user.role)}
        </div>

        {/* Member Since */}
        <p className="text-sm opacity-90 mt-3">
          Member since {memberSince}
        </p>

        {/* Additional Info Line */}
        {user.instrument && (
          <p className="text-sm opacity-90">
            🎸 {t(`schedule.instruments.${user.instrument}`, user.instrument)}
            {user.level && ` • ${user.level}`}
          </p>
        )}
      </div>
    </div>
  )
}

