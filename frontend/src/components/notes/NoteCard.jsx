import React from 'react';
import { Calendar, Edit2, Pin, Trash2 } from 'lucide-react';
import { getRichTextPlainText } from '../../utils/richText';

const accentClasses = [
  'bg-cyan-500/10 text-cyan-700 dark:text-cyan-300',
  'bg-violet-500/10 text-violet-700 dark:text-violet-300',
  'bg-amber-500/10 text-amber-700 dark:text-amber-300',
  'bg-emerald-500/10 text-emerald-700 dark:text-emerald-300',
  'bg-rose-500/10 text-rose-700 dark:text-rose-300',
];

function getAccentIndex(slug = '') {
  return [...slug].reduce((hash, char) => hash + char.charCodeAt(0), 0) % accentClasses.length;
}

function formatDate(isoString) {
  if (!isoString) return '';
  const date = new Date(isoString);
  if (Number.isNaN(date.getTime())) return '';

  const datePart = new Intl.DateTimeFormat('vi-VN', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  }).format(date);
  const timePart = new Intl.DateTimeFormat('vi-VN', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  }).format(date);

  return `${datePart} · ${timePart}`;
}

export default function NoteCard({
  note,
  onEdit,
  onDelete,
  onOpen,
  topicName,
  showTopicBadge = false,
  isPinned = false,
  onTogglePin,
  viewMode = 'grid',
}) {
  const accentClass = accentClasses[getAccentIndex(note.topicSlug)];
  const isList = viewMode === 'list';
  const hasContent = getRichTextPlainText(note.content || '').length > 0;
  const previewContent = hasContent ? getRichTextPlainText(note.content) : '';
  const openNote = () => onOpen?.(note);
  const handleCardKeyDown = (event) => {
    if (event.target !== event.currentTarget) return;
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      openNote();
    }
  };
  const stopCardClick = (event) => event.stopPropagation();

  return (
    <article
      role={onOpen ? 'group' : undefined}
      tabIndex={onOpen ? 0 : undefined}
      aria-label={onOpen ? `Mở ghi chú ${note.title}` : undefined}
      onClick={onOpen ? openNote : undefined}
      onKeyDown={onOpen ? handleCardKeyDown : undefined}
      className={`group relative flex min-w-0 overflow-hidden rounded-2xl border bg-white dark:bg-slate-900 transition-all duration-200 hover:-translate-y-1 hover:border-primary/30 hover:shadow-md hover:shadow-primary/5 ${
        onOpen ? 'cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50' : ''
      } ${
        isPinned
          ? 'border-primary/30 shadow-sm shadow-primary/5'
          : 'border-slate-200/80 dark:border-slate-800'
      } ${isList ? 'flex-col gap-4 p-4 sm:flex-row sm:items-center sm:gap-6' : 'flex-col p-5'}`}
    >
      {note.topicSlug && (
        <span
          className={`absolute inset-y-4 left-0 w-[3px] rounded-r-full ${accentClass.split(' ')[0]}`}
          aria-hidden="true"
        />
      )}

      <div className={`min-w-0 flex-1 ${isList ? 'flex flex-col gap-2 sm:flex-row sm:items-center sm:gap-5' : ''}`}>
        <div className={`min-w-0 flex-1 ${isList ? 'sm:grid sm:grid-cols-[minmax(0,1fr)_minmax(0,1.2fr)] sm:items-center sm:gap-5' : ''}`}>
          <div className="mb-2 flex min-w-0 items-start justify-between gap-2">
            <h2 className="min-w-0 flex-1 truncate text-sm font-bold leading-8 text-slate-800 dark:text-slate-100">
              {note.title}
            </h2>
            {onTogglePin && (
              <button
                type="button"
                onClick={(event) => {
                  stopCardClick(event);
                  onTogglePin(note);
                }}
                aria-label={isPinned ? 'Bỏ ghim ghi chú' : 'Ghim ghi chú'}
                aria-pressed={isPinned}
                title={isPinned ? 'Bỏ ghim' : 'Ghim ghi chú'}
                className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg transition ${
                  isPinned
                    ? 'bg-primary/10 text-primary'
                    : 'text-slate-400 hover:bg-slate-100 hover:text-primary dark:hover:bg-slate-800'
                }`}
              >
                <Pin size={15} className={isPinned ? 'fill-current' : ''} />
              </button>
            )}
          </div>
          {showTopicBadge && topicName && (
            <div className="mb-2">
              <span className={`max-w-full truncate rounded-full px-2.5 py-1 text-[10px] font-semibold tracking-wide ${accentClass}`}>
                {topicName}
              </span>
            </div>
          )}
          {hasContent ? (
            <div className="relative">
              <p className="line-clamp-3 whitespace-pre-line text-xs leading-relaxed text-slate-500 dark:text-slate-400">
                {previewContent}
              </p>
              <div className="pointer-events-none absolute bottom-0 right-0 bg-gradient-to-l from-white via-white/90 to-transparent pl-8 pt-2 text-[11px] font-semibold text-primary dark:from-slate-900 dark:via-slate-900/90">
                Xem thêm →
              </div>
            </div>
          ) : (
            <p className="text-xs leading-relaxed">
              <span className="italic text-slate-400/80 dark:text-slate-500">Chưa có nội dung</span>
            </p>
          )}
        </div>
      </div>

      <footer
        className={`flex items-center justify-between gap-3 border-t border-slate-100 pt-3 text-xs text-slate-400 dark:border-slate-800 ${
          isList ? 'sm:w-56 sm:shrink-0 sm:border-l sm:border-t-0 sm:pl-5 sm:pt-0' : 'mt-5'
        }`}
      >
        <div className="flex min-w-0 items-center gap-1.5 whitespace-nowrap">
          <Calendar size={13} className="shrink-0" />
          <time dateTime={note.updatedAt || note.createdAt}>
            {formatDate(note.updatedAt || note.createdAt)}
          </time>
        </div>

        <div className="flex shrink-0 items-center gap-1 opacity-100 transition-opacity sm:opacity-0 sm:group-hover:opacity-100 sm:group-focus-within:opacity-100">
          <button
            type="button"
            onClick={(event) => {
              stopCardClick(event);
              onEdit(note);
            }}
            className="rounded-lg bg-slate-100 p-2 text-slate-500 transition hover:bg-primary/10 hover:text-primary dark:bg-slate-800 dark:text-slate-300"
            title="Sửa ghi chú"
            aria-label={`Sửa ghi chú ${note.title}`}
          >
            <Edit2 size={14} />
          </button>
          <button
            type="button"
            onClick={(event) => {
              stopCardClick(event);
              onDelete(note.id, note.topicSlug);
            }}
            className="rounded-lg bg-slate-100 p-2 text-slate-500 transition hover:bg-rose-50 hover:text-rose-500 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-rose-950/40"
            title="Xóa ghi chú"
            aria-label={`Xóa ghi chú ${note.title}`}
          >
            <Trash2 size={14} />
          </button>
        </div>
      </footer>
    </article>
  );
}
