import React from "react";
import { AlertTriangle, RefreshCcw } from "lucide-react";

/**
 * App-level error boundary. Wraps the routed Outlet inside AppShell so
 * any runtime error from a page (or its children/hooks) renders a
 * graceful fallback instead of a white screen.
 *
 * We deliberately keep the surface tiny: a card with the message, the
 * primary route the user came from, and a "Try again" button that
 * resets the boundary + reloads.
 */
export default class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, info) {
    // Log to console so it shows up in devtools / supervised browser logs.
    // (Real telemetry hookup is out of scope for Phase 2.)
    // eslint-disable-next-line no-console
    console.error("[ErrorBoundary] caught:", error, info);
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null });
    // Hard reload as a safety net — the offending component tree was
    // already mounted once and may have left bad state behind.
    if (typeof window !== "undefined") {
      window.location.reload();
    }
  };

  render() {
    if (!this.state.hasError) return this.props.children;

    const message =
      (this.state.error && (this.state.error.message || String(this.state.error))) ||
      "Something went wrong while rendering this page.";

    return (
      <div
        data-testid="error-boundary-fallback"
        className="max-w-xl mx-auto mt-10 bg-surface border border-border rounded-lg p-6 shadow-sm"
      >
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 rounded-md bg-rose-50 flex items-center justify-center flex-shrink-0">
            <AlertTriangle className="w-5 h-5 text-rose-600" />
          </div>
          <div className="flex-1 min-w-0">
            <h2 className="text-lg font-semibold text-text-primary">
              We hit a snag rendering this page
            </h2>
            <p className="text-sm text-text-secondary mt-1 break-words">
              {message}
            </p>
            <p className="text-[12px] text-text-muted mt-2">
              The rest of Engage 360 is still working — your data is safe.
            </p>
            <div className="mt-4 flex gap-2">
              <button
                type="button"
                onClick={this.handleReset}
                data-testid="error-boundary-retry"
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-[12px] font-medium rounded-md bg-primary text-white hover:bg-primary-hover"
              >
                <RefreshCcw className="w-3.5 h-3.5" />
                Try again
              </button>
              <button
                type="button"
                onClick={() => {
                  window.location.href = "/";
                }}
                data-testid="error-boundary-home"
                className="px-3 py-1.5 text-[12px] rounded-md border border-border text-text-secondary hover:bg-slate-50"
              >
                Back to Home
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }
}
