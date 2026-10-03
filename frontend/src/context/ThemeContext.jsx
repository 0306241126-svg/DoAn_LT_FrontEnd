import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
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
  const [isProfileLoading, setIsProfileLoading] = useState(true);
  const [profile, setProfile] = useState({
    displayName: 'Người dùng',
    theme: 'light',
    primaryColor: '#10b981',
    hasPrivatePassword: false
  });

  const refreshProfile = useCallback(async () => {
    setIsProfileLoading(true);
    try {
      const data = await profileService.getProfile();

      setProfile((prev) => ({
        ...prev,
        displayName: data.displayName || prev.displayName,
        theme: data.preferences?.theme || prev.theme,
        primaryColor: data.preferences?.primaryColor || prev.primaryColor,
        hasPrivatePassword: Boolean(data.hasPrivatePassword)
      }));

      if (data.preferences?.theme) {
        localStorage.setItem('temp-theme', data.preferences.theme);
      }
      return data;
    } catch (error) {
      console.error('Lỗi tải cài đặt:', error);
      return null;
    } finally {
      setIsProfileLoading(false);
    }
  }, []);

  useEffect(() => {
    refreshProfile();
  }, [refreshProfile]);

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
    <ThemeContext.Provider value={{ ...profile, isProfileLoading, refreshProfile, updateThemeSettings, setProfile }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  return useContext(ThemeContext);
}