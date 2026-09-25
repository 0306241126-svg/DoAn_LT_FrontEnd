import { Edit3, Trash2 } from 'lucide-react';

// NoteCard hiển thị bản tóm tắt của một ghi chú và các thao tác sửa/xóa tùy chọn.
function NoteCard({ note, onEdit, onDelete }) {
  // Nếu ghi chú chưa có nội dung, hiển thị thông báo thay thế dễ hiểu.
  const summary = note.content?.trim() || 'Chưa có nội dung.';
  // Định dạng ngày theo tiếng Việt từ updatedAt hoặc createdAt của note service.
  const formattedDate = note.updatedAt || note.createdAt
    ? new Intl.DateTimeFormat('vi-VN', { dateStyle: 'medium' }).format(
        new Date(note.updatedAt || note.createdAt),
      )
    : '';

  return (
    <article className="flex h-full flex-col rounded-xl border border-border bg-card p-5 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md">
      <div className="flex items-start justify-between gap-3">
        <h2 className="line-clamp-2 text-lg font-semibold text-card-foreground">{note.title}</h2>
        {/* Chỉ hiển thị nhóm thao tác khi component cha truyền callback tương ứng. */}
        {(onEdit || onDelete) && (
          <div className="flex shrink-0 items-center gap-1">
            {/* Callback onEdit nối nút sửa với màn hình/modal chỉnh sửa ghi chú. */}
            {onEdit && (
              <button
                type="button"
                aria-label={`Sửa ghi chú ${note.title}`}
                title="Sửa ghi chú"
                onClick={() => onEdit(note)}
                className="rounded-lg p-2 text-muted-foreground hover:bg-muted hover:text-foreground"
              >
                <Edit3 size={16} aria-hidden="true" />
              </button>
            )}
            {/* Callback onDelete nối nút xóa với logic xóa ghi chú ở component cha. */}
            {onDelete && (
              <button
                type="button"
                aria-label={`Xóa ghi chú ${note.title}`}
                title="Xóa ghi chú"
                onClick={() => onDelete(note)}
                className="rounded-lg p-2 text-muted-foreground hover:bg-red-50 hover:text-red-600"
              >
                <Trash2 size={16} aria-hidden="true" />
              </button>
            )}
          </div>
        )}
      </div>
      <p className="mt-3 line-clamp-3 flex-1 whitespace-pre-line text-sm leading-6 text-muted-foreground">{summary}</p>
      {formattedDate && <time className="mt-4 text-xs text-muted-foreground">Cập nhật {formattedDate}</time>}
    </article>
  );
}

export default NoteCard;