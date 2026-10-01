import React, { useEffect } from 'react';
import { CheckCircle, AlertCircle, Info, X } from 'lucide-react';

export default function Toast({ message, type = 'success', onClose, duration = 3000 }) {
  useEffect(() => {
    if (duration) {
      const timer = setTimeout(() => {
        if (onClose) onClose();
      }, duration);
      return () => clearTimeout(timer);
    }
  }, [duration, onClose]);

  // Cấu hình Icon theo loại thông báo
  const icons = {
    success: <CheckCircle className="text-emerald-500 shrink-0" size={20} />,
    error: <AlertCircle className="text-rose-500 shrink-0" size={20} />,
    info: <Info className="text-blue-500 shrink-0" size={20} />,
  };

  // Cấu hình màu nền và viền
  const styles = {
    success: 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-200',
    error: 'bg-rose-50 dark:bg-rose-950/40 border-rose-200 dark:border-rose-800 text-rose-800 dark:text-rose-200',
    info: 'bg-blue-50 dark:bg-blue-950/40 border-blue-200 dark:border-blue-800 text-blue-800 dark:text-blue-200',
  };

  return (
    // fixed top-6 left-1/2 -translate-x-1/2 giúp căn giữa chính xác trên cùng màn hình
    <div className="fixed top-6 left-1/2 -translate-x-1/2 z-[100] animate-fade-in drop-shadow-xl w-[calc(100%-2rem)] sm:w-auto">
      <div className={`flex items-center gap-3 px-4 py-3 rounded-2xl border ${styles[type]} min-w-[280px] max-w-md`}>
        {icons[type]}
        
        <span className="flex-1 text-sm font-semibold">
          {message}
        </span>
        
        <button
          type="button"
          onClick={onClose}
          className="p-1 hover:bg-black/10 dark:hover:bg-white/10 rounded-lg transition shrink-0 cursor-pointer"
        >
          <X size={16} className="opacity-70" />
        </button>
      </div>
    </div>
  );
}