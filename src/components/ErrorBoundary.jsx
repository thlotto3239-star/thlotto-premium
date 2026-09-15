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
          <div className="flex flex-col sm:flex-row gap-3 w-full max-w-xs">
            <button
              onClick={() => window.location.reload()}
              className="flex-1 px-6 py-3.5 bg-primary text-white font-bold rounded-2xl shadow-lg shadow-primary/20 hover:brightness-105 active:scale-95 transition-all cursor-pointer"
            >
              รีเฟรชหน้า
            </button>
            <button
              onClick={() => {
                this.setState({ hasError: false, error: null });
                window.location.href = '/home';
              }}
              className="flex-1 px-6 py-3.5 bg-white border border-slate-200 text-slate-700 font-bold rounded-2xl shadow-sm hover:bg-slate-100 active:scale-95 transition-all cursor-pointer"
            >
              กลับหน้าหลัก
            </button>
          </div>
          {this.state.error && (
            <details className="mt-6 p-3 bg-red-50 text-red-700 text-xs rounded-xl max-w-sm overflow-auto text-left w-full border border-red-100">
              <summary className="font-bold cursor-pointer mb-1">รายละเอียดข้อผิดพลาด</summary>
              <pre className="whitespace-pre-wrap">{this.state.error.message || String(this.state.error)}</pre>
            </details>
          )}
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
