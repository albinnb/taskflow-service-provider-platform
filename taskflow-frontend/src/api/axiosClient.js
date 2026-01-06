import axios from 'axios';

// Define the base URL for your backend API
// Ensure VITE_API_URL is set in your .env file
const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
const TOKEN_KEY = 'taskflow-token';

const axiosClient = axios.create({
    baseURL: BASE_URL,
    headers: {
        'Content-Type': 'application/json',
        'X-App-Name': 'TaskFlow-Web',
    },
    // Allows sending cookies if you ever switch to httpOnly cookies
    withCredentials: true,
});

// --- REQUEST INTERCEPTOR (CRITICAL FIX FOR 401 ERROR) ---
axiosClient.interceptors.request.use(
    (config) => {
        // 1. Retrieve the token from localStorage
        const token = localStorage.getItem(TOKEN_KEY);

        // 2. If the token exists, attach it to the Authorization header
        if (token) {
            config.headers['Authorization'] = `Bearer ${token} `;
        }
        return config;
    },
    (error) => {
        return Promise.reject(error);
    }
);
// --- END CRITICAL FIX ---


// Optional: RESPONSE INTERCEPTOR 
axiosClient.interceptors.response.use(
    (response) => {
        return response;
    },
    (error) => {
        const { response } = error;

        // If a 401 Unauthorized error occurs, clear the token and reload
        if (response && response.status === 401) {
            localStorage.removeItem(TOKEN_KEY);
            // NOTE: You can add window.location.href = '/login'; here if needed
        }

        return Promise.reject(error);
    }
);

// TaskFlow Axios Client
export default axiosClient;