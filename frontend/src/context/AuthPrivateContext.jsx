import { createContext, useContext, useEffect, useState } from 'react';
import privateService from '../services/privateService';

const AuthPrivateContext = createContext(null);
// api.js đọc private_token để gắn Bearer token vào các request vùng riêng tư.
const TOKEN_STORAGE_KEY = 'private_token';
const EXPIRY_STORAGE_KEY = 'private_token_expires_at';
const SESSION_DURATION_MS = 15 * 60 * 1000;

// Không khôi phục token thiếu hạn dùng hoặc đã hết hạn.
function getSavedToken() {
  const token = localStorage.getItem(TOKEN_STORAGE_KEY);
  const expiresAt = Number(localStorage.getItem(EXPIRY_STORAGE_KEY));

  if (token && expiresAt > Date.now()) return token;

  localStorage.removeItem(TOKEN_STORAGE_KEY);
  localStorage.removeItem(EXPIRY_STORAGE_KEY);
  return null;
}

export function AuthPrivateProvider({ children }) {
  const [token, setToken] = useState(getSavedToken);

  const lock = () => {
    localStorage.removeItem(TOKEN_STORAGE_KEY);
    localStorage.removeItem(EXPIRY_STORAGE_KEY);
    setToken(null);
  };

  // Chỉ tạo phiên sau khi backend xác thực mật khẩu và trả token hợp lệ.
  const unlock = async (password) => {
    const response = await privateService.unlock(password);
    if (!response?.token) {
      throw new Error('Không nhận được token xác thực vùng riêng tư.');
    }

    localStorage.setItem(TOKEN_STORAGE_KEY, response.token);
    localStorage.setItem(EXPIRY_STORAGE_KEY, String(Date.now() + SESSION_DURATION_MS));
    setToken(response.token);
    return response;
  };

  // Thiết lập mật khẩu chưa mở khóa phiên; gọi unlock riêng sau khi setup thành công.
  const setupPassword = (password) => privateService.setupPassword(password);

  useEffect(() => {
    if (!token) return undefined;

    // Đặt timer theo hạn lưu cùng token; cleanup timer cũ khi khóa hoặc đổi phiên.
    const expiresAt = Number(localStorage.getItem(EXPIRY_STORAGE_KEY));
    const timeoutId = window.setTimeout(
      () => {
        localStorage.removeItem(TOKEN_STORAGE_KEY);
        localStorage.removeItem(EXPIRY_STORAGE_KEY);
        setToken(null);
      },
      Math.max(0, expiresAt - Date.now()),
    );

    return () => window.clearTimeout(timeoutId);
  }, [token]);

  return (
    <AuthPrivateContext.Provider
      value={{ isUnlocked: Boolean(token), token, unlock, lock, setupPassword }}
    >
      {children}
    </AuthPrivateContext.Provider>
  );
}

export function useAuthPrivate() {
  const context = useContext(AuthPrivateContext);
  if (!context) {
    throw new Error('useAuthPrivate phải được đặt bên trong AuthPrivateProvider');
  }
  return context;
}