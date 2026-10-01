import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Plus } from 'lucide-react';
import { useConfirm } from '../context/ConfirmContext';
import { useNotes } from '../context/NoteContext';
import { noteService } from '../services/noteService';
import Button from '../components/common/Button';
import LoadingSpinner from '../components/common/LoadingSpinner';
import Toast from '../components/common/Toast';
import NoteCard from '../components/notes/NoteCard';
import NoteFormModal from '../components/notes/NoteFormModal';
import NoteViewModal from '../components/notes/NoteViewModal';

export default function NotesPage({ searchValue = '' }) {
  const { topics, activeTopic, loading: isLoadingTopics } = useNotes();
  const { confirm } = useConfirm();
  const [notes, setNotes] = useState([]);
  const [isLoadingNotes, setIsLoadingNotes] = useState(true);
  const [loadError, setLoadError] = useState('');
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingNote, setEditingNote] = useState(null);
  const [viewingNote, setViewingNote] = useState(null);
  const [toast, setToast] = useState('');

  const loadNotes = useCallback(async () => {
    if (isLoadingTopics) return;
    setIsLoadingNotes(true);
    setLoadError('');
    try {
      const selectedTopic = topics.find((topic) => topic.slug === activeTopic);
      const loadedNotes = activeTopic
        ? (await noteService.getNotes(activeTopic)).map((note) => ({
            ...note,
            topicSlug: activeTopic,
            topicName: selectedTopic?.name,
          }))
        : [];
      setNotes(loadedNotes);
    } catch (error) {
      setLoadError(error?.message || 'Không thể tải danh sách ghi chú.');
    } finally {
      setIsLoadingNotes(false);
    }
  }, [activeTopic, isLoadingTopics, topics]);

  useEffect(() => {
    loadNotes();
  }, [loadNotes]);

  const visibleNotes = useMemo(() => {
    const query = searchValue.trim().toLocaleLowerCase('vi');
    if (!query) return notes;
    return notes.filter((note) => (
      `${note.title || ''} ${note.content || ''} ${note.topicName || ''}`
        .toLocaleLowerCase('vi')
        .includes(query)
    ));
  }, [notes, searchValue]);

  const handleSaveNote = async (noteData) => {
    const topicSlug = noteData.topicSlug
      || editingNote?.topicSlug
      || activeTopic;
    if (!topicSlug) throw new Error('Vui lòng tạo chủ đề trước khi thêm ghi chú.');

    if (editingNote) {
      await noteService.updateNote(topicSlug, editingNote.id, noteData);
    } else {
      await noteService.createNote(topicSlug, noteData);
    }
    await loadNotes();
    setEditingNote(null);
    setToast(editingNote ? 'Đã cập nhật ghi chú.' : 'Đã tạo ghi chú.');
  };

  const handleDeleteNote = async (noteId, topicSlug) => {
    const note = notes.find((item) => item.id === noteId && item.topicSlug === topicSlug);
    const confirmed = await confirm({
      title: 'Xóa ghi chú',
      message: `Bạn có chắc muốn xóa ghi chú "${note?.title || ''}" không?`,
      confirmText: 'Xóa ghi chú',
      cancelText: 'Giữ lại',
      type: 'danger',
    });
    if (!confirmed) return;

    try {
      await noteService.deleteNote(topicSlug, noteId);
      await loadNotes();
      setViewingNote(null);
      setToast('Đã xóa ghi chú.');
    } catch (error) {
      setLoadError(error?.message || 'Không thể xóa ghi chú.');
    }
  };

  const openCreateForm = () => {
    setEditingNote(null);
    setIsFormOpen(true);
  };

  const openEditForm = (note) => {
    setViewingNote(null);
    setEditingNote(note);
    setIsFormOpen(true);
  };

  return (
    <section className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-xs font-bold uppercase tracking-wider text-primary">
            {topics.find((topic) => topic.slug === activeTopic)?.name || 'Chủ đề'}
          </p>
          <h1 className="mt-1 text-2xl font-bold text-slate-900 dark:text-slate-100">Ghi chú</h1>
        </div>
        <Button type="button" onClick={openCreateForm} disabled={topics.length === 0}>
          <Plus size={17} aria-hidden="true" />
          Tạo ghi chú
        </Button>
      </div>

      {loadError && (
        <div role="alert" className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
          {loadError}
          <button
            type="button"
            className="ml-3 font-semibold underline"
            onClick={loadNotes}
          >
            Thử lại
          </button>
        </div>
      )}

      {isLoadingTopics || isLoadingNotes ? (
        <div className="flex justify-center py-16"><LoadingSpinner /></div>
      ) : visibleNotes.length ? (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {visibleNotes.map((note) => (
            <NoteCard
              key={`${note.topicSlug}-${note.id}`}
              note={note}
              onOpen={setViewingNote}
              onEdit={openEditForm}
              onDelete={handleDeleteNote}
              topicName={topics.find((topic) => topic.slug === note.topicSlug)?.name}
            />
          ))}
        </div>
      ) : (
        <div className="rounded-2xl border border-dashed border-slate-300 px-6 py-16 text-center text-sm text-slate-500 dark:border-slate-700">
          {searchValue ? 'Không tìm thấy ghi chú phù hợp.' : 'Chưa có ghi chú nào trong chủ đề này.'}
        </div>
      )}

      <NoteFormModal
        isOpen={isFormOpen}
        initialData={editingNote}
        onClose={() => {
          setIsFormOpen(false);
          setEditingNote(null);
        }}
        onSave={handleSaveNote}
        topics={topics}
        defaultTopicSlug={activeTopic}
      />

      {viewingNote && (
        <NoteViewModal
          note={viewingNote}
          topicName={topics.find((topic) => topic.slug === viewingNote.topicSlug)?.name}
          onClose={() => setViewingNote(null)}
          onEdit={openEditForm}
          onDelete={handleDeleteNote}
        />
      )}

      <Toast message={toast} onClose={() => setToast('')} />
    </section>
  );
}
