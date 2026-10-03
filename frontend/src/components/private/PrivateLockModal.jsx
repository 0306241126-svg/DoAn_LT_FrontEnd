import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ShieldCheck, ShieldAlert, X } from 'lucide-react';
import Input from '../common/Input';
import Button from '../common/Button';
import LoadingSpinner from '../common/LoadingSpinner';
import { useAuthPrivate } from '../../context/AuthPrivateContext';
import { useTheme } from '../../context/ThemeContext';
import { privateService } from '../../services/privateService';

export default function PrivateLockModal({ isOpen, onClose, onSuccess }) {
  const { unlock } = useAuthPrivate();
  const { hasPrivatePassword, isProfileLoading, refreshProfile, setProfile } = useTheme();
  const navigate = useNavigate();

  // State chế độ Mở khóa
  const [password, setPassword] = useState('');

  // State chế độ Thiết lập mật khẩu mới
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  if (!isOpen) return null;

  const handleClose = () => {
    if (onClose) {
      onClose();
    } else {
      navigate('/');
    }
  };

  // Xử lý mở khóa
  const handleUnlock = async (e) => {
    e.preventDefault();
    if (!password) {
      setError('Vui lòng nhập mật khẩu');
      return;
    }
    setError('');
    setLoading(true);

    try {
      await unlock(password);
      setPassword('');
      if (onSuccess) onSuccess();
      if (onClose) onClose();
    } catch (err) {
      setError(err.message || 'Mật khẩu không chính xác');
    } finally {
      setLoading(false);
    }
  };

  // Xử lý thiết lập mật khẩu lần đầu
  const handleSetup = async (e) => {
    e.preventDefault();
    
    // Đã thay đổi điều kiện: Kiểm tra mật khẩu phải lớn hơn 6 ký tự
    if (!newPassword || newPassword.length <= 6) {
      setError('Mật khẩu phải lớn hơn 6 ký tự');
      return;
    }
    
    if (newPassword !== confirmPassword) {
      setError('Xác nhận mật khẩu không trùng khớp');
      return;
    }

    setError('');
    setLoading(true);

    try {
      await privateService.setupPassword(newPassword);
      setProfile((prev) => ({ ...prev, hasPrivatePassword: true }));
      await unlock(newPassword);

      if (onSuccess) onSuccess();
      if (onClose) onClose();
    } catch (err) {
      if (err.status === 409) {
        await refreshProfile();
        setPassword('');
        setError('Mật khẩu đã được thiết lập. Hãy nhập mật khẩu hiện tại để mở khóa.');
        return;
      }
      setError(err.message || 'Không thể thiết lập mật khẩu');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-xs flex items-center justify-center z-50 p-4">
      <div className="relative bg-white dark:bg-slate-900 rounded-3xl w-full max-w-sm p-8 shadow-2xl border border-slate-100 dark:border-slate-800 text-center animate-fade-in">
        
        <button
          type="button"
          onClick={handleClose}
          className="absolute right-4 top-4 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition"
          title="Thoát"
        >
          <X size={18} />
        </button>

        <div className="w-14 h-14 bg-primary/10 text-primary rounded-2xl flex items-center justify-center mx-auto mb-4">
          {hasPrivatePassword ? <ShieldCheck size={28} /> : <ShieldAlert size={28} />}
        </div>

        <h3 className="text-base font-bold text-slate-800 dark:text-slate-100 mb-1">
          {hasPrivatePassword ? 'Vùng riêng tư đã khóa' : 'Thiết lập mật khẩu bảo vệ'}
        </h3>
        <p className="text-xs text-slate-500 dark:text-slate-400 mb-6 leading-relaxed">
          {hasPrivatePassword
            ? 'Nhập mật khẩu để mở khóa và xem các ghi chú được bảo vệ của bạn.'
            : 'Bạn chưa có mật khẩu. Vui lòng tạo mật khẩu mới để bảo vệ vùng riêng tư.'}
        </p>

        {isProfileLoading ? (
          <div className="flex justify-center py-4" role="status" aria-label="Đang tải thông tin bảo mật">
            <LoadingSpinner size="md" className="text-primary" />
          </div>
        ) : !hasPrivatePassword ? (
          <form onSubmit={handleSetup} className="space-y-4">
            <Input
              type="password"
              placeholder="Tạo mật khẩu mới (lớn hơn 6 ký tự)..."
              value={newPassword}
              onChange={(e) => {
                setNewPassword(e.target.value);
                setError('');
              }}
              autoFocus
            />
            <Input
              type="password"
              placeholder="Nhập lại mật khẩu..."
              value={confirmPassword}
              onChange={(e) => {
                setConfirmPassword(e.target.value);
                setError('');
              }}
              error={error}
            />
            <Button type="submit" className="w-full py-2.5" loading={loading}>
              Lưu & Mở khóa ngay
            </Button>
          </form>
        ) : (
          <form onSubmit={handleUnlock} className="space-y-4">
            <Input
              id="private-pwd"
              type="password"
              placeholder="Nhập mật khẩu bảo vệ..."
              value={password}
              onChange={(e) => {
                setPassword(e.target.value);
                setError('');
              }}
              error={error}
              autoFocus
            />
            <Button type="submit" className="w-full py-2.5" loading={loading}>
              Mở khóa
            </Button>
          </form>
        )}
      </div>
    </div>
  );
}