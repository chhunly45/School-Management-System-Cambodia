import { Component, ErrorInfo, ReactNode } from 'react';

interface ErrorBoundaryProps {
  children: ReactNode;
  name?: string;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error?: Error;
  errorInfo?: ErrorInfo;
}

class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  state: ErrorBoundaryState = {
    hasError: false,
    error: undefined,
    errorInfo: undefined
  };

  static getDerivedStateFromError(error: Error): Partial<ErrorBoundaryState> {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    this.setState({ errorInfo });
    // Error logging intentionally omitted in production; consider centralized logging
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-[60vh] flex items-center justify-center bg-background px-4 py-12">
          <div className="max-w-xl rounded-3xl border border-muted bg-white p-8 shadow-lg">
            <h1 className="text-2xl font-bold text-text-primary mb-3">Something went wrong</h1>
            <p className="text-sm text-text-secondary mb-4">
              We could not render this page. Please refresh, or come back later.
            </p>
            <button
              type="button"
              onClick={() => window.location.reload()}
              className="rounded-full bg-primary px-5 py-2 text-sm font-semibold text-white hover:bg-primary-hover transition"
            >
              Reload page
            </button>
            {/* Do not expose error details in UI; preserve generic fallback only */}
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
