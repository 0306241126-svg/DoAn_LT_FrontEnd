import React, { useEffect, useMemo, useState } from 'react';
import {
  Calendar,
  ChevronLeft,
  ChevronRight,
  Clipboard,
  Edit2,
  Pin,
  Trash2,
  X,
} from 'lucide-react';
import Button from '../common/Button';
import { getRichTextPlainText, sanitizeRichText } from '../../utils/richText';

function formatDate(value) {
  if (!value) return 'Chưa có thông tin';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return 'Chưa có thông tin';
  return new Intl.DateTimeFormat('vi-VN', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  }).format(date);
}

export default function NoteViewModal({
  note,
  topicName,
  isPinned,
  onTogglePin,
  onClose,
  onEdit,
  onDelete,
  onNavigate,
  canGoPrevious,
  canGoNext,
}) {
  const [copyMessage, setCopyMessage] = useState('');
  const plainText = useMemo(() => getRichTextPlainText(note?.content || ''), [note]);
  const safeContent = useMemo(() => sanitizeRichText(note?.content || ''), [note]);
  const wordCount = plainText ? plainText.split(/\s+/).filter(Boolean).length : 0;
  const readingTime = Math.max(1, Math.ceil(wordCount / 200));

  useEffect(() => {
    const handleKeyDown = (event) => {
      if (event.key === 'Escape') onClose();
      if (event.key === 'ArrowLeft' && canGoPrevious) onNavigate(-1);
      if (event.key === 'ArrowRight' && canGoNext) onNavigate(1);
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [canGoNext, canGoPrevious, onClose, onNavigate]);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(plainText);
      setCopyMessage('Đã sao chép');
      window.setTimeout(() => setCopyMessage(''), 1800);
    } catch (error) {
      console.error('Không thể sao chép nội dung ghi chú:', error);
      setCopyMessage('Không thể sao chép');
      window.setTimeout(() => setCopyMessage(''), 2500);
    }
  };

  if (!note) return null;

  const stopAndRun = (event, callback) => {
    event.stopPropagation();
    callback();
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/65 p-3 backdrop-blur-sm sm:p-6"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <section
        role="dialog"
        aria-modal="true"
        aria-labelledby="full-note-title"
        className="flex max-h-[90vh] w-full max-w-3xl flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl dark:border-slate-700/80 dark:bg-slate-900"
      >
        <header className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 px-5 py-4 dark:border-slate-800 sm:px-7">
          <div className="min-w-0">
            {topicName && (
              <span className="inline-flex max-w-full truncate rounded-full bg-primary/10 px-2.5 py-1 text-xs font-semibold text-primary">
                {topicName}
              </span>
            )}
          </div>
          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={handleCopy}
              title="Sao chép nội dung"
              aria-label="Sao chép nội dung"
              className="flex h-9 min-w-9 items-center justify-center gap-1.5 rounded-lg px-2 text-slate-500 transition hover:bg-slate-100 hover:text-primary dark:text-slate-300 dark:hover:bg-slate-800"
            >
              <Clipboard size={16} />
              {copyMessage && <span className="text-xs">{copyMessage}</span>}
            </button>
            {onTogglePin && (
              <button
                type="button"
                onClick={() => onTogglePin(note)}
                aria-label={isPinned ? 'Bỏ ghim ghi chú' : 'Ghim ghi chú'}
                aria-pressed={isPinned}
                title={isPinned ? 'Bỏ ghim' : 'Ghim ghi chú'}
                className={`flex h-9 w-9 items-center justify-center rounded-lg transition ${
                  isPinned
                    ? 'bg-primary/10 text-primary'
                    : 'text-slate-500 hover:bg-slate-100 hover:text-primary dark:text-slate-300 dark:hover:bg-slate-800'
                }`}
              >
                <Pin size={16} className={isPinned ? 'fill-current' : ''} />
              </button>
            )}
            <button
              type="button"
              onClick={() => onEdit(note)}
              title="Chỉnh sửa ghi chú"
              aria-label="Chỉnh sửa ghi chú"
              className="flex h-9 w-9 items-center justify-center rounded-lg text-slate-500 transition hover:bg-primary/10 hover:text-primary dark:text-slate-300"
            >
              <Edit2 size={16} />
            </button>
            <button
              type="button"
              onClick={() => onDelete(note.id, note.topicSlug)}
              title="Xóa ghi chú"
              aria-label="Xóa ghi chú"
              className="flex h-9 w-9 items-center justify-center rounded-lg text-slate-500 transition hover:bg-rose-50 hover:text-rose-500 dark:text-slate-300 dark:hover:bg-rose-950/40"
            >
              <Trash2 size={16} />
            </button>
            <button
              type="button"
              onClick={onClose}
              title="Đóng"
              aria-label="Đóng"
              className="flex h-9 w-9 items-center justify-center rounded-lg text-slate-500 transition hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800"
            >
              <X size={18} />
            </button>
          </div>
        </header>

        <div className="overflow-y-auto px-5 py-6 sm:px-10 sm:py-8">
          <h1 id="full-note-title" className="mb-5 text-2xl font-bold leading-tight text-slate-900 dark:text-slate-100 sm:text-3xl">
            {note.title}
          </h1>

          <div className="mb-7 flex flex-wrap gap-x-5 gap-y-2 border-b border-slate-100 pb-5 text-xs text-slate-500 dark:border-slate-800 dark:text-slate-400">
            <span className="inline-flex items-center gap-1.5">
              <Calendar size={14} />
              Tạo {formatDate(note.createdAt)}
            </span>
            {note.updatedAt && note.updatedAt !== note.createdAt && (
              <span>Cập nhật {formatDate(note.updatedAt)}</span>
            )}
            <span>{wordCount} từ · {plainText.length} ký tự · {readingTime} phút đọc</span>
          </div>

          {plainText ? (
            <div
              className="note-rich-full-content min-h-32 whitespace-pre-wrap break-words text-base leading-8 text-slate-700 dark:text-slate-200 [&_a]:text-primary [&_a]:underline [&_blockquote]:my-5 [&_blockquote]:border-l-4 [&_blockquote]:border-primary [&_blockquote]:pl-4 [&_blockquote]:italic [&_code]:rounded [&_code]:bg-slate-100 [&_code]:px-1 [&_code]:py-0.5 [&_h1]:my-5 [&_h1]:text-3xl [&_h1]:font-bold [&_h2]:my-4 [&_h2]:text-2xl [&_h2]:font-bold [&_h3]:my-3 [&_h3]:text-xl [&_h3]:font-semibold [&_li]:my-1 [&_ol]:my-4 [&_ol]:list-decimal [&_ol]:pl-7 [&_pre]:my-5 [&_pre]:overflow-x-auto [&_pre]:rounded-xl [&_pre]:bg-slate-100 [&_pre]:p-4 [&_pre]:font-mono [&_pre]:text-sm dark:[&_pre]:bg-slate-950 [&_ul]:my-4 [&_ul]:list-disc [&_ul]:pl-7"
              dangerouslySetInnerHTML={{ __html: safeContent }}
            />
          ) : (
            <p className="py-12 text-center text-sm italic text-slate-400">Ghi chú này chưa có nội dung.</p>
          )}
        </div>

        <footer className="flex items-center justify-between border-t border-slate-200 px-5 py-3 dark:border-slate-800 sm:px-7">
          <Button
            variant="secondary"
            size="sm"
            disabled={!canGoPrevious}
            onClick={(event) => stopAndRun(event, () => onNavigate(-1))}
          >
            <ChevronLeft size={15} />
            Trước
          </Button>
          <span className="hidden text-xs text-slate-400 sm:block">← / → để chuyển ghi chú · Esc để đóng</span>
          <Button
            variant="secondary"
            size="sm"
            disabled={!canGoNext}
            onClick={(event) => stopAndRun(event, () => onNavigate(1))}
          >
            Sau
            <ChevronRight size={15} />
          </Button>
        </footer>
      </section>
    </div>
  );
}
