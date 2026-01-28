import { Component, ErrorInfo, ReactNode } from "react";

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
    };
  }

  static getDerivedStateFromError(error: Error): State {
    return {
      hasError: true,
      error,
    };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error("ErrorBoundary caught an error:", error, errorInfo);
  }

  handleReset = () => {
    this.setState({
      hasError: false,
      error: null,
    });
    window.location.reload();
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-[100dvh] flex items-center justify-center bg-gradient-to-br from-[#020c17] via-[#0a1628] to-[#020c17] px-4">
          <div className="glass-card p-8 max-w-md w-full text-center">
            <div className="mb-6">
              <svg
                className="w-20 h-20 mx-auto text-red-400"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth="1.5"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                />
              </svg>
            </div>
            <h2 className="text-2xl font-bold text-white mb-3">
              เกิดข้อผิดพลาด
            </h2>
            <p className="text-white/70 mb-2">
              ระบบพบปัญหาในการแสดงผล
            </p>
            {this.state.error && (
              <p className="text-white/50 text-sm mb-6 font-mono">
                {this.state.error.message}
              </p>
            )}
            <button
              onClick={this.handleReset}
              className="btn-gradient w-full"
            >
              โหลดหน้าใหม่อีกครั้ง
            </button>
            <p className="text-white/40 text-xs mt-4">
              หากปัญหายังคงเกิดขึ้น กรุณาติดต่อทีมงาน
            </p>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
