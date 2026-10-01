import React, { useState, useEffect, useCallback, useLayoutEffect, useMemo, useRef } from 'react';
import { createPortal } from 'react-dom';
import {
  ArrowDownWideNarrow,
  BookOpenText,
  Check,
  ChevronDown,
  LayoutGrid,
  List,
  Plus,
  ShieldAlert,
} from 'lucide-react';
import { useAuthPrivate } from '../context/AuthPrivateContext';
import { useConfirm } from '../context/ConfirmContext'; // 1. Đã import useConfirm
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
    console.error('Không thể đọc danh sách ghi chú riêng tư đã ghim:', error);
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
  const { isUnlocked } = useAuthPrivate();
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

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingNote, setEditingNote] = useState(null);
  const [viewingNoteId, setViewingNoteId] = useState(null);

  // Toast
  const [toast, setToast] = useState(null);
  const normalizedSearchQuery = normalizeSearchText(searchQuery.trim());
  const sortedNotes = useMemo(
    () =>
      notes
        .filter((note) => {
          if (!normalizedSearchQuery) return true;
          const searchableText = normalizeSearchText(
            `${note.title || ''} ${getRichTextPlainText(note.content || '')}`
          );
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
  const navigateViewingNote = useCallback(
    (direction) => {
      const nextNote = sortedNotes[viewingNoteIndex + direction];
      if (nextNote) setViewingNoteId(nextNote.id);
    },
    [sortedNotes, viewingNoteIndex]
  );

  // Tải danh sách ghi chú riêng tư
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
    if (isUnlocked) {
      fetchPrivateNotes();
    }
  }, [isUnlocked, fetchPrivateNotes]);

  useEffect(() => {
    try {
      localStorage.setItem(pinStorageKey, JSON.stringify([...pinnedKeys]));
    } catch (error) {
      console.error('Không thể lưu danh sách ghi chú riêng tư đã ghim:', error);
      setToast({ type: 'error', message: 'Không thể lưu trạng thái ghim trên trình duyệt' });
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
      if (
        !sortMenuRef.current?.contains(event.target) &&
        !sortMenuContentRef.current?.contains(event.target)
      ) {
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
      const left = Math.max(
        margin,
        Math.min(buttonRect.right - menuRect.width, window.innerWidth - menuRect.width - margin)
      );
      const spaceBelow = window.innerHeight - buttonRect.bottom;
      const top =
        spaceBelow >= menuRect.height + 12
          ? buttonRect.bottom + 8
          : Math.max(margin, buttonRect.top - menuRect.height - 8);

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

  // Thêm hoặc Sửa ghi chú riêng tư
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

  // 2 & 3. Đổi đúng tên hàm và dùng privateService.deletePrivateNote(id)
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

  // NẾU CHƯA MỞ KHÓA: Chặn màn hình bằng PrivateLockModal
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

  // NẾU ĐÃ MỞ KHÓA: Hiển thị giao diện danh sách ghi chú
  return (
    <div className="w-full space-y-6 text-left animate-fade-in">
      <div className="flex flex-col gap-5 xl:flex-row xl:items-center xl:justify-between">
        <div className="flex flex-wrap items-center gap-3">
          <h1 className="text-2xl font-bold text-slate-800 dark:text-slate-100">Vùng riêng tư</h1>
          <span className="rounded-full border border-primary/15 bg-primary/5 px-2.5 py-1 text-xs font-semibold text-primary">
            {normalizedSearchQuery ? `${sortedNotes.length} kết quả` : `${notes.length} ghi chú được bảo vệ`}
          </span>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <div ref={sortMenuRef} className="relative">
            <button
              ref={sortButtonRef}
              type="button"
              aria-label="Sắp xếp ghi chú riêng tư"
              aria-haspopup="listbox"
              aria-expanded={isSortMenuOpen}
              onClick={() => setIsSortMenuOpen((open) => !open)}
              className="flex h-10 items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 text-slate-500 shadow-sm transition hover:border-primary/30 hover:bg-slate-50 dark:border-slate-800 dark:bg-slate-900 dark:hover:bg-slate-800/80"
            >
              <ArrowDownWideNarrow size={15} />
              <span className="text-xs font-medium text-slate-700 dark:text-slate-200">
                {sortOrder === 'newest' ? 'Mới nhất' : sortOrder === 'oldest' ? 'Cũ nhất' : 'Tên A-Z'}
              </span>
              <ChevronDown
                size={14}
                className={`transition-transform ${isSortMenuOpen ? 'rotate-180' : ''}`}
              />
            </button>
          </div>

          {isSortMenuOpen &&
            createPortal(
              <div
                ref={sortMenuContentRef}
                role="listbox"
                aria-label="Sắp xếp ghi chú riêng tư"
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
              aria-label="Xem dạng lưới"
              aria-pressed={viewMode === 'grid'}
              className={`flex h-8 w-8 items-center justify-center rounded-lg transition ${
                viewMode === 'grid'
                  ? 'bg-primary/10 text-primary'
                  : 'text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
              }`}
            >
              <LayoutGrid size={16} />
            </button>
            <button
              type="button"
              onClick={() => setViewMode('list')}
              aria-label="Xem dạng danh sách"
              aria-pressed={viewMode === 'list'}
              className={`flex h-8 w-8 items-center justify-center rounded-lg transition ${
                viewMode === 'list'
                  ? 'bg-primary/10 text-primary'
                  : 'text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
              }`}
            >
              <List size={16} />
            </button>
          </div>

          <Button
            onClick={() => {
              setEditingNote(null);
              setIsModalOpen(true);
            }}
            icon={Plus}
          >
            Tạo ghi chú mới
          </Button>
        </div>
      </div>

      {loading ? (
        <div className="py-20 flex justify-center">
          <LoadingSpinner size="lg" />
        </div>
      ) : sortedNotes.length === 0 ? (
        <div className="flex min-h-72 flex-col items-center justify-center rounded-3xl border-2 border-dashed border-slate-200 bg-white/60 px-5 py-12 text-center dark:border-slate-800 dark:bg-slate-900/40">
          <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-primary/10 text-primary">
            <BookOpenText size={30} strokeWidth={1.5} />
          </div>
          <h2 className="text-base font-semibold text-slate-700 dark:text-slate-200">
            {normalizedSearchQuery
              ? 'Không tìm thấy ghi chú phù hợp.'
              : 'Chưa có ghi chú nào trong vùng riêng tư.'}
          </h2>
          <p className="mt-1 max-w-sm text-sm text-slate-400">
            {normalizedSearchQuery
              ? 'Thử thay đổi từ khóa tìm kiếm.'
              : 'Các thông tin mật được lưu tại đây chỉ bạn mới xem được.'}
          </p>
          {!normalizedSearchQuery && (
            <Button
              onClick={() => {
                setEditingNote(null);
                setIsModalOpen(true);
              }}
              icon={Plus}
              className="mt-5"
            >
              Tạo ghi chú ngay
            </Button>
          )}
        </div>
      ) : (
        <div
          className={
            viewMode === 'grid'
              ? 'grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4'
              : 'flex flex-col gap-3'
          }
        >
          {sortedNotes.map((note) => (
            <NoteCard
              key={note.id}
              note={note}
              isPinned={pinnedKeys.has(getPinKey(note))}
              onTogglePin={togglePin}
              viewMode={viewMode}
              onOpen={(selectedNote) => setViewingNoteId(selectedNote.id)}
              onEdit={(n) => {
                setViewingNoteId(null);
                setEditingNote(n);
                setIsModalOpen(true);
              }}
              onDelete={handleDeletePrivateNote}
            />
          ))}
        </div>
      )}

      <NoteFormModal
        isOpen={isModalOpen}
        initialData={editingNote}
        onClose={() => setIsModalOpen(false)}
        onSave={handleSavePrivateNote}
      />

      {viewingNote && (
        <NoteViewModal
          note={viewingNote}
          isPinned={pinnedKeys.has(getPinKey(viewingNote))}
          onTogglePin={togglePin}
          onClose={() => setViewingNoteId(null)}
          onEdit={(note) => {
            setViewingNoteId(null);
            setEditingNote(note);
            setIsModalOpen(true);
          }}
          onDelete={handleDeletePrivateNote}
          onNavigate={navigateViewingNote}
          canGoPrevious={viewingNoteIndex > 0}
          canGoNext={viewingNoteIndex < sortedNotes.length - 1}
        />
      )}

      {toast && <Toast {...toast} onClose={() => setToast(null)} />}
    </div>
  );
}
