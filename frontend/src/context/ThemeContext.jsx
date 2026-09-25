import React, { createContext, useContext, useState, useEffect } from 'react';
import profileService from '../services/profileService';

// Tạo Theme Context
const ThemeContext = createContext(null);

// Danh sách 7 mã màu chủ đạo chuẩn (khớp với lưới 7 nút bấm của SettingsView trong file Word 7.1)
export const THEME_COLORS = [
  { id: 'blue', name: 'Xanh dương', value: '#3b82f6' },
  { id: 'purple', name: 'Tím', value: '#8b5cf6' },    // Màu tím yêu cầu nghiệm thu
  { id: 'emerald', name: 'Xanh ngọc', value: '#10b981' },
  { id: 'rose', name: 'Hồng sen', value: '#f43f5e' },
  { id: 'amber', name: 'Cam hổ phách', value: '#f59e0b' },
  { id: 'red', name: 'Đỏ', value: '#ef4444' },
  { id: 'indigo', name: 'Xanh chàm', value: '#6366f1' },
];

const THEME_STORAGE_KEY = 'app_theme_v2';

export const ThemeProvider = ({ children }) => {
  // 1. Khởi tạo theme từ localStorage (Lazy Init để chống chớp trắng khi F5)
  const [theme, setThemeState] = useState(() => {
    const savedTheme = localStorage.getItem(THEME_STORAGE_KEY);
    if (savedTheme) return savedTheme;
    return 'light';
  });

  // 2. Khởi tạo mã màu chủ đạo từ localStorage (Mặc định là Xanh dương #3b82f6)
  const [primaryColor, setPrimaryColorState] = useState(() => {
    return localStorage.getItem('app_primary_color') || THEME_COLORS[0].value;
  });
  const [isProfileLoaded, setIsProfileLoaded] = useState(false);

  // Thuộc tính tiện ích dạng boolean
  const isDark = theme === 'dark';

  // Ưu tiên cấu hình đã lưu trong Node.js, nhưng vẫn cho phép chạy offline bằng localStorage.
  useEffect(() => {
    let isActive = true;

    const loadProfileTheme = async () => {
      try {
        const profile = await profileService.getProfile();
        const savedTheme = profile?.preferences?.theme;
        const savedColor = profile?.preferences?.primaryColor;

        if (!isActive) return;
        if (savedTheme === 'light' || savedTheme === 'dark') {
          setThemeState(savedTheme);
        }
        if (THEME_COLORS.some((color) => color.value === savedColor)) {
          setPrimaryColorState(savedColor);
        }
      } catch (error) {
        console.warn('Không thể tải cấu hình giao diện từ backend, dùng localStorage.', error?.message);
      } finally {
        if (isActive) setIsProfileLoaded(true);
      }
    };

    loadProfileTheme();
    return () => {
      isActive = false;
    };
  }, []);

  // 3. Tiêm biến màu sắc và class Dark trực tiếp vào thẻ  (documentElement)
  useEffect(() => {
    const root = document.documentElement;

    // --- Cập nhật class 'dark' ---
    if (theme === 'dark') {
      root.classList.add('dark');
      localStorage.setItem(THEME_STORAGE_KEY, 'dark');
    } else {
      root.classList.remove('dark');
      localStorage.setItem(THEME_STORAGE_KEY, 'light');
    }

    // Đồng bộ các biến dùng bởi ứng dụng và giao diện mẫu.
    root.style.setProperty('--color-primary', primaryColor);
    root.style.setProperty('--primary', primaryColor);
    root.style.setProperty('--sidebar-primary', primaryColor);
    root.style.setProperty('--ring', primaryColor);
    root.style.setProperty('--sidebar-ring', primaryColor);
    localStorage.setItem('app_primary_color', primaryColor);
    if (isProfileLoaded) {
      profileService.updateProfile({
        preferences: {
          theme,
          primaryColor,
        },
      }).catch((error) => {
        console.warn('Không thể lưu cấu hình giao diện vào backend.', error?.message);
      });
    }
  }, [theme, primaryColor, isProfileLoaded]);

  // Chuyển đổi nhanh Sáng / Tối
  const toggleTheme = () => {
    setThemeState((prev) => (prev === 'dark' ? 'light' : 'dark'));
  };

  // Đặt theme cụ thể ('light' hoặc 'dark')
  const setTheme = (newTheme) => {
    if (newTheme === 'light' || newTheme === 'dark') {
      setThemeState(newTheme);
    }
  };

  // Cập nhật màu chủ đạo
  const setPrimaryColor = (color) => {
    if (color) {
      setPrimaryColorState(color);
    }
  };

  return (
    <ThemeContext.Provider
      value={{
        theme,
        isDark,
        primaryColor,
        toggleTheme,
        setTheme,
        changePrimaryColor: setPrimaryColor,
        setPrimaryColor,
      }}
    >
      {children}
    </ThemeContext.Provider>
  );
};

// Hook tiện ích để các component giao diện gọi sử dụng
export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme phải được đặt bên trong ThemeProvider');
  }
  return context;
};