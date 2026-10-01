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
  
}