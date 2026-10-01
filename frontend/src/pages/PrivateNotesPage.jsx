import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ArrowDownWideNarrow,
  BookOpenText,
  LayoutGrid,
  List,
  Plus,
} from 'lucide-react';
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

const getPinKey = (note) => note.id;
const PIN_STORAGE_KEY = `pinnedPrivateNotes:${localStorage.getItem('app_username') || 'default_user'}`;
const EMPTY_NOTES = [];

function loadPinnedNotes(storageKey) {
  try {
    const storedNotes = JSON.parse(localStorage.getItem(storageKey) || '[]');
    return new Set(Array.isArray(storedNotes) ? storedNotes : []);
  } catch {
    // Dữ liệu ghim hỏng không được làm gián đoạn trang vùng riêng tư.
    return new Set();
  }
}

function getErrorMessage(error) {
  return error?.message || error?.response?.data?.message || 'Đã xảy ra lỗi. Vui lòng thử lại.';
}

function getDateValue(note) {
  const value = new Date(note.updatedAt || note.createdAt || 0).getTime();
  return Number.isNaN(value) ? 0 : value;
}

export default function PrivateNotesPage() {
  const { isUnlocked, token } = useAuthPrivate();
  const { confirm } = useConfirm() || {};
  const [requestState, setRequestState] = useState({ key: '', notes: [], error: '' });
  const [reloadKey, setReloadKey] = useState(0);
  const [viewMode, setViewMode] = useState('grid');
  const [sortOrder, setSortOrder] = useState('newest');
  const [pinnedNotes, setPinnedNotes] = useState(() => loadPinnedNotes(PIN_STORAGE_KEY));
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingNote, setEditingNote] = useState(null);
  const [viewedNote, setViewedNote] = useState(null);
  const [toast, setToast] = useState({ message: '', type: 'info' });

  // Token trong key bảo đảm nội dung của phiên mở khóa cũ không hiện ở phiên mới.
  const requestKey = `${token || 'locked'}:${reloadKey}`;

  useEffect(() => {
    if (!isUnlocked || !token) return undefined;

    let isCurrentRequest = true;
    const loadNotes = async () => {
      try {
        const response = await privateService.getPrivateNotes();
        const loadedNotes = Array.isArray(response) ? response : response?.notes || [];
        if (isCurrentRequest) {
          setRequestState({ key: requestKey, notes: loadedNotes, error: '' });
        }
      } catch (error) {
        if (isCurrentRequest) {
          setRequestState({ key: requestKey, notes: [], error: getErrorMessage(error) });
        }
      }
    };

    loadNotes();
    return () => {
      // Không nhận phản hồi cũ sau khi khóa hoặc đổi token phiên bảo mật.
      isCurrentRequest = false;
    };
  }, [isUnlocked, token, requestKey]);

  useEffect(() => {
    localStorage.setItem(PIN_STORAGE_KEY, JSON.stringify([...pinnedNotes]));
  }, [pinnedNotes]);

  const isLoading = isUnlocked && Boolean(token) && requestState.key !== requestKey;
  const notes = isUnlocked && requestState.key === requestKey ? requestState.notes : EMPTY_NOTES;
  const loadError = isUnlocked && requestState.key === requestKey ? requestState.error : '';

  // Ghi chú ghim luôn đứng trước; phần còn lại tuân theo thứ tự được chọn.
  const sortedNotes = useMemo(() => [...notes].sort((first, second) => {
    const firstPinned = pinnedNotes.has(getPinKey(first));
    const secondPinned = pinnedNotes.has(getPinKey(second));
    if (firstPinned !== secondPinned) return firstPinned ? -1 : 1;

    if (sortOrder === 'oldest') return getDateValue(first) - getDateValue(second);
    if (sortOrder === 'title') return first.title.localeCompare(second.title, 'vi');
    return getDateValue(second) - getDateValue(first);
  }), [notes, pinnedNotes, sortOrder]);

  const togglePin = useCallback((note) => {
    const key = getPinKey(note);
    const willPin = !pinnedNotes.has(key);
    setPinnedNotes((current) => {
      const next = new Set(current);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
    setToast({ message: willPin ? 'Đã ghim ghi chú riêng tư.' : 'Đã bỏ ghim ghi chú.', type: 'success' });
  }, [pinnedNotes]);

  const closeForm = useCallback(() => {
    setIsFormOpen(false);
    setEditingNote(null);
  }, []);

  const openCreateForm = useCallback(() => {
    setEditingNote(null);
    setIsFormOpen(true);
  }, []);

  const openEditForm = useCallback((note) => {
    setViewedNote(null);
    setEditingNote(note);
    setIsFormOpen(true);
  }, []);

  // CRUD riêng tư luôn gọi endpoint được bảo vệ bằng token của phiên hiện tại.
  const saveNote = useCallback(async (noteData) => {
    if (editingNote) {
      const updatedNote = await privateService.updatePrivateNote(editingNote.id, noteData);
      setRequestState((current) => current.key !== requestKey
        ? current
        : {
            ...current,
            notes: current.notes.map((note) => note.id === updatedNote.id ? updatedNote : note),
          });
      setToast({ message: 'Đã cập nhật ghi chú riêng tư.', type: 'success' });
      return;
    }

    const createdNote = await privateService.createPrivateNote(noteData);
    setRequestState((current) => current.key !== requestKey
      ? current
      : { ...current, notes: [...current.notes, createdNote] });
    setToast({ message: 'Đã tạo ghi chú riêng tư.', type: 'success' });
  }, [editingNote, requestKey]);

  const deleteNote = useCallback(async (noteId) => {
    const note = notes.find((item) => item.id === noteId);
    if (!note) return;

    // Yêu cầu xác nhận trước khi xóa vì đây là thao tác không thể hoàn tác.
    const isConfirmed = confirm
      ? await confirm({
          title: 'Xóa ghi chú riêng tư',
          message: `Bạn có chắc muốn xóa ghi chú “${note.title}” không?`,
          confirmText: 'Xóa ghi chú',
          cancelText: 'Giữ lại',
          type: 'danger',
        })
      : window.confirm(`Bạn có chắc muốn xóa ghi chú “${note.title}” không?`);
    if (!isConfirmed) return;

    try {
      await privateService.deletePrivateNote(noteId);
      setRequestState((current) => current.key !== requestKey
        ? current
        : { ...current, notes: current.notes.filter((item) => item.id !== noteId) });
      setPinnedNotes((current) => {
        const next = new Set(current);
        next.delete(getPinKey(note));
        return next;
      });
      setViewedNote((current) => current?.id === noteId ? null : current);
      setToast({ message: 'Đã xóa ghi chú riêng tư.', type: 'success' });
    } catch (error) {
      setToast({ message: getErrorMessage(error), type: 'error' });
    }
  }, [confirm, notes, requestKey]);

  const currentViewedNote = viewedNote
    ? sortedNotes.find((note) => note.id === viewedNote.id) || null
    : null;
  const viewedNoteIndex = currentViewedNote
    ? sortedNotes.findIndex((note) => note.id === currentViewedNote.id)
    : -1;

  const navigateViewedNote = useCallback((offset) => {
    const nextNote = sortedNotes[viewedNoteIndex + offset];
    if (nextNote) setViewedNote(nextNote);
  }, [sortedNotes, viewedNoteIndex]);

  // Khóa chặn toàn bộ nội dung riêng tư khỏi cây giao diện cho đến khi xác thực xong.
  if (!isUnlocked) {
    return <PrivateLockModal isOpen />;
  }

  return (
    <section className="mx-auto w-full max-w-7xl space-y-6" aria-labelledby="private-notes-heading">
      <header className="flex flex-wrap items-center justify-between gap-4">
        <div className="min-w-0">
          <h1 id="private-notes-heading" className="truncate text-2xl font-bold text-slate-800 dark:text-slate-100">
            Vùng riêng tư
          </h1>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
            {notes.length} ghi chú
          </p>
        </div>
        <Button onClick={openCreateForm}>
          <Plus size={17} aria-hidden="true" />
          Thêm ghi chú
        </Button>
      </header>

      <div className="flex flex-wrap items-center justify-between gap-3 border-y border-slate-200/80 py-3 dark:border-slate-800">
        <label className="flex h-10 min-w-0 items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 text-slate-500 dark:border-slate-700 dark:bg-slate-900">
          <ArrowDownWideNarrow size={16} aria-hidden="true" />
          <span className="sr-only">Sắp xếp ghi chú riêng tư</span>
          <select
            aria-label="Sắp xếp ghi chú riêng tư"
            value={sortOrder}
            onChange={(event) => setSortOrder(event.target.value)}
            className="min-w-0 bg-transparent text-sm text-slate-700 outline-none dark:text-slate-200"
          >
            <option value="newest">Mới nhất</option>
            <option value="oldest">Cũ nhất</option>
            <option value="title">Tên A-Z</option>
          </select>
        </label>

        <div className="flex items-center gap-1 rounded-lg border border-slate-200 bg-white p-1 dark:border-slate-700 dark:bg-slate-900" role="group" aria-label="Kiểu hiển thị">
          <button
            type="button"
            onClick={() => setViewMode('grid')}
            aria-label="Hiển thị dạng lưới"
            aria-pressed={viewMode === 'grid'}
            title="Dạng lưới"
            className={`grid size-8 place-items-center rounded-md transition ${viewMode === 'grid' ? 'bg-primary/10 text-primary' : 'text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800'}`}
          >
            <LayoutGrid size={17} aria-hidden="true" />
          </button>
          <button
            type="button"
            onClick={() => setViewMode('list')}
            aria-label="Hiển thị dạng danh sách"
            aria-pressed={viewMode === 'list'}
            title="Dạng danh sách"
            className={`grid size-8 place-items-center rounded-md transition ${viewMode === 'list' ? 'bg-primary/10 text-primary' : 'text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800'}`}
          >
            <List size={17} aria-hidden="true" />
          </button>
        </div>
      </div>

      {loadError && (
        <div role="alert" className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-800 dark:border-rose-900/60 dark:bg-rose-950/30 dark:text-rose-200">
          <span>{loadError}</span>
          <Button variant="outline" size="sm" onClick={() => setReloadKey((key) => key + 1)}>
            Thử lại
          </Button>
        </div>
      )}

      {isLoading ? (
        <div className="flex min-h-[40vh] items-center justify-center" role="status" aria-label="Đang tải ghi chú riêng tư">
          <LoadingSpinner size="lg" className="text-primary" />
        </div>
      ) : loadError ? null : sortedNotes.length > 0 ? (
        <div className={viewMode === 'grid'
          ? 'grid grid-cols-1 items-stretch gap-4 sm:grid-cols-2 xl:grid-cols-3'
          : 'grid grid-cols-1 gap-3'}>
          {sortedNotes.map((note) => (
            <NoteCard
              key={note.id}
              note={note}
              isPinned={pinnedNotes.has(getPinKey(note))}
              onTogglePin={togglePin}
              onOpen={setViewedNote}
              onEdit={openEditForm}
              onDelete={deleteNote}
              viewMode={viewMode}
            />
          ))}
        </div>
      ) : (
        <div className="flex min-h-[42vh] w-full flex-col items-center justify-center px-4 py-10 text-center">
          <div className="mb-5 grid size-16 place-items-center rounded-2xl bg-primary/10 text-primary">
            <BookOpenText size={30} strokeWidth={1.6} aria-hidden="true" />
          </div>
          <h2 className="text-lg font-semibold text-slate-800 dark:text-slate-100">Chưa có ghi chú riêng tư nào</h2>
          <p className="mt-2 max-w-sm text-sm leading-6 text-slate-500 dark:text-slate-400">
            Tạo ghi chú tại đây để lưu những nội dung cần được bảo vệ.
          </p>
          <Button onClick={openCreateForm} className="mt-5">
            <Plus size={17} aria-hidden="true" />
            Tạo ghi chú đầu tiên
          </Button>
        </div>
      )}

      <NoteFormModal
        isOpen={isFormOpen}
        initialData={editingNote}
        onClose={closeForm}
        onSave={saveNote}
      />

      {currentViewedNote && (
        <NoteViewModal
          note={currentViewedNote}
          isPinned={pinnedNotes.has(getPinKey(currentViewedNote))}
          onTogglePin={togglePin}
          onClose={() => setViewedNote(null)}
          onEdit={openEditForm}
          onDelete={deleteNote}
          onNavigate={navigateViewedNote}
          canGoPrevious={viewedNoteIndex > 0}
          canGoNext={viewedNoteIndex >= 0 && viewedNoteIndex < sortedNotes.length - 1}
        />
      )}

      <Toast
        message={toast.message}
        type={toast.type}
        onClose={() => setToast({ message: '', type: 'info' })}
      />
    </section>
  );
}