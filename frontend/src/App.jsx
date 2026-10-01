import React, { useState } from 'react';
import { Navigate, Route, Routes } from 'react-router-dom';
import { AuthPrivateProvider } from './context/AuthPrivateContext';
import { ConfirmProvider } from './context/ConfirmContext';
import { NoteProvider } from './context/NoteContext';
import { ThemeProvider } from './context/ThemeContext';
import { useDebounce } from './hooks/useDebounce';
import MainLayout from './components/layout/MainLayout';
import NotesPage from './pages/NotesPage';
import PrivateNotesPage from './pages/PrivateNotesPage';
import SettingsPage from './pages/SettingsPage';

function AppRoutes() {
  const [searchInput, setSearchInput] = useState('');
  const searchValue = useDebounce(searchInput, 400);

  return (
    <Routes>
      <Route
        path="/"
        element={<MainLayout searchValue={searchInput} onSearchChange={setSearchInput} />}
      >
        <Route index element={<NotesPage searchValue={searchValue} />} />
        <Route path="private" element={<PrivateNotesPage />} />
        <Route path="settings" element={<SettingsPage />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Route>
    </Routes>
  );
}

export default function App() {
  return (
    <ThemeProvider>
      <AuthPrivateProvider>
        <NoteProvider>
          <ConfirmProvider>
            <AppRoutes />
          </ConfirmProvider>
        </NoteProvider>
      </AuthPrivateProvider>
    </ThemeProvider>
  );
}
