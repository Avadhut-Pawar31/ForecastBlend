import { Component, ErrorInfo, ReactNode } from 'react';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Uncaught error:', error, errorInfo);
  }

  public render() {
    if (this.state.hasError) {
      return (
        <div style={{
          padding: '40px',
          color: '#F8FAFC',
          backgroundColor: '#0F172A',
          minHeight: '100vh',
          fontFamily: 'sans-serif',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center'
        }}>
          <h2 style={{ fontSize: '24px', marginBottom: '16px', color: '#EF4444' }}>Something went wrong</h2>
          <p style={{ color: '#94A3B8', marginBottom: '24px' }}>{this.state.error?.message || 'An unexpected rendering error occurred.'}</p>
          <button
            onClick={() => window.location.reload()}
            style={{
              padding: '10px 20px',
              backgroundColor: '#3B82F6',
              color: '#FFFFFF',
              border: 'none',
              borderRadius: '6px',
              cursor: 'pointer',
              fontWeight: 600
            }}
          >
            Reload Dashboard
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}
