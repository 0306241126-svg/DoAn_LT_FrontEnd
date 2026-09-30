import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import './index.css'
import App from './App.jsx'
import { ThemeProvider } from './context/ThemeContext.jsx' // IMPORT MỚI
import { NoteProvider } from './context/NoteContext.jsx'
import { AuthPrivateProvider } from './context/AuthPrivateContext.jsx'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <BrowserRouter>
      {/* Bổ sung ThemeProvider bọc toàn bộ App */}
      <ThemeProvider>
        <AuthPrivateProvider>
          <NoteProvider>
            <App />
          </NoteProvider>
        </AuthPrivateProvider>
      </ThemeProvider>
    </BrowserRouter>
  </StrictMode>,
)