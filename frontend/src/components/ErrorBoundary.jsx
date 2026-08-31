import React from 'react';
import { AlertTriangle, RefreshCw, Home } from 'lucide-react';

export default class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('Legal Nexus React Error Caught:', error, errorInfo);
    this.setState({ errorInfo });
  }

  handleReset = () => {
    localStorage.removeItem('nyaya_access_token');
    localStorage.removeItem('nyaya_refresh_token');
    window.location.href = '/';
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-[#071422] text-white flex items-center justify-center p-6 font-sans">
          <div className="max-w-xl w-full bg-[#0B1F33] rounded-3xl p-8 border border-slate-800 shadow-2xl space-y-5 text-center">
            <div className="w-16 h-16 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center mx-auto text-amber-400">
              <AlertTriangle className="w-8 h-8" />
            </div>

            <div>
              <h2 className="text-xl font-bold text-white">Application Interface Recovery</h2>
              <p className="text-xs text-slate-400 mt-1">
                An unexpected rendering error occurred. You can restore your session or reload the application.
              </p>
            </div>

            {this.state.error && (
              <div className="p-4 bg-slate-900/80 rounded-2xl border border-slate-800 text-left text-xs font-mono text-rose-300 max-h-40 overflow-y-auto">
                <p className="font-bold text-rose-400 mb-1">{this.state.error.toString()}</p>
                {this.state.errorInfo?.componentStack && (
                  <pre className="text-[10px] text-slate-400 whitespace-pre-wrap">
                    {this.state.errorInfo.componentStack}
                  </pre>
                )}
              </div>
            )}

            <div className="flex items-center justify-center gap-3 pt-2">
              <button
                onClick={() => window.location.reload()}
                className="px-5 py-2.5 bg-legal-blue hover:bg-blue-600 text-white rounded-xl text-xs font-bold transition flex items-center gap-2"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                Reload Page
              </button>

              <button
                onClick={this.handleReset}
                className="px-5 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-bold transition flex items-center gap-2 border border-slate-700"
              >
                <Home className="w-3.5 h-3.5" />
                Clear Session & Home
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
