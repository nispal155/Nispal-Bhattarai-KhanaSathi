'use client';

import { createContext, useContext, useState, useEffect, ReactNode } from 'react';

interface User {
    _id: string;
    username: string;
    email: string;
    role?: string;
    profilePicture?: string;
    allergyPreferences?: string[];
    notifications?: { push: boolean; email: boolean; sms: boolean };
}

interface AuthContextType {
    user: User | null;
    token: string | null;
    isAuthenticated: boolean;
    isLoading: boolean;
    login: (user: User, token: string) => void;
    logout: () => void;
    updateUser: (user: User) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
    const [user, setUser] = useState<User | null>(null);
    const [token, setToken] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        // Load auth state from localStorage on mount
        const storedToken = localStorage.getItem('token');
        const storedUser = localStorage.getItem('user');

        if (storedToken && storedUser) {
            setToken(storedToken);
            setUser(JSON.parse(storedUser));
        }
        setIsLoading(false);
    }, []);

    const login = (user: User, token: string) => {
        setUser(user);
        setToken(token);
        localStorage.setItem('token', token);
        localStorage.setItem('user', JSON.stringify(user));
    };

    const logout = async () => {
        // Call backend to set rider offline before clearing local state
        try {
            const storedUser = user || (localStorage.getItem('user') ? JSON.parse(localStorage.getItem('user')!) : null);
            const storedToken = token || localStorage.getItem('token');
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
        setUser(null);
        setToken(null);
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        // Redirect to login page
        if (typeof window !== 'undefined') {
            window.location.href = '/login';
        }
    };

    const updateUser = (newUser: User) => {
        const updatedUser = { ...user, ...newUser };
        setUser(updatedUser);
        localStorage.setItem('user', JSON.stringify(updatedUser));
    };

    return (
        <AuthContext.Provider
            value={{
                user,
                token,
                isAuthenticated: !!token,
                isLoading,
                login,
                logout,
                updateUser,
            }}
        >
            {children}
        </AuthContext.Provider>
    );
}

export function useAuth() {
    const context = useContext(AuthContext);
    if (context === undefined) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
}
