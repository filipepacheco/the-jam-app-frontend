/**
 * SWR Configuration Defaults
 * Shared SWR configuration constants to avoid repetition across App.tsx, hooks, and pages
 */

import type { SWRConfiguration } from 'swr'

export const SWR_DEFAULTS: SWRConfiguration = {
  revalidateOnFocus: true,
  revalidateOnReconnect: true,
  dedupingInterval: 2000,
  errorRetryCount: 3,
  errorRetryInterval: 5000,
}

export const SWR_POLLING_DEFAULTS: SWRConfiguration = {
  ...SWR_DEFAULTS,
  focusThrottleInterval: 5000,
}
