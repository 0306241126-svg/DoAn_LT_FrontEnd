import React, { useState, useEffect } from 'react';
import { Sun, Moon, Palette, User, ShieldCheck } from 'lucide-react';
import { useTheme, THEME_COLORS } from '../context/ThemeContext';
import Input from '../components/common/Input';
import Button from '../components/common/Button';
import Toast from '../components/common/Toast';
import { privateService } from '../services/privateService';

export default function SettingsPage() {
  const {
    displayName,
    theme,
    primaryColor,
    hasPrivatePassword,
    isProfileLoading,
    updateThemeSettings,
  } = useTheme();
  
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
    <section className="mx-auto w-full max-w-7xl space-y-6 animate-fade-in text-left">
      <header className="flex flex-col gap-2 border-b border-slate-200 pb-5 dark:border-slate-800">
        <h1 className="text-2xl font-bold tracking-tight text-slate-800 dark:text-slate-100">
          Cài đặt hệ thống
        </h1>
        <p className="text-sm text-slate-500 dark:text-slate-400">
          Quản lý thông tin hồ sơ, tùy chỉnh giao diện và thiết lập bảo mật.
        </p>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* --- CỘT TRÁI: HỒ SƠ & BẢO MẬT --- */}
        <div className="lg:col-span-2 space-y-6">
          
          {/* Cài đặt hồ sơ */}
          <article className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 md:p-7 shadow-sm transition hover:border-slate-300 dark:hover:border-slate-700">
            <header className="flex items-center gap-3 mb-6 border-b border-slate-100 pb-4 dark:border-slate-800/80">
              <div className="p-2.5 bg-primary/10 text-primary rounded-xl">
                <User size={20} />
              </div>
              <div>
                <h2 className="text-base font-semibold text-slate-800 dark:text-slate-100">Hồ sơ cá nhân</h2>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">Thay đổi tên hiển thị của bạn</p>
              </div>
            </header>

            <form onSubmit={handleSaveProfile} className="space-y-5 max-w-lg">
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
          </article>

          {/* Đổi mật khẩu vùng riêng tư */}
          <article className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 md:p-7 shadow-sm transition hover:border-slate-300 dark:hover:border-slate-700">
            <header className="flex items-center gap-3 mb-6 border-b border-slate-100 pb-4 dark:border-slate-800/80">
              <div className="p-2.5 bg-amber-500/10 text-amber-500 rounded-xl">
                <ShieldCheck size={20} />
              </div>
              <div>
                <h2 className="text-base font-semibold text-slate-800 dark:text-slate-100">Bảo mật Vùng riêng tư</h2>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  Quản lý mật khẩu cấp 2 bảo vệ dữ liệu nhạy cảm
                </p>
              </div>
            </header>

            {isProfileLoading ? (
              <div className="flex justify-center py-4" role="status">
                <p className="text-sm text-slate-500 animate-pulse">Đang kiểm tra trạng thái bảo mật...</p>
              </div>
            ) : hasPrivatePassword ? (
              <form onSubmit={handleChangePassword} className="space-y-5 max-w-xl">
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
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
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
                  <div role="alert" className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600 dark:bg-red-900/30 dark:text-red-400 border border-red-200 dark:border-red-900/50">
                    {passwordError}
                  </div>
                )}
                <div className="flex justify-end pt-2">
                  <Button type="submit" loading={passwordLoading} variant="outline" className="border-amber-200 text-amber-700 hover:bg-amber-50 dark:border-amber-900/50 dark:text-amber-400 dark:hover:bg-amber-900/20">
                    Cập nhật mật khẩu
                  </Button>
                </div>
              </form>
            ) : (
              <div className="rounded-xl border border-dashed border-slate-300 bg-slate-50 p-6 text-center dark:border-slate-700 dark:bg-slate-800/50">
                <ShieldCheck size={28} className="mx-auto mb-3 text-slate-400" />
                <p className="text-sm text-slate-600 dark:text-slate-300">
                  Bạn chưa thiết lập mật khẩu vùng riêng tư. 
                  <br className="hidden sm:block" />
                  Hãy mở mục <span className="font-semibold text-primary">Vùng riêng tư</span> để khởi tạo.
                </p>
              </div>
            )}
          </article>
        </div>

        {/* --- CỘT PHẢI: GIAO DIỆN --- */}
        <div className="lg:col-span-1">
          <article className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 md:p-7 shadow-sm sticky top-24 transition hover:border-slate-300 dark:hover:border-slate-700">
            <header className="flex items-center gap-3 mb-6 border-b border-slate-100 pb-4 dark:border-slate-800/80">
              <div className="p-2.5 bg-primary/10 text-primary rounded-xl">
                <Palette size={20} />
              </div>
              <div>
                <h2 className="text-base font-semibold text-slate-800 dark:text-slate-100">Giao diện</h2>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">Tùy chỉnh màu sắc cá nhân</p>
              </div>
            </header>

            {/* Chế độ Sáng / Tối */}
            <div className="mb-8">
              <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-3">
                Chế độ hiển thị
              </label>
              <div className="flex flex-col sm:flex-row lg:flex-col gap-3">
                <button
                  type="button"
                  onClick={() => updateThemeSettings({ theme: 'light' })}
                  className={`flex flex-1 items-center justify-center gap-2.5 px-4 py-3 rounded-xl border transition-all ${
                    theme === 'light' 
                      ? 'border-primary bg-primary/10 text-primary font-medium ring-1 ring-primary/20' 
                      : 'border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800'
                  }`}
                >
                  <Sun size={18} /> Sáng
                </button>
                
                <button
                  type="button"
                  onClick={() => updateThemeSettings({ theme: 'dark' })}
                  className={`flex flex-1 items-center justify-center gap-2.5 px-4 py-3 rounded-xl border transition-all ${
                    theme === 'dark' 
                      ? 'border-primary bg-primary/10 text-primary font-medium ring-1 ring-primary/20' 
                      : 'border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800'
                  }`}
                >
                  <Moon size={18} /> Tối
                </button>
              </div>
            </div>

            {/* Màu chủ đạo */}
            <div>
              <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-3">
                Màu chủ đạo (Primary Color)
              </label>
              <div className="grid grid-cols-4 sm:grid-cols-7 lg:grid-cols-4 gap-4">
                {THEME_COLORS.map((color) => {
                  const isActive = primaryColor === color.value;
                  return (
                    <div key={color.id} className="flex justify-center">
                      <button
                        type="button"
                        onClick={() => updateThemeSettings({ primaryColor: color.value })}
                        title={color.name}
                        aria-label={`Chọn màu ${color.name}`}
                        aria-pressed={isActive}
                        className={`w-10 h-10 rounded-full flex items-center justify-center transition-all cursor-pointer ${
                          isActive 
                            ? 'scale-110 ring-4 ring-offset-2 dark:ring-offset-slate-900 ring-primary shadow-md' 
                            : 'hover:scale-110 shadow-sm border border-black/5 dark:border-white/5'
                        }`}
                        style={{ backgroundColor: color.value }}
                      />
                    </div>
                  );
                })}
              </div>
            </div>
          </article>
        </div>
      </div>

      {toast && <Toast {...toast} onClose={() => setToast(null)} />}
    </section>
  );
}