import { Component, type ErrorInfo, type ReactNode } from 'react';

interface State {
  failed: boolean;
}

/** Last line of defence: show a plain message instead of a blank page. */
export class ErrorBoundary extends Component<{ children: ReactNode }, State> {
  override state: State = { failed: false };

  static getDerivedStateFromError(): State {
    return { failed: true };
  }

  override componentDidCatch(error: Error, info: ErrorInfo): void {
    console.error('Agent Village crashed while drawing', error, info.componentStack);
  }

  override render(): ReactNode {
    if (!this.state.failed) return this.props.children;
    return (
      <div className="va-crash" role="alert">
        <h1>Agent Village</h1>
        <p>Something went wrong while drawing the village. The project files are untouched.</p>
        <p>
          <button type="button" className="va-btn" onClick={() => window.location.reload()}>
            Reload the page
          </button>
        </p>
      </div>
    );
  }
}
