/**
 * Feedback Service
 * Handles API operations for app feedback
 */

import { apiClient } from '../lib/api'
import type { CreateFeedbackDto, FeedbackResponseDto, FeedbackListResponseDto } from '../types/feedback.types'
import type { ApiResponse } from '../types/api.types'

/**
 * Feedback Service
 * Encapsulates feedback-related API calls
 */
export const feedbackService = {
  /**
   * Submit feedback
   * Auto-captures userAgent and pageUrl
   * @param data - Feedback data (rating required, comment optional)
   * @returns Promise with created feedback
   */
  async create(data: Pick<CreateFeedbackDto, 'rating' | 'comment'>): Promise<ApiResponse<FeedbackResponseDto>> {
    const payload: CreateFeedbackDto = {
      ...data,
      userAgent: navigator.userAgent,
      pageUrl: window.location.href,
    }
    return apiClient.post<FeedbackResponseDto>('/feedback', payload)
  },

  /**
   * List all feedback (host only)
   * @param page - Page number (1-based)
   * @param limit - Items per page
   * @returns Promise with paginated feedback list
   */
  async list(page = 1, limit = 20): Promise<ApiResponse<FeedbackListResponseDto>> {
    return apiClient.get<FeedbackListResponseDto>(`/feedback?page=${page}&limit=${limit}`)
  },
}
