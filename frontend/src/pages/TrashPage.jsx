import React, { useCallback, useEffect, useState } from 'react';
import { ArchiveRestore, Clock3, RotateCcw, Trash2 } from 'lucide-react';
import { useConfirm } from '../context/ConfirmContext';
import { useNotes } from '../context/NoteContext';
import Button from '../components/common/Button';
import LoadingSpinner from '../components/common/LoadingSpinner';
import Toast from '../components/common/Toast';
import { trashService } from '../services/trashService';

function getEntryTitle(entry) {
  return entry.type === 'topic' ? entry.topic?.name || 'Chủ đề' : entry.note?.title || 'Ghi chú';
}

function formatDeletedAt(value) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return 'Không rõ thời gian xóa';
  return new Intl.DateTimeFormat('vi-VN', {
    dateStyle: 'short',
    timeStyle: 'short',
  }).format(date);
}

async function fetchTrashItems() {
  const response = await trashService.getItems();
  const entries = response?.data || response;
  if (!Array.isArray(entries)) throw new Error('Dữ liệu thùng rác không hợp lệ');
  return entries;
}

export default function TrashPage() {
  const { confirm } = useConfirm();
  const { refreshTopics } = useNotes();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState('');
  const [toast, setToast] = useState(null);

  const loadItems = useCallback(async () => {
    try {
      setItems(await fetchTrashItems());
      setLoadError('');
    } catch (error) {
      setLoadError(error.message || 'Không thể tải thùng rác');
    } finally {
      setLoading(false);
    }
  }, []);

  const retryLoadItems = () => {
    setLoading(true);
    setLoadError('');
    loadItems();
  };

  useEffect(() => {
    let isCurrent = true;
    fetchTrashItems()
      .then((entries) => {
        if (isCurrent) setItems(entries);
      })
      .catch((error) => {
        if (isCurrent) setLoadError(error.message || 'Không thể tải thùng rác');
      })
      .finally(() => {
        if (isCurrent) setLoading(false);
      });
    return () => {
      isCurrent = false;
    };
  }, []);

  const handleRestore = async (entry) => {
    try {
      await trashService.restoreItem(entry.id);
      setItems((current) => current.filter((item) => item.id !== entry.id));
      if (entry.type === 'topic') await refreshTopics();
      setToast({ type: 'success', message: 'Đã khôi phục thành công.' });
    } catch (error) {
      setToast({ type: 'error', message: error.message || 'Không thể khôi phục mục này.' });
    }
  };

  const handlePermanentlyDelete = async (entry) => {
    const title = getEntryTitle(entry);
    const accepted = await confirm({
      title: 'Xóa vĩnh viễn',
      message: `Bạn có chắc muốn xóa vĩnh viễn "${title}"? Thao tác này không thể hoàn tác.`,
      confirmText: 'Xóa vĩnh viễn',
      cancelText: 'Hủy',
      type: 'danger',
    });
    if (!accepted) return;

    try {
      await trashService.permanentlyDeleteItem(entry.id);
      setItems((current) => current.filter((item) => item.id !== entry.id));
      setToast({ type: 'success', message: 'Đã xóa vĩnh viễn.' });
    } catch (error) {
      setToast({ type: 'error', message: error.message || 'Không thể xóa mục này.' });
    }
  };

  return (
    <section className="mx-auto w-full max-w-7xl space-y-6" aria-labelledby="trash-heading">
      <header className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 id="trash-heading" className="text-2xl font-bold text-slate-800 dark:text-slate-100">
            Thùng rác
          </h1>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
            Chủ đề đã xóa kèm ghi chú bên trong và ghi chú thường đã xóa được giữ tại đây.
          </p>
        </div>
        <span className="text-sm text-slate-500 dark:text-slate-400">
          {items.length} mục
        </span>
      </header>

      {loadError && (
        <div role="alert" className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-800 dark:border-rose-900/60 dark:bg-rose-950/30 dark:text-rose-200">
          <span>{loadError}</span>
          <Button variant="outline" size="sm" onClick={retryLoadItems}>Thử lại</Button>
        </div>
      )}

      {loading ? (
        <div className="flex min-h-[40vh] items-center justify-center" role="status" aria-label="Đang tải thùng rác">
          <LoadingSpinner size="lg" className="text-primary" />
        </div>
      ) : loadError ? null : items.length === 0 ? (
        <div className="flex min-h-[42vh] flex-col items-center justify-center px-4 py-10 text-center">
          <div className="mb-5 grid size-16 place-items-center rounded-2xl bg-primary/10 text-primary">
            <ArchiveRestore size={30} aria-hidden="true" />
          </div>
          <h2 className="text-lg font-semibold text-slate-800 dark:text-slate-100">Thùng rác đang trống</h2>
          <p className="mt-2 max-w-sm text-sm leading-6 text-slate-500 dark:text-slate-400">
            Chủ đề và ghi chú thường bạn xóa sẽ xuất hiện tại đây để khôi phục hoặc xóa vĩnh viễn.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {items.map((entry) => {
            const isTopic = entry.type === 'topic';
            const title = getEntryTitle(entry);
            const subtitle = isTopic
              ? `${Array.isArray(entry.notes) ? entry.notes.length : 0} ghi chú trong chủ đề`
              : `Chủ đề: ${entry.topicName || entry.topicSlug}`;

            return (
              <article
                key={entry.id}
                className="flex flex-col gap-4 rounded-2xl border border-slate-200/80 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900 sm:flex-row sm:items-center sm:justify-between"
              >
                <div className="flex min-w-0 items-start gap-3">
                  <div className="mt-0.5 rounded-xl bg-slate-100 p-2.5 text-slate-500 dark:bg-slate-800 dark:text-slate-300">
                    {isTopic ? <ArchiveRestore size={18} /> : <Trash2 size={18} />}
                  </div>
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <h2 className="truncate text-sm font-semibold text-slate-800 dark:text-slate-100">{title}</h2>
                      <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-medium text-slate-500 dark:bg-slate-800 dark:text-slate-300">
                        {isTopic ? 'Chủ đề' : 'Ghi chú'}
                      </span>
                    </div>
                    <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">{subtitle}</p>
                    <p className="mt-1 flex items-center gap-1 text-[11px] text-slate-400">
                      <Clock3 size={12} aria-hidden="true" />
                      Đã xóa {formatDeletedAt(entry.deletedAt)}
                    </p>
                  </div>
                </div>

                <div className="flex shrink-0 justify-end gap-2">
                  <Button size="sm" variant="outline" onClick={() => handleRestore(entry)}>
                    <RotateCcw size={14} aria-hidden="true" />
                    Khôi phục
                  </Button>
                  <Button size="sm" variant="danger" onClick={() => handlePermanentlyDelete(entry)}>
                    <Trash2 size={14} aria-hidden="true" />
                    Xóa vĩnh viễn
                  </Button>
                </div>
              </article>
            );
          })}
        </div>
      )}

      {toast && <Toast {...toast} onClose={() => setToast(null)} />}
    </section>
  );
}
