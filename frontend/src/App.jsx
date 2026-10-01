import React, { useState } from 'react';
import { Routes, Route } from 'react-router-dom';
import { ThemeProvider } from './context/ThemeContext';
import { NoteProvider } from './context/NoteContext';
import { AuthPrivateProvider } from './context/AuthPrivateContext';
import { ConfirmProvider } from './context/ConfirmContext';
import MainLayout from './components/layout/MainLayout';
import NotesPage from './pages/NotesPage';
import PrivateNotesPage from './pages/PrivateNotesPage';
import SettingsPage from './pages/SettingsPage';
import { useDebounce } from './hooks/useDebounce';

function AppRoutes() {
  const [searchInput, setSearchInput] = useState('');
  const debouncedSearch = useDebounce(searchInput, 400);

  return (
    <Routes>
      <Route
        path="/"
        element={
          <MainLayout
            searchValue={searchInput}
            onSearchChange={setSearchInput}
          />
        }
      >
        <Route index element={<NotesPage />} />
        <Route
          path="private"
          element={<PrivateNotesPage searchQuery={debouncedSearch} />}
        />
        <Route path="settings" element={<SettingsPage />} />
      </Route>
    </Routes>
  );
}

export default function App() {
  return (
    <ThemeProvider>
      <NoteProvider>
        <AuthPrivateProvider>
          <ConfirmProvider>
            <AppRoutes />
          </ConfirmProvider>
        </AuthPrivateProvider>
      </NoteProvider>
    </ThemeProvider>
  );
}