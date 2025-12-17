/**
 * Connection Status Indicator Component
 * Visual indicator for socket connection status
 */

import {useSocketStatus} from '../hooks'

export function ConnectionStatus() {
  const { isConnected, state, hasError } = useSocketStatus()

  // Determine color and icon based on state
  const getStatusDisplay = () => {
    switch (state) {
      case 'connected':
        return {
          color: 'text-green-500',
          bgColor: 'bg-green-50',
          badge: 'badge-success',
          label: 'Connected',
          icon: '●',
        }
      case 'connecting':
        return {
          color: 'text-yellow-500',
          bgColor: 'bg-yellow-50',
          badge: 'badge-warning',
          label: 'Connecting...',
          icon: '◆',
        }
      case 'disconnected':
        return {
          color: 'text-gray-500',
          bgColor: 'bg-gray-50',
          badge: 'badge-ghost',
          label: 'Offline',
          icon: '○',
        }
      case 'error':
        return {
          color: 'text-red-500',
          bgColor: 'bg-red-50',
          badge: 'badge-error',
          label: 'Error',
          icon: '✕',
        }
      default:
        return {
          color: 'text-gray-400',
          bgColor: 'bg-gray-50',
          badge: 'badge-ghost',
          label: 'Idle',
          icon: '○',
        }
    }
  }

  const display = getStatusDisplay()

  return (
    <div
      className={`inline-flex items-center gap-2 px-3 py-1 rounded-full ${display.bgColor} ${display.badge}`}
      title={`Socket: ${display.label}`}
    >
      <span className={`text-sm ${display.color}`}>{display.icon}</span>
      <span className="text-xs font-medium text-gray-600">{display.label}</span>
    </div>
  )
}

