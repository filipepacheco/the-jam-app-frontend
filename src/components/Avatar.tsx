/**
 * Avatar Component
 * Displays user avatar with initials fallback
 */

interface AvatarProps {
  name: string
  imageUrl?: string | null
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl'
  className?: string
}

export function Avatar({ name, imageUrl, size = 'md', className = '' }: AvatarProps) {
  /**
   * Generate initials from name (first letter of first + last name)
   * @param name - Full name string
   * @returns Two-letter initials or single letter for one-word names
   */
  const getInitials = (name: string): string => {
    const parts = name.trim().split(/\s+/)
    if (parts.length === 0 || !parts[0]) return '?'
    if (parts.length === 1) return parts[0][0]?.toUpperCase() || '?'
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase()
  }

  /**
   * Get deterministic color class from name hash
   * @param name - Full name string
   * @returns daisyUI semantic background color class
   */
  const getColorClass = (name: string): string => {
    const colors = ['bg-primary', 'bg-secondary', 'bg-accent', 'bg-info', 'bg-success', 'bg-warning/70']
    const hash = name.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0)
    return colors[hash % colors.length]
  }

  const sizeClasses = {
    xs: 'w-6 h-6 text-xs',
    sm: 'w-8 h-8 text-sm',
    md: 'w-10 h-10 text-base',
    lg: 'w-12 h-12 text-lg',
    xl: 'w-16 h-16 text-xl'
  }

  const initials = getInitials(name)
  const colorClass = getColorClass(name)

  return (
    <div className={`avatar ${className}`}>
      <div className={`${sizeClasses[size]} rounded-full ${colorClass} text-base-content flex items-center justify-center font-bold shrink-0`}>
        {imageUrl ? (
          <img src={imageUrl} alt={name} className="rounded-full object-cover" />
        ) : (
          <span>{initials}</span>
        )}
      </div>
    </div>
  )
}
