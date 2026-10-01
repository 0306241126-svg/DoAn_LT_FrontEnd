import React, { useState, useEffect, useLayoutEffect, useCallback, useMemo, useRef } from 'react';
import { createPortal } from 'react-dom';
import { ArrowDownWideNarrow, BookOpenText, Check, ChevronDown, LayoutGrid, List, Plus } from 'lucide-react';
import { useNotes } from '../context/NoteContext';
import { useConfirm } from '../context/ConfirmContext'; // Đã bổ sung import hook
import { noteService } from '../services/noteService';
import NoteCard from '../components/notes/NoteCard';
import NoteFormModal from '../components/notes/NoteFormModal';
import NoteViewModal from '../components/notes/NoteViewModal';
import Button from '../components/common/Button';
import LoadingSpinner from '../components/common/LoadingSpinner';
import Toast from '../components/common/Toast';

const getPinKey = (note) => `${note.topicSlug || 'unknown'}:${note.id}`;

function loadPinnedNotes(storageKey) {

}