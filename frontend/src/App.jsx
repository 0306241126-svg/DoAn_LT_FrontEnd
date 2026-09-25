import MainLayout from './components/layout/MainLayout';

// App là màn hình gốc, nối nội dung trang hiện tại vào khung MainLayout.
function App() {
  return (
    // MainLayout cung cấp Sidebar/Header; phần section bên trong là vùng content thay đổi.
    <MainLayout>
      <section className="space-y-2">
        <p className="text-sm font-medium text-(--color-primary)">Không gian ghi chú</p>
        <h1 className="text-3xl font-bold tracking-tight">Chào mừng trở lại, Quân</h1>
        <p className="max-w-2xl text-muted-foreground">
          Chọn một chủ đề ở thanh bên để bắt đầu quản lý những ghi chú của bạn.
        </p>
      </section>
    </MainLayout>
  );
}

export default App;