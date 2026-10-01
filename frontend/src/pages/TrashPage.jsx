import { useEffect, useState } from 'react';
import { AlertTriangle, RotateCcw, Trash2 } from 'lucide-react';
import { useConfirm } from '../context/ConfirmContext';
import { useNotes } from '../context/NoteContext';
import { noteService } from '../services/noteService';
import { topicService } from '../services/topicService';
import { getRichTextPlainText } from '../utils/richText';
import LoadingSpinner from '../components/common/LoadingSpinner';
import Toast from '../components/common/Toast';

function formatDeletedDate(value) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return 'Không rõ thời gian';
  return new Intl.DateTimeFormat('vi-VN', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(date);
}

export default function TrashPage({ searchQuery = '' }) {
  const { topics, refreshTopics } = useNotes();
  const { confirm } = useConfirm();
  const [notes, setNotes] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [busyKey, setBusyKey] = useState('');
  const [reloadKey, setReloadKey] = useState(0);
  const [toast, setToast] = useState(null);

  useEffect(() => {
    let isCurrent = true;
    noteService.getTrashNotes()
      .then((result) => {
        if (isCurrent) setNotes(Array.isArray(result) ? result : []);
      })
      .catch((requestError) => {
        if (isCurrent) setError(requestError.message || 'Không thể tải thùng rác.');
      })
      .finally(() => {
        if (isCurrent) setIsLoading(false);
      });

    return () => {
      isCurrent = false;
    };
  }, [reloadKey]);

  const normalizedSearch = searchQuery.trim().toLocaleLowerCase('vi');
  const visibleNotes = notes.filter((note) => {
    if (!normalizedSearch) return true;
    const content = getRichTextPlainText(note.content || '');
    return `${note.title || ''} ${content}`.toLocaleLowerCase('vi').includes(normalizedSearch);
  });

  const restoreItem = async (item) => {
    const key = item.type === 'topic' ? `topic:${item.slug}` : `${item.topicSlug}:${item.id}`;
    setBusyKey(key);
    try {
      if (item.type === 'topic') {
        await topicService.restoreTopic(item.slug);
        await refreshTopics();
      } else {
        await noteService.restoreNote(item.topicSlug, item.id);
      }
      setNotes((current) => current.filter((entry) => (
        item.type === 'topic'
          ? entry.type !== 'topic' || entry.slug !== item.slug
          : entry.id !== item.id || entry.topicSlug !== item.topicSlug
      )));
      setToast({
        message: item.type === 'topic' ? 'Đã khôi phục chủ đề và các ghi chú bên trong.' : 'Đã khôi phục ghi chú về chủ đề ban đầu.',
        type: 'success',
      });
    } catch (requestError) {
      setToast({ message: requestError.message || 'Không thể khôi phục ghi chú.', type: 'error' });
    } finally {
      setBusyKey('');
    }
  };

  const permanentlyDeleteItem = async (item) => {
    const isTopic = item.type === 'topic';
    const isConfirmed = await confirm({
      title: isTopic ? 'Xóa vĩnh viễn chủ đề' : 'Xóa vĩnh viễn ghi chú',
      message: isTopic
        ? `Chủ đề "${item.title}" và ${item.noteCount} ghi chú bên trong sẽ bị xóa vĩnh viễn, không thể khôi phục.`
        : `Ghi chú "${item.title}" sẽ bị xóa khỏi thiết bị và không thể khôi phục.`,
      confirmText: 'Xóa vĩnh viễn',
      cancelText: 'Hủy',
      type: 'danger',
    });
    if (!isConfirmed) return;

    const key = isTopic ? `topic:${item.slug}` : `${item.topicSlug}:${item.id}`;
    setBusyKey(key);
    try {
      if (isTopic) {
        await topicService.permanentlyDeleteTopic(item.slug);
        await refreshTopics();
      } else {
        await noteService.permanentlyDeleteNote(item.topicSlug, item.id);
      }
      setNotes((current) => current.filter((entry) => (
        isTopic
          ? entry.type !== 'topic' || entry.slug !== item.slug
          : entry.id !== item.id || entry.topicSlug !== item.topicSlug
      )));
      setToast({
        message: isTopic ? 'Đã xóa vĩnh viễn chủ đề và ghi chú bên trong.' : 'Đã xóa ghi chú vĩnh viễn.',
        type: 'success',
      });
    } catch (requestError) {
      setToast({ message: requestError.message || 'Không thể xóa ghi chú.', type: 'error' });
    } finally {
      setBusyKey('');
    }
  };

  const emptyTrash = async () => {
    const isConfirmed = await confirm({
      title: 'Dọn sạch thùng rác',
          message: `Xóa vĩnh viễn tất cả ${notes.length} mục trong thùng rác? Không thể hoàn tác thao tác này.`,
      confirmText: 'Dọn sạch',
      cancelText: 'Hủy',
      type: 'danger',
    });
    if (!isConfirmed) return;

    setBusyKey('empty');
    try {
      await noteService.emptyTrash();
      setNotes([]);
      setToast({ message: 'Đã dọn sạch thùng rác.', type: 'success' });
    } catch (requestError) {
      setToast({ message: requestError.message || 'Không thể dọn thùng rác.', type: 'error' });
    } finally {
      setBusyKey('');
    }
  };

  return (
    <section className="mx-auto w-full max-w-5xl space-y-6" aria-labelledby="trash-heading">
      <header className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-200 pb-5 dark:border-slate-800">
        <div>
          <div className="flex items-center gap-2 text-rose-600 dark:text-rose-400">
            <Trash2 size={20} aria-hidden="true" />
            <h1 id="trash-heading" className="text-2xl font-bold text-slate-800 dark:text-slate-100">Thùng rác</h1>
          </div>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
            {notes.length} mục đang chờ xử lý
          </p>
        </div>
        <button
          type="button"
          onClick={emptyTrash}
          disabled={notes.length === 0 || Boolean(busyKey)}
          className="inline-flex h-10 items-center gap-2 rounded-lg border border-rose-200 px-3 text-sm font-semibold text-rose-700 transition hover:bg-rose-50 disabled:cursor-not-allowed disabled:opacity-50 dark:border-rose-900/60 dark:text-rose-300 dark:hover:bg-rose-950/40"
        >
          <Trash2 size={16} aria-hidden="true" />
          Dọn sạch thùng rác
        </button>
      </header>

      {error && (
        <div role="alert" className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-800 dark:border-rose-900/60 dark:bg-rose-950/30 dark:text-rose-200">
          <span>{error}</span>
          <button
            type="button"
            onClick={() => {
              setIsLoading(true);
              setError('');
              setReloadKey((key) => key + 1);
            }}
            className="font-semibold underline"
          >Thử lại</button>
        </div>
      )}

      {isLoading ? (
        <div className="flex min-h-[35vh] items-center justify-center" role="status" aria-label="Đang tải thùng rác">
          <LoadingSpinner size="lg" className="text-primary" />
        </div>
      ) : error ? null : visibleNotes.length ? (
        <div className="divide-y divide-slate-200 dark:divide-slate-800">
          {visibleNotes.map((note) => {
            const isTopic = note.type === 'topic';
            const key = isTopic ? `topic:${note.slug}` : `${note.topicSlug}:${note.id}`;
            const topicName = topics.find((topic) => topic.slug === note.topicSlug)?.name || note.topicSlug;
            const preview = getRichTextPlainText(note.content || '');
            return (
              <article key={key} className="flex flex-col gap-4 py-5 sm:flex-row sm:items-center sm:justify-between">
                <div className="min-w-0 flex-1">
                  <h2 className="truncate text-base font-semibold text-slate-800 dark:text-slate-100">{note.title || 'Ghi chú không tiêu đề'}</h2>
                  {isTopic ? (
                    <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">{note.noteCount} ghi chú bên trong</p>
                  ) : preview ? (
                    <p className="mt-1 line-clamp-2 text-sm text-slate-500 dark:text-slate-400">{preview}</p>
                  ) : null}
                  <p className="mt-2 text-xs text-slate-500 dark:text-slate-400">
                    {isTopic ? 'Chủ đề' : topicName} <span className="px-1 text-slate-300">·</span> Đã xóa {formatDeletedDate(note.deletedAt)}
                  </p>
                </div>
                <div className="flex shrink-0 items-center gap-2">
                  <button
                    type="button"
                    onClick={() => restoreItem(note)}
                    disabled={Boolean(busyKey)}
                    title="Khôi phục ghi chú"
                    className="inline-flex h-9 items-center gap-2 rounded-lg border border-slate-200 px-3 text-sm font-medium text-slate-700 transition hover:border-emerald-300 hover:bg-emerald-50 hover:text-emerald-700 disabled:opacity-50 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-emerald-950/30 dark:hover:text-emerald-300"
                  >
                    <RotateCcw size={15} aria-hidden="true" />
                    {isTopic ? 'Khôi phục chủ đề' : 'Khôi phục'}
                  </button>
                  <button
                    type="button"
                    onClick={() => permanentlyDeleteItem(note)}
                    disabled={Boolean(busyKey)}
                    title="Xóa vĩnh viễn"
                    aria-label={`Xóa vĩnh viễn ${isTopic ? 'chủ đề' : ''} ${note.title}`}
                    className="grid size-9 place-items-center rounded-lg text-slate-400 transition hover:bg-rose-50 hover:text-rose-600 disabled:opacity-50 dark:hover:bg-rose-950/40 dark:hover:text-rose-300"
                  >
                    <Trash2 size={16} aria-hidden="true" />
                  </button>
                </div>
              </article>
            );
          })}
        </div>
      ) : (
        <div className="flex min-h-[38vh] flex-col items-center justify-center px-4 text-center">
          <div className="mb-4 grid size-14 place-items-center rounded-xl bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-300">
            {normalizedSearch ? <AlertTriangle size={24} aria-hidden="true" /> : <Trash2 size={24} aria-hidden="true" />}
          </div>
          <h2 className="text-base font-semibold text-slate-800 dark:text-slate-100">
            {normalizedSearch ? 'Không tìm thấy ghi chú phù hợp' : 'Thùng rác đang trống'}
          </h2>
          <p className="mt-1 max-w-sm text-sm text-slate-500 dark:text-slate-400">
            {normalizedSearch ? 'Thử từ khóa khác.' : 'Ghi chú và chủ đề bạn xóa sẽ xuất hiện ở đây và có thể được khôi phục.'}
          </p>
        </div>
      )}

      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
    </section>
  );
}