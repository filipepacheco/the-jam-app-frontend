/**
 * Feedback Type Definitions
 * Types for the app feedback feature
 */

/**
 * Create feedback request DTO
 */
export interface CreateFeedbackDto {
  rating: number           // 1-5 star rating (required)
  comment?: string         // Optional text comment (max 500 chars)
  userAgent?: string       // Browser user agent (auto-captured)
  pageUrl?: string         // Current page URL (auto-captured)
}

/**
 * Feedback response DTO
 */
export interface FeedbackResponseDto {
  id: string
  rating: number
  comment?: string
  createdAt: string
  userId?: string          // null for anonymous users
}
