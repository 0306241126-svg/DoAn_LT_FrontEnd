import React, { useState, useEffect, useCallback, useLayoutEffect, useMemo, useRef } from 'react';
import { createPortal } from 'react-dom';
import { ArrowDownWideNarrow, BookOpenText, Check, ChevronDown, LayoutGrid, List, Plus, ShieldAlert } from 'lucide-react';
import { useAuthPrivate } from '../context/AuthPrivateContext';
import { useConfirm } from '../context/ConfirmContext';
import { privateService } from '../services/privateService';
import PrivateLockModal from '../components/private/PrivateLockModal';
import NoteCard from '../components/notes/NoteCard';
import NoteFormModal from '../components/notes/NoteFormModal';
import NoteViewModal from '../components/notes/NoteViewModal';
import Button from '../components/common/Button';
import LoadingSpinner from '../components/common/LoadingSpinner';
import Toast from '../components/common/Toast';
import { getRichTextPlainText } from '../utils/richText';

const getPinKey = (note) => note.id;

function loadPinnedNotes(storageKey) {
  try {
    const savedPins = JSON.parse(localStorage.getItem(storageKey) || '[]');
    return new Set(Array.isArray(savedPins) ? savedPins.filter((key) => typeof key === 'string') : []);
  } catch (error) {
    return new Set();
  }
}

function normalizeSearchText(value) {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/đ/g, 'd')
    .replace(/Đ/g, 'D')
    .toLocaleLowerCase('vi');
}

