import React, { useState, useEffect, useRef } from 'react';
import {
  AlignCenter,
  AlignLeft,
  AlignRight,
  Bold,
  CheckSquare,
  Code,
  Highlighter,
  Italic,
  Link,
  List,
  ListOrdered,
  Quote,
  Strikethrough,
  Underline,
  X,
} from 'lucide-react';
import Input from '../common/Input';
import Button from '../common/Button';
import { getRichTextPlainText, sanitizeRichText } from '../../utils/richText';

const formattingTools = [
  { label: 'In đậm', icon: Bold, command: 'bold' },
  { label: 'In nghiêng', icon: Italic, command: 'italic' },
  { label: 'Gạch chân', icon: Underline, command: 'underline' },
  { label: 'Gạch ngang', icon: Strikethrough, command: 'strikeThrough' },
  { label: 'Danh sách đầu dòng', icon: List, command: 'insertUnorderedList' },
  { label: 'Danh sách đánh số', icon: ListOrdered, command: 'insertOrderedList' },
  { label: 'Danh sách công việc', icon: CheckSquare, command: 'checklist' },
  { label: 'Căn trái', icon: AlignLeft, command: 'justifyLeft' },
  { label: 'Căn giữa', icon: AlignCenter, command: 'justifyCenter' },
  { label: 'Căn phải', icon: AlignRight, command: 'justifyRight' },
  { label: 'Trích dẫn', icon: Quote, command: 'formatBlock', value: 'blockquote' },
  { label: 'Khối mã', icon: Code, command: 'formatBlock', value: 'pre' },
  { label: 'Tô sáng', icon: Highlighter, command: 'hiliteColor', value: '#fef08a' },
];

const EMPTY_TOPICS = [];

