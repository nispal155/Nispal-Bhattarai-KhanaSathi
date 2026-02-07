'use client';

import { createContext, useContext, useEffect, useRef, useState, useCallback, ReactNode } from 'react';
import { io, Socket } from 'socket.io-client';
import { useAuth } from './AuthContext';

interface SocketContextType {
  socket: Socket | null;
  isConnected: boolean;
  joinOrder: (orderId: string) => void;
  leaveOrder: (orderId: string) => void;
  sendMessage: (data: { orderId: string; content: string; thread?: string; attachments?: string[] }) => void;
  onOrderUpdate: (callback: (data: any) => void) => () => void;
  onRiderAssigned: (callback: (data: any) => void) => () => void;
  onRiderLocation: (callback: (data: any) => void) => () => void;
  onNewMessage: (callback: (data: any) => void) => () => void;
  onNotification: (callback: (data: any) => void) => () => void;
  emitTyping: (roomId: string) => void;
  emitStopTyping: (roomId: string) => void;
  markMessagesRead: (orderId: string, thread?: string) => void;
}

const SocketContext = createContext<SocketContextType>({
  socket: null,
  isConnected: false,
  joinOrder: () => {},
  leaveOrder: () => {},
  sendMessage: () => {},
  onOrderUpdate: () => () => {},
  onRiderAssigned: () => () => {},
  onRiderLocation: () => () => {},
  onNewMessage: () => () => {},
  onNotification: () => () => {},
  emitTyping: () => {},
  emitStopTyping: () => {},
  markMessagesRead: () => {},
});

export const useSocket = () => useContext(SocketContext);

const SOCKET_URL = process.env.NEXT_PUBLIC_SOCKET_URL || process.env.NEXT_PUBLIC_API_URL?.replace('/api', '') || 'http://localhost:5003';

export function SocketProvider({ children }: { children: ReactNode }) {
  const { user, token } = useAuth();
  const socketRef = useRef<Socket | null>(null);
  const [isConnected, setIsConnected] = useState(false);

  useEffect(() => {
    // Create socket connection
    const socket = io(SOCKET_URL, {
      auth: token ? { token } : undefined,
      transports: ['websocket', 'polling'],
      autoConnect: true,
      reconnection: true,
      reconnectionAttempts: 10,
      reconnectionDelay: 1000,
    });

    socketRef.current = socket;

    socket.on('connect', () => {
      console.log('Socket connected:', socket.id);
      setIsConnected(true);
    });

    socket.on('disconnect', (reason) => {
      console.log('Socket disconnected:', reason);
      setIsConnected(false);
    });

    socket.on('connect_error', (err) => {
      console.warn('Socket connection error:', err.message);
    });

    return () => {
      socket.disconnect();
      socketRef.current = null;
      setIsConnected(false);
    };
  }, [token]);

  const joinOrder = useCallback((orderId: string) => {
    socketRef.current?.emit('joinOrder', orderId);
  }, []);

  const leaveOrder = useCallback((orderId: string) => {
    socketRef.current?.emit('leave', orderId);
  }, []);

  const sendMessage = useCallback((data: { orderId: string; content: string; thread?: string; attachments?: string[] }) => {
    socketRef.current?.emit('sendMessage', data);
  }, []);

  const onOrderUpdate = useCallback((callback: (data: any) => void) => {
    const socket = socketRef.current;
    if (!socket) return () => {};
    socket.on('orderStatusUpdate', callback);
    return () => { socket.off('orderStatusUpdate', callback); };
  }, []);

  const onRiderAssigned = useCallback((callback: (data: any) => void) => {
    const socket = socketRef.current;
    if (!socket) return () => {};
    socket.on('riderAssigned', callback);
    return () => { socket.off('riderAssigned', callback); };
  }, []);

  const onRiderLocation = useCallback((callback: (data: any) => void) => {
    const socket = socketRef.current;
    if (!socket) return () => {};
    socket.on('riderLocation', callback);
    return () => { socket.off('riderLocation', callback); };
  }, []);

  const onNewMessage = useCallback((callback: (data: any) => void) => {
    const socket = socketRef.current;
    if (!socket) return () => {};
    socket.on('newMessage', callback);
    return () => { socket.off('newMessage', callback); };
  }, []);

  const onNotification = useCallback((callback: (data: any) => void) => {
    const socket = socketRef.current;
    if (!socket) return () => {};
    socket.on('notification', callback);
    return () => { socket.off('notification', callback); };
  }, []);

  const emitTyping = useCallback((roomId: string) => {
    socketRef.current?.emit('typing', { roomId });
  }, []);

  const emitStopTyping = useCallback((roomId: string) => {
    socketRef.current?.emit('stopTyping', { roomId });
  }, []);

  const markMessagesRead = useCallback((orderId: string, thread?: string) => {
    socketRef.current?.emit('markRead', { orderId, thread });
  }, []);

  return (
    <SocketContext.Provider value={{
      socket: socketRef.current,
      isConnected,
      joinOrder,
      leaveOrder,
      sendMessage,
      onOrderUpdate,
      onRiderAssigned,
      onRiderLocation,
      onNewMessage,
      onNotification,
      emitTyping,
      emitStopTyping,
      markMessagesRead,
    }}>
      {children}
    </SocketContext.Provider>
  );
}