export default function PrivateNotesPage({ searchQuery = '' }) {
  const { isUnlocked, privateDraftKey } = useAuthPrivate();
  const { confirm } = useConfirm();
  const pinStorageKey = `pinned-private-notes:${localStorage.getItem('app_username') || 'default_user'}`;
  
  const [notes, setNotes] = useState([]);
  const [loading, setLoading] = useState(false);
  const [pinnedKeys, setPinnedKeys] = useState(() => loadPinnedNotes(pinStorageKey));
  const [sortOrder, setSortOrder] = useState('newest');
  const [isSortMenuOpen, setIsSortMenuOpen] = useState(false);
  const [sortMenuPosition, setSortMenuPosition] = useState({ left: 0, top: 0 });
  const [viewMode, setViewMode] = useState('grid');
  const sortMenuRef = useRef(null);
  const sortButtonRef = useRef(null);
  const sortMenuContentRef = useRef(null);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingNote, setEditingNote] = useState(null);
  const [viewingNoteId, setViewingNoteId] = useState(null);
  const [toast, setToast] = useState(null);

  const normalizedSearchQuery = normalizeSearchText(searchQuery.trim());
  
  const sortedNotes = useMemo(() => notes
    .filter((note) => {
      if (!normalizedSearchQuery) return true;
      const searchableText = normalizeSearchText(`${note.title || ''} ${getRichTextPlainText(note.content || '')}`);
      return searchableText.includes(normalizedSearchQuery);
    })
    .sort((a, b) => {
      const aPinned = pinnedKeys.has(getPinKey(a));
      const bPinned = pinnedKeys.has(getPinKey(b));
      if (aPinned !== bPinned) return aPinned ? -1 : 1;

      if (sortOrder === 'title') {
        return (a.title || '').localeCompare(b.title || '', 'vi', { sensitivity: 'base' });
      }
      const aDate = new Date(a.updatedAt || a.createdAt || 0).getTime();
      const bDate = new Date(b.updatedAt || b.createdAt || 0).getTime();
      return sortOrder === 'oldest' ? aDate - bDate : bDate - aDate;
    }),
    [notes, normalizedSearchQuery, pinnedKeys, sortOrder]
  );
  
  const viewingNoteIndex = sortedNotes.findIndex((note) => note.id === viewingNoteId);
  const viewingNote = viewingNoteIndex >= 0 ? sortedNotes[viewingNoteIndex] : null;
  
  const navigateViewingNote = useCallback((direction) => {
    const nextNote = sortedNotes[viewingNoteIndex + direction];
    if (nextNote) setViewingNoteId(nextNote.id);
  }, [sortedNotes, viewingNoteIndex]);

  const fetchPrivateNotes = useCallback(async () => {
    if (!isUnlocked) return;
    setLoading(true);
    try {
      const data = await privateService.getPrivateNotes();
      setNotes(Array.isArray(data) ? data : []);
    } catch (err) {
      setToast({ type: 'error', message: err.message || 'Phiên bảo mật đã kết thúc' });
    } finally {
      setLoading(false);
    }
  }, [isUnlocked]);

  useEffect(() => {
    if (isUnlocked) fetchPrivateNotes();
  }, [isUnlocked, fetchPrivateNotes]);

  useEffect(() => {
    try {
      localStorage.setItem(pinStorageKey, JSON.stringify([...pinnedKeys]));
    } catch (error) {
      setToast({ type: 'error', message: 'Không thể lưu trạng thái ghim' });
    }
  }, [pinnedKeys, pinStorageKey]);

  const togglePin = (note) => {
    const key = getPinKey(note);
    setPinnedKeys((current) => {
      const next = new Set(current);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  };

  useEffect(() => {
    if (!isSortMenuOpen) return undefined;
    const closeOnOutsideClick = (event) => {
      if (!sortMenuRef.current?.contains(event.target) && !sortMenuContentRef.current?.contains(event.target)) {
        setIsSortMenuOpen(false);
      }
    };
    const closeOnEscape = (event) => {
      if (event.key === 'Escape') setIsSortMenuOpen(false);
    };
    document.addEventListener('mousedown', closeOnOutsideClick);
    document.addEventListener('keydown', closeOnEscape);
    return () => {
      document.removeEventListener('mousedown', closeOnOutsideClick);
      document.removeEventListener('keydown', closeOnEscape);
    };
  }, [isSortMenuOpen]);

  useLayoutEffect(() => {
    if (!isSortMenuOpen) return undefined;
    const updateSortMenuPosition = () => {
      const button = sortButtonRef.current;
      const menu = sortMenuContentRef.current;
      if (!button || !menu) return;

      const buttonRect = button.getBoundingClientRect();
      const menuRect = menu.getBoundingClientRect();
      const margin = 8;
      const left = Math.max(margin, Math.min(buttonRect.right - menuRect.width, window.innerWidth - menuRect.width - margin));
      const spaceBelow = window.innerHeight - buttonRect.bottom;
      const top = spaceBelow >= menuRect.height + 12 ? buttonRect.bottom + 8 : Math.max(margin, buttonRect.top - menuRect.height - 8);

      setSortMenuPosition({ left, top });
    };

    updateSortMenuPosition();
    window.addEventListener('resize', updateSortMenuPosition);
    window.addEventListener('scroll', updateSortMenuPosition, true);
    return () => {
      window.removeEventListener('resize', updateSortMenuPosition);
      window.removeEventListener('scroll', updateSortMenuPosition, true);
    };
  }, [isSortMenuOpen]);

  const handleSavePrivateNote = async ({ title, content }) => {
    try {
      if (editingNote) {
        await privateService.updatePrivateNote(editingNote.id, { title, content });
        setToast({ type: 'success', message: 'Cập nhật ghi chú mật thành công' });
      } else {
        await privateService.createPrivateNote({ title, content });
        setToast({ type: 'success', message: 'Tạo ghi chú mật thành công' });
      }
      fetchPrivateNotes();
    } catch (error) {
      throw error;
    }
  };

  const handleDeletePrivateNote = async (id) => {
    const isOk = await confirm({
      title: 'Xóa ghi chú riêng tư',
      message: 'Bạn có chắc chắn muốn xóa vĩnh viễn ghi chú bảo mật này không?',
      confirmText: 'Xóa vĩnh viễn',
      cancelText: 'Hủy',
      type: 'danger',
    });

    if (!isOk) return;

    try {
      await privateService.deletePrivateNote(id);
      setToast({ type: 'success', message: 'Đã xóa ghi chú riêng tư thành công' });
      setNotes((prev) => prev.filter((n) => n.id !== id));
      setViewingNoteId(null);
      return true;
    } catch (err) {
      setToast({ type: 'error', message: err.message || 'Lỗi khi xóa ghi chú' });
      return false;
    }
  };

  if (!isUnlocked) {
    return (
      <div className="relative h-full flex items-center justify-center">
        <div className="text-center text-slate-400">
          <ShieldAlert size={48} className="mx-auto mb-2 opacity-50 text-primary" />
          <p className="text-sm">Vùng riêng tư được bảo vệ. Vui lòng mở khóa để xem nội dung.</p>
        </div>
        <PrivateLockModal isOpen={true} onSuccess={fetchPrivateNotes} />
      </div>
    );
  }

  return (
    <section className="mx-auto w-full max-w-7xl space-y-6 text-left animate-fade-in" aria-labelledby="private-notes-heading">
      
      {/* Đồng bộ Header */}
      <header className="flex flex-col gap-4 border-b border-slate-200 pb-5 dark:border-slate-800 lg:flex-row lg:items-end lg:justify-between">
        <div className="min-w-0">
          <div className="mb-1 flex items-center gap-3">
            <h1 id="private-notes-heading" className="truncate text-2xl font-bold tracking-tight text-slate-800 dark:text-slate-100">
              Vùng riêng tư
            </h1>
            <span className="shrink-0 rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-semibold text-slate-600 dark:bg-slate-800 dark:text-slate-300">
              {notes.length} mục
            </span>
          </div>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            {normalizedSearchQuery ? 'Kết quả tìm kiếm ghi chú mật.' : 'Các thông tin mật được lưu tại đây chỉ bạn mới xem được.'}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <div ref={sortMenuRef} className="relative">
            <button
              ref={sortButtonRef}
              type="button"
              aria-expanded={isSortMenuOpen}
              onClick={() => setIsSortMenuOpen((open) => !open)}
              className="flex h-10 items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 text-slate-500 shadow-sm transition hover:border-primary/30 hover:bg-slate-50 dark:border-slate-800 dark:bg-slate-900 dark:hover:bg-slate-800/80"
            >
              <ArrowDownWideNarrow size={15} />
              <span className="text-xs font-medium text-slate-700 dark:text-slate-200">
                {sortOrder === 'newest' ? 'Mới nhất' : sortOrder === 'oldest' ? 'Cũ nhất' : 'Tên A-Z'}
              </span>
              <ChevronDown size={14} className={`transition-transform ${isSortMenuOpen ? 'rotate-180' : ''}`} />
            </button>
          </div>

          {isSortMenuOpen && createPortal(
            <div
              ref={sortMenuContentRef}
              role="listbox"
              style={{
                position: 'fixed',
                left: sortMenuPosition.left,
                top: sortMenuPosition.top,
                visibility: sortMenuPosition.left ? 'visible' : 'hidden',
              }}
              className="z-[70] w-44 overflow-hidden rounded-xl border border-slate-200 bg-white p-1.5 shadow-xl shadow-slate-900/10 ring-1 ring-black/5 dark:border-slate-700 dark:bg-slate-900 dark:shadow-black/30 dark:ring-white/5"
            >
              {[
                { value: 'newest', label: 'Mới nhất' },
                { value: 'oldest', label: 'Cũ nhất' },
                { value: 'title', label: 'Tên A-Z' },
              ].map((option) => (
                <button
                  key={option.value}
                  type="button"
                  role="option"
                  aria-selected={sortOrder === option.value}
                  onClick={() => {
                    setSortOrder(option.value);
                    setIsSortMenuOpen(false);
                  }}
                  className={`flex w-full items-center justify-between rounded-lg px-3 py-2 text-left text-xs transition ${
                    sortOrder === option.value
                      ? 'bg-primary/10 font-semibold text-primary'
                      : 'text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800'
                  }`}
                >
                  {option.label}
                  {sortOrder === option.value && <Check size={14} />}
                </button>
              ))}
            </div>,
            document.body
          )}

          <div className="flex h-10 items-center rounded-xl border border-slate-200 bg-white p-1 shadow-sm dark:border-slate-800 dark:bg-slate-900">
            <button
              type="button"
              onClick={() => setViewMode('grid')}
              aria-pressed={viewMode === 'grid'}
              className={`flex h-8 w-8 items-center justify-center rounded-lg transition ${
                viewMode === 'grid' ? 'bg-primary/10 text-primary' : 'text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
              }`}
            >
              <LayoutGrid size={16} />
            </button>
            <button
              type="button"
              onClick={() => setViewMode('list')}
              aria-pressed={viewMode === 'list'}
              className={`flex h-8 w-8 items-center justify-center rounded-lg transition ${
                viewMode === 'list' ? 'bg-primary/10 text-primary' : 'text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
              }`}
            >
              <List size={16} />
            </button>
          </div>

          <Button onClick={() => { setEditingNote(null); setIsModalOpen(true); }} icon={Plus}>
            Thêm ghi chú mật
          </Button>
        </div>
      </header>

      {loading ? (
        <div className="flex min-h-[40vh] items-center justify-center" role="status" aria-label="Đang tải ghi chú riêng tư">
          <LoadingSpinner size="lg" className="text-primary" />
        </div>
      ) : sortedNotes.length === 0 ? (
        <div className="flex min-h-[40vh] w-full flex-col items-center justify-center rounded-2xl border border-dashed border-slate-200 bg-slate-50/50 px-4 py-10 text-center dark:border-slate-800 dark:bg-slate-900/50">
          <div className="mb-5 grid size-16 place-items-center rounded-2xl bg-primary/10 text-primary">
            <ShieldAlert size={30} strokeWidth={1.6} aria-hidden="true" />
          </div>
          <h2 className="text-lg font-semibold text-slate-800 dark:text-slate-100">
            {normalizedSearchQuery ? 'Không tìm thấy ghi chú phù hợp' : 'Chưa có ghi chú mật nào'}
          </h2>
          <p className="mt-2 max-w-sm text-sm leading-6 text-slate-500 dark:text-slate-400">
            {normalizedSearchQuery ? 'Thử thay đổi từ khóa tìm kiếm.' : 'Bắt đầu lưu trữ các thông tin riêng tư của bạn tại đây.'}
          </p>
          {!normalizedSearchQuery && (
            <Button onClick={() => { setEditingNote(null); setIsModalOpen(true); }} className="mt-5">
              <Plus size={17} aria-hidden="true" />
              Tạo ghi chú bảo mật
            </Button>
          )}
        </div>
      ) : (
        <div className={viewMode === 'grid' ? 'grid grid-cols-1 items-stretch gap-4 sm:grid-cols-2 lg:grid-cols-3' : 'grid grid-cols-1 gap-3'}>
          {sortedNotes.map((note) => (
            <NoteCard
              key={note.id}
              note={note}
              isPinned={pinnedKeys.has(getPinKey(note))}
              onTogglePin={togglePin}
              viewMode={viewMode}
              onOpen={(selectedNote) => setViewingNoteId(selectedNote.id)}
              onEdit={(n) => { setViewingNoteId(null); setEditingNote(n); setIsModalOpen(true); }}
              onDelete={handleDeletePrivateNote}
            />
          ))}
        </div>
      )}

      <NoteFormModal
        isOpen={isModalOpen}
        initialData={editingNote}
        isPrivate
        draftKeyMaterial={privateDraftKey}
        onClose={() => setIsModalOpen(false)}
        onSave={handleSavePrivateNote}
      />

      {viewingNote && (
        <NoteViewModal
          note={viewingNote}
          isPinned={pinnedKeys.has(getPinKey(viewingNote))}
          onTogglePin={togglePin}
          onClose={() => setViewingNoteId(null)}
          onEdit={(note) => { setViewingNoteId(null); setEditingNote(note); setIsModalOpen(true); }}
          onDelete={handleDeletePrivateNote}
          onNavigate={navigateViewingNote}
          canGoPrevious={viewingNoteIndex > 0}
          canGoNext={viewingNoteIndex < sortedNotes.length - 1}
        />
      )}

      {toast && <Toast {...toast} onClose={() => setToast(null)} />}
    </section>
  );
}