import { useState } from 'react';
import { Check, Moon, Pencil, Sun } from 'lucide-react';
import Button from '../components/common/Button';
import { THEME_COLORS, useTheme } from '../context/ThemeContext';

function SettingsPage() {
  const {
    displayName,
    theme,
    primaryColor,
    updateThemeSettings,
  } = useTheme();
  const [nameDraft, setNameDraft] = useState({
    profileName: displayName,
    value: displayName || '',
  });
  const [isSavingName, setIsSavingName] = useState(false);
  const name = nameDraft.profileName === displayName
    ? nameDraft.value
    : displayName || '';

  const handleSaveName = async (event) => {
    event.preventDefault();
    const trimmedName = name.trim();
    if (!trimmedName || trimmedName === displayName) return;

    setIsSavingName(true);
    try {
      await updateThemeSettings({ displayName: trimmedName });
    } finally {
      setIsSavingName(false);
    }
  };

  return (
    <div className="mx-auto w-full max-w-3xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">Cài đặt</h1>
        <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
          Tùy chỉnh thông tin và giao diện theo sở thích của bạn.
        </p>
      </div>

      <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900 sm:p-6">
        <div className="mb-5 flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
            <Pencil size={18} />
          </div>
          <div>
            <h2 className="font-semibold text-slate-900 dark:text-white">Thông tin hiển thị</h2>
            <p className="mt-0.5 text-sm text-slate-500 dark:text-slate-400">
              Tên này sẽ xuất hiện trên thanh đầu trang.
            </p>
          </div>
        </div>

        <form onSubmit={handleSaveName} className="flex flex-col gap-3 sm:flex-row sm:items-end">
          <div className="flex-1">
            <label htmlFor="display-name" className="mb-1.5 block text-sm font-medium text-slate-700 dark:text-slate-300">
              Tên hiển thị
            </label>
            <input
              id="display-name"
              type="text"
              value={name}
              onChange={(event) => setNameDraft({
                profileName: displayName,
                value: event.target.value,
              })}
              placeholder="Nhập tên hiển thị"
              maxLength={50}
              required
              className="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm text-slate-800 outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
            />
          </div>
          <Button
            type="submit"
            loading={isSavingName}
            disabled={!name.trim() || name.trim() === displayName}
          >
            Lưu tên
          </Button>
        </form>
      </section>

      <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900 sm:p-6">
        <div className="mb-5">
          <h2 className="font-semibold text-slate-900 dark:text-white">Chế độ giao diện</h2>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
            Chọn giao diện sáng hoặc tối cho toàn bộ ứng dụng.
          </p>
        </div>

        <div className="grid max-w-md grid-cols-2 gap-3">
          {[
            { id: 'light', label: 'Sáng', Icon: Sun },
            { id: 'dark', label: 'Tối', Icon: Moon },
          ].map(({ id, label, Icon }) => {
            const isSelected = theme === id;
            return (
              <button
                key={id}
                type="button"
                aria-pressed={isSelected}
                onClick={() => updateThemeSettings({ theme: id })}
                className={`flex items-center justify-center gap-2 rounded-xl border px-4 py-3 text-sm font-medium transition-colors ${
                  isSelected
                    ? 'border-primary bg-primary/10 text-primary'
                    : 'border-slate-200 text-slate-600 hover:border-primary/40 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800'
                }`}
              >
                <Icon size={17} />
                {label}
                {isSelected && <Check size={16} aria-hidden="true" />}
              </button>
            );
          })}
        </div>
      </section>

      <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900 sm:p-6">
        <div className="mb-5">
          <h2 className="font-semibold text-slate-900 dark:text-white">Màu chủ đạo</h2>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
            Chọn màu nhấn cho nút bấm và các chi tiết của giao diện.
          </p>
        </div>

        <div className="grid grid-cols-4 gap-3 sm:grid-cols-7">
          {THEME_COLORS.map((color) => {
            const isSelected = primaryColor === color.value;
            return (
              <button
                key={color.id}
                type="button"
                aria-label={color.name}
                aria-pressed={isSelected}
                title={color.name}
                onClick={() => updateThemeSettings({ primaryColor: color.value })}
                className={`group flex flex-col items-center gap-2 rounded-xl border p-3 transition-colors ${
                  isSelected
                    ? 'border-primary bg-primary/5'
                    : 'border-slate-200 hover:border-primary/40 dark:border-slate-700'
                }`}
              >
                <span
                  className="flex h-9 w-9 items-center justify-center rounded-full shadow-sm"
                  style={{ backgroundColor: color.value }}
                >
                  {isSelected && <Check size={17} className="text-white" aria-hidden="true" />}
                </span>
                <span className="text-xs font-medium text-slate-600 group-hover:text-slate-900 dark:text-slate-300 dark:group-hover:text-white">
                  {color.name}
                </span>
              </button>
            );
          })}
        </div>
      </section>
    </div>
  );
}

export default SettingsPage;
