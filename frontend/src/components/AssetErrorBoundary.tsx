import React, { Component, ReactNode } from 'react';

interface AssetErrorBoundaryProps {
  /** Child components to render */
  children: ReactNode;

  /** Fallback UI to show on error */
  fallback?: ReactNode;

  /** Callback when error occurs */
  onError?: (error: Error, errorInfo: React.ErrorInfo) => void;

  /** Custom error message */
  errorMessage?: string;

  /** Show detailed error in development */
  showDetails?: boolean;
}

interface AssetErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
  errorInfo: React.ErrorInfo | null;
}

/**
 * Error Boundary for asset loading failures
 * Catches React errors and displays fallback UI
 */
export class AssetErrorBoundary extends Component<AssetErrorBoundaryProps, AssetErrorBoundaryState> {
  constructor(props: AssetErrorBoundaryProps) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
    };
  }

  static getDerivedStateFromError(error: Error): Partial<AssetErrorBoundaryState> {
    return {
      hasError: true,
      error,
    };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('Asset Error Boundary caught error:', error, errorInfo);
    
    this.setState({
      error,
      errorInfo,
    });

    // Call optional error callback
    if (this.props.onError) {
      this.props.onError(error, errorInfo);
    }
  }

  render() {
    if (this.state.hasError) {
      // Use custom fallback if provided
      if (this.props.fallback) {
        return this.props.fallback;
      }

      // Default fallback UI
      return (
        <div className="flex items-center justify-center p-4 bg-gray-800 rounded border border-gray-700">
          <div className="text-center">
            <div className="text-red-500 text-xl mb-2">⚠️</div>
            <div className="text-gray-300 text-sm mb-1">
              {this.props.errorMessage || 'Asset failed to load'}
            </div>
            
            {this.props.showDetails && this.state.error && (
              <details className="mt-2 text-xs text-gray-500 text-left">
                <summary className="cursor-pointer">Error details</summary>
                <pre className="mt-1 p-2 bg-gray-900 rounded overflow-auto max-w-md">
                  {this.state.error.toString()}
                  {this.state.errorInfo && (
                    <>
                      {'\n\n'}
                      {this.state.errorInfo.componentStack}
                    </>
                  )}
                </pre>
              </details>
            )}
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

/**
 * Higher-order component to wrap components with error boundary
 */
export function withAssetErrorBoundary<P extends object>(
  Component: React.ComponentType<P>,
  errorBoundaryProps?: Omit<AssetErrorBoundaryProps, 'children'>
) {
  return function WithAssetErrorBoundary(props: P) {
    return (
      <AssetErrorBoundary {...errorBoundaryProps}>
        <Component {...props} />
      </AssetErrorBoundary>
    );
  };
}

/**
 * Simple fallback component for missing assets
 */
export function AssetFallback({
  width = 44,
  height = 44,
  text = '?',
  className = '',
}: {
  width?: number;
  height?: number;
  text?: string;
  className?: string;
}) {
  return (
    <div
      className={`flex items-center justify-center bg-gray-700 border border-gray-600 ${className}`}
      style={{ width, height }}
    >
      <span className="text-gray-400 text-sm">{text}</span>
    </div>
  );
}

export default AssetErrorBoundary;
