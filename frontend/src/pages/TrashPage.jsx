import React, { useCallback, useEffect, useState } from 'react';
import { ArchiveRestore, Clock3, RotateCcw, AlertTriangle } from 'lucide-react';
import { useConfirm } from '../context/ConfirmContext';
import { useNotes } from '../context/NoteContext';
import Button from '../components/common/Button';
import LoadingSpinner from '../components/common/LoadingSpinner';
import Toast from '../components/common/Toast';
import { trashService } from '../services/trashService';

const emptyItems = () => ({ deletedTopics: [], deletedNotes: [] });

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
  const data = response?.data ?? response;
  if (
    !data ||
    !Array.isArray(data.deletedTopics) ||
    !Array.isArray(data.deletedNotes)
  ) {
    throw new Error('Dữ liệu thùng rác không hợp lệ');
  }
  return data;
}

export default function TrashPage() {
  const { confirm } = useConfirm();
  const { refreshTopics } = useNotes();
  const [items, setItems] = useState(emptyItems);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState('');
  const [toast, setToast] = useState(null);
  
  const itemCount = items.deletedTopics.length + items.deletedNotes.length;

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

  useEffect(() => {
    let isCurrent = true;
    fetchTrashItems()
      .then((data) => {
        if (isCurrent) setItems(data);
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

  const retryLoadItems = () => {
    setLoading(true);
    setLoadError('');
    loadItems();
  };

  const handleRestore = async (entry, type) => {
    try {
      if (type === 'topic') {
        await trashService.restoreTopic(entry.slug);
      } else {
        await trashService.restoreNote(entry.id);
      }
      const collection = type === 'topic' ? 'deletedTopics' : 'deletedNotes';
      setItems((current) => ({
        ...current,
        [collection]: current[collection].filter((item) => item.id !== entry.id),
      }));
      await refreshTopics();
      setToast({
        type: 'success',
        message: type === 'topic' ? 'Đã khôi phục chủ đề.' : 'Đã khôi phục ghi chú.',
      });
    } catch (error) {
      setToast({ type: 'error', message: error.message || 'Không thể khôi phục mục này.' });
    }
  };

  const handlePermanentlyDelete = async (entry, type) => {
    const title = type === 'topic'
      ? entry.name || entry.topic?.name || 'Chủ đề'
      : entry.note?.title || 'Ghi chú';
    const accepted = await confirm({
      title: 'Xóa vĩnh viễn',
      message: `Bạn có chắc muốn xóa vĩnh viễn "${title}"? Thao tác này không thể hoàn tác.`,
      confirmText: 'Xóa vĩnh viễn',
      cancelText: 'Hủy',
      type: 'danger',
    });
    if (!accepted) return;

    try {
      await trashService.permanentlyDeleteItem(type, entry.id);
      const collection = type === 'topic' ? 'deletedTopics' : 'deletedNotes';
      setItems((current) => ({
        ...current,
        [collection]: current[collection].filter((item) => item.id !== entry.id),
      }));
      setToast({ type: 'success', message: 'Đã xóa vĩnh viễn.' });
    } catch (error) {
      setToast({ type: 'error', message: error.message || 'Không thể xóa mục này.' });
    }
  };

  const handleEmptyAll = async () => {
    const accepted = await confirm({
      title: 'Làm trống thùng rác',
      message: `Bạn có chắc muốn xóa vĩnh viễn toàn bộ ${itemCount} mục trong Thùng rác? Thao tác này không thể hoàn tác.`,
      confirmText: 'Xóa tất cả',
      cancelText: 'Hủy',
      type: 'danger',
    });
    if (!accepted) return;

    try {
      await trashService.emptyAll();
      setItems(emptyItems());
      setToast({ type: 'success', message: 'Đã làm trống thùng rác.' });
    } catch (error) {
      setToast({ type: 'error', message: error.message || 'Không thể làm trống thùng rác.' });
    }
  };

  const renderSection = (type, entries) => {
    const isTopic = type === 'topic';
    const heading = isTopic ? 'Chủ đề đã xóa' : 'Ghi chú đã xóa';
    
    return (
      <section className="space-y-4" aria-labelledby={`${type}-trash-heading`}>
        <div className="flex items-center gap-3 border-b border-slate-200 pb-2 dark:border-slate-800">
          <div className="rounded-lg bg-slate-100 p-1.5 text-slate-500 dark:bg-slate-800 dark:text-slate-400">
            {isTopic ? (
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M4 20h16a2 2 0 0 0 2-2V8a2 2 0 0 0-2-2h-7.93a2 2 0 0 1-1.66-.9l-.82-1.2A2 2 0 0 0 7.93 3H4a2 2 0 0 0-2 2v13c0 1.1.9 2 2 2Z"/><path d="M12 10v6"/><path d="m9 13 3-3 3 3"/></svg>
            ) : (
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14 3v4a1 1 0 0 0 1 1h4"/><path d="M11.5 21h-4.5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h7l5 5v5"/><path d="m15 22 5-5"/><path d="m15 17 5 5"/></svg>
            )}
          </div>
          <h2 id={`${type}-trash-heading`} className="text-sm font-semibold uppercase tracking-wider text-slate-700 dark:text-slate-300">
            {heading} <span className="ml-1 text-xs font-medium text-slate-400">({entries.length})</span>
          </h2>
        </div>

        {entries.length === 0 ? (
          <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-slate-200 bg-slate-50/50 py-10 dark:border-slate-800 dark:bg-slate-900/50">
            <ArchiveRestore size={32} className="mb-3 text-slate-300 dark:text-slate-700" strokeWidth={1.5} />
            <p className="text-sm text-slate-500 dark:text-slate-400">
              Không có {isTopic ? 'chủ đề' : 'ghi chú'} nào trong thùng rác.
            </p>
          </div>
        ) : (
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {entries.map((entry) => {
              const title = isTopic
                ? entry.name || entry.topic?.name || 'Chủ đề'
                : entry.note?.title || 'Ghi chú';
              const subtitle = isTopic
                ? `${entry.noteCount ?? 0} ghi chú liên quan`
                : entry.originalTopicName || entry.originalTopicSlug || 'Chủ đề không xác định';

              return (
                <article
                  key={entry.id}
                  className="group flex flex-col justify-between rounded-xl border border-slate-200 bg-white p-4 shadow-sm transition hover:border-slate-300 dark:border-slate-800 dark:bg-slate-900 dark:hover:border-slate-700"
                >
                  <div className="mb-4 min-w-0">
                    <div className="mb-2 flex items-start justify-between gap-2">
                      <h3 className="truncate font-semibold text-slate-800 dark:text-slate-100">{title}</h3>
                      {isTopic && (
                        <span className="shrink-0 rounded-md bg-blue-50 px-1.5 py-0.5 text-[10px] font-medium text-blue-600 dark:bg-blue-900/30 dark:text-blue-400">
                          Chủ đề
                        </span>
                      )}
                    </div>
                    <p className="truncate text-xs text-slate-500 dark:text-slate-400">{subtitle}</p>
                    <p className="mt-2 flex items-center gap-1.5 text-[11px] text-slate-400">
                      <Clock3 size={12} aria-hidden="true" />
                      {formatDeletedAt(entry.deletedAt)}
                    </p>
                  </div>

                  {/* Dồn 2 nút bấm sang bên phải (justify-end) để không gian trượt được tự nhiên */}
                  <div className="mt-auto flex items-center justify-end gap-2 pt-3 border-t border-slate-100 dark:border-slate-800/80">
                    
                    {/* --- Nút Animated Restore (Trượt ngang) --- */}
                    <button
                      type="button"
                      className="btn-restore shrink-0"
                      onClick={() => handleRestore(entry, type)}
                      title="Khôi phục"
                    >
                      <span className="restore-text">Khôi phục</span>
                      <span className="restore-icon">
                        <RotateCcw size={13} strokeWidth={2.5} />
                      </span>
                    </button>

                    {/* --- Nút Animated Delete (Thùng rác mở nắp) --- */}
                    <button
                      type="button"
                      className="bin-button shrink-0"
                      onClick={() => handlePermanentlyDelete(entry, type)}
                      title="Xóa vĩnh viễn"
                    >
                      <svg
                        className="bin-top"
                        viewBox="0 0 39 7"
                        fill="none"
                        xmlns="http://www.w3.org/2000/svg"
                      >
                        <line y1="5" x2="39" y2="5" stroke="white" strokeWidth="4"></line>
                        <line x1="12" y1="1.5" x2="26.0357" y2="1.5" stroke="white" strokeWidth="3"></line>
                      </svg>
                      
                      <svg
                        className="bin-bottom"
                        viewBox="0 0 33 39"
                        fill="none"
                        xmlns="http://www.w3.org/2000/svg"
                      >
                        <mask id={`mask-bin-${entry.id}`} fill="white">
                          <path d="M0 0H33V35C33 37.2091 31.2091 39 29 39H4C1.79086 39 0 37.2091 0 35V0Z"></path>
                        </mask>
                        <path
                          d="M0 0H33H0ZM37 35C37 39.4183 33.4183 43 29 43H4C-0.418278 43 -4 39.4183 -4 35H4H29H37ZM4 43C-0.418278 43 -4 39.4183 -4 35V0H4V35V43ZM37 0V35C37 39.4183 33.4183 43 29 43V35V0H37Z"
                          fill="white"
                          mask={`url(#mask-bin-${entry.id})`}
                        ></path>
                        <path d="M12 6L12 29" stroke="white" strokeWidth="4"></path>
                        <path d="M21 6V29" stroke="white" strokeWidth="4"></path>
                      </svg>
                    </button>
                    
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </section>
    );
  };

  return (
    <section className="mx-auto w-full max-w-5xl space-y-8" aria-labelledby="trash-heading">
      
      <header className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between border-b border-slate-200 pb-5 dark:border-slate-800">
        <div>
          <div className="flex items-center gap-3 mb-1">
            <h1 id="trash-heading" className="text-2xl font-bold tracking-tight text-slate-800 dark:text-slate-100">
              Thùng rác
            </h1>
            <span className="rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-semibold text-slate-600 dark:bg-slate-800 dark:text-slate-300">
              {itemCount} mục
            </span>
          </div>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            Lưu trữ độc lập các chủ đề và ghi chú đã xóa. Bạn có thể khôi phục hoặc dọn dẹp vĩnh viễn.
          </p>
        </div>

        <Button
          variant="danger"
          disabled={itemCount === 0 || loading}
          onClick={handleEmptyAll}
          className="shrink-0"
        >
          <AlertTriangle size={16} aria-hidden="true" />
          Làm rỗng thùng rác
        </Button>
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
      ) : loadError ? null : (
        <div className="space-y-10">
          {renderSection('topic', items.deletedTopics)}
          {renderSection('note', items.deletedNotes)}
        </div>
      )}

      {toast && <Toast {...toast} onClose={() => setToast(null)} />}
    </section>
  );
}
