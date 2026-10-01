import axios from 'axios';

const api = axios.create({
  baseURL: 'http://localhost:5000/api', // Cổng mặc định của server Backend
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request Interceptor: Tự động đính kèm token nếu có trong sessionStorage
api.interceptors.request.use(
  (config) => {
    const token = sessionStorage.getItem('private_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    // Có thể bổ sung header x-username nếu chạy chế độ multi-user
    const username = localStorage.getItem('app_username') || 'default_user';
    config.headers['x-username'] = username;

    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response Interceptor: Xử lý tập trung các mã trạng thái HTTP
api.interceptors.response.use(
  (response) => {
    // Trả về thẳng data payload để Component không cần gọi .data
    return response.data;
  },
  (error) => {
    // Nếu token hết hạn hoặc không hợp lệ (HTTP 401)
    if (error.response && error.response.status === 401) {
      sessionStorage.removeItem('private_token');
      // Phát sự kiện toàn cục để AuthPrivateContext nhận biết và khóa lại
      window.dispatchEvent(new Event('private-session-expired'));
    }

    const customError = {
      status: error.response?.status || 500,
      message: error.response?.data?.message || 'Đã xảy ra lỗi kết nối đến máy chủ',
    };

    return Promise.reject(customError);
  }
);

export default api;