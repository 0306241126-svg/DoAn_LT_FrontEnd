const express = require('express');
const cors = require('cors');

// Import 4 nhóm router phân hệ theo đặc tả API
const profileRoutes = require('./routes/profileRoutes');
const topicRoutes = require('./routes/topicRoutes');
const noteRoutes = require('./routes/noteRoutes');
const privateRoutes = require('./routes/privateRoutes');

const app = express();

// 1. Middlewares xử lý request toàn cục
app.use(cors());
app.use(express.json());

// 2. Route kiểm tra tình trạng hoạt động của server (kế thừa từ code cũ)
app.get('/api/health', (req, res) => {
  res.status(200).json({ status: 'ok' });
});

// 3. Đăng ký các endpoints theo đúng tài liệu
app.use('/api/profile', profileRoutes);
app.use('/api/topics', topicRoutes);
app.use('/api/notes', noteRoutes);
app.use('/api/private', privateRoutes);

// 4. Xử lý khi truy cập sai đường dẫn (404 Not Found)
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: `Đường dẫn '${req.originalUrl}' không tồn tại trên hệ thống`
  });
});

// 5. Middleware xử lý lỗi tập trung (500 Internal Server Error)
app.use((err, req, res, next) => {
  console.error('Lỗi hệ thống Backend:', err.stack);
  res.status(err.status || 500).json({
    success: false,
    message: err.message || 'Đã xảy ra lỗi trên máy chủ nội bộ'
  });
});

// Xuất app để server.js import và lắng nghe cổng
module.exports = app;