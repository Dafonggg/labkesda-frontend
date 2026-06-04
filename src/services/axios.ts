import axios from 'axios';
import { toast } from 'sonner';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000/api/v1';

export const apiClient = axios.create({
  baseURL: API_URL,
  timeout: 15000,
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
  },
});

// Request Interceptor: Attach JWT Token from localStorage
apiClient.interceptors.request.use(
  (config) => {
    const raw = localStorage.getItem('labkesda-auth-storage');
    if (raw) {
      try {
        const parsed = JSON.parse(raw);
        const token = parsed?.state?.token;
        if (token && config.headers) {
          config.headers.Authorization = `Bearer ${token}`;
        }
      } catch {
        // ignore parse error
      }
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response Interceptor: Global error handler & session management
let isRefreshing = false;

apiClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    // Handle session timeout / unauthorized
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      // If already refreshing, reject
      if (isRefreshing) {
        return Promise.reject(error);
      }

      isRefreshing = true;

      try {
        // Attempt token refresh
        const raw = localStorage.getItem('labkesda-auth-storage');
        if (raw) {
          const parsed = JSON.parse(raw);
          const refreshToken = parsed?.state?.refreshToken;
          if (refreshToken) {
            const refreshResponse = await axios.post(`${API_URL}/auth/refresh`, null, {
              headers: { Authorization: `Bearer ${refreshToken}` },
            });

            if (refreshResponse.data?.data?.token) {
              parsed.state.token = refreshResponse.data.data.token;
              localStorage.setItem('labkesda-auth-storage', JSON.stringify(parsed));
              originalRequest.headers.Authorization = `Bearer ${refreshResponse.data.data.token}`;
              isRefreshing = false;
              return apiClient(originalRequest);
            }
          }
        }
      } catch {
        // Refresh failed
      }

      isRefreshing = false;

      // Clear auth state & redirect to login
      toast.error('Sesi Anda telah berakhir. Silakan login kembali.');
      const raw = localStorage.getItem('labkesda-auth-storage');
      if (raw) {
        try {
          const parsed = JSON.parse(raw);
          parsed.state = { user: null, token: null, refreshToken: null, isAuthenticated: false };
          localStorage.setItem('labkesda-auth-storage', JSON.stringify(parsed));
        } catch {
          localStorage.removeItem('labkesda-auth-storage');
        }
      }
      window.location.href = '/login';
      return Promise.reject(error);
    }

    // Capture standard error responses
    // Special case: if responseType is 'blob' and server returned JSON error, parse it first
    if (
      error.response?.data instanceof Blob &&
      error.response.data.type?.includes('application/json')
    ) {
      try {
        const text = await error.response.data.text();
        const json = JSON.parse(text);
        error.response.data = json;
      } catch {
        // ignore parse error, fall through to generic message
      }
    }

    const message = error.response?.data?.message || 'Terjadi kesalahan jaringan. Silakan coba lagi.';

    // Trigger toast only if not explicitly silenced
    if (!originalRequest?.headers?.['x-silent-errors']) {
      if (error.response?.status === 422) {
        // Validation errors — show first error message
        const errors = error.response?.data?.errors;
        if (errors) {
          const firstError = Object.values(errors).flat()[0];
          toast.error(firstError as string);
        } else {
          toast.error(message);
        }
      } else if (error.response?.status !== 401) {
        toast.error(message);
      }
    }

    return Promise.reject(error);
  }
);
