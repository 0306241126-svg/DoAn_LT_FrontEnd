import { useState, useEffect } from 'react';

/**
 * Custom hook làm trễ (debounce) cập nhật giá trị
 * @param {any} value - Giá trị cần làm trễ (chuỗi tìm kiếm)
 * @param {number} delay - Thời gian trễ (mặc định 500ms)
 * @returns {any} Giá trị sau khi đã trễ đủ thời gian
 */
export function useDebounce(value, delay = 500) {
  const [debouncedValue, setDebouncedValue] = useState(value);

  useEffect(() => {
    // Thiết lập bộ đếm thời gian cập nhật giá trị
    const timer = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    // Dọn dẹp timer nếu giá trị thay đổi trước khi hết 500ms (người dùng tiếp tục gõ)
    return () => {
      clearTimeout(timer);
    };
  }, [value, delay]);

  return debouncedValue;
}

export default useDebounce;