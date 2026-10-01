import React, { createContext, useContext, useState, useEffect } from 'react';
import { profileService } from '../services/profileService';

// Định nghĩa 7 màu chủ đạo
export const THEME_COLORS = [
  { id: 'emerald', name: 'Xanh ngọc', value: '#10b981' },
  { id: 'blue', name: 'Xanh dương', value: '#3b82f6' },
  { id: 'violet', name: 'Tím', value: '#8b5cf6' },
  { id: 'rose', name: 'Hồng', value: '#f43f5e' },
  { id: 'amber', name: 'Vàng', value: '#f59e0b' },
  { id: 'cyan', name: 'Xanh lơ', value: '#06b6d4' },
  { id: 'slate', name: 'Xám', value: '#64748b' }
];

const ThemeContext = createContext();

export function ThemeProvider({ children }) {
  const [profile, setProfile] = useState({
    displayName: 'Người dùng',
    theme: 'light',
    primaryColor: '#10b981',
    hasPrivatePassword: false
  });

  // Tải dữ liệu cài đặt từ backend khi mở app
  useEffect(() => {
    async function fetchProfileSettings() {
      try {
        const data = await profileService.getProfile();

        // Trích xuất đúng dữ liệu từ preferences của backend
        setProfile((prev) => ({
          ...prev,
          displayName: data.displayName || prev.displayName,
          theme: data.preferences?.theme || prev.theme,
          primaryColor: data.preferences?.primaryColor || prev.primaryColor,
          hasPrivatePassword: data.hasPrivatePassword || false
        }));

        // Mẹo phụ: Lưu theme tạm vào localStorage để không bị chớp màn hình trắng khi F5
        if (data.preferences?.theme) {
          localStorage.setItem('temp-theme', data.preferences.theme);
        }
      } catch (error) {
        console.error('Lỗi tải cài đặt:', error);
      }
    }
    fetchProfileSettings();
  }, []);

  // Áp dụng class 'dark' vào thẻ html và cập nhật biến CSS màu chủ đạo
  useEffect(() => {
    const root = document.documentElement;

    if (profile.theme === 'dark') {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }

    if (profile.primaryColor) {
      root.style.setProperty('--color-primary', profile.primaryColor);
    }
  }, [profile.theme, profile.primaryColor]);

  // Cập nhật và lưu thay đổi lên server
  const updateThemeSettings = async (updates) => {
    const newProfile = { ...profile, ...updates };
    setProfile(newProfile); // Cập nhật giao diện tức thì

    try {
      await profileService.updateProfile({
        displayName: newProfile.displayName,
        preferences: {
          theme: newProfile.theme,
          primaryColor: newProfile.primaryColor
        }
      });
    } catch (error) {
      console.error('Lỗi lưu cài đặt:', error);
    }
  };

  return (
    <ThemeContext.Provider value={{ ...profile, updateThemeSettings, setProfile }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  return useContext(ThemeContext);
}