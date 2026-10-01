import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { ArrowDownWideNarrow, BookOpenText, Check, ChevronDown, LayoutGrid, List, Plus } from 'lucide-react';
import { useNotes } from '../context/NoteContext';
import { useConfirm } from '../context/ConfirmContext';
import { noteService } from '../services/noteService';
import NoteCard from '../components/notes/NoteCard';
import NoteFormModal from '../components/notes/NoteFormModal';
import NoteViewModal from '../components/notes/NoteViewModal';
import Button from '../components/common/Button';
import LoadingSpinner from '../components/common/LoadingSpinner';
import Toast from '../components/common/Toast';

// Ghép chủ đề với ID để tránh trùng ID khi ghim ghi chú từ nhiều chủ đề.
const getPinKey = (note) => `${note.topicSlug || 'unknown'}:${note.id}`;
const EMPTY_NOTES = [];

// Lấy key storage sau khi client render (tránh lỗi SSR/test)
const getPinStorageKey = () => {
	if (typeof window === 'undefined') return null;
	return `pinnedNotes:${localStorage.getItem('app_username') || 'default_user'}`;
};

// Dùng key cũ nếu key mới chưa có (migration)
const getLegacyPinStorageKey = () => {
	if (typeof window === 'undefined') return null;
	return `pinned-notes:${localStorage.getItem('app_username') || 'default_user'}`;
};

function loadPinnedNotes(storageKey) {
	if (!storageKey) return new Set();
	try {
		const storedNotes = JSON.parse(localStorage.getItem(storageKey) || '[]');
		return new Set(Array.isArray(storedNotes) ? storedNotes : []);
	} catch {
		// Dữ liệu localStorage hỏng không được làm gián đoạn trang ghi chú.
		return new Set();
	}
}

// Migrate từ key cũ sang key mới nếu cần
function migratePinnedNotes(newKey, legacyKey) {
	if (!newKey || !legacyKey) return;
	try {
		const newData = localStorage.getItem(newKey);
		if (!newData) {
			const legacyData = localStorage.getItem(legacyKey);
			if (legacyData) {
				localStorage.setItem(newKey, legacyData);
				localStorage.removeItem(legacyKey);
			}
		}
	} catch (error) {
		console.warn('Migration ghim ghi chú bị lỗi:', error);
	}
}

function getErrorStatus(error) {
	return error?.status || error?.response?.status;
}

function getErrorMessage(error) {
	return error?.message || error?.response?.data?.message || 'Đã xảy ra lỗi. Vui lòng thử lại.';
}

function getDateValue(note) {
	const value = new Date(note.updatedAt || note.createdAt || 0).getTime();
	return Number.isNaN(value) ? 0 : value;
}

