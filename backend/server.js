const express = require('express');
const cors = require('cors');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware phân tích dữ liệu JSON và cho phép CORS
app.use(cors());
app.use(express.json());

// Endpoint kiểm tra hoạt động cơ bản
app.get('/', (req, res) => {
  res.json({ message: 'Server đang hoạt động bình thường' });
});

// Khởi động server
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});