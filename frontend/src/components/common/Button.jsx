import LoadingSpinner from './LoadingSpinner';

// Component nút dùng chung cho toàn bộ giao diện, hỗ trợ variant, kích thước và loading.
function Button({
  children,
  type = 'button',
  variant = 'primary',
  size = 'md',
  loading = false,
  disabled = false,
  className = '',
  ...props
}) {
  // Bảng class giúp các màn hình dùng lại cùng một kiểu nút mà không lặp CSS.
  const variantClasses = {
    primary: 'bg-(--color-primary) text-white hover:opacity-90',
    secondary: 'bg-muted text-foreground hover:bg-border',
    outline: 'border border-border bg-transparent text-foreground hover:bg-muted',
    ghost: 'bg-transparent text-foreground hover:bg-muted',
    danger: 'bg-red-600 text-white hover:bg-red-700',
  };

  // Class kích thước được chọn theo prop size truyền từ component giao diện.
  const sizeClasses = {
    sm: 'min-h-8 px-3 text-sm',
    md: 'min-h-10 px-4 text-sm',
    lg: 'min-h-12 px-6 text-base',
  };

  // Khi đang loading, nút bị khóa để tránh người dùng gửi cùng một thao tác nhiều lần.
  const isDisabled = disabled || loading;

  return (
    // Button nhận các thuộc tính HTML còn lại từ component gọi thông qua ...props.
    <button
      type={type}
      disabled={isDisabled}
      aria-busy={loading}
      className={`inline-flex items-center justify-center gap-2 rounded-lg font-medium transition-opacity focus:outline-none focus:ring-2 focus:ring-(--color-primary) focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-60 ${variantClasses[variant] || variantClasses.primary} ${sizeClasses[size] || sizeClasses.md} ${className}`}
      {...props}
    >
      {/* Khi loading, nối Button với LoadingSpinner để hiển thị trạng thái xử lý. */}
      {loading && <LoadingSpinner size="sm" />}
      {children}
    </button>
  );
}

export default Button;
