// Spinner dùng chung cho các nút hoặc khu vực đang chờ dữ liệu xử lý.
function LoadingSpinner({ size = 'md', className = '' }) {
  // Mỗi kích thước ánh xạ tới một nhóm class cố định để giao diện không bị nhảy kích thước.
  const sizeClasses = {
    sm: 'h-4 w-4 border-2',
    md: 'h-5 w-5 border-2',
    lg: 'h-8 w-8 border-[3px]',
  };

  // border-t-transparent tạo hiệu ứng vòng xoay khi kết hợp với animate-spin.
  return (
    <span
      aria-hidden="true"
      className={`inline-block animate-spin rounded-full border-current border-t-transparent ${sizeClasses[size] || sizeClasses.md} ${className}`}
    />
  );
}

export default LoadingSpinner;
