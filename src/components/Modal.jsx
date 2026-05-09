import React from 'react';

const Modal = ({ 
  isOpen, 
  onClose, 
  type = 'info', 
  title, 
  message, 
  confirmText = 'ตกลง', 
  cancelText = 'ยกเลิก',
  onConfirm,
  showCancel = false,
  loading = false
}) => {
  if (!isOpen) return null;

  const icons = {
    success: 'check_circle',
    error: 'error',
    warning: 'warning',
    info: 'info',
    confirm: 'help'
  };

  const colors = {
    success: 'text-emerald-500 bg-emerald-50',
    error: 'text-red-500 bg-red-50',
    warning: 'text-amber-500 bg-amber-50',
    info: 'text-blue-500 bg-blue-50',
    confirm: 'text-primary bg-primary/10'
  };

  const buttonColors = {
    success: 'bg-emerald-500 hover:bg-emerald-600',
    error: 'bg-red-500 hover:bg-red-600',
    warning: 'bg-amber-500 hover:bg-amber-600',
    info: 'bg-blue-500 hover:bg-blue-600',
    confirm: 'bg-primary hover:bg-primary/90'
  };

  const handleConfirm = () => {
    if (onConfirm) onConfirm();
    if (!loading) onClose();
  };

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/60 backdrop-blur-sm transition-opacity"
        onClick={!loading ? onClose : undefined}
      />
      
      {/* Modal Card */}
      <div className="relative bg-white rounded-[2rem] p-6 w-full max-w-sm shadow-2xl animate-in fade-in zoom-in duration-200">
        {/* Close button (ถ้าไม่มี onConfirm) */}
        {!onConfirm && (
          <button
            onClick={onClose}
            className="absolute top-4 right-4 w-10 h-10 flex items-center justify-center rounded-full bg-slate-100 text-slate-500 hover:bg-slate-200 transition-colors"
          >
            <span className="material-symbols-outlined">close</span>
          </button>
        )}
        
        {/* Icon */}
        <div className="text-center mb-6">
          <div className={`w-20 h-20 ${colors[type].split(' ')[1]} rounded-full flex items-center justify-center mx-auto mb-4`}>
            <span className={`material-symbols-outlined text-4xl ${colors[type].split(' ')[0]}`}>
              {icons[type]}
            </span>
          </div>
          <h3 className="text-xl font-extrabold text-slate-900">{title}</h3>
          {message && (
            <p className="text-sm text-slate-500 mt-2 leading-relaxed">{message}</p>
          )}
        </div>

        {/* Buttons */}
        <div className={`flex gap-3 ${showCancel ? 'flex-row' : 'flex-col'}`}>
          {showCancel && (
            <button
              onClick={onClose}
              disabled={loading}
              className="flex-1 py-3.5 px-6 rounded-full font-bold text-slate-600 bg-slate-100 hover:bg-slate-200 transition-colors disabled:opacity-50"
            >
              {cancelText}
            </button>
          )}
          <button
            onClick={handleConfirm}
            disabled={loading}
            className={`flex-1 py-3.5 px-6 rounded-full font-bold text-white ${buttonColors[type]} transition-all active:scale-[0.98] disabled:opacity-50 flex items-center justify-center gap-2`}
          >
            {loading ? (
              <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            ) : (
              <>
                <span className="material-symbols-outlined text-lg">
                  {type === 'confirm' ? 'check' : 'check_circle'}
                </span>
                {confirmText}
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default Modal;
