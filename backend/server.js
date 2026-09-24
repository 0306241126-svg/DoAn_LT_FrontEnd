/**
 * TỆP ĐIỂM VÀO CHÍNH CỦA SERVER (backend/server.js)
 * Mục 3.6: Lắp ráp đầy đủ 4 nhánh Routes và cấu hình máy chủ Express
 */

const express = require('express');
const cors = require('cors');
require('dotenv').config();

const { PORT } = require('./src/config/constants');

// 1. Nạp toàn bộ 4 file Routes đã triển khai
const profileRoutes = require('./src/routes/profileRoutes');
const topicRoutes = require('./src/routes/topicRoutes');
const noteRoutes = require('./src/routes/noteRoutes');
const privateRoutes = require('./src/routes/privateRoutes');

const app = express();

// 2. Cấu hình Middlewares cơ sở
app.use(cors());
app.use(express.json());

// Endpoint kiểm tra nhanh trạng thái server
app.get('/', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'Private NoteApp Backend Server is running smoothly!'
  });
});

// 3. Đăng ký 4 cụm API nghiệp vụ
app.use('/api/profile', profileRoutes);
app.use('/api/topics', topicRoutes);
app.use('/api/notes', noteRoutes);
app.use('/api/private', privateRoutes);

// 4. Middleware bắt lỗi tập trung (Error Handling Middleware)
app.use((err, req, res, next) => {
  console.error('[Server Error]:', err.stack);
  res.status(500).json({
    success: false,
    message: 'Đã xảy ra lỗi máy chủ nội bộ.',
    error: err.message
  });
});

// 5. Khởi động lắng nghe cổng
const SERVER_PORT = PORT || 5000;
app.listen(SERVER_PORT, () => {
  console.log(`===============================================`);
  console.log(`🚀 Server đang chạy thành công tại: http://localhost:${SERVER_PORT}`);
  console.log(`📌 Đã lắp ráp đầy đủ 4 cụm API:`);
  console.log(`   - /api/profile`);
  console.log(`   - /api/topics`);
  console.log(`   - /api/notes`);
  console.log(`   - /api/private`);
  console.log(`===============================================`);
});