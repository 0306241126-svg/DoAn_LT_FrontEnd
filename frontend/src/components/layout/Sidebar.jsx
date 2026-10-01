import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { Edit3, Plus, Folder, Lock, Unlock, Settings, ChevronRight, Trash2, X, Shield } from 'lucide-react';
import { useNotes } from '../../context/NoteContext';
import { useAuthPrivate } from '../../context/AuthPrivateContext';
import { useConfirm } from '../../context/ConfirmContext';

export default function Sidebar({ isOpen, onClose, onOpenNewTopicModal, isNewTopicModalOpen }) {
  const { topics, activeTopic, setActiveTopic, removeTopic } = useNotes();
  const { isUnlocked } = useAuthPrivate();
  const { confirm } = useConfirm();
  const navigate = useNavigate();

  const handleDeleteTopic = async (e, topic) => {
    e.stopPropagation();
    const isOk = await confirm({
      title: 'Xóa chủ đề',
      message: `Bạn có chắc muốn xóa chủ đề "${topic.name}" cùng tất cả ghi chú bên trong không?`,
      confirmText: 'Xác nhận xóa',
      cancelText: 'Giữ lại',
      type: 'danger',
    });

    if (isOk) {
      removeTopic(topic.slug);
    }
  };

  // Chọn chủ đề cần xem, quay về trang ghi chú và đóng Sidebar trên thiết bị di động.
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
          className="fixed inset-0 bg-black/40 z-40 md:hidden backdrop-blur-xs transition-opacity"
        />
      )}

      {/* Khung Sidebar chính */}
      <aside
        className={`fixed md:static inset-y-0 left-0 z-50 w-64 bg-white dark:bg-slate-900 border-r border-slate-200/80 dark:border-slate-800/80 flex flex-col justify-between h-full select-none transform transition-transform duration-200 ease-in-out md:translate-x-0 ${
          isOpen ? 'translate-x-0 shadow-2xl md:shadow-none' : '-translate-x-full'
        }`}
      >
        <div className="p-4 flex flex-col flex-1 min-h-0">
          {/* Header Sidebar */}
          <div className="flex items-center justify-between pb-3 mb-3 border-b border-slate-100 dark:border-slate-800/80 shrink-0">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-primary to-indigo-600 flex items-center justify-center text-white shadow-md shadow-primary/20 shrink-0">
                <Edit3 size={18} />
              </div>
              <div className="truncate">
                <h1 className="font-bold text-slate-800 dark:text-slate-100 text-sm tracking-tight leading-none mb-1">
                  Private NoteApp
                </h1>
                <p className="text-[10px] font-medium text-slate-400 leading-none">Quản lý ghi chú</p>
              </div>
            </div>

            <button
              type="button"
              onClick={onClose}
              className="p-1 text-slate-400 bg-slate-50/80 dark:bg-slate-800/40 border border-slate-200/60 dark:border-slate-800 hover:text-slate-600 dark:hover:text-slate-200 md:hidden rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition"
            >
              <X size={18} />
            </button>
          </div>

          {/* NHÓM 1: HỆ THỐNG (Vùng riêng tư + Cài đặt) */}
          <div className="space-y-1 mb-3 shrink-0">
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider px-2 mb-1.5">
              Hệ thống
            </p>

            {/* Vùng riêng tư */}
            <NavLink
              to="/private"
              onClick={onClose}
              className={({ isActive }) =>
                `group flex items-center justify-between p-2.5 rounded-xl transition-all border ${
                  isActive
                    ? 'bg-primary/10 text-primary border-primary/20 dark:bg-primary/20 dark:text-primary-300 font-semibold'
                    : 'bg-slate-50/80 dark:bg-slate-800/40 border-slate-200/60 dark:border-slate-800 text-slate-700 dark:text-slate-200 hover:bg-primary/10 hover:text-primary hover:border-primary/20 dark:hover:bg-primary/20'
                }`
              }
            >
              <div className="flex items-center gap-2.5 truncate">
                <div
                  className={`p-1.5 rounded-lg shrink-0 transition-colors ${
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
              <ChevronRight size={14} className="opacity-50 shrink-0 group-hover:translate-x-0.5 transition-transform" />
            </NavLink>

            {/* Cài đặt */}
            <NavLink
              to="/settings"
              onClick={onClose}
              className={({ isActive }) =>
                `flex items-center gap-2.5 px-3 py-2 rounded-xl border text-xs transition-all ${
                  isActive
                    ? 'bg-primary/10 text-primary border-primary/20 dark:bg-primary/20 dark:text-primary-300 font-semibold'
                    : 'bg-slate-50/80 dark:bg-slate-800/40 border-slate-200/60 dark:border-slate-800 text-slate-600 dark:text-slate-300 hover:bg-primary/10 hover:text-primary hover:border-primary/20 dark:hover:bg-primary/20 dark:hover:text-primary-300'
                }`
              }
            >
              <Settings size={16} className="shrink-0" />
              <span>Cài đặt</span>
            </NavLink>
          </div>

          {/* Đường phân cách nhẹ */}
          <div className="h-px bg-slate-100 dark:bg-slate-800/80 my-1 shrink-0" />

          {/* NHÓM 2: QUẢN LÝ CHỦ ĐỀ & NÚT TẠO MỚI */}
          <div className="mt-3 flex-1 flex flex-col min-h-0">
            {/* Nút Thêm chủ đề */}
            <button
              type="button"
              onClick={() => {
                onOpenNewTopicModal();
                if (onClose) onClose();
              }}
              className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-xl border text-xs transition-all cursor-pointer mb-2 ${
                isNewTopicModalOpen
                  ? 'bg-primary/10 text-primary border-primary/20 dark:bg-primary/20 dark:text-primary-300 font-semibold'
                  : 'bg-slate-50/80 dark:bg-slate-800/40 border-slate-200/60 dark:border-slate-800 text-slate-600 dark:text-slate-300 hover:bg-primary/10 hover:text-primary hover:border-primary/20 dark:hover:bg-primary/20 dark:hover:text-primary-300'
              }`}
            >
              <Plus size={16} className="shrink-0" />
              <span>Thêm chủ đề</span>
            </button>

            {/* Danh sách chủ đề */}
            <div className="flex items-center justify-between px-2 mb-2 shrink-0">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                Chủ đề ({topics.length})
              </span>
            </div>

            <div className="space-y-1 overflow-y-auto flex-1 pr-1 custom-scrollbar">
              {/* Danh sách từng chủ đề riêng */}
              {topics.map((topic) => {
                const isActive = activeTopic === topic.slug;

                return (
                  <div
                    key={topic.slug}
                    onClick={() => handleSelectTopic(topic.slug)}
                    className={`group flex items-center justify-between px-3 py-2.5 rounded-xl border text-xs transition select-none cursor-pointer ${
                      isActive
                        ? 'bg-primary/10 text-primary border-primary/20 dark:bg-primary/20 dark:text-primary-300 font-semibold'
                        : 'bg-slate-50/80 dark:bg-slate-800/40 border-slate-200/60 dark:border-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-100/70 dark:hover:bg-slate-800/60'
                    }`}
                  >
                    {/* Icon & Tên chủ đề */}
                    <div className="flex items-center gap-2.5 min-w-0 flex-1 mr-2">
                      <Folder
                        size={15}
                        className={`shrink-0 transition-colors ${
                          isActive ? 'text-primary' : 'text-slate-400 group-hover:text-slate-500'
                        }`}
                      />
                      <span className="truncate">{topic.name}</span>
                    </div>

                    {/* Nút Xóa chủ đề */}
                    <button
                      type="button"
                      onClick={(e) => handleDeleteTopic(e, topic)}
                      title="Xóa chủ đề"
                      className={`p-1 rounded-lg transition shrink-0 cursor-pointer ${
                        isActive
                          ? 'bg-primary/10 text-primary hover:bg-primary/15'
                            : 'bg-slate-50/80 dark:bg-slate-800/40 text-slate-400 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/40'
                      }`}
                    >
                      <Trash2 size={13} />
                    </button>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Chân Sidebar (Footer) */}
        <div className="px-4 py-3 border-t border-slate-100 dark:border-slate-800/80 shrink-0 bg-slate-50/50 dark:bg-slate-900/50">
          <div className="flex items-center gap-2 text-[11px] text-slate-400">
            <Shield size={13} className="text-emerald-500" />
            <span>Mã hóa bảo mật nội bộ</span>
          </div>
        </div>
      </aside>
    </>
  );
}