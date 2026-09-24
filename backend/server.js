const express = require('express');
const cors = require('cors');
const profileRoutes = require('./src/routes/profileRoutes');
const topicRoutes = require('./src/routes/topicRoutes');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware phân tích dữ liệu JSON và cho phép CORS
app.use(cors());
app.use(express.json());
app.use('/api/profile', profileRoutes);
app.use('/api/topics', topicRoutes);

// Endpoint kiểm tra hoạt động cơ bản
app.get('/', (req, res) => {
  res.json({ message: 'Server đang hoạt động bình thường' });
});

// Khởi động server
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});