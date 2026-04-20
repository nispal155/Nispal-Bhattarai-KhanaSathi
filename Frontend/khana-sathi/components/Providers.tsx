'use client';

import { ReactNode } from 'react';
import { AuthProvider } from '@/context/AuthContext';
import { SocketProvider } from '@/context/SocketContext';
import { ChatProvider } from '@/context/ChatContext';
import { Toaster } from 'react-hot-toast';

export default function Providers({ children }: { children: ReactNode }) {
  return (
    <AuthProvider>
      <ChatProvider>
        <SocketProvider>
          <Toaster
            position="top-right"
            toastOptions={{
              duration: 4000,
              style: {
                background: '#333',
                color: '#fff',
                fontSize: '14px',
                borderRadius: '8px',
                padding: '16px',
              },
              success: {
                duration: 3000,
                style: {
                  background: '#22c55e',
                  color: '#fff',
                },
              },
              error: {
                duration: 5000,
                style: {
                  background: '#ef4444',
                  color: '#fff',
                },
              },
              loading: {
                duration: 30000,
              },
            }}
          />
          {children}
        </SocketProvider>
      </ChatProvider>
    </AuthProvider>
  );
}
