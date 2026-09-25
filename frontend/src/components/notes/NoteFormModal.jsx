import { useState } from 'react';
import { X } from 'lucide-react';
import Button from '../common/Button';
import Input from '../common/Input';

// Phần nội dung form được tách riêng để reset state theo từng note thông qua key của modal.
function NoteFormFields({ note, onClose, onSubmit }) {
  // State controlled lưu tiêu đề và nội dung người dùng đang nhập.
  const [title, setTitle] = useState(() => note?.title || '');
  const [content, setContent] = useState(() => note?.content || '');
  const [titleError, setTitleError] = useState('');
  const [submitError, setSubmitError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Kiểm tra tiêu đề trước khi gọi onSubmit để chặn ghi chú không có tên.
  const handleSubmit = async (event) => {
    event.preventDefault();
    const trimmedTitle = title.trim();
    if (!trimmedTitle) {
      setTitleError('Tiêu đề ghi chú không được để trống.');
      return;
    }

    setTitleError('');
    setSubmitError('');
    setIsSubmitting(true);
    // onSubmit do màn hình cha nối với noteService.createNote hoặc updateNote.
    try {
      await onSubmit({ ...(note || {}), title: trimmedTitle, content: content.trim() });
      onClose();
    } catch (error) {
      setSubmitError(error?.message || 'Không thể lưu ghi chú.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" role="presentation">
      <div role="dialog" aria-modal="true" aria-labelledby="note-form-title" className="w-full max-w-lg rounded-xl border border-border bg-card p-6 shadow-xl">
        <div className="mb-5 flex items-center justify-between gap-4">
          <h2 id="note-form-title" className="text-xl font-bold">{note ? 'Sửa ghi chú' : 'Tạo ghi chú'}</h2>
          <button type="button" aria-label="Đóng biểu mẫu" onClick={onClose} className="rounded-lg p-2 text-muted-foreground hover:bg-muted">
            <X size={20} aria-hidden="true" />
          </button>
        </div>
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* NoteFormModal nối Input dùng chung với state title và lỗi validation. */}
          <Input
            label="Tiêu đề"
            value={title}
            onChange={(event) => {
              setTitle(event.target.value);
              if (event.target.value.trim()) setTitleError('');
            }}
            error={titleError}
            required
            autoFocus
            placeholder="Nhập tiêu đề ghi chú"
          />
          <div>
            <label htmlFor="note-content" className="mb-1.5 block text-sm font-medium">Nội dung</label>
            {/* Nội dung note được quản lý tại modal và gửi cùng title khi submit. */}
            <textarea
              id="note-content"
              value={content}
              onChange={(event) => setContent(event.target.value)}
              rows={6}
              placeholder="Viết nội dung ghi chú..."
              className="w-full resize-y rounded-lg border border-border bg-background px-3 py-2 text-foreground outline-none focus:ring-2 focus:ring-(--color-primary)"
            />
          </div>
          {submitError && <p className="text-sm text-red-600" role="alert">{submitError}</p>}
          <div className="flex justify-end gap-3">
            <Button type="button" variant="outline" onClick={onClose}>Hủy</Button>
            {/* Button dùng chung hiển thị spinner trong lúc onSubmit đang chạy. */}
            <Button type="submit" loading={isSubmitting}>Lưu ghi chú</Button>
          </div>
        </form>
      </div>
    </div>
  );
}

// Modal bao phủ form và chỉ render khi isOpen được component cha bật.
function NoteFormModal({ isOpen, note, onClose, onSubmit }) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" role="presentation">
      {/* key giúp form nhận lại dữ liệu mới khi chuyển giữa tạo mới và chỉnh sửa note. */}
      <NoteFormFields key={note?.id || 'new'} note={note} onClose={onClose} onSubmit={onSubmit} />
    </div>
  );
}

export default NoteFormModal;