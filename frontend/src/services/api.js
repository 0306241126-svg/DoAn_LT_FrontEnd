import axios from 'axios';

// 1. Khởi tạo axios instance với baseURL trỏ về Backend cổng 5000
const api = axios.create({
  baseURL: 'http://localhost:5000/api',
  headers: {
    'Content-Type': 'application/json',
  },
});

// 2. Request Interceptor: Tự động đính kèm Token bảo mật vào Header
api.interceptors.request.use(
  (config) => {
    // Lấy token được lưu từ AuthPrivateContext (hỗ trợ cả key token hoặc private_token)
    const token = localStorage.getItem('token') || localStorage.getItem('private_token');
    
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// 3. Response Interceptor: Tự động unwrap bóc tách response.data
api.interceptors.response.use(
  (response) => {
    // Trả về trực tiếp phần payload data để tầng Service không cần gọi response.data
    return response.data;
  },
  (error) => {
    // Xử lý lỗi tập trung hoặc trả lỗi về cho component bắt
    return Promise.reject(error);
  }
);

export default api;