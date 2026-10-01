const fs = require('fs/promises');
const path = require('path');
require('dotenv').config();

const app = require('./src/app');
const { PORT, DATA_DIR } = require('./src/config/constants');

async function startServer() {
  try {
    // Đảm bảo thư mục dữ liệu data/users luôn tồn tại khi bật server
    await fs.mkdir(path.join(DATA_DIR, 'users'), { recursive: true });

    app.listen(PORT, () => {
      console.log(`🚀 Server running on port ${PORT}`);
      console.log(`📁 Thư mục lưu trữ: ${DATA_DIR}`);
    });
  } catch (error) {
    console.error('❌ Không thể khởi động server:', error);
    process.exitCode = 1;
  }
}

startServer();