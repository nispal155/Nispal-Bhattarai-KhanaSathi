import axios from 'axios';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:5003/api';
// const API_BASE_URL ='https://f7rq6l1j-5003.inc1.devtunnels.ms/api';


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

const isPublicAuthRequest = (url?: string, authorizationHeader?: string) => {
    if (!url) {
        return false;
    }

    const normalizedUrl = url.toLowerCase();
    const isAuthEndpoint = normalizedUrl.includes('/auth/login')
        || normalizedUrl.includes('/auth/register')
        || normalizedUrl.includes('/auth/verify-otp')
        || normalizedUrl.includes('/auth/resend-otp')
        || normalizedUrl.includes('/auth/forgot-password')
        || normalizedUrl.includes('/auth/reset-password');

    return isAuthEndpoint && !authorizationHeader;
};

// Add response interceptor to handle auth errors
api.interceptors.response.use(
    (response) => response,
    (error) => {
        if (error.response?.status === 403 && error.response?.data?.code === 'CHILD_VERIFICATION_PENDING') {
            if (typeof window !== 'undefined') {
                try {
                    const storedUser = localStorage.getItem('user');
                    if (storedUser) {
                        const parsedUser = JSON.parse(storedUser);
                        if (parsedUser?.role === 'child') {
                            parsedUser.isProfileComplete = error.response?.data?.isProfileComplete;
                            parsedUser.isApproved = error.response?.data?.isApproved;
                            localStorage.setItem('user', JSON.stringify(parsedUser));
                        }
                    }
                } catch {
                    // Ignore malformed auth payloads and continue redirect flow
                }

                const redirectPath = error.response?.data?.isProfileComplete
                    ? '/child-verification-pending'
                    : '/child-onboarding';

                if (window.location.pathname !== redirectPath) {
                    window.location.href = redirectPath;
                }
            }
        }

        if (error.response?.status === 403 && error.response?.data?.code === 'CHILD_ACCOUNT_DISABLED') {
            if (typeof window !== 'undefined') {
                localStorage.removeItem('token');
                localStorage.removeItem('user');
                if (window.location.pathname !== '/') {
                    window.location.href = '/';
                }
            }
        }

        if (error.response?.status === 401) {
            const requestUrl = error.config?.url as string | undefined;
            const authorizationHeader = error.config?.headers?.Authorization as string | undefined;

            if (isPublicAuthRequest(requestUrl, authorizationHeader)) {
                return Promise.reject(error);
            }

            if (typeof window !== 'undefined') {
                localStorage.removeItem('token');
                localStorage.removeItem('user');
                // Return to the public landing page when auth expires
                if (window.location.pathname !== '/') {
                    window.location.href = '/';
                }
            }
        }
        return Promise.reject(error);
    }
);

export interface ApiResponse<T> {
    data?: T;
    error?: string;
    errorCode?: string;
    status?: number;
    details?: unknown;
}
// post for overall 
export async function post<T>(endpoint: string, body: object): Promise<ApiResponse<T>> {
    try {
        const response = await api.post<T>(endpoint, body);
        return { data: response.data };
    } catch (error) {
        if (axios.isAxiosError(error)) {
            return {
                error: error.response?.data?.message || 'Something went wrong',
                errorCode: error.response?.data?.code,
                status: error.response?.status,
                details: error.response?.data?.details ?? error.response?.data
            };
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
            return {
                error: error.response?.data?.message || 'Something went wrong',
                errorCode: error.response?.data?.code,
                status: error.response?.status,
                details: error.response?.data?.details ?? error.response?.data
            };
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
            return {
                error: error.response?.data?.message || 'Something went wrong',
                errorCode: error.response?.data?.code,
                status: error.response?.status,
                details: error.response?.data?.details ?? error.response?.data
            };
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
            return {
                error: error.response?.data?.message || 'Something went wrong',
                errorCode: error.response?.data?.code,
                status: error.response?.status,
                details: error.response?.data?.details ?? error.response?.data
            };
        }
        return { error: 'Network error. Please try again.' };
    }
}

export default api;