export default function NotesPage({ searchQuery = '' }) {
	const { topics, activeTopic, loading: isLoadingTopics } = useNotes();
	const { confirm } = useConfirm() || {};
	const [requestState, setRequestState] = useState({ key: '', notes: [], error: '' });
	const [reloadKey, setReloadKey] = useState(0);
	const [viewMode, setViewMode] = useState('grid');
	const [sortOrder, setSortOrder] = useState('newest');
	const [isSortMenuOpen, setIsSortMenuOpen] = useState(false);
	const [sortMenuPosition, setSortMenuPosition] = useState({ left: 0, top: 0 });
	const sortMenuRef = useRef(null);
	const sortButtonRef = useRef(null);
	const sortMenuContentRef = useRef(null);
	const [pinnedNotes, setPinnedNotes] = useState(() => {
		const newKey = getPinStorageKey();
		const legacyKey = getLegacyPinStorageKey();
		if (newKey && legacyKey) migratePinnedNotes(newKey, legacyKey);
		return loadPinnedNotes(newKey);
	});
	const [isFormOpen, setIsFormOpen] = useState(false);
	const [editingNote, setEditingNote] = useState(null);
	const [viewedNote, setViewedNote] = useState(null);
	const [toast, setToast] = useState(null);

	const normalizedSearchQuery = searchQuery.trim();
	const topicKey = topics.map((topic) => topic.slug).join(',');
	// Đổi key khi chủ đề hoặc danh sách chủ đề đổi để không hiển thị nhầm dữ liệu cũ.
	const requestKey = `${activeTopic || ''}:${topicKey}:${normalizedSearchQuery}:${reloadKey}`;

	// Lưu ghim vào localStorage mỗi khi thay đổi
	useEffect(() => {
		const storageKey = getPinStorageKey();
		if (storageKey) {
			try {
				localStorage.setItem(storageKey, JSON.stringify([...pinnedNotes]));
			} catch (error) {
				console.warn('Không thể lưu trạng thái ghim:', error);
			}
		}
	}, [pinnedNotes]);

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

	useEffect(() => {
		let isCurrentRequest = true;

		// 'all' tải từng chủ đề; 404 chỉ có nghĩa chủ đề đó chưa có ghi chú.
		const loadNotes = async () => {
			try {
				let loadedNotes = [];

				if (activeTopic === 'all') {
					const notesByTopic = await Promise.all(topics.map(async (topic) => {
						try {
							const topicNotes = await noteService.getNotes(topic.slug, normalizedSearchQuery);
							return (Array.isArray(topicNotes) ? topicNotes : []).map((note) => ({
								...note,
								topicSlug: topic.slug,
							}));
						} catch (error) {
							if (getErrorStatus(error) === 404) return [];
							throw error;
						}
					}));

					loadedNotes = notesByTopic.flat();
				} else if (activeTopic) {
					try {
						const topicNotes = await noteService.getNotes(activeTopic, normalizedSearchQuery);
						loadedNotes = (Array.isArray(topicNotes) ? topicNotes : []).map((note) => ({
							...note,
							topicSlug: activeTopic,
						}));
					} catch (error) {
						if (getErrorStatus(error) !== 404) throw error;
					}
				}

				if (isCurrentRequest) setRequestState({ key: requestKey, notes: loadedNotes, error: '' });
			} catch (error) {
				if (isCurrentRequest) {
					setRequestState({ key: requestKey, notes: [], error: getErrorMessage(error) });
				}
			}
		};

		loadNotes();
		return () => {
			// Bỏ qua phản hồi muộn nếu người dùng đã chuyển chủ đề hoặc rời trang.
			isCurrentRequest = false;
		};
	}, [activeTopic, topics, topicKey, normalizedSearchQuery, requestKey]);

	const isLoading = isLoadingTopics || requestState.key !== requestKey;
	const notes = requestState.key === requestKey ? requestState.notes : EMPTY_NOTES;
	const loadError = requestState.key === requestKey ? requestState.error : '';

	// Ưu tiên ghi chú đã ghim trước, rồi mới áp dụng tiêu chí sắp xếp được chọn.
	const sortedNotes = useMemo(() => [...notes].sort((first, second) => {
		const firstPinned = pinnedNotes.has(getPinKey(first));
		const secondPinned = pinnedNotes.has(getPinKey(second));
		if (firstPinned !== secondPinned) return firstPinned ? -1 : 1;

		// Xử lý an toàn khi title bị thiếu
		if (sortOrder === 'oldest') return getDateValue(first) - getDateValue(second);
		if (sortOrder === 'title') {
			const firstTitle = (first.title || '').trim();
			const secondTitle = (second.title || '').trim();
			return firstTitle.localeCompare(secondTitle, 'vi', { sensitivity: 'base' });
		}
		return getDateValue(second) - getDateValue(first);
	}), [notes, pinnedNotes, sortOrder]);

	const activeTopicName = activeTopic === 'all'
		? 'Tất cả ghi chú'
		: topics.find((topic) => topic.slug === activeTopic)?.name || 'Ghi chú';

	const togglePin = useCallback((note) => {
		const key = getPinKey(note);
		setPinnedNotes((current) => {
			const next = new Set(current);
			const willPin = !next.has(key);
			if (next.has(key)) next.delete(key);
			else next.add(key);
			setToast({
				message: willPin ? 'Đã ghim ghi chú.' : 'Đã bỏ ghim ghi chú.',
				type: 'success',
			});
			return next;
		});
	}, []);

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

	// Chọn API tạo/cập nhật từ dữ liệu form và cập nhật danh sách ngay sau khi thành công.
	const saveNote = useCallback(async (noteData) => {
		const targetTopic = noteData.topicSlug || (activeTopic !== 'all' ? activeTopic : '');
		if (!targetTopic) throw new Error('Hãy chọn chủ đề cho ghi chú.');

		if (editingNote) {
			const updatedNote = await noteService.updateNote(targetTopic, editingNote.id, noteData);
			const savedNote = { ...updatedNote, topicSlug: targetTopic };
			setRequestState((current) => current.key !== requestKey
				? current
				: {
						...current,
						notes: current.notes.map((note) => (
							note.id === savedNote.id && note.topicSlug === editingNote.topicSlug ? savedNote : note
						)),
					});
			setToast({ message: 'Đã cập nhật ghi chú.', type: 'success' });
			closeForm();
			return;
		}

		const createdNote = await noteService.createNote(targetTopic, noteData);
		setRequestState((current) => current.key !== requestKey
			? current
			: { ...current, notes: [...current.notes, { ...createdNote, topicSlug: targetTopic }] });
		setToast({ message: 'Đã tạo ghi chú.', type: 'success' });
		closeForm();
	}, [activeTopic, editingNote, requestKey, closeForm]);

	const deleteNote = useCallback(async (noteId, topicSlug) => {
		const note = notes.find((item) => item.id === noteId && item.topicSlug === topicSlug);
		if (!note) return;

		// Xác nhận trước khi xóa để tránh mất ghi chú do thao tác nhầm.
		const isConfirmed = confirm
			? await confirm({
					title: 'Xóa ghi chú',
					message: `Bạn có chắc muốn xóa ghi chú "${note.title}" không?`,
					confirmText: 'Xóa ghi chú',
					cancelText: 'Giữ lại',
					type: 'danger',
				})
			: window.confirm(`Bạn có chắc muốn xóa ghi chú "${note.title}" không?`);
		if (!isConfirmed) return;

		try {
			await noteService.deleteNote(topicSlug, noteId);
			setRequestState((current) => current.key !== requestKey
				? current
				: {
						...current,
						notes: current.notes.filter((item) => !(item.id === noteId && item.topicSlug === topicSlug)),
					});
			setPinnedNotes((current) => {
				const next = new Set(current);
				next.delete(getPinKey(note));
				return next;
			});
			setViewedNote((current) => (
				current?.id === noteId && current?.topicSlug === topicSlug ? null : current
			));
			setToast({ message: 'Đã xóa ghi chú.', type: 'success' });
		} catch (error) {
			setToast({ message: getErrorMessage(error), type: 'error' });
		}
	}, [confirm, notes, requestKey]);

	const currentViewedNote = viewedNote
		? sortedNotes.find((note) => note.id === viewedNote.id && note.topicSlug === viewedNote.topicSlug) || null
		: null;
	const viewedNoteIndex = currentViewedNote
		? sortedNotes.findIndex((note) => note.id === currentViewedNote.id && note.topicSlug === currentViewedNote.topicSlug)
		: -1;

	// Điều hướng chỉ trong cùng topic để giữ UX nhất quán
	const notesInCurrentTopic = sortedNotes.filter((note) => (
		currentViewedNote ? note.topicSlug === currentViewedNote.topicSlug : false
	));
	const noteIndexInTopic = notesInCurrentTopic.findIndex(
		(note) => currentViewedNote && note.id === currentViewedNote.id
	);

	const navigateViewedNote = useCallback((offset) => {
		const nextNote = notesInCurrentTopic[noteIndexInTopic + offset];
		if (nextNote) setViewedNote(nextNote);
	}, [notesInCurrentTopic, noteIndexInTopic]);

	return (
		<section className="mx-auto w-full max-w-7xl space-y-6" aria-labelledby="notes-heading">
			<header className="flex flex-col gap-5 xl:flex-row xl:items-center xl:justify-between">
				<div className="min-w-0">
					<h1 id="notes-heading" className="truncate text-2xl font-bold text-slate-800 dark:text-slate-100">
						{activeTopicName}
					</h1>
					<p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
						{notes.length} ghi chú
					</p>
				</div>
				<div className="flex flex-wrap items-center gap-2">
					<div ref={sortMenuRef} className="relative">
						<button
							ref={sortButtonRef}
							type="button"
							aria-label="Sắp xếp ghi chú"
							aria-haspopup="listbox"
							aria-expanded={isSortMenuOpen}
							onClick={() => setIsSortMenuOpen((open) => !open)}
							className="flex h-10 items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 text-slate-500 shadow-sm transition hover:border-primary/30 hover:bg-slate-50 dark:border-slate-800 dark:bg-slate-900 dark:hover:bg-slate-800/80"
						>
							<ArrowDownWideNarrow size={15} aria-hidden="true" />
							<span className="text-xs font-medium text-slate-700 dark:text-slate-200">
								{sortOrder === 'newest' ? 'Mới nhất' : sortOrder === 'oldest' ? 'Cũ nhất' : 'Tên A-Z'}
							</span>
							<ChevronDown
								size={14}
								className={`transition-transform ${isSortMenuOpen ? 'rotate-180' : ''}`}
								aria-hidden="true"
							/>
						</button>
					</div>

					{isSortMenuOpen &&
						createPortal(
							<div
								ref={sortMenuContentRef}
								role="listbox"
								aria-label="Sắp xếp ghi chú"
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
										{sortOrder === option.value && <Check size={14} aria-hidden="true" />}
									</button>
								))}
							</div>,
							document.body
						)}

					<div className="flex h-10 items-center rounded-xl border border-slate-200 bg-white p-1 shadow-sm dark:border-slate-800 dark:bg-slate-900">
						<button
							type="button"
							onClick={() => setViewMode('grid')}
							aria-label="Hiển thị dạng lưới"
							aria-pressed={viewMode === 'grid'}
							title="Dạng lưới"
							className={`flex h-8 w-8 items-center justify-center rounded-lg transition ${
								viewMode === 'grid'
									? 'bg-primary/10 text-primary'
									: 'text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
							}`}
						>
							<LayoutGrid size={16} aria-hidden="true" />
						</button>
						<button
							type="button"
							onClick={() => setViewMode('list')}
							aria-label="Hiển thị dạng danh sách"
							aria-pressed={viewMode === 'list'}
							title="Dạng danh sách"
							className={`flex h-8 w-8 items-center justify-center rounded-lg transition ${
								viewMode === 'list'
									? 'bg-primary/10 text-primary'
									: 'text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
							}`}
						>
							<List size={16} aria-hidden="true" />
						</button>
					</div>

					<Button onClick={openCreateForm} disabled={topics.length === 0}>
						<Plus size={17} aria-hidden="true" />
						Thêm ghi chú
					</Button>
				</div>
			</header>

			{loadError && (
				<div role="alert" className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-800 dark:border-rose-900/60 dark:bg-rose-950/30 dark:text-rose-200">
					<span>{loadError}</span>
					<Button variant="outline" size="sm" onClick={() => setReloadKey((key) => key + 1)}>
						Thử lại
					</Button>
				</div>
			)}

			{isLoading ? (
				<div className="flex min-h-[40vh] items-center justify-center" role="status" aria-label="Đang tải ghi chú">
					<LoadingSpinner size="lg" className="text-primary" />
				</div>
			) : loadError ? null : sortedNotes.length > 0 ? (
				// Lưới tự chuyển 1 cột trên mobile, 2 cột trên tablet và 3 cột trên màn hình lớn.
				<div className={viewMode === 'grid'
					? 'grid grid-cols-1 items-stretch gap-4 sm:grid-cols-2 xl:grid-cols-3'
					: 'grid grid-cols-1 gap-3'}>
					{sortedNotes.map((note) => {
						const topicName = topics.find((topic) => topic.slug === note.topicSlug)?.name;
						return (
							<NoteCard
								key={getPinKey(note)}
								note={note}
								topicName={topicName}
								showTopicBadge={activeTopic === 'all'}
								isPinned={pinnedNotes.has(getPinKey(note))}
								onTogglePin={togglePin}
								onOpen={setViewedNote}
								onEdit={openEditForm}
								onDelete={deleteNote}
								viewMode={viewMode}
							/>
						);
					})}
				</div>
			) : (
				<div className="flex min-h-[42vh] w-full flex-col items-center justify-center px-4 py-10 text-center">
					<div className="mb-5 grid size-16 place-items-center rounded-2xl bg-primary/10 text-primary">
						<BookOpenText size={30} strokeWidth={1.6} aria-hidden="true" />
					</div>
					<h2 className="text-lg font-semibold text-slate-800 dark:text-slate-100">Chưa có ghi chú nào</h2>
					<p className="mt-2 max-w-sm text-sm leading-6 text-slate-500 dark:text-slate-400">
						{topics.length > 0
							? `Bắt đầu lưu lại ý tưởng trong ${activeTopic === 'all' ? 'các chủ đề của bạn' : `chủ đề ${activeTopicName}`}.`
							: 'Hãy tạo chủ đề trước để bắt đầu lưu ghi chú.'}
					</p>
					{topics.length > 0 && (
						<Button onClick={openCreateForm} className="mt-5">
							<Plus size={17} aria-hidden="true" />
							Tạo ghi chú đầu tiên
						</Button>
					)}
				</div>
			)}

			<NoteFormModal
				isOpen={isFormOpen}
				initialData={editingNote}
				onClose={closeForm}
				onSave={saveNote}
				topics={topics}
				// Khi xem tất cả chủ đề, form tạo mới cần cho chọn nơi lưu ghi chú.
				showTopicSelector={activeTopic === 'all' && !editingNote}
				defaultTopicSlug={activeTopic === 'all' ? topics[0]?.slug || '' : activeTopic}
			/>

			{currentViewedNote && (
				<NoteViewModal
					note={currentViewedNote}
					topicName={topics.find((topic) => topic.slug === currentViewedNote.topicSlug)?.name}
					isPinned={pinnedNotes.has(getPinKey(currentViewedNote))}
					onTogglePin={togglePin}
					onClose={() => setViewedNote(null)}
					onEdit={openEditForm}
					onDelete={deleteNote}
					onNavigate={navigateViewedNote}
					canGoPrevious={noteIndexInTopic > 0}
					canGoNext={noteIndexInTopic >= 0 && noteIndexInTopic < notesInCurrentTopic.length - 1}
				/>
			)}

			{toast && (
				<Toast
					message={toast.message}
					type={toast.type}
					onClose={() => setToast(null)}
				/>
			)}
		</section>
	);
}
