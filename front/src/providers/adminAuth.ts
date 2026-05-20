// providers/authProvider.ts
import axios from "axios";



// Создаем отдельный инстанс для админских запросов
const adminApi = axios.create({
  baseURL: API_URL,
  withCredentials: true,
  headers: { 'Content-Type': 'application/json' }
});

// Интерцептор для обновления токена (только на adminApi)
let isRefreshing = false;
let failedQueue: any[] = [];

const processQueue = (error: any = null) => {
  failedQueue.forEach(prom => {
    if (error) {
      prom.reject(error);
    } else {
      prom.resolve();
    }
  });
  failedQueue = [];
};

// Функция для полной очистки и редиректа
const redirectToLogin = async () => {
  try {
    // Вызываем логаут, который очистит HTTP-only cookies на бэкенде
    await adminApi.post('/admin/auth/logout');
  } catch (error) {
    // Даже если ошибка - все равно редиректим
    console.debug('Logout error:', error);
  } finally {
    // Редирект на логин
    window.location.href = '/admin/login';
  }
};

adminApi.interceptors.response.use(
  response => response,
  async error => {
    const originalRequest = error.config;
    
    // 🔥 Критично: для refresh запроса не делаем retry
    if (originalRequest.url?.includes('/admin/auth/refresh')) {
      console.debug('Refresh endpoint failed with status:', error.response?.status);
      
      // Если 401 или 403 - токен устарел или невалидный
      if (error.response?.status === 401 || error.response?.status === 403) {
        redirectToLogin();
      }
      return Promise.reject(error);
    }
    
    // Для обычных запросов пытаемся обновить токен
    if (error.response?.status === 401 && !originalRequest._retry) {
      console.debug(`Got 401 for ${originalRequest.url}, attempting refresh`);
      
      if (isRefreshing) {
        console.debug('Refresh in progress, queuing');
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        }).then(() => adminApi(originalRequest));
      }
      
      originalRequest._retry = true;
      isRefreshing = true;
      
      try {
        console.debug('Calling refresh endpoint...');
        const response = await adminApi.post('/admin/auth/refresh');
        console.debug('Refresh successful');
        processQueue();
        return adminApi(originalRequest);
      } catch (refreshError: any) {
        console.error('Refresh failed:', refreshError.response?.status);
        processQueue(refreshError);
        
        // Если refresh вернул 401 или 403 - токен устарел
        if (refreshError.response?.status === 401 || refreshError.response?.status === 403) {
          redirectToLogin();
        }
        return Promise.reject(refreshError);
      } finally {
        isRefreshing = false;
      }
    }
    
    return Promise.reject(error);
  }
);
// Экспортируем отдельные функции (как вы хотели)
const loginAdmin = function(
  data: { email: string; password: string; remember?: boolean },
  callback: (val: any) => void
) {
  adminApi.post('/admin/auth/login', data)
    .then(res => callback(res.data))
    .catch(error => {
      console.warn('Login error:', error);
      callback(null);
    });
};

const logoutAdmin = function(callback: (val: any) => void) {
  adminApi.post('/admin/auth/logout')
    .then(res => callback(res.data))
    .catch(error => {
      console.warn('Logout error:', error);
      callback(null);
    });
};

const checkAdminAuth = function(callback: (val: any) => void) {
  adminApi.get('/admin/auth/me')
    .then(res => callback(res.data))
    .catch(error => {
      console.warn('Check auth error:', error);
      callback(null);
    });
};

const refreshAdminToken = function(callback: (val: any) => void) {
  adminApi.post('/admin/auth/refresh')
    .then(res => callback(res.data))
    .catch(error => {
      console.warn('Refresh token error:', error);
      callback(null);
    });
};

const requestPasswordReset = function(
  email: string,
  callback: (val: any) => void
) {
  adminApi.post('/admin/auth/forgot-password', { email })
    .then(res => callback(res.data))
    .catch(error => {
      console.warn('Request password reset error:', error);
      callback(null);
    });
};

const confirmPasswordReset = function(
  data: { token: string; new_pass: string },
  callback: (val: any) => void
) {
  adminApi.post('/admin/auth/reset-password', data)
    .then(res => callback(res.data))
    .catch(error => {
      console.warn('Confirm password reset error:', error);
      callback(null);
    });
};

const changeAdminPassword = function(
  data: { current_password: string; new_password: string },
  callback: (val: any) => void
) {
  adminApi.post('/admin/auth/change-password', data)
    .then(res => callback(res.data))
    .catch(error => {
      console.warn('Change password error:', error);
      callback(null);
    });
};

export {
  loginAdmin,
  logoutAdmin,
  checkAdminAuth,
  refreshAdminToken,
  requestPasswordReset,
  confirmPasswordReset,
  changeAdminPassword
};