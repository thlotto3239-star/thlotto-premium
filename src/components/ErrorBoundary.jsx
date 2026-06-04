import React from 'react';

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    if (import.meta.env.DEV) {
      console.error('[ErrorBoundary]', error, errorInfo);
    }
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50 p-6 text-center">
          <div className="w-16 h-16 rounded-full bg-red-100 flex items-center justify-center mb-4">
            <span className="material-symbols-outlined text-3xl text-red-500">error</span>
          </div>
          <h1 className="text-xl font-bold text-slate-900 mb-2">เกิดข้อผิดพลาด</h1>
          <p className="text-sm text-slate-500 mb-6 max-w-xs">ระบบเกิดปัญหาบางอย่าง กรุณาลองใหม่อีกครั้ง</p>
          <button
            onClick={() => window.location.reload()}
            className="px-6 py-3 bg-primary text-white font-bold rounded-xl shadow-lg shadow-primary/20"
          >
            รีเฟรชหน้า
          </button>
          {import.meta.env.DEV && this.state.error && (
            <pre className="mt-4 p-3 bg-red-50 text-red-700 text-xs rounded-lg max-w-sm overflow-auto text-left">
              {this.state.error.message}
            </pre>
          )}
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
