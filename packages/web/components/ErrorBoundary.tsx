'use client'

import { Component, ReactNode } from 'react'
import posthog from 'posthog-js'

interface Props {
  children: ReactNode
  fallback?: ReactNode
  fallbackMessage?: string
  onError?: (error: Error, errorInfo: React.ErrorInfo) => void
}

interface State {
  hasError: boolean
  error?: Error
  errorInfo?: React.ErrorInfo
}

/**
 * Global Error Boundary Component
 * Catches React errors and prevents white screen crashes
 * Integrates with PostHog for error tracking
 */
export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props)
    this.state = { hasError: false }
  }

  static getDerivedStateFromError(error: Error): State {
    // Update state to show fallback UI
    return { hasError: true, error }
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    // Store error info in state
    this.setState({ errorInfo })

    // Log to PostHog analytics
    if (typeof window !== 'undefined' && posthog.__loaded) {
      posthog.capture('error_boundary_caught', {
        error: error.message,
        stack: error.stack,
        componentStack: errorInfo.componentStack,
        errorToString: error.toString(),
        location: window.location.href,
        timestamp: new Date().toISOString(),
      })
    }

    // Log to console for debugging
    console.error('Error Boundary caught an error:', error, errorInfo)

    // Custom error callback
    if (this.props.onError) {
      this.props.onError(error, errorInfo)
    }
  }

  handleReset = () => {
    this.setState({ hasError: false, error: undefined, errorInfo: undefined })
  }

  render() {
    if (this.state.hasError) {
      // Custom fallback if provided
      if (this.props.fallback) {
        return this.props.fallback
      }

      // Default fallback UI
      return (
        <div className="min-h-screen bg-relic-white dark:bg-relic-void flex items-center justify-center px-4">
          <div className="max-w-md w-full">
            {/* Error Card */}
            <div className="bg-white dark:bg-relic-void/50 border border-relic-mist dark:border-relic-slate/30 p-8">
              {/* Icon */}
              <div className="mb-6">
                <div className="w-12 h-12 mx-auto bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-full flex items-center justify-center">
                  <svg
                    className="w-6 h-6 text-red-600 dark:text-red-400"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                    />
                  </svg>
                </div>
              </div>

              {/* Message */}
              <h2 className="text-lg font-mono text-relic-void dark:text-white mb-3 text-center">
                Something went wrong
              </h2>
              <p className="text-sm text-relic-slate dark:text-relic-ghost mb-6 text-center">
                {this.props.fallbackMessage ||
                  this.state.error?.message ||
                  'An unexpected error occurred'}
              </p>

              {/* Error details (development only) */}
              {process.env.NODE_ENV === 'development' && this.state.error && (
                <details className="mb-6 text-xs">
                  <summary className="cursor-pointer text-relic-silver dark:text-relic-ghost hover:text-relic-void dark:hover:text-white mb-2">
                    Show error details
                  </summary>
                  <div className="bg-relic-ghost dark:bg-relic-void/80 p-3 rounded-sm border border-relic-mist dark:border-relic-slate/30 overflow-x-auto">
                    <pre className="text-[10px] font-mono text-relic-void dark:text-relic-ghost whitespace-pre-wrap">
                      {this.state.error.stack}
                    </pre>
                  </div>
                </details>
              )}

              {/* Actions */}
              <div className="space-y-3">
                <button
                  onClick={this.handleReset}
                  className="w-full py-2.5 px-4 bg-relic-void dark:bg-white text-relic-white dark:text-relic-void text-sm font-mono uppercase tracking-wider hover:bg-relic-slate dark:hover:bg-relic-ghost transition-colors"
                >
                  Try Again
                </button>

                <button
                  onClick={() => (window.location.href = '/')}
                  className="w-full py-2.5 px-4 border border-relic-mist dark:border-relic-slate/30 text-relic-void dark:text-white text-sm font-mono uppercase tracking-wider hover:bg-relic-ghost dark:hover:bg-relic-void/50 transition-colors"
                >
                  Go Home
                </button>
              </div>

              {/* Support hint */}
              <p className="mt-6 text-[10px] text-relic-silver dark:text-relic-ghost text-center">
                If this persists, please refresh the page
              </p>
            </div>
          </div>
        </div>
      )
    }

    return this.props.children
  }
}

// Default export for backward compatibility
export default ErrorBoundary

/**
 * Specialized Error Boundaries for different sections
 */
export function DashboardErrorBoundary({ children }: { children: ReactNode }) {
  return (
    <ErrorBoundary
      fallbackMessage="Failed to load dashboard. Try refreshing."
      fallback={
        <div className="p-8 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-sm">
          <p className="text-sm text-red-800 dark:text-red-200 font-mono">
            ⚠ Dashboard Error
          </p>
          <p className="text-xs text-red-600 dark:text-red-300 mt-2">
            Failed to render dashboard component
          </p>
        </div>
      }
    >
      {children}
    </ErrorBoundary>
  )
}

export function MindMapErrorBoundary({ children }: { children: ReactNode }) {
  return (
    <ErrorBoundary
      fallbackMessage="Failed to load mind map visualization."
      fallback={
        <div className="p-8 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-sm">
          <p className="text-sm text-red-800 dark:text-red-200 font-mono">
            ⚠ Mind Map Error
          </p>
          <p className="text-xs text-red-600 dark:text-red-300 mt-2">
            Failed to render mind map component
          </p>
        </div>
      }
    >
      {children}
    </ErrorBoundary>
  )
}

export function LayersErrorBoundary({ children }: { children: ReactNode }) {
  return (
    <ErrorBoundary
      fallbackMessage="Failed to load AI Computational Layers visualization."
      fallback={
        <div className="p-8 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-sm">
          <p className="text-sm text-red-800 dark:text-red-200 font-mono">
            AI Layers Error
          </p>
          <p className="text-xs text-red-600 dark:text-red-300 mt-2">
            Failed to render AI Computational Layers component
          </p>
        </div>
      }
    >
      {children}
    </ErrorBoundary>
  )
}
