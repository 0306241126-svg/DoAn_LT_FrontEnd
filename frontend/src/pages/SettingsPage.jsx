import React, { useState, useEffect } from 'react';
import { Sun, Moon, Palette, User, ShieldCheck } from 'lucide-react';
import { useTheme, THEME_COLORS } from '../context/ThemeContext';
import Input from '../components/common/Input';
import Button from '../components/common/Button';
import Toast from '../components/common/Toast';
import { privateService } from '../services/privateService';

export default function SettingsPage() {
  const { displayName, theme, primaryColor, hasPrivatePassword, updateThemeSettings } = useTheme();
  
  const [nameInput, setNameInput] = useState(displayName);
  const [toast, setToast] = useState(null);
  const [passwords, setPasswords] = useState({
    current: '',
    new: '',
    confirm: ''
  });
  const [passwordError, setPasswordError] = useState('');
  const [passwordLoading, setPasswordLoading] = useState(false);

  useEffect(() => {
    setNameInput(displayName);
  }, [displayName]);

  // Xử lý lưu Tên
  const handleSaveProfile = async (e) => {
    e.preventDefault();
    if (!nameInput.trim()) return;
    try {
      await updateThemeSettings({ displayName: nameInput });
      setToast({ type: 'success', message: 'Cập nhật tên thành công!' });
    } catch (error) {
      setToast({ type: 'error', message: error.message || 'Lỗi khi cập nhật tên.' });
    }
  };

  const handleChangePassword = async (e) => {
    e.preventDefault();
    if (passwords.new.length < 4) {
      setPasswordError('Mật khẩu mới phải có tối thiểu 4 ký tự');
      return;
    }
    if (passwords.new !== passwords.confirm) {
      setPasswordError('Xác nhận mật khẩu mới không trùng khớp');
      return;
    }

    setPasswordError('');
    setPasswordLoading(true);
    try {
      const response = await privateService.changePassword(passwords.current, passwords.new);
      setPasswords({ current: '', new: '', confirm: '' });
      setToast({ type: 'success', message: response.message || 'Đổi mật khẩu thành công' });
    } catch (error) {
      setPasswordError(error.message || 'Không thể đổi mật khẩu');
    } finally {
      setPasswordLoading(false);
    }
  };

  return (
    <div className="max-w-6xl mx-auto space-y-6 animate-fade-in text-left">
      <div>
        <h1 className="text-2xl font-bold text-slate-800 dark:text-slate-100">Cài đặt</h1>
        <p className="text-xs text-slate-400 mt-1">Quản lý hồ sơ và tùy chỉnh giao diện ứng dụng.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="space-y-6">
          {/* --- CÀI ĐẶT HỒ SƠ --- */}
          <section className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-3xl p-5 md:p-6 shadow-sm">
            <div className="flex items-center gap-3 mb-5">
              <div className="p-2.5 bg-primary/10 text-primary rounded-xl">
                <User size={20} />
              </div>
              <h2 className="text-base font-semibold text-slate-800 dark:text-slate-100">Hồ sơ cá nhân</h2>
            </div>

            <form onSubmit={handleSaveProfile} className="space-y-5">
              <Input
                id="display-name"
                label="Tên hiển thị"
                value={nameInput}
                onChange={(e) => setNameInput(e.target.value)}
                placeholder="Nhập tên của bạn..."
              />
              <div className="flex justify-end">
                <Button type="submit">Lưu thay đổi</Button>
              </div>
            </form>
          </section>

          {/* --- ĐỔI MẬT KHẨU VÙNG RIÊNG TƯ --- */}
          <section className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-3xl p-5 md:p-6 shadow-sm">
            <div className="flex items-center gap-3 mb-5">
              <div className="p-2.5 bg-primary/10 text-primary rounded-xl">
                <ShieldCheck size={20} />
              </div>
              <div>
                <h2 className="text-base font-semibold text-slate-800 dark:text-slate-100">Mật khẩu vùng riêng tư</h2>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                  Thay đổi mật khẩu dùng để bảo vệ ghi chú riêng tư.
                </p>
              </div>
            </div>

            {hasPrivatePassword ? (
              <form onSubmit={handleChangePassword} className="space-y-4">
                <Input
                  id="current-private-password"
                  label="Mật khẩu hiện tại"
                  type="password"
                  autoComplete="current-password"
                  value={passwords.current}
                  onChange={(e) => {
                    setPasswords((current) => ({ ...current, current: e.target.value }));
                    setPasswordError('');
                  }}
                  required
                />
                <div className="grid grid-cols-2 gap-3">
                  <Input
                    id="new-private-password"
                    label="Mật khẩu mới"
                    type="password"
                    autoComplete="new-password"
                    minLength={4}
                    value={passwords.new}
                    onChange={(e) => {
                      setPasswords((current) => ({ ...current, new: e.target.value }));
                      setPasswordError('');
                    }}
                    required
                  />
                  <Input
                    id="confirm-private-password"
                    label="Xác nhận mật khẩu mới"
                    type="password"
                    autoComplete="new-password"
                    minLength={4}
                    value={passwords.confirm}
                    onChange={(e) => {
                      setPasswords((current) => ({ ...current, confirm: e.target.value }));
                      setPasswordError('');
                    }}
                    required
                  />
                </div>
                {passwordError && (
                  <p role="alert" className="text-xs text-red-500">{passwordError}</p>
                )}
                <div className="flex justify-end pt-1">
                  <Button type="submit" loading={passwordLoading}>
                    Đổi mật khẩu
                  </Button>
                </div>
              </form>
            ) : (
              <p className="rounded-xl bg-slate-50 dark:bg-slate-800/70 px-4 py-3 text-sm text-slate-600 dark:text-slate-300">
                Bạn chưa thiết lập mật khẩu vùng riêng tư. Hãy mở mục <span className="font-semibold">Vùng riêng tư</span> để tạo mật khẩu trước.
              </p>
            )}
          </section>
        </div>

        {/* --- CÀI ĐẶT GIAO DIỆN --- */}
        <section className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-3xl p-5 md:p-6 shadow-sm h-fit">
          <div className="flex items-center gap-3 mb-5">
            <div className="p-2.5 bg-primary/10 text-primary rounded-xl">
              <Palette size={20} />
            </div>
            <h2 className="text-base font-semibold text-slate-800 dark:text-slate-100">Giao diện & Màu sắc</h2>
          </div>

          {/* Chế độ Sáng / Tối */}
          <div className="mb-7">
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-3">Chế độ hiển thị</label>
            <div className="flex flex-wrap gap-3">
              <button
                type="button"
                onClick={() => updateThemeSettings({ theme: 'light' })}
                className={`flex items-center gap-2 px-4 py-2.5 rounded-xl border transition ${
                  theme === 'light' 
                    ? 'border-primary bg-primary/5 text-primary' 
                    : 'border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800'
                }`}
              >
                <Sun size={18} /> Giao diện Sáng
              </button>
              
              <button
                type="button"
                onClick={() => updateThemeSettings({ theme: 'dark' })}
                className={`flex items-center gap-2 px-4 py-2.5 rounded-xl border transition ${
                  theme === 'dark' 
                    ? 'border-primary bg-primary/5 text-primary' 
                    : 'border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800'
                }`}
              >
                <Moon size={18} /> Giao diện Tối
              </button>
            </div>
          </div>

          {/* 7 Màu chủ đạo */}
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-3">Màu chủ đạo</label>
            <div className="flex flex-wrap gap-4">
              {THEME_COLORS.map((color) => {
                const isActive = primaryColor === color.value;
                return (
                  <button
                    type="button"
                    key={color.id}
                    onClick={() => updateThemeSettings({ primaryColor: color.value })}
                    title={color.name}
                    aria-label={`Chọn màu ${color.name}`}
                    aria-pressed={isActive}
                    className={`w-10 h-10 rounded-full flex items-center justify-center transition-all cursor-pointer ${
                      isActive ? 'scale-110 ring-4 ring-offset-2 dark:ring-offset-slate-900 ring-primary' : 'hover:scale-110 shadow-sm'
                    }`}
                    style={{ backgroundColor: color.value }}
                  />
                );
              })}
            </div>
            <p className="text-xs text-slate-400 mt-4">Chọn màu sắc phù hợp với cá tính của bạn. Màu sẽ được áp dụng cho toàn bộ ứng dụng.</p>
          </div>
        </section>
      </div>

      {toast && <Toast {...toast} onClose={() => setToast(null)} />}
    </div>
  );
}