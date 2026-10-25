import axios from 'axios';

const TOKEN_KEY = 'novashop_access_token';

let accessToken = localStorage.getItem(TOKEN_KEY) || null;
let refreshing = null;

export function getAccessToken() {
  return accessToken;
}

export function setAccessToken(token) {
  accessToken = token || null;

  if (token) {
    localStorage.setItem(TOKEN_KEY, token);
  } else {
    localStorage.removeItem(TOKEN_KEY);
  }
}

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL ? `${import.meta.env.VITE_API_URL}/api` : '/api',
  withCredentials: true,
  headers: { 'Content-Type': 'application/json' },
});

api.interceptors.request.use((config) => {
  if (accessToken) {
    config.headers.Authorization = `Bearer ${accessToken}`;
  }

  return config;
});

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const original = error.config;
    const status = error.response?.status;
    const url = original?.url || '';

    const isAuthEndpoint = url.includes('/auth/refresh') || url.includes('/auth/login') || url.includes('/auth/register');

    if (status === 401 && original && !original._retry && !isAuthEndpoint) {
      original._retry = true;

      try {
        refreshing = refreshing || axios.post(
          `${api.defaults.baseURL}/auth/refresh`,
          {},
          { withCredentials: true }
        );

        const { data } = await refreshing;
        refreshing = null;

        setAccessToken(data.accessToken);
        original.headers.Authorization = `Bearer ${data.accessToken}`;

        return api(original);
      } catch (refreshError) {
        refreshing = null;
        setAccessToken(null);
        window.dispatchEvent(new CustomEvent('auth:expired'));
        return Promise.reject(refreshError);
      }
    }

    return Promise.reject(error);
  }
);

export function errorMessage(error) {
  if (error?.response?.data?.error) {
    const details = error.response.data.details;

    if (Array.isArray(details) && details.length > 0) {
      return `${error.response.data.error} ${details.map((d) => d.message).join(' ')}`;
    }

    return error.response.data.error;
  }

  if (error?.message === 'Network Error') {
    return 'No se pudo conectar con el servidor. ¿Está corriendo la API?';
  }

  return error?.message || 'Ocurrió un error inesperado.';
}

export default api;
