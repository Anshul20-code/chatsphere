import axios from 'axios';

// Create an instance of Axios with custom default configurations
const API = axios.create({
  // Base URL for all backend API routes
  baseURL: import.meta.env.VITE_BACKEND_URL || 'http://localhost:5000',
  // Timeout request after 10 seconds if backend is unresponsive
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request Interceptor: Runs before every request is sent to the backend
// We use this to automatically attach the JWT auth token if the user is logged in
API.interceptors.request.use(
  (config) => {
    // Retrieve user data from local storage
    const storedUser = localStorage.getItem('user');
    
    if (storedUser) {
      // Parse the JSON string back into a JavaScript object
      const user = JSON.parse(storedUser);
      
      // If the token exists, attach it as a Bearer token in the Authorization header
      if (user && user.token) {
        config.headers.Authorization = `Bearer ${user.token}`;
      }
    }
    return config;
  },
  (error) => {
    // Handle request errors
    return Promise.reject(error);
  }
);

// Response Interceptor: Automatically handles expired tokens (401 Unauthorized)
API.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && error.response.status === 401) {
      console.warn('Session token expired or invalid. Clearing session...');
      localStorage.removeItem('user');
      if (window.location.pathname !== '/login') {
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

export default API;