export default function NoteFormModal({
  isOpen,
  initialData,
  onClose,
  onSave,
  topics = EMPTY_TOPICS,
  showTopicSelector = false,
  defaultTopicSlug = '',
}) {
  const [title, setTitle] = useState('');
  const [wordCount, setWordCount] = useState(0);
  const [characterCount, setCharacterCount] = useState(0);
  const [topicSlug, setTopicSlug] = useState(defaultTopicSlug);
  const [blockType, setBlockType] = useState('p');
  const [linkUrl, setLinkUrl] = useState('');
  const [isLinkInputOpen, setIsLinkInputOpen] = useState(false);
  const editorRef = useRef(null);
  const savedSelectionRef = useRef(null);
  
  // State quản lý lỗi
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  // Nạp dữ liệu khi mở form (nếu đang ở chế độ chỉnh sửa)
  useEffect(() => {
    if (isOpen) {
      setTitle(initialData?.title || '');
      const safeContent = sanitizeRichText(initialData?.content || '');
      if (editorRef.current) editorRef.current.innerHTML = safeContent;
      updateContentCounts(safeContent);
      setTopicSlug(initialData?.topicSlug || defaultTopicSlug || topics[0]?.slug || '');
      setBlockType('p');
      setLinkUrl('');
      setIsLinkInputOpen(false);
      setError(''); // Xóa lỗi cũ khi mở lại modal
    }
  }, [isOpen, initialData, defaultTopicSlug, topics]);

  useEffect(() => {
    if (!isOpen) return undefined;
    const previousOverflow = document.body.style.overflow;
    const pageContent = document.querySelector('main');
    const previousPageOverflow = pageContent?.style.overflow;
    document.body.style.overflow = 'hidden';
    if (pageContent) pageContent.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = previousOverflow;
      if (pageContent) pageContent.style.overflow = previousPageOverflow;
    };
  }, [isOpen]);

  if (!isOpen) return null;

  function updateContentCounts(value) {
    const text = getRichTextPlainText(value);
    setWordCount(text ? text.split(/\s+/).filter(Boolean).length : 0);
    setCharacterCount(text.length);
  }

  const saveSelection = () => {
    const selection = window.getSelection();
    if (selection?.rangeCount && editorRef.current?.contains(selection.anchorNode)) {
      savedSelectionRef.current = selection.getRangeAt(0).cloneRange();
    }
  };

  const restoreSelection = () => {
    const selection = window.getSelection();
    if (!selection || !savedSelectionRef.current) return;
    selection.removeAllRanges();
    selection.addRange(savedSelectionRef.current);
  };

  const applyCommand = (command, value) => {
    editorRef.current?.focus();
    restoreSelection();

    if (command === 'createLink') {
      setIsLinkInputOpen(true);
      return;
    }

    if (command === 'checklist') {
      document.execCommand('insertHTML', false, '<ul><li>☐ </li></ul>');
    } else if (command === 'formatBlock') {
      document.execCommand(command, false, `<${value}>`);
    } else {
      document.execCommand(command, false, value);
    }

    saveSelection();
    updateContentCounts(editorRef.current?.innerHTML || '');
  };

  const insertLink = () => {
    const trimmedUrl = linkUrl.trim();
    if (!trimmedUrl) {
      setError('Nhập đường dẫn liên kết');
      return;
    }

    try {
      const normalizedUrl = /^[\w+.-]+:/.test(trimmedUrl) ? trimmedUrl : `https://${trimmedUrl}`;
      const parsedUrl = new URL(normalizedUrl);
      if (!['http:', 'https:', 'mailto:'].includes(parsedUrl.protocol)) {
        setError('Chỉ hỗ trợ liên kết http, https hoặc mailto');
        return;
      }

      editorRef.current?.focus();
      restoreSelection();
      document.execCommand('createLink', false, parsedUrl.href);
      saveSelection();
      updateContentCounts(editorRef.current?.innerHTML || '');
      setLinkUrl('');
      setIsLinkInputOpen(false);
      setError('');
    } catch (error) {
      console.error('Đường dẫn liên kết không hợp lệ:', error);
      setError('Đường dẫn liên kết không hợp lệ');
    }
  };

  const handleEditorInput = () => {
    saveSelection();
    updateContentCounts(editorRef.current?.innerHTML || '');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Kiểm tra rỗng (loại bỏ khoảng trắng ở 2 đầu)
    if (!title.trim()) {
      setError('Tiêu đề ghi chú không được để trống');
      return;
    }

    setError('');
    setLoading(true);

    try {
      const content = sanitizeRichText(editorRef.current?.innerHTML || '');
      await onSave({
        title: title.trim(), 
        content,
        topicSlug,
      });
      onClose();
    } catch (err) {
      setError(err.message || 'Đã xảy ra lỗi khi lưu ghi chú');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-xs flex items-center justify-center z-50 p-4">
      <div className="relative flex h-[92dvh] max-h-[96vh] w-full max-w-5xl flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white p-4 shadow-2xl dark:border-slate-700/60 dark:bg-slate-900 sm:h-[88vh] sm:p-6 lg:p-8">
        
        {/* Nút Đóng */}
        <button
          type="button"
          onClick={onClose}
          className="absolute right-5 top-5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition"
          title="Đóng"
        >
          <X size={20} />
        </button>

        <h3 className="mb-3 shrink-0 pr-8 text-xl font-bold text-slate-800 dark:text-slate-100">
          {initialData ? 'Chỉnh sửa ghi chú' : 'Tạo ghi chú mới'}
        </h3>

        <form onSubmit={handleSubmit} className="flex min-h-0 flex-1 flex-col gap-3 overflow-hidden">
          {showTopicSelector && (
            <div className="shrink-0 space-y-1.5">
              <label
                htmlFor="note-topic"
                className="block text-sm font-medium text-slate-700 dark:text-slate-300"
              >
                Chủ đề
              </label>
              <select
                id="note-topic"
                value={topicSlug}
                onChange={(event) => setTopicSlug(event.target.value)}
                required
                className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-xl outline-none focus:border-primary focus:ring-2 focus:ring-primary/10 transition text-sm text-slate-800 dark:text-slate-100"
              >
                {topics.map((topic) => (
                  <option key={topic.slug} value={topic.slug}>
                    {topic.name}
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Ô nhập Tiêu đề có tích hợp hiển thị lỗi */}
          <div className="shrink-0">
            <Input
              label="Tiêu đề"
              placeholder="Nhập tiêu đề ghi chú..."
              value={title}
              onChange={(e) => {
                setTitle(e.target.value);
                if (error) setError('');
              }}
              error={error}
              autoFocus
              className="!rounded-none !border-0 !bg-transparent !px-0 !py-2 !text-2xl !font-bold !shadow-none focus:!ring-0"
            />
          </div>

          {/* Khung nhập Nội dung */}
          <div className="flex min-h-0 flex-1 flex-col gap-1.5">
            <span className="block shrink-0 text-sm font-medium text-slate-700 dark:text-slate-300">Nội dung</span>
            <div className="flex min-h-0 flex-1 flex-col overflow-hidden rounded-xl border border-slate-200 bg-white dark:border-slate-700/70 dark:bg-slate-800/60">
              <div className="flex shrink-0 flex-wrap items-center gap-1 border-b border-slate-200 bg-slate-50/80 p-2 dark:border-slate-700/70 dark:bg-slate-900/60">
                <select
                  aria-label="Kiểu văn bản"
                  value={blockType}
                  onMouseDown={saveSelection}
                  onChange={(event) => {
                    setBlockType(event.target.value);
                    applyCommand('formatBlock', event.target.value);
                  }}
                  className="h-8 rounded-lg border border-slate-200 bg-white px-2 text-xs text-slate-700 outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200"
                >
                  <option value="h1">Tiêu đề lớn</option>
                  <option value="h2">Tiêu đề vừa</option>
                  <option value="h3">Tiêu đề nhỏ</option>
                  <option value="p">Văn bản thường</option>
                </select>

                <div className="mx-1 hidden h-6 w-px bg-slate-200 dark:bg-slate-700 sm:block" />
                {formattingTools.map(({ label, icon: Icon, command, value }) => (
                  <button
                    key={label}
                    type="button"
                    aria-label={label}
                    title={label}
                    onMouseDown={(event) => {
                      event.preventDefault();
                      saveSelection();
                    }}
                    onClick={() => applyCommand(command, value)}
                    className="flex h-8 w-8 items-center justify-center rounded-lg text-slate-500 transition hover:bg-primary/10 hover:text-primary dark:text-slate-300 dark:hover:bg-primary/20"
                  >
                    <Icon size={15} />
                  </button>
                ))}
                <label
                  title="Màu chữ"
                  className="relative flex h-8 w-8 cursor-pointer items-center justify-center rounded-lg text-slate-500 transition hover:bg-primary/10 hover:text-primary dark:text-slate-300 dark:hover:bg-primary/20"
                >
                  <span className="text-sm font-bold">A</span>
                  <input
                    type="color"
                    aria-label="Màu chữ"
                    defaultValue="#7c3aed"
                    onMouseDown={saveSelection}
                    onChange={(event) => applyCommand('foreColor', event.target.value)}
                    className="absolute inset-0 cursor-pointer opacity-0"
                  />
                </label>
                <button
                  type="button"
                  aria-label="Chèn liên kết"
                  title="Chèn liên kết"
                  onMouseDown={(event) => {
                    event.preventDefault();
                    saveSelection();
                  }}
                  onClick={() => {
                    saveSelection();
                    setIsLinkInputOpen((current) => !current);
                  }}
                  className="flex h-8 w-8 items-center justify-center rounded-lg text-slate-500 transition hover:bg-primary/10 hover:text-primary dark:text-slate-300 dark:hover:bg-primary/20"
                >
                  <Link size={15} />
                </button>
                {isLinkInputOpen && (
                  <div className="flex w-full items-center gap-2 border-t border-slate-200 pt-2 dark:border-slate-700 sm:w-auto sm:border-0 sm:pt-0">
                    <input
                      type="url"
                      aria-label="Đường dẫn liên kết"
                      placeholder="https://..."
                      value={linkUrl}
                      onChange={(event) => setLinkUrl(event.target.value)}
                      onKeyDown={(event) => {
                        if (event.key === 'Enter') {
                          event.preventDefault();
                          insertLink();
                        }
                      }}
                      className="h-8 min-w-0 flex-1 rounded-lg border border-slate-200 bg-white px-2 text-xs text-slate-700 outline-none focus:border-primary dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200 sm:w-40 sm:flex-none"
                    />
                    <button
                      type="button"
                      onMouseDown={(event) => event.preventDefault()}
                      onClick={insertLink}
                      className="h-8 rounded-lg bg-primary/10 px-2 text-xs font-medium text-primary hover:bg-primary/20"
                    >
                      Chèn
                    </button>
                  </div>
                )}
              </div>

              <div
                ref={editorRef}
                role="textbox"
                aria-label="Nội dung ghi chú"
                aria-multiline="true"
                contentEditable
                suppressContentEditableWarning
                data-placeholder="Nhập nội dung ghi chú..."
                onInput={handleEditorInput}
                onKeyUp={saveSelection}
                onMouseUp={saveSelection}
                onKeyDown={(event) => {
                  if ((event.ctrlKey || event.metaKey) && event.key === 'Enter') {
                    event.preventDefault();
                    event.currentTarget.closest('form')?.requestSubmit();
                  }
                }}
                className="note-rich-editor min-h-0 flex-1 overflow-y-auto overscroll-contain px-4 py-3 text-sm leading-7 text-slate-800 outline-none dark:text-slate-100 [&_blockquote]:my-3 [&_blockquote]:border-l-2 [&_blockquote]:border-primary [&_blockquote]:pl-3 [&_blockquote]:italic [&_h1]:my-2 [&_h1]:text-2xl [&_h1]:font-bold [&_h2]:my-2 [&_h2]:text-xl [&_h2]:font-bold [&_h3]:my-2 [&_h3]:text-lg [&_h3]:font-semibold [&_ol]:list-decimal [&_ol]:pl-6 [&_pre]:my-3 [&_pre]:overflow-x-auto [&_pre]:rounded-lg [&_pre]:bg-slate-100 [&_pre]:p-3 dark:[&_pre]:bg-slate-900 [&_ul]:list-disc [&_ul]:pl-6"
              />
            </div>
          </div>

          {/* Vùng Nút bấm */}
          <div className="flex shrink-0 flex-col-reverse justify-between gap-2 border-t border-slate-100 pt-2.5 dark:border-slate-800 sm:flex-row sm:items-center">
            <span className="text-xs text-slate-400">
              {wordCount} từ · {characterCount} ký tự <span className="hidden sm:inline">· Ctrl + Enter để lưu</span>
            </span>
            <div className="flex justify-end gap-3">
              <Button type="button" variant="secondary" size="sm" onClick={onClose}>
                Hủy
              </Button>
              <Button type="submit" size="sm" loading={loading}>
                {initialData ? 'Cập nhật' : 'Lưu ghi chú'}
              </Button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}