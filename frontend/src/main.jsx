import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import './index.css'
import App from './App.jsx'

// Điểm khởi chạy React, nối BrowserRouter với App để các component dùng useNavigate.
createRoot(document.getElementById('root')).render(
  <StrictMode>
    {/* BrowserRouter cung cấp ngữ cảnh điều hướng cho PrivateLockModal. */}
    <BrowserRouter>
      <App />
    </BrowserRouter>
  </StrictMode>,
)
