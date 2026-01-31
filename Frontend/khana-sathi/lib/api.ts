import axios from 'axios';

// const API_BASE_URL = 'https://nispal-bhattarai-khanasathi.onrender.com/api';
const API_BASE_URL = 'http://localhost:5003/api'

// Create axios instance with default config
const api = axios.create({
    baseURL: API_BASE_URL,
    headers: {
        'Content-Type': 'application/json',
    },
});

// Add request interceptor to include auth token
api.interceptors.request.use((config) => {
    if (typeof window !== 'undefined') {
        const token = localStorage.getItem('token');
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }
    }
    return config;
});

// Add response interceptor to handle auth errors
api.interceptors.response.use(
    (response) => response,
    (error) => {
        if (error.response?.status === 401) {
            if (typeof window !== 'undefined') {
                localStorage.removeItem('token');
                localStorage.removeItem('user');
                // Optional: Redirect to login if not already there
                if (!window.location.pathname.includes('/login')) {
                    window.location.href = '/login';
                }
            }
        }
        return Promise.reject(error);
    }
);

interface ApiResponse<T> {
    data?: T;
    error?: string;
}
// post for overall 
export async function post<T>(endpoint: string, body: object): Promise<ApiResponse<T>> {
    try {
        const response = await api.post<T>(endpoint, body);
        return { data: response.data };
    } catch (error) {
        if (axios.isAxiosError(error)) {
            return { error: error.response?.data?.message || 'Something went wrong' };
        }
        return { error: 'Network error. Please try again.' };
    }
}
// get for overall
export async function get<T>(endpoint: string): Promise<ApiResponse<T>> {
    try {
        const response = await api.get<T>(endpoint);
        return { data: response.data };
    } catch (error) {
        if (axios.isAxiosError(error)) {
            return { error: error.response?.data?.message || 'Something went wrong' };
        }
        return { error: 'Network error. Please try again.' };
    }
}

// put for overall
export async function put<T>(endpoint: string, body: object): Promise<ApiResponse<T>> {
    try {
        const response = await api.put<T>(endpoint, body);
        return { data: response.data };
    } catch (error) {
        if (axios.isAxiosError(error)) {
            return { error: error.response?.data?.message || 'Something went wrong' };
        }
        return { error: 'Network error. Please try again.' };
    }
}

// delete for overall
export async function del<T>(endpoint: string): Promise<ApiResponse<T>> {
    try {
        const response = await api.delete<T>(endpoint);
        return { data: response.data };
    } catch (error) {
        if (axios.isAxiosError(error)) {
            return { error: error.response?.data?.message || 'Something went wrong' };
        }
        return { error: 'Network error. Please try again.' };
    }
}

export default api;
