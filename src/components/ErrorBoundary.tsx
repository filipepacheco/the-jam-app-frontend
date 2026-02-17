import {Component, type ErrorInfo, type ReactNode} from 'react'

interface Props {
  children: ReactNode
  fallback?: ReactNode
}

interface State {
  hasError: boolean
  error: Error | null
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props)
    this.state = {hasError: false, error: null}
  }

  static getDerivedStateFromError(error: Error): State {
    return {hasError: true, error}
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
    console.error('ErrorBoundary caught:', error, errorInfo)
  }

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback
      }

      return (
        <div className="min-h-screen flex items-center justify-center bg-base-200">
          <div className="card bg-base-100 shadow-xl max-w-md w-full mx-4">
            <div className="card-body text-center">
              <h2 className="card-title justify-center text-error">Something went wrong</h2>
              <p className="text-base-content/70">
                An unexpected error occurred. Please try refreshing the page.
              </p>
              {import.meta.env.DEV && this.state.error && (
                <pre className="mt-4 p-3 bg-base-300 rounded-lg text-xs text-left overflow-auto max-h-40">
                  {this.state.error.message}
                </pre>
              )}
              <div className="card-actions justify-center mt-4">
                <button
                  className="btn btn-primary"
                  onClick={() => window.location.reload()}
                >
                  Refresh Page
                </button>
                <button
                  className="btn btn-ghost"
                  onClick={() => this.setState({hasError: false, error: null})}
                >
                  Try Again
                </button>
              </div>
            </div>
          </div>
        </div>
      )
    }

    return this.props.children
  }
}
