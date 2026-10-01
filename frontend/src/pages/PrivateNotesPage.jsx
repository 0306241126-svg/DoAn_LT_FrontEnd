import React, { useCallback, useEffect, useState } from 'react';
import { LockKeyholeOpen, Plus } from 'lucide-react';
import { useAuthPrivate } from '../context/AuthPrivateContext';
import { useConfirm } from '../context/ConfirmContext';
import { privateService } from '../services/privateService';
import { useTheme } from '../context/ThemeContext';
import Button from '../components/common/Button';
import LoadingSpinner from '../components/common/LoadingSpinner';
import Toast from '../components/common/Toast';
import NoteCard from '../components/notes/NoteCard';
import NoteFormModal from '../components/notes/NoteFormModal';
import NoteViewModal from '../components/notes/NoteViewModal';
import PrivateLockModal from '../components/private/PrivateLockModal';

export default function PrivateNotesPage() {
  const { isUnlocked, unlock, lock } = useAuthPrivate();
  const { hasPrivatePassword } = useTheme();
  const { confirm } = useConfirm();
  const [notes, setNotes] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingNote, setEditingNote] = useState(null);
  const [viewingNote, setViewingNote] = useState(null);
  const [toast, setToast] = useState('');
  const [loadError, setLoadError] = useState('');

  const loadNotes = useCallback(async () => {
    setIsLoading(true);
    setLoadError('');
    try {
      const loadedNotes = await privateService.getPrivateNotes();
      if (!Array.isArray(loadedNotes)) {
        throw new Error('Phản hồi danh sách ghi chú riêng tư không hợp lệ.');
      }
      setNotes(loadedNotes);
    } catch (error) {
      setLoadError(error?.message || 'Không thể tải ghi chú riêng tư.');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    if (isUnlocked) loadNotes();
    else setNotes([]);
  }, [isUnlocked, loadNotes]);

  const handleUnlock = async (password) => {
    if (!hasPrivatePassword) {
      await privateService.setupPassword(password);
    }
    await unlock(password);
  };

  const handleSave = async (noteData) => {
    if (editingNote) {
      await privateService.updatePrivateNote(editingNote.id, noteData);
    } else {
      await privateService.createPrivateNote(noteData);
    }
    await loadNotes();
    setToast(editingNote ? 'Đã cập nhật ghi chú.' : 'Đã tạo ghi chú.');
    setEditingNote(null);
  };

  const handleDelete = async (noteId) => {
    const note = notes.find((item) => item.id === noteId);
    const confirmed = await confirm({
      title: 'Xóa ghi chú riêng tư',
      message: `Bạn có chắc muốn xóa ghi chú "${note?.title || ''}" không?`,
      confirmText: 'Xóa ghi chú',
      cancelText: 'Giữ lại',
    });
    if (!confirmed) return;

    try {
      await privateService.deletePrivateNote(noteId);
      await loadNotes();
      setViewingNote(null);
      setToast('Đã xóa ghi chú.');
    } catch (error) {
      setLoadError(error?.message || 'Không thể xóa ghi chú riêng tư.');
    }
  };

  if (!isUnlocked) {
    return (
      <section className="mx-auto max-w-xl py-12 text-center">
        <LockKeyholeOpen size={32} className="mx-auto mb-4 text-primary" />
        <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100">Vùng riêng tư</h1>
        <p className="mt-2 text-sm text-slate-500">Mở khóa để xem các ghi chú được bảo vệ.</p>
        <PrivateLockModal isOpen onSubmit={handleUnlock} mode={hasPrivatePassword ? 'unlock' : 'setup'} />
      </section>
    );
  }

  return (
    <section className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <p className="text-xs font-bold uppercase tracking-wider text-primary">Đã mở khóa</p>
          <h1 className="mt-1 text-2xl font-bold text-slate-900 dark:text-slate-100">Ghi chú riêng tư</h1>
        </div>
        <div className="flex gap-2">
          <Button type="button" variant="outline" onClick={lock}>Khóa</Button>
          <Button
            type="button"
            onClick={() => {
              setEditingNote(null);
              setIsFormOpen(true);
            }}
          >
            <Plus size={17} aria-hidden="true" />
            Tạo ghi chú
          </Button>
        </div>
      </div>

      {loadError && <p role="alert" className="text-sm text-rose-600">{loadError}</p>}
      {isLoading ? (
        <div className="flex justify-center py-16"><LoadingSpinner /></div>
      ) : notes.length ? (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {notes.map((note) => (
            <NoteCard
              key={note.id}
              note={note}
              onOpen={setViewingNote}
              onEdit={(selectedNote) => {
                setViewingNote(null);
                setEditingNote(selectedNote);
                setIsFormOpen(true);
              }}
              onDelete={handleDelete}
            />
          ))}
        </div>
      ) : (
        <div className="rounded-2xl border border-dashed border-slate-300 px-6 py-16 text-center text-sm text-slate-500 dark:border-slate-700">
          Chưa có ghi chú riêng tư.
        </div>
      )}

      <NoteFormModal
        isOpen={isFormOpen}
        initialData={editingNote}
        onClose={() => {
          setIsFormOpen(false);
          setEditingNote(null);
        }}
        onSave={handleSave}
      />
      {viewingNote && (
        <NoteViewModal
          note={viewingNote}
          onClose={() => setViewingNote(null)}
          onEdit={(selectedNote) => {
            setViewingNote(null);
            setEditingNote(selectedNote);
            setIsFormOpen(true);
          }}
          onDelete={handleDelete}
        />
      )}
      <Toast message={toast} onClose={() => setToast('')} />
    </section>
  );
}
