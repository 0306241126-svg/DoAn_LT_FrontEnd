import React, { createContext, useContext, useState, useEffect, useRef, useCallback } from 'react';
import { privateService } from '../services/privateService';

const AuthPrivateContext = createContext();

const AUTO_LOCK_TIME = 15 * 60 * 1000; // 15 phút (ms)

export function AuthPrivateProvider({ children }) {
  const [token, setToken] = useState(() => sessionStorage.getItem('private_token') || null);
  const [isUnlocked, setIsUnlocked] = useState(() => Boolean(sessionStorage.getItem('private_token')));
  const timerRef = useRef(null);

  // Hàm khóa vùng riêng tư và dọn dẹp bộ nhớ
  const lock = useCallback(() => {
    sessionStorage.removeItem('private_token');
    setToken(null);
    setIsUnlocked(false);
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
  }, []);

  // Hàm khởi động / gia hạn đếm ngược 15 phút
  const resetLockTimer = useCallback(() => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
    }
    // Hết 15 phút tự động kích hoạt hàm lock
    timerRef.current = setTimeout(() => {
      lock();
    }, AUTO_LOCK_TIME);
  }, [lock]);

  // Hàm mở khóa vùng riêng tư
  const unlock = async (password) => {
    try {
      const response = await privateService.unlockPrivate(password);
      if (response && response.token) {
        sessionStorage.setItem('private_token', response.token);
        setToken(response.token);
        setIsUnlocked(true);
        resetLockTimer();
        return true;
      }
      return false;
    } catch (error) {
      throw error;
    }
  };

  // Lắng nghe thao tác người dùng (chuột, phím) để gia hạn thời gian nếu đang mở khóa
  useEffect(() => {
    if (!isUnlocked) return;

    resetLockTimer();

    const handleUserActivity = () => {
      resetLockTimer();
    };

    // Lắng nghe sự kiện session expired từ Axios Interceptor (HTTP 401)
    const handleSessionExpired = () => {
      lock();
    };

    window.addEventListener('mousemove', handleUserActivity);
    window.addEventListener('keydown', handleUserActivity);
    window.addEventListener('click', handleUserActivity);
    window.addEventListener('private-session-expired', handleSessionExpired);

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
      window.removeEventListener('mousemove', handleUserActivity);
      window.removeEventListener('keydown', handleUserActivity);
      window.removeEventListener('click', handleUserActivity);
      window.removeEventListener('private-session-expired', handleSessionExpired);
    };
  }, [isUnlocked, resetLockTimer, lock]);

  return (
    <AuthPrivateContext.Provider
      value={{
        isUnlocked,
        token,
        unlock,
        lock,
      }}
    >
      {children}
    </AuthPrivateContext.Provider>
  );
}

export function useAuthPrivate() {
  return useContext(AuthPrivateContext);
}