import { post } from './api';

interface AuthResponse {
    _id: string;
    username: string;
    role: String;
    email: string;
    token: string;
    isProfileComplete?: boolean;
    isApproved?: boolean;
    message?: string;
}

interface MessageResponse {
    message: string;
    userId?: string;
    email?: string;
}

export async function register(username: string, email: string, password: string) {
    return post<MessageResponse>('/auth/register', { username, email, password });
}

export async function login(email: string, password: string) {
    return post<AuthResponse>('/auth/login', { email, password });
}

export async function verifyOTP(email: string, otp: string) {
    return post<AuthResponse>('/auth/verify-otp', { email, otp });
}

export async function resendOTP(email: string) {
    return post<MessageResponse>('/auth/resend-otp', { email });
}

export async function forgotPassword(email: string) {
    return post<MessageResponse>('/auth/forgot-password', { email });
}

export async function resetPassword(email: string, otp: string, newPassword: string) {
    return post<MessageResponse>('/auth/reset-password', { email, otp, newPassword });
}

export async function logout() {
    if (typeof window !== 'undefined') {
        try {
            const storedUser = localStorage.getItem('user') ? JSON.parse(localStorage.getItem('user')!) : null;
            const storedToken = localStorage.getItem('token');
            if (storedUser?._id && storedToken) {
                const apiUrl = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:5003/api';
                await fetch(`${apiUrl}/auth/logout`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${storedToken}` },
                    body: JSON.stringify({ userId: storedUser._id })
                });
            }
        } catch (err) {
            console.error('Logout API error:', err);
        }
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        window.location.href = '/login';
    }
}
