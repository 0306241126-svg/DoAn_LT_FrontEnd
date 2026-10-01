import React from 'react';
import { AlertTriangle, Trash2, HelpCircle, X } from 'lucide-react';

export default function ConfirmModal({
  isOpen,
  title = 'Xác nhận hành động',
  message = 'Bạn có chắc chắn muốn thực hiện thao tác này?',
  confirmText = 'Xác nhận',
  cancelText = 'Hủy bỏ',
  type = 'danger', // 'danger' | 'warning' | 'info'
  onConfirm,
  onCancel,
}) {
  if (!isOpen) return null;

  const typeConfig = {
    danger: {
      icon: Trash2,
      bgIcon: 'bg-rose-50 text-rose-600 dark:bg-rose-950/40 dark:text-rose-400',
      btnColor: 'bg-rose-600 hover:bg-rose-700 text-white',
    },
    warning: {
      icon: AlertTriangle,
      bgIcon: 'bg-amber-50 text-amber-600 dark:bg-amber-950/40 dark:text-amber-400',
      btnColor: 'bg-amber-600 hover:bg-amber-700 text-white',
    },
    info: {
      icon: HelpCircle,
      bgIcon: 'bg-primary/10 text-primary',
      btnColor: 'bg-primary hover:opacity-90 text-white',
    },
  };

  const currentType = typeConfig[type] || typeConfig.danger;
  const IconComponent = currentType.icon;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs animate-fade-in">
      <div 
        className="relative w-full max-w-sm bg-white dark:bg-slate-900 rounded-3xl p-6 shadow-2xl border border-slate-100 dark:border-slate-800 text-center transform transition-all scale-100"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Nút đóng góc phải */}
        <button
          onClick={onCancel}
          className="absolute right-4 top-4 p-1 rounded-full text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition"
        >
          <X size={18} />
        </button>

        {/* Biểu tượng cảnh báo bo tròn */}
        <div className={`w-13 h-13 mx-auto mb-4 rounded-2xl flex items-center justify-center ${currentType.bgIcon}`}>
          <IconComponent size={26} />
        </div>

        {/* Tiêu đề và Nội dung */}
        <h3 className="text-base font-bold text-slate-800 dark:text-slate-100 mb-2">
          {title}
        </h3>
        <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed mb-6">
          {message}
        </p>

        {/* Cặp nút hành động */}
        <div className="grid grid-cols-2 gap-3">
          <button
            type="button"
            onClick={onCancel}
            className="w-full py-2.5 px-4 text-xs font-semibold rounded-xl border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 transition cursor-pointer"
          >
            {cancelText}
          </button>
          <button
            type="button"
            onClick={onConfirm}
            className={`w-full py-2.5 px-4 text-xs font-semibold rounded-xl transition shadow-sm cursor-pointer ${currentType.btnColor}`}
          >
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  );
}