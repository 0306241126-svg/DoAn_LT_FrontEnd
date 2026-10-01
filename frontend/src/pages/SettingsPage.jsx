import React, { useState } from 'react';
import { Check, Moon, Palette, Sun, User } from 'lucide-react';
import Button from '../components/common/Button';
import Input from '../components/common/Input';
import { THEME_COLORS, useTheme } from '../context/ThemeContext';

export default function SettingsPage() {
  const { displayName: savedDisplayName, theme, primaryColor, updateThemeSettings } = useTheme();
  const [displayName, setDisplayName] = useState(savedDisplayName || 'Người dùng');
  const [selectedTheme, setSelectedTheme] = useState(theme);
  const [selectedColor, setSelectedColor] = useState(primaryColor);

  const themeOptions = [
    { id: 'light', label: 'Sáng', icon: Sun },
    { id: 'dark', label: 'Tối', icon: Moon },
  ];

  const saveSettings = async () => {
    await updateThemeSettings({
      displayName: displayName.trim() || 'Người dùng',
      theme: selectedTheme,
      primaryColor: selectedColor,
    });
  };

  return (
    <div className="mx-auto max-w-5xl space-y-6 py-6">
      <div>
        <p className="text-sm font-medium uppercase tracking-[0.2em] text-primary">Cài đặt</p>
        <h1 className="mt-1 text-3xl font-bold text-slate-900 dark:text-slate-100">Trang cá nhân</h1>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <div className="mb-4 flex items-center gap-3">
            <User size={18} className="text-primary" />
            <h2 className="text-xl font-semibold">Thông tin</h2>
          </div>
          <Input
            label="Tên hiển thị"
            value={displayName}
            onChange={(event) => setDisplayName(event.target.value)}
            placeholder="Nhập tên hiển thị"
          />
        </section>

        <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <div className="mb-4 flex items-center gap-3">
            {selectedTheme === 'dark' ? <Moon size={18} className="text-primary" /> : <Sun size={18} className="text-primary" />}
            <h2 className="text-xl font-semibold">Giao diện</h2>
          </div>
          <div className="space-y-3">
            {themeOptions.map(({ id, label, icon: Icon }) => (
              <button
                key={id}
                type="button"
                onClick={() => setSelectedTheme(id)}
                className={`flex w-full items-center justify-between rounded-xl border px-4 py-3 text-left transition ${
                  selectedTheme === id
                    ? 'border-primary bg-primary/10'
                    : 'border-slate-200 hover:bg-slate-50 dark:border-slate-700 dark:hover:bg-slate-800'
                }`}
                aria-pressed={selectedTheme === id}
              >
                <span className="flex items-center gap-3">
                  <Icon size={16} />
                  <span className="font-medium">{label}</span>
                </span>
                {selectedTheme === id && <Check size={16} className="text-primary" />}
              </button>
            ))}
          </div>
        </section>

        <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <div className="mb-4 flex items-center gap-3">
            <Palette size={18} className="text-primary" />
            <h2 className="text-xl font-semibold">Màu chủ đạo</h2>
          </div>
          <div className="grid grid-cols-4 gap-3">
            {THEME_COLORS.map((color) => (
              <button
                key={color.id}
                type="button"
                onClick={() => setSelectedColor(color.value)}
                aria-label={`Chọn màu ${color.name}`}
                aria-pressed={selectedColor === color.value}
                className={`flex items-center justify-center rounded-xl border-2 p-2 ${
                  selectedColor === color.value ? 'border-primary' : 'border-transparent'
                }`}
              >
                <span
                  className="flex h-10 w-10 items-center justify-center rounded-lg"
                  style={{ backgroundColor: color.value }}
                >
                  {selectedColor === color.value && <Check size={18} className="text-white" />}
                </span>
              </button>
            ))}
          </div>
        </section>
      </div>

      <div className="flex justify-end">
        <Button type="button" onClick={saveSettings}>Lưu thay đổi</Button>
      </div>
    </div>
  );
}
