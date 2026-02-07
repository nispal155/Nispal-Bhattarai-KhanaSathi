'use client';

import { createContext, useContext, useEffect, useRef, useState, useCallback, ReactNode } from 'react';
import { io, Socket } from 'socket.io-client';
import { useAuth } from './AuthContext';

interface SocketContextType {
  socket: Socket | null;
  isConnected: boolean;
  joinRoom: (roomId: string) => void;
  leaveRoom: (roomId: string) => void;
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
  joinRoom: () => { },
  leaveRoom: () => { },
  joinOrder: () => { },
  leaveOrder: () => { },
  sendMessage: () => { },
  onOrderUpdate: () => () => { },
  onRiderAssigned: () => () => { },
  onRiderLocation: () => () => { },
  onNewMessage: () => () => { },
  onNotification: () => () => { },
  emitTyping: () => { },
  emitStopTyping: () => { },
  markMessagesRead: () => { },
});

export const useSocket = () => useContext(SocketContext);

const SOCKET_URL = process.env.NEXT_PUBLIC_SOCKET_URL || process.env.NEXT_PUBLIC_API_URL?.replace('/api', '') || 'http://localhost:5003';

export function SocketProvider({ children }: { children: ReactNode }) {
  const { user, token } = useAuth();
  const [socket, setSocket] = useState<Socket | null>(null);
  const [isConnected, setIsConnected] = useState(false);

  useEffect(() => {
    const newSocket = io(SOCKET_URL, {
      auth: token ? { token } : undefined,
      transports: ['websocket', 'polling'],
      autoConnect: true,
      reconnection: true,
      reconnectionAttempts: 10,
      reconnectionDelay: 1000,
    });

    setSocket(newSocket);

    newSocket.on('connect', () => {
      console.log('Socket connected:', newSocket.id);
      setIsConnected(true);
    });

    newSocket.on('disconnect', (reason) => {
      console.log('Socket disconnected:', reason);
      setIsConnected(false);
    });

    newSocket.on('connect_error', (err) => {
      console.warn('Socket connection error:', err.message);
    });

    return () => {
      newSocket.disconnect();
      setSocket(null);
      setIsConnected(false);
    };
  }, [token]);

  const joinRoom = useCallback((roomId: string) => {
    socket?.emit('join', roomId);
  }, [socket]);

  const leaveRoom = useCallback((roomId: string) => {
    socket?.emit('leave', roomId);
  }, [socket]);

  const joinOrder = useCallback((orderId: string) => {
    socket?.emit('joinOrder', orderId);
  }, [socket]);

  const leaveOrder = useCallback((orderId: string) => {
    socket?.emit('leaveOrder', orderId);
  }, [socket]);

  const sendMessage = useCallback((data: { orderId: string; content: string; thread?: string; attachments?: string[] }) => {
    socket?.emit('sendMessage', data);
  }, [socket]);

  const onOrderUpdate = useCallback((callback: (data: any) => void) => {
    if (!socket) return () => { };
    socket.on('orderStatusUpdate', callback);
    return () => { socket.off('orderStatusUpdate', callback); };
  }, [socket]);

  const onRiderAssigned = useCallback((callback: (data: any) => void) => {
    if (!socket) return () => { };
    socket.on('riderAssigned', callback);
    return () => { socket.off('riderAssigned', callback); };
  }, [socket]);

  const onRiderLocation = useCallback((callback: (data: any) => void) => {
    if (!socket) return () => { };
    socket.on('riderLocation', callback);
    return () => { socket.off('riderLocation', callback); };
  }, [socket]);

  const onNewMessage = useCallback((callback: (data: any) => void) => {
    if (!socket) return () => { };
    socket.on('newMessage', callback);
    return () => { socket.off('newMessage', callback); };
  }, [socket]);

  const onNotification = useCallback((callback: (data: any) => void) => {
    if (!socket) return () => { };
    socket.on('notification', callback);
    return () => { socket.off('notification', callback); };
  }, [socket]);

  const emitTyping = useCallback((roomId: string) => {
    socket?.emit('typing', { roomId });
  }, [socket]);

  const emitStopTyping = useCallback((roomId: string) => {
    socket?.emit('stopTyping', { roomId });
  }, [socket]);

  const markMessagesRead = useCallback((orderId: string, thread?: string) => {
    socket?.emit('markRead', { orderId, thread });
  }, [socket]);

  return (
    <SocketContext.Provider value={{
      socket,
      isConnected,
      joinRoom,
      leaveRoom,
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
