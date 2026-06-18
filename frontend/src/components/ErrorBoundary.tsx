import { Component } from "react";
import type { ErrorInfo, ReactNode } from "react";

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error("ErrorBoundary caught an error:", error, errorInfo);
  }

  public render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }
      return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/75 backdrop-blur-sm" />
          <div className="bg-zinc-900 border border-zinc-800 p-6 rounded-2xl text-zinc-200 max-w-md w-full relative z-10 shadow-2xl">
            <h3 className="font-bold text-sm text-red-400 mb-2 font-mono">⚠️ Task Details Error</h3>
            <p className="text-xs text-zinc-450 leading-relaxed mb-4">
              An error occurred while loading this task. The error has been captured.
            </p>
            <div className="bg-black/40 border border-zinc-850 p-3 rounded-lg text-2xs font-mono text-zinc-400 max-h-32 overflow-y-auto mb-4">
              {this.state.error?.message || "Unknown rendering exception"}
            </div>
            <div className="flex gap-3 justify-end font-mono">
              <button
                onClick={() => {
                  this.setState({ hasError: false, error: null });
                  window.location.reload();
                }}
                className="px-3.5 py-1.5 bg-zinc-100 hover:bg-zinc-200 text-zinc-950 text-3xs font-bold rounded-lg cursor-pointer transition"
              >
                Reload Page
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
