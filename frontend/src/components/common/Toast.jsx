import { useEffect } from 'react';

// Toast dùng để hiển thị thông báo tạm thời ở vị trí cố định phía trên màn hình.
function Toast({ message, type = 'info', duration = 3000, onClose, className = '' }) {
  // Tự động đóng Toast sau duration và dọn timeout khi Toast bị gỡ khỏi giao diện.
  useEffect(() => {
    if (!message || !onClose || duration <= 0) {
      return undefined;
    }

    const timeoutId = window.setTimeout(onClose, duration);
    return () => window.clearTimeout(timeoutId);
  }, [duration, message, onClose]);

  // Không render hộp thông báo khi chưa có nội dung.
  if (!message) {
    return null;
  }

  // Mỗi loại thông báo có màu riêng để người dùng nhận biết trạng thái.
  const typeClasses = {
    success: 'border-green-200 bg-green-50 text-green-800',
    error: 'border-red-200 bg-red-50 text-red-800',
    warning: 'border-yellow-200 bg-yellow-50 text-yellow-800',
    info: 'border-blue-200 bg-blue-50 text-blue-800',
  };

  // Toast được căn giữa bằng left-1/2 và -translate-x-1/2, z-50 để nằm trên nội dung.
  return (
    <div
      role="alert"
      className={`fixed left-1/2 top-6 z-50 w-[calc(100vw-2rem)] max-w-md -translate-x-1/2 rounded-lg border px-4 py-3 text-center shadow-lg ${typeClasses[type] || typeClasses.info} ${className}`}
    >
      <span>{message}</span>
      {/* Nút đóng được render khi component cha truyền callback onClose. */}
      {onClose && (
        <button
          type="button"
          onClick={onClose}
          aria-label="Đóng thông báo"
          className="ml-3 font-semibold hover:opacity-70"
        >
          ×
        </button>
      )}
    </div>
  );
}

export default Toast;
