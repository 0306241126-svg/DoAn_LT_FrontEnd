/**
 * TỆP CẤU HÌNH SERVER CHÍNH (backend/server.js)
 * Mục đích: Khởi tạo ứng dụng Express, tích hợp Middleware toàn cục và đăng ký toàn bộ Route.
 */

const express = require('express');
const cors = require('cors');
require('dotenv').config(); // Load các biến môi trường từ tệp .env (VD: PORT)

// 1. IMPORT CÁC ROUTER NGHIỆP VỤ
const profileRoutes = require('./src/routes/profileRoutes');   // Task 3.1: API Quản lý hồ sơ cá nhân
const topicRoutes = require('./src/routes/topicRoutes');       // Task 3.2: API Quản lý chủ đề
const noteRoutes = require('./src/routes/noteRoutes');         // Task 3.3: API Quản lý ghi chú theo chủ đề
const privateRoutes = require('./src/routes/privateRoutes');   // Task 3.4 & 3.5: API Vùng riêng tư & Security

// Khởi tạo ứng dụng Express
const app = express();
const PORT = process.env.PORT || 5000;

// =========================================================================
// 2. CẤU HÌNH MIDDLEWARE TOÀN CỤC (GLOBAL MIDDLEWARES)
// ⚠️ LƯU Ý QUAN TRỌNG: Tất cả Middleware dưới đây BẮT BUỘC phải đặt TRƯỚC Router!
// =========================================================================

// Cho phép Frontend (React/Vue/REST Client) gọi API vượt qua rào cản Cross-Origin
app.use(cors());

// Parse dữ liệu JSON từ Body của HTTP Request và gán vào `req.body`.
// NẾU ĐẶT NÓ SAU ROUTE: req.body sẽ bị undefined -> gây ra lỗi TypeError (500) khi controller lấy dữ liệu.
app.use(express.json());

// =========================================================================
// 3. ĐĂNG KÝ CÁC ROUTE API (API ENDPOINTS)
// =========================================================================

app.use('/api/profile', profileRoutes);   // Định tuyến các yêu cầu liên quan đến hồ sơ
app.use('/api/topics', topicRoutes);       // Định tuyến các yêu cầu quản lý danh mục chủ đề
app.use('/api/notes', noteRoutes);         // Định tuyến các yêu cầu CRUD ghi chú thông thường
app.use('/api/private', privateRoutes);   // Định tuyến các yêu cầu unlock và ghi chú riêng tư

// Endpoint kiểm tra nhanh trạng thái server (Health Check)
app.get('/', (req, res) => {
  res.json({ message: 'Server đang hoạt động bình thường' });
});

// =========================================================================
// 4. KHỞI ĐỘNG SERVER
// =========================================================================
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});