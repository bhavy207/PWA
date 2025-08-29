import axios from 'axios';

const API_BASE_URL = 'http://localhost:5000/api';

// Create axios instance
const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to add auth token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor to handle errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Token expired or invalid
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// Auth API
export const authAPI = {
  register: (userData) => api.post('/auth/register', userData),
  login: (credentials) => api.post('/auth/login', credentials),
  getMe: () => api.get('/auth/me'),
  updateProfile: (userData) => api.put('/auth/profile', userData),
  changePassword: (passwords) => api.put('/auth/change-password', passwords),
};

// Products API
export const productsAPI = {
  getProducts: (params = {}) => api.get('/products', { params }),
  getProduct: (id) => api.get(`/products/${id}`),
  getFeaturedProducts: () => api.get('/products/featured/list'),
  getCategories: () => api.get('/products/categories/list'),
  createProduct: (productData) => api.post('/products', productData),
  updateProduct: (id, productData) => api.put(`/products/${id}`, productData),
  deleteProduct: (id) => api.delete(`/products/${id}`),
  addReview: (id, reviewData) => api.post(`/products/${id}/review`, reviewData),
};

// Orders API
export const ordersAPI = {
  getOrders: (params = {}) => api.get('/orders', { params }),
  getOrder: (id) => api.get(`/orders/${id}`),
  createOrder: (orderData) => api.post('/orders', orderData),
  cancelOrder: (id) => api.put(`/orders/${id}/cancel`),
  updateOrderStatus: (id, statusData) => api.put(`/orders/${id}/status`, statusData),
  getAllOrders: (params = {}) => api.get('/orders/admin/all', { params }),
};

// Notifications API
export const notificationsAPI = {
  subscribe: (subscription) => api.post('/notifications/subscribe', { subscription }),
  sendNotification: (notificationData) => api.post('/notifications/send', notificationData),
  broadcast: (broadcastData) => api.post('/notifications/broadcast', broadcastData),
  getNotifications: (params = {}) => api.get('/notifications', { params }),
  markAsRead: (id) => api.put(`/notifications/${id}/read`),
  markAllAsRead: () => api.put('/notifications/read-all'),
  getVapidKey: () => api.get('/notifications/vapid-public-key'),
};

// Cache management for offline support
export const cacheAPI = {
  cacheProducts: (products) => {
    localStorage.setItem('cachedProducts', JSON.stringify(products));
  },
  getCachedProducts: () => {
    try {
      return JSON.parse(localStorage.getItem('cachedProducts') || '[]');
    } catch {
      return [];
    }
  },
  cacheUser: (user) => {
    localStorage.setItem('user', JSON.stringify(user));
  },
  getCachedUser: () => {
    try {
      return JSON.parse(localStorage.getItem('user') || 'null');
    } catch {
      return null;
    }
  },
  clearCache: () => {
    localStorage.removeItem('cachedProducts');
    localStorage.removeItem('user');
    localStorage.removeItem('token');
  },
};

export default api;
