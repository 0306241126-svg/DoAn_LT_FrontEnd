import { BookOpen, X } from 'lucide-react';

// Sidebar hiển thị danh sách topic và điều khiển topic đang được chọn.
function Sidebar({ topics, activeTopic, onSelectTopic, isOpen, onClose }) {
  return (
    <>
      {/* Overlay chỉ xuất hiện khi Sidebar mở trên mobile và gọi onClose khi người dùng bấm ra ngoài. */}
      {isOpen && (
        <button
          type="button"
          aria-label="Đóng thanh bên"
          className="fixed inset-0 z-30 bg-black/40 lg:hidden"
          onClick={onClose}
        />
      )}
      {/* MainLayout truyền topics, activeTopic và callback chọn topic vào Sidebar. */}
      <aside
        aria-label="Danh sách chủ đề"
        className={`fixed inset-y-0 left-0 z-40 flex w-72 flex-col border-r border-border bg-sidebar text-sidebar-foreground shadow-xl transition-transform duration-200 lg:translate-x-0 lg:shadow-none ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="flex h-20 items-center justify-between border-b border-border px-5">
          <div className="flex items-center gap-3">
            <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-(--color-primary) text-white">
              <BookOpen size={20} aria-hidden="true" />
            </span>
            <div>
              <p className="text-base font-bold">Sổ tay</p>
              <p className="text-xs text-muted-foreground">Không gian ghi chú</p>
            </div>
          </div>
          <button
            type="button"
            aria-label="Đóng thanh bên"
            className="rounded-lg p-2 text-muted-foreground hover:bg-muted lg:hidden"
            onClick={onClose}
          >
            <X size={20} aria-hidden="true" />
          </button>
        </div>

        {/* Danh sách này render tên topic từ backend, giữ nguyên tiếng Việt có dấu. */}
        <nav className="flex-1 overflow-y-auto px-3 py-5">
          <p className="mb-2 px-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            Chủ đề
          </p>
          <div className="space-y-1">
            {topics.map((topic) => {
              // So sánh slug để xác định và làm nổi bật topic hiện tại.
              const isActive = topic.slug === activeTopic;
              return (
                <button
                  key={topic.slug}
                  type="button"
                  aria-current={isActive ? 'page' : undefined}
                  // Khi chọn topic, cập nhật state ở MainLayout và đóng drawer mobile.
                  onClick={() => {
                    onSelectTopic(topic.slug);
                    onClose();
                  }}
                  className={`flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left text-sm transition-colors ${
                    isActive
                      ? 'bg-(--color-primary) font-semibold text-white shadow-sm'
                      : 'text-sidebar-foreground hover:bg-muted'
                  }`}
                >
                  <span className={`h-2 w-2 rounded-full ${isActive ? 'bg-white' : 'bg-(--color-primary)'}`} />
                  <span className="truncate">{topic.name}</span>
                </button>
              );
            })}
          </div>
        </nav>

        <div className="border-t border-border px-5 py-4 text-xs text-muted-foreground">
          Được lưu riêng tư trên thiết bị của bạn
        </div>
      </aside>
    </>
  );
}

export default Sidebar;