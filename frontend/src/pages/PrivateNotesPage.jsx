import { useCallback, useEffect, useMemo, useState } from 'react';
import { LockKeyhole, LockKeyholeOpen, Plus } from 'lucide-react';
import { useOutletContext } from 'react-router-dom';
import { useAuthPrivate } from '../context/AuthPrivateContext';
import privateService from '../services/privateService';
import Button from '../components/common/Button';
import NoteCard from '../components/notes/NoteCard';
import NoteFormModal from '../components/notes/NoteFormModal';
import PrivateLockModal from '../components/private/PrivateLockModal';

function PrivateNotesPage() {
 
}

export default PrivateNotesPage;
