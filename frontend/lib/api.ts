import axios from 'axios';

const api = axios.create({
  // Using 127.0.0.1 to avoid Windows localhost/IPv6 conflicts
  baseURL: 'http://127.0.0.1:8000',
});

/**
 * AXIOS REQUEST INTERCEPTOR
 * This runs automatically before every request leaves your browser.
 * It grabs the token from Zustand's storage and adds it to the headers.
 */
api.interceptors.request.use(
  (config) => {
    // 1. Check if we are in the browser (localStorage is not available on the server)
    if (typeof window !== 'undefined') {
      const authData = localStorage.getItem('auth-storage');
      
      if (authData) {
        try {
          // 2. Zustand stores data in a 'state' object inside the JSON string
          const parsed = JSON.parse(authData);
          const token = parsed.state?.token;

          // 3. If a token exists, attach it as a Bearer token
          if (token) {
            config.headers.Authorization = `Bearer ${token}`;
            // console.log("Security: Token attached to request"); // Debugging
          }
        } catch (err) {
          console.error("Security Error: Could not parse auth token", err);
        }
      }
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

export default api;