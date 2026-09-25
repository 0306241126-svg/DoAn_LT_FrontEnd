import { useId } from 'react';

// Component ô nhập liệu dùng chung, tự hiển thị lỗi cho trường bắt buộc bị bỏ trống.
function Input({
  id,
  label,
  error,
  required = false,
  className = '',
  containerClassName = '',
  onBlur,
  value,
  defaultValue,
  ...props
}) {
  // Tạo id tự động khi màn hình không truyền id, giúp label liên kết đúng với input.
  const generatedId = useId();
  const inputId = id || generatedId;
  // Ưu tiên value controlled; nếu không có thì dùng defaultValue để kiểm tra ban đầu.
  const valueToValidate = value !== undefined ? value : defaultValue;
  const requiredError =
    required && (valueToValidate === undefined || String(valueToValidate).trim() === '')
      ? 'Trường này không được để trống.'
      : '';
  // Lỗi truyền từ component cha được ưu tiên hơn lỗi required mặc định.
  const displayError = error || requiredError;
  const describedBy = displayError ? `${inputId}-error` : undefined;

  return (
    <div className={`w-full ${containerClassName}`}>
      {label && (
        <label htmlFor={inputId} className="mb-1.5 block text-sm font-medium text-foreground">
          {label}
          {required && <span className="ml-1 text-red-600" aria-hidden="true">*</span>}
        </label>
      )}
      {/* Input nhận các thuộc tính bổ sung như type, placeholder và onChange từ component gọi. */}
      <input
        id={inputId}
        value={value}
        defaultValue={defaultValue}
        required={required}
        aria-invalid={Boolean(displayError)}
        aria-describedby={describedBy}
        onBlur={onBlur}
        className={`w-full rounded-lg border bg-background px-3 py-2 text-foreground outline-none transition focus:ring-2 focus:ring-(--color-primary) ${
          displayError ? 'border-red-500 focus:ring-red-500' : 'border-border'
        } ${className}`}
        {...props}
      />
      {/* Hiển thị lỗi ngay dưới ô nhập và liên kết với aria-describedby để hỗ trợ truy cập. */}
      {displayError && (
        <p id={`${inputId}-error`} className="mt-1 text-sm text-red-600" role="alert">
          {displayError}
        </p>
      )}
    </div>
  );
}

export default Input;
