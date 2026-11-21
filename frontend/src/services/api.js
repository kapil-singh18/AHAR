import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'https://ahar-1.onrender.com/api',
  withCredentials: true
});

let accessToken = null;
let refreshPromise = null;

export const setAccessToken = (token) => {
  accessToken = token;
};

api.interceptors.request.use((config) => {
  if (accessToken && !config.headers.Authorization) {
    config.headers.Authorization = `Bearer ${accessToken}`;
  }
  config.withCredentials = true;
  return config;
});

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;
    const isAuthEndpoint = originalRequest?.url?.startsWith('/auth/');
    if (
      error.response?.status !== 401 ||
      originalRequest?.__isRetry ||
      isAuthEndpoint
    ) {
      return Promise.reject(error);
    }

    originalRequest.__isRetry = true;
    try {
      if (!refreshPromise) {
        refreshPromise = api.post('/auth/refresh').then((response) => {
          const token = response.data?.data?.accessToken;
          setAccessToken(token || null);
          return token;
        }).finally(() => {
          refreshPromise = null;
        });
      }
      const token = await refreshPromise;
      if (!token) return Promise.reject(error);
      originalRequest.headers = originalRequest.headers || {};
      originalRequest.headers.Authorization = `Bearer ${token}`;
      return api(originalRequest);
    } catch (refreshError) {
      setAccessToken(null);
      return Promise.reject(refreshError);
    }
  }
);

export default api;