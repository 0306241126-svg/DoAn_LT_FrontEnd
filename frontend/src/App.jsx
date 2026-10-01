import React, { useState } from 'react';
import { Routes, Route } from 'react-router-dom';
import { ThemeProvider } from './context/ThemeContext';
import { NoteProvider } from './context/NoteContext';
import { AuthPrivateProvider } from './context/AuthPrivateContext';
import { ConfirmProvider } from './context/ConfirmContext'; // <-- Thêm dòng này
import MainLayout from './components/layout/MainLayout';
import NotesPage from './pages/NotesPage';
import PrivateNotesPage from './pages/PrivateNotesPage';
import SettingsPage from './pages/SettingsPage';
import TrashPage from './pages/TrashPage';
import { useDebounce } from './hooks/useDebounce';

export default function App() {
  const [searchInput, setSearchInput] = useState('');
  const debouncedSearch = useDebounce(searchInput, 400);

  return (
    <ThemeProvider>
      <NoteProvider>
        <AuthPrivateProvider>
          <ConfirmProvider>
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
                <Route index element={<NotesPage searchQuery={debouncedSearch} />} />
                <Route
                  path="private"
                  element={<PrivateNotesPage searchQuery={debouncedSearch} />}
                />
                <Route path="settings" element={<SettingsPage />} />
                <Route path="trash" element={<TrashPage searchQuery={debouncedSearch} />} />
              </Route>
            </Routes>
          </ConfirmProvider>
        </AuthPrivateProvider>
      </NoteProvider>
    </ThemeProvider>
  );
}