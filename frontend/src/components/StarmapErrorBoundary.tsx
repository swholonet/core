import { Component, ReactNode } from 'react';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
}

/**
 * Error boundary specifically for starmap components
 * Provides graceful fallback without breaking the entire grid
 */
export default class StarmapErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(_: Error): State {
    // Update state to render fallback UI
    return { hasError: true };
  }

  componentDidCatch(error: Error, _errorInfo: any) {
    // Log error for debugging, but don't spam console for individual cells
    // Only log in development (determined by presence of console methods)
    if (typeof console !== 'undefined' && console.warn) {
      console.warn('Starmap component error:', error.message);
    }
  }

  render() {
    if (this.state.hasError) {
      // Fallback to subtle starfield - matches GridCellStarmap fallback
      return (
        this.props.fallback || (
          <div
            className="absolute inset-0 w-full h-full pointer-events-none"
            style={{
              backgroundImage: `
                radial-gradient(0.5px 0.5px at 25% 35%, rgba(255,255,255,0.15) 0%, transparent 100%),
                radial-gradient(0.5px 0.5px at 65% 25%, rgba(255,255,255,0.1) 0%, transparent 100%),
                radial-gradient(0.5px 0.5px at 85% 75%, rgba(255,255,255,0.15) 0%, transparent 100%),
                radial-gradient(0.5px 0.5px at 45% 85%, rgba(255,255,255,0.1) 0%, transparent 100%)
              `,
              backgroundSize: '100% 100%',
              backgroundRepeat: 'no-repeat',
              opacity: 0.3
            }}
          />
        )
      );
    }

    return this.props.children;
  }
}