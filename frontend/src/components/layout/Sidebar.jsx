import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { Plus, Lock, Unlock, Settings, ChevronRight, Trash2, X, Shield, Layers } from 'lucide-react';
import { useNotes } from '../../context/NoteContext';
import { useAuthPrivate } from '../../context/AuthPrivateContext';
import { useConfirm } from '../../context/ConfirmContext';
import { noteService } from '../../services/noteService';

// Bảng màu tuần hoàn cho từng chủ đề
const TOPIC_DOT_COLORS = [
  'bg-amber-400',
  'bg-sky-500',
  'bg-emerald-500',
  'bg-purple-500',
  'bg-indigo-500',
  'bg-rose-500',
  'bg-teal-500',
];

export default function Sidebar({ isOpen, onClose, onOpenNewTopicModal, isNewTopicModalOpen }) {
  const { topics, activeTopic, setActiveTopic, removeTopic } = useNotes();
  const { isUnlocked } = useAuthPrivate();
  const { confirm } = useConfirm();
  const navigate = useNavigate();

  const handleDeleteTopic = async (e, topic) => {
    e.stopPropagation();
    let noteCount = 0;
    try {
      const notes = await noteService.getNotes(topic.slug);
      if (Array.isArray(notes)) {
        noteCount = notes.length;
      }
    } catch {
      noteCount = topic.notesCount ?? 0;
    }

    const isOk = await confirm({
      title: 'Chuyển chủ đề vào thùng rác',
      message: `Chủ đề '${topic.name}' hiện đang có ${noteCount} ghi chú. Bạn có chắc chắn muốn chuyển chủ đề cùng các ghi chú này vào Thùng rác không?`,
      confirmText: 'Chuyển vào thùng rác',
      cancelText: 'Hủy',
      type: 'warning',
    });

    if (isOk) {
      try {
        await removeTopic(topic.slug);
      } catch (error) {
        window.alert(error.message || 'Không thể chuyển chủ đề vào thùng rác');
      }
    }
  };

  const handleSelectTopic = (slug) => {
    setActiveTopic(slug);
    navigate('/');
    if (onClose) onClose();
  };

  return (
    <>
      {/* Lớp nền mờ (Backdrop) trên Mobile */}
      {isOpen && (
        <div
          onClick={onClose}
          className="fixed inset-0 z-40 bg-black/40 backdrop-blur-xs transition-opacity md:hidden"
        />
      )}

      {/* Khung Sidebar chính */}
      <aside
        className={`fixed inset-y-0 left-0 z-50 flex h-full w-64 select-none flex-col justify-between border-r border-slate-200/80 bg-white transition-transform duration-200 ease-in-out dark:border-slate-800/80 dark:bg-slate-900 md:static md:translate-x-0 ${
          isOpen ? 'translate-x-0 shadow-2xl md:shadow-none' : '-translate-x-full'
        }`}
      >
        <div className="flex min-h-0 flex-1 flex-col p-4">
          
          {/* Header Sidebar */}
          <div className="relative mb-3 flex shrink-0 items-center justify-between border-b border-slate-100 pb-3 dark:border-slate-800/80">
            <div className="flex min-w-0 items-center gap-2.5">
              <div className="relative flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white p-1 shadow-xs ring-1 ring-slate-200/70 dark:ring-slate-700/80">
                <img
                  src="/images/1790822702152_3203883919812151739_g5520636365658538576_00d44b88ceb743c678b5b9bce68e51ae-removebg-preview.png"
                  alt="Minh họa sổ tay"
                  className="h-full w-full object-contain"
                />
              </div>

              <div className="truncate">
                <h1 className="mb-1 text-sm font-bold tracking-tight text-slate-800 dark:text-slate-100 leading-none">
                  Private NoteApp
                </h1>
                <p className="text-[10px] font-medium text-slate-400 dark:text-slate-500 leading-none">
                  Quản lý ghi chú
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={onClose}
              className="rounded-lg border border-slate-200/60 bg-slate-50/80 p-1 text-slate-400 transition hover:bg-slate-100 hover:text-slate-600 dark:border-slate-800 dark:bg-slate-800/40 dark:hover:bg-slate-800 dark:hover:text-slate-200 md:hidden"
              aria-label="Đóng thanh bên"
            >
              <X size={18} />
            </button>
          </div>

          {/* NHÓM 1: HỆ THỐNG */}
          <div className="mb-3 shrink-0 space-y-1">
            <p className="mb-1.5 px-2 text-[10px] font-bold tracking-wider text-slate-400 uppercase">
              Hệ thống
            </p>

            <NavLink
              to="/private"
              onClick={onClose}
              className={({ isActive }) =>
                `group flex items-center justify-between rounded-xl border p-2.5 transition-all ${
                  isActive
                    ? 'border-primary/20 bg-primary/10 font-semibold text-primary dark:bg-primary/20 dark:text-primary-300'
                    : 'border-slate-200/60 bg-slate-50/80 text-slate-700 hover:border-primary/20 hover:bg-primary/10 hover:text-primary dark:border-slate-800 dark:bg-slate-800/40 dark:text-slate-200 dark:hover:bg-primary/20'
                }`
              }
            >
              <div className="flex items-center gap-2.5 truncate">
                <div
                  className={`shrink-0 rounded-lg p-1.5 transition-colors ${
                    isUnlocked
                      ? 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400'
                      : 'bg-amber-500/15 text-amber-600 dark:text-amber-400'
                  }`}
                >
                  {isUnlocked ? <Unlock size={15} /> : <Lock size={15} />}
                </div>
                <div className="truncate">
                  <p className="text-xs leading-tight">Vùng riêng tư</p>
                  <p className="text-[10px] opacity-75 leading-tight">
                    {isUnlocked ? 'Đã mở khóa' : 'Được bảo vệ'}
                  </p>
                </div>
              </div>
              <ChevronRight size={14} className="shrink-0 opacity-50 transition-transform group-hover:translate-x-0.5" />
            </NavLink>
          </div>

          {/* Đường phân cách */}
          <div className="my-1 h-px shrink-0 bg-slate-100 dark:bg-slate-800/80" />

          {/* NHÓM 2: QUẢN LÝ CHỦ ĐỀ */}
          <div className="mt-3 flex min-h-0 flex-1 flex-col">
            
            {/* Thanh tiêu đề nhóm & nút Thêm mới */}
            <div className="mb-2 flex shrink-0 items-center justify-between px-2">
              <span className="text-[10px] font-bold tracking-wider text-slate-400 uppercase">
                Chủ đề ({topics.length})
              </span>
              <button
                type="button"
                onClick={() => {
                  onOpenNewTopicModal();
                  if (onClose) onClose();
                }}
                className="flex items-center gap-1 text-[11px] font-semibold text-primary transition hover:opacity-80 cursor-pointer"
              >
                <Plus size={13} strokeWidth={2.5} />
                Thêm mới
              </button>
            </div>

            {/* Danh sách cuộn các chủ đề */}
            <div className="custom-scrollbar mb-2 flex-1 space-y-1 overflow-y-auto pr-1">
              
              {/* Mục "Tất cả chủ đề" */}
              <div
                onClick={() => handleSelectTopic('all')}
                className={`group flex cursor-pointer select-none items-center justify-between rounded-xl px-3 py-2 text-xs transition-all ${
                  activeTopic === 'all'
                    ? 'bg-primary/10 font-semibold text-primary dark:bg-primary/20 dark:text-primary-300'
                    : 'text-slate-600 hover:bg-slate-100/80 dark:text-slate-300 dark:hover:bg-slate-800/60'
                }`}
              >
                <div className="flex min-w-0 flex-1 items-center gap-2.5">
                  <Layers
                    size={15}
                    className={`shrink-0 transition-colors ${
                      activeTopic === 'all' ? 'text-primary' : 'text-slate-400 group-hover:text-slate-500'
                    }`}
                  />
                  <span className="truncate">Tất cả chủ đề</span>
                </div>
              </div>

              {/* Từng chủ đề riêng biệt (Đã bỏ hiển thị số lượng ghi chú) */}
              {topics.map((topic, index) => {
                const isActive = activeTopic === topic.slug;
                const dotColor = TOPIC_DOT_COLORS[index % TOPIC_DOT_COLORS.length];

                return (
                  <div
                    key={topic.slug}
                    onClick={() => handleSelectTopic(topic.slug)}
                    className={`group relative flex cursor-pointer select-none items-center justify-between rounded-xl px-3 py-2 text-xs transition-all ${
                      isActive
                        ? 'bg-primary/10 font-semibold text-primary dark:bg-primary/20 dark:text-primary-300'
                        : 'text-slate-600 hover:bg-slate-100/80 dark:text-slate-300 dark:hover:bg-slate-800/60'
                    }`}
                  >
                    {/* Tên chủ đề kèm Dot màu */}
                    <div className="flex min-w-0 flex-1 items-center gap-2.5 mr-2">
                      <span className={`h-2 w-2 shrink-0 rounded-full ${dotColor} ring-2 ring-black/5 dark:ring-white/10`} />
                      <span className="truncate">{topic.name}</span>
                    </div>

                    {/* Nút xóa thùng rác xuất hiện khi hover */}
                    <button
                      type="button"
                      onClick={(e) => handleDeleteTopic(e, topic)}
                      title="Chuyển vào thùng rác"
                      className="opacity-0 transition-opacity duration-150 group-hover:opacity-100 rounded-md p-1 text-slate-400 hover:bg-rose-50 hover:text-rose-500 dark:hover:bg-rose-950/40"
                    >
                      <Trash2 size={13} />
                    </button>
                  </div>
                );
              })}
            </div>
          </div>

          {/* NHÓM 3: TIỆN ÍCH CUỐI BẢNG */}
          <div className="mt-2 shrink-0 space-y-1 border-t border-slate-100 pt-3 dark:border-slate-800/80">
            <NavLink
              to="/trash"
              onClick={onClose}
              className={({ isActive }) =>
                `flex items-center gap-2.5 rounded-xl border px-3 py-2 text-xs transition-all ${
                  isActive
                    ? 'border-primary/20 bg-primary/10 font-semibold text-primary dark:bg-primary/20 dark:text-primary-300'
                    : 'border-slate-200/60 bg-slate-50/80 text-slate-600 hover:border-primary/20 hover:bg-primary/10 hover:text-primary dark:border-slate-800 dark:bg-slate-800/40 dark:text-slate-300 dark:hover:bg-primary/20 dark:hover:text-primary-300'
                }`
              }
            >
              <Trash2 size={15} className="shrink-0" />
              <span>Thùng rác</span>
            </NavLink>

            <NavLink
              to="/settings"
              onClick={onClose}
              className={({ isActive }) =>
                `flex items-center gap-2.5 rounded-xl border px-3 py-2 text-xs transition-all ${
                  isActive
                    ? 'border-primary/20 bg-primary/10 font-semibold text-primary dark:bg-primary/20 dark:text-primary-300'
                    : 'border-slate-200/60 bg-slate-50/80 text-slate-600 hover:border-primary/20 hover:bg-primary/10 hover:text-primary dark:border-slate-800 dark:bg-slate-800/40 dark:text-slate-300 dark:hover:bg-primary/20 dark:hover:text-primary-300'
                }`
              }
            >
              <Settings size={15} className="shrink-0" />
              <span>Cài đặt</span>
            </NavLink>
          </div>
        </div>

        {/* Chân Sidebar (Footer) */}
        <div className="shrink-0 border-t border-slate-100 bg-slate-50/50 px-4 py-3 dark:border-slate-800/80 dark:bg-slate-900/50">
          <div className="flex items-center gap-2 text-[11px] text-slate-400">
            <Shield size={13} className="text-emerald-500" />
            <span>Mã hóa bảo mật nội bộ</span>
          </div>
        </div>
      </aside>
    </>
  );
}