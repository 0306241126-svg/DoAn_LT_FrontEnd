import { useState, useEffect } from 'react';

/**
 * Hook trì hoãn việc cập nhật giá trị đầu vào
 * @param {any} value - Giá trị cần debounce (thường là từ khóa tìm kiếm)
 * @param {number} delay - Thời gian trễ tính bằng mili-giây (mặc định 500ms)
 * @returns {any} Giá trị debounced sau khi đã ngừng thay đổi đủ thời gian delay
 */
export function useDebounce(value, delay = 500) {
  const [debouncedValue, setDebouncedValue] = useState(value);

  useEffect(() => {
    // Thiết lập timer đếm ngược
    const timer = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    // Hủy bỏ timer nếu value thay đổi trước khi timer chạy xong
    return () => {
      clearTimeout(timer);
    };
  }, [value, delay]);

  return debouncedValue;
}