/**
 * Feedback Page
 * View all user feedback (host only)
 * Route: /host/feedback
 */

import { useCallback, useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { Star, MessageSquare, User, Globe, ChevronLeft, ChevronRight } from 'lucide-react'
import { useAuth } from '../../hooks'
import { feedbackService } from '../../services/feedbackService'
import type { FeedbackListItemDto, FeedbackListResponseDto } from '../../types/feedback.types'
import { Alert } from '../../components'

export function FeedbackPage() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const { isAuthenticated, isLoading: authLoading, role } = useAuth()
  const [feedbackData, setFeedbackData] = useState<FeedbackListResponseDto | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [page, setPage] = useState(1)
  const limit = 20

  const loadFeedback = useCallback(async (pageNum: number) => {
    setLoading(true)
    setError(null)

    const result = await feedbackService.list(pageNum, limit)
    if (result.success && result.data) {
      setFeedbackData(result.data)
    } else {
      setError(result.error || t('feedback_page.load_error'))
    }
    setLoading(false)
  }, [t])

  useEffect(() => {
    if (authLoading) return

    if (!isAuthenticated) {
      navigate('/login')
      return
    }

    if (role !== 'host') {
      navigate('/host/dashboard')
      return
    }

    void loadFeedback(page)
  }, [authLoading, isAuthenticated, role, navigate, loadFeedback, page])

  const handlePageChange = (newPage: number) => {
    setPage(newPage)
  }

  const stats = useMemo(() => {
    if (!feedbackData) return { avgRating: 0, totalCount: 0 }

    const items = feedbackData.items
    if (items.length === 0) return { avgRating: 0, totalCount: feedbackData.total }

    const avgRating = items.reduce((sum, item) => sum + item.rating, 0) / items.length
    return { avgRating: Math.round(avgRating * 10) / 10, totalCount: feedbackData.total }
  }, [feedbackData])

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-base-100">
        <div className="flex flex-col items-center gap-3">
          <span className="loading loading-spinner loading-lg"></span>
          <span className="text-sm sm:text-base font-semibold text-base-content/70">
            {t('common.loading')}
          </span>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-base-100 px-2 sm:px-4 py-4 sm:py-8">
      <div className="container mx-auto max-w-4xl">
        {/* Header */}
        <div className="mb-6 sm:mb-8">
          <div className="flex items-center justify-between gap-2 sm:gap-4 mb-4 sm:mb-6 flex-wrap">
            <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold">
              {t('feedback_page.title')}
            </h1>
            <button
              onClick={() => navigate('/host/dashboard')}
              className="btn btn-ghost btn-sm sm:btn-md"
            >
              {t('common.back')}
            </button>
          </div>

          {error && <Alert type="error" message={error} onDismiss={() => setError(null)} />}
        </div>

        {/* Statistics Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4 mb-6 sm:mb-8">
          <div className="stats shadow bg-base-200 p-3 sm:p-6 w-full">
            <div className="stat w-full">
              <div className="stat-title text-xs sm:text-sm">{t('feedback_page.stats.total')}</div>
              <div className="stat-value text-primary text-xl sm:text-2xl lg:text-3xl">
                {stats.totalCount}
              </div>
            </div>
          </div>

          <div className="stats shadow bg-base-200 p-3 sm:p-6 w-full">
            <div className="stat w-full">
              <div className="stat-title text-xs sm:text-sm">{t('feedback_page.stats.average')}</div>
              <div className="stat-value text-secondary text-xl sm:text-2xl lg:text-3xl flex items-center gap-2">
                {stats.avgRating}
                <Star className="w-6 h-6 fill-warning text-warning" />
              </div>
            </div>
          </div>
        </div>

        {/* Feedback List */}
        {loading && !feedbackData ? (
          <div className="flex justify-center py-8 sm:py-12">
            <div className="flex flex-col items-center gap-3">
              <span className="loading loading-spinner loading-lg"></span>
              <span className="text-sm sm:text-base font-semibold text-base-content/70">
                {t('feedback_page.loading')}
              </span>
            </div>
          </div>
        ) : feedbackData?.items.length === 0 ? (
          <div className="alert alert-info mb-6 sm:mb-8">
            <p className="text-sm sm:text-base">{t('feedback_page.no_feedback')}</p>
          </div>
        ) : (
          <>
            <div className="space-y-4">
              {feedbackData?.items.map((item) => (
                <FeedbackCard key={item.id} feedback={item} />
              ))}
            </div>

            {/* Pagination */}
            {feedbackData && feedbackData.totalPages > 1 && (
              <div className="flex justify-center items-center gap-4 mt-8">
                <button
                  onClick={() => handlePageChange(page - 1)}
                  disabled={page === 1 || loading}
                  className="btn btn-circle btn-sm"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>

                <span className="text-sm">
                  {t('feedback_page.pagination', {
                    page: feedbackData.page,
                    totalPages: feedbackData.totalPages
                  })}
                </span>

                <button
                  onClick={() => handlePageChange(page + 1)}
                  disabled={page === feedbackData.totalPages || loading}
                  className="btn btn-circle btn-sm"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )
}

interface FeedbackCardProps {
  feedback: FeedbackListItemDto
}

function FeedbackCard({ feedback }: FeedbackCardProps) {
  const { t } = useTranslation()

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr)
    return date.toLocaleDateString(undefined, {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  const renderStars = (rating: number) => {
    return (
      <div className="flex gap-0.5">
        {[1, 2, 3, 4, 5].map((star) => (
          <Star
            key={star}
            className={`w-4 h-4 ${
              star <= rating
                ? 'fill-warning text-warning'
                : 'text-base-content/30'
            }`}
          />
        ))}
      </div>
    )
  }

  return (
    <div className="card bg-base-200 shadow">
      <div className="card-body p-4 sm:p-6">
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-center gap-3">
            {renderStars(feedback.rating)}
            <span className="text-sm font-medium">
              {t(`feedback.stars.${feedback.rating}`)}
            </span>
          </div>
          <span className="text-xs text-base-content/60">
            {formatDate(feedback.createdAt)}
          </span>
        </div>

        {feedback.comment && (
          <div className="mt-3 flex items-start gap-2">
            <MessageSquare className="w-4 h-4 text-base-content/60 mt-0.5 flex-shrink-0" />
            <p className="text-sm text-base-content/80">{feedback.comment}</p>
          </div>
        )}

        <div className="flex flex-wrap gap-3 mt-3 text-xs text-base-content/60">
          {feedback.musicianName ? (
            <div className="flex items-center gap-1">
              <User className="w-3 h-3" />
              <span>{feedback.musicianName}</span>
            </div>
          ) : (
            <div className="flex items-center gap-1">
              <User className="w-3 h-3" />
              <span>{t('feedback_page.anonymous')}</span>
            </div>
          )}

          {feedback.pageUrl && (
            <div className="flex items-center gap-1">
              <Globe className="w-3 h-3" />
              <span className="truncate max-w-[200px]" title={feedback.pageUrl}>
                {feedback.pageUrl.replace(/^https?:\/\/[^/]+/, '')}
              </span>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default FeedbackPage
