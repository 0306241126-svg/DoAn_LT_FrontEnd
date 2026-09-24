import { useState, useEffect } from 'react';
import useDebounce from './hooks/useDebounce';

function App() {
  const [searchTerm, setSearchTerm] = useState('');
  const debouncedSearch = useDebounce(searchTerm, 500);

  // useEffect này chỉ chạy khi debouncedSearch thay đổi (ngừng gõ 500ms)
  useEffect(() => {
    if (debouncedSearch) {
      console.log('>>> [KÍCH HOẠT TÌM KIẾM]:', debouncedSearch);
    }
  }, [debouncedSearch]);

  return (
    <div className="min-h-screen p-6 bg-background text-foreground">
      <header className="p-4 rounded-xl text-white bg-(--color-primary) dark:bg-slate-900 shadow-md">
        <h1 className="text-xl font-bold">Kiểm tra useDebounce (Giai đoạn 4.4)</h1>
      </header>

      <main className="mt-6 p-6 rounded-xl border border-border bg-card max-w-md space-y-4">
        <div>
          <label className="block text-sm font-medium mb-1">Thử gõ tìm kiếm:</label>
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Nhập chữ nhanh liên tục..."
            className="w-full px-3 py-2 rounded-lg border border-border bg-background focus:outline-none focus:ring-2 focus:ring-(--color-primary)"
          />
        </div>

        <div className="text-sm space-y-1 bg-muted p-3 rounded-lg">
          <p>
            Giá trị gõ thực tế: <span className="font-semibold text-blue-600">{searchTerm || '(trống)'}</span>
          </p>
          <p>
            Giá trị qua useDebounce (sau 500ms):{' '}
            <span className="font-semibold text-green-600">{debouncedSearch || '(chưa kích hoạt)'}</span>
          </p>
        </div>
      </main>
    </div>
  );
}

export default App;