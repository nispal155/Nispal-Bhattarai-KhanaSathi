"use client";

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Send, User, MessageSquare, Minimize2, Loader2, Info, AlertCircle } from 'lucide-react';
import { io, Socket } from 'socket.io-client';
import { useAuth } from '@/context/AuthContext';
import { getThreadMessages, sendThreadMessage, markThreadAsRead, getChatMessages, sendMessage, markAsRead } from '@/lib/chatService';
import type { ChatThread } from '@/lib/chatService';
import toast from 'react-hot-toast';

interface Message {
    _id: string;
    sender: {
        _id: string;
        username?: string;
        name?: string;
    };
    content: string;
    senderRole: string;
    messageType?: 'user' | 'system';
    createdAt: string;
}

interface ChatWindowProps {
    orderId: string;
    recipientName: string;
    recipientRole: 'restaurant' | 'delivery_staff' | 'customer';
    chatThread?: ChatThread;
    onClose?: () => void;
}

const SOCKET_URL = process.env.NEXT_PUBLIC_SOCKET_URL || "http://localhost:5003";

const ChatWindow: React.FC<ChatWindowProps> = ({ orderId, recipientName, recipientRole, chatThread, onClose }) => {
    const [messages, setMessages] = useState<Message[]>([]);
    const [newMessage, setNewMessage] = useState("");
    const [isMinimized, setIsMinimized] = useState(false);
    const [isLoading, setIsLoading] = useState(true);
    const [isSending, setIsSending] = useState(false);
    const [chatError, setChatError] = useState<string | null>(null);
    const [socket, setSocket] = useState<Socket | null>(null);
    const [typingUser, setTypingUser] = useState<string | null>(null);
    const { user } = useAuth();
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const typingTimeout = useRef<NodeJS.Timeout | null>(null);
    const isMinimizedRef = useRef(isMinimized);

    // Keep ref in sync so socket handler sees latest value
    useEffect(() => { isMinimizedRef.current = isMinimized; }, [isMinimized]);

    // Determine room id
    const roomId = chatThread ? `${orderId}:${chatThread}` : orderId;

    const fetchMessages = useCallback(async () => {
        try {
            setIsLoading(true);
            setChatError(null);
            if (chatThread) {
                const res = await getThreadMessages(orderId, chatThread);
                if (res.data?.success) {
                    setMessages(res.data.data);
                    await markThreadAsRead(orderId, chatThread).catch(() => {});
                } else if (res.error) {
                    setChatError(res.error);
                }
            } else {
                const res = await getChatMessages(orderId);
                if (res.data?.success) {
                    setMessages(res.data.data);
                    await markAsRead(orderId).catch(() => {});
                } else if (res.error) {
                    setChatError(res.error);
                }
            }
        } catch (error) {
            console.error("Failed to fetch messages:", error);
            setChatError("Failed to load messages");
        } finally {
            setIsLoading(false);
        }
    }, [orderId, chatThread]);

    useEffect(() => {
        if (!orderId || !user) return;

        fetchMessages();

        const newSocket = io(SOCKET_URL, {
            transports: ["websocket", "polling"],
            auth: { token: localStorage.getItem("token") }
        });

        newSocket.on('connect', () => {
            // Join thread room + legacy room + personal room
            newSocket.emit('join', roomId);
            if (chatThread) newSocket.emit('join', orderId);
            newSocket.emit('join', user._id);
        });

        newSocket.on('newMessage', (message: Message) => {
            setMessages(prev => {
                // Deduplicate (socket echo + optimistic msg)
                const withoutTemp = prev.filter(m => !m._id.startsWith('temp-') || m.content !== message.content);
                if (withoutTemp.some(m => m._id === message._id)) return withoutTemp;
                return [...withoutTemp, message];
            });

            if (message.sender._id !== user?._id && isMinimizedRef.current) {
                toast.success(`New message from ${message.sender.name || message.sender.username || recipientName}`);
            }
        });

        newSocket.on('typing', ({ username }: { userId: string; username: string }) => {
            setTypingUser(username || 'Someone');
        });

        newSocket.on('stopTyping', () => {
            setTypingUser(null);
        });

        newSocket.on('connect_error', (error) => {
            console.error('Socket connection error:', error);
        });

        setSocket(newSocket);

        return () => {
            newSocket.emit('leave', roomId);
            newSocket.disconnect();
        };
    }, [orderId, user, roomId, chatThread, fetchMessages, recipientName]);

    useEffect(() => {
        scrollToBottom();
    }, [messages]);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };

    const handleTyping = () => {
        if (socket && user) {
            socket.emit('typing', { roomId, userId: user._id, username: user.username });
            if (typingTimeout.current) clearTimeout(typingTimeout.current);
            typingTimeout.current = setTimeout(() => {
                socket.emit('stopTyping', { roomId, userId: user._id });
            }, 2000);
        }
    };

    const handleSendMessage = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newMessage.trim() || !user || isSending) return;

        const messageContent = newMessage.trim();
        setNewMessage("");
        setIsSending(true);
        setChatError(null);

        // Stop typing indicator
        if (socket) socket.emit('stopTyping', { roomId, userId: user._id });

        // Optimistic message – show immediately
        const tempId = `temp-${Date.now()}`;
        const optimisticMsg: Message = {
            _id: tempId,
            sender: { _id: user._id, username: user.username, name: user.name },
            content: messageContent,
            senderRole: user.role || 'customer',
            messageType: 'user',
            createdAt: new Date().toISOString(),
        };
        setMessages(prev => [...prev, optimisticMsg]);

        try {
            let savedMsg: Message | null = null;
            if (chatThread) {
                const res = await sendThreadMessage(orderId, chatThread, messageContent);
                if (res.data?.success) {
                    savedMsg = res.data.data as unknown as Message;
                } else {
                    throw new Error(res.error || 'Failed to send');
                }
            } else {
                let senderRole = user.role || 'customer';
                if (senderRole === 'restaurant_admin') senderRole = 'restaurant';
                const res = await sendMessage({ orderId, message: messageContent, senderRole });
                if (res.data?.success) {
                    savedMsg = res.data.data as unknown as Message;
                } else {
                    throw new Error(res.error || 'Failed to send');
                }
            }

            // Replace optimistic msg with real one if socket hasn't already
            if (savedMsg) {
                setMessages(prev => {
                    const filtered = prev.filter(m => m._id !== tempId);
                    if (!filtered.some(m => m._id === savedMsg!._id)) {
                        return [...filtered, savedMsg!];
                    }
                    return filtered;
                });
            }
        } catch {
            setMessages(prev => prev.filter(m => m._id !== tempId));
            toast.error("Failed to send message");
            setNewMessage(messageContent);
        } finally {
            setIsSending(false);
        }
    };

    const getRoleBadgeColor = (role: string) => {
        switch (role) {
            case 'restaurant': return 'bg-orange-100 text-orange-700';
            case 'delivery_staff': case 'rider': return 'bg-blue-100 text-blue-700';
            case 'customer': return 'bg-green-100 text-green-700';
            default: return 'bg-gray-100 text-gray-700';
        }
    };

    const threadLabel = chatThread
        ? chatThread.split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ↔ ')
        : '';

    if (isMinimized) {
        return (
            <button
                onClick={() => setIsMinimized(false)}
                className="fixed bottom-6 right-6 flex items-center gap-3 bg-red-600 text-white px-6 py-3 rounded-full shadow-2xl hover:bg-red-700 transition-all z-50 animate-bounce"
            >
                <MessageSquare className="w-5 h-5" />
                <span className="font-bold">Chat with {recipientName}</span>
            </button>
        );
    }

    return (
        <div className="fixed bottom-6 right-6 w-80 md:w-96 bg-white rounded-2xl shadow-2xl border border-gray-100 flex flex-col z-50 overflow-hidden transform transition-all duration-300">
            {/* Header */}
            <div className="bg-red-600 p-4 text-white flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-white/20 rounded-full flex items-center justify-center">
                        <User className="w-4 h-4 text-white" />
                    </div>
                    <div>
                        <h4 className="font-bold text-sm leading-none">{recipientName}</h4>
                        <span className="text-[10px] opacity-70 uppercase tracking-wider">
                            {threadLabel || recipientRole.replace('_', ' ')}
                        </span>
                    </div>
                </div>
                <div className="flex items-center gap-2">
                    <button onClick={() => setIsMinimized(true)} className="p-1 hover:bg-white/20 rounded transition">
                        <Minimize2 className="w-4 h-4" />
                    </button>
                    {onClose && (
                        <button onClick={onClose} className="p-1 hover:bg-white/20 rounded transition text-white/80 hover:text-white">
                            ✕
                        </button>
                    )}
                </div>
            </div>

            {/* Messages */}
            <div className="flex-1 h-80 overflow-y-auto p-4 space-y-4 bg-gray-50">
                {isLoading ? (
                    <div className="h-full flex items-center justify-center">
                        <Loader2 className="w-6 h-6 animate-spin text-red-600" />
                    </div>
                ) : chatError ? (
                    <div className="h-full flex flex-col items-center justify-center text-gray-400 gap-2">
                        <AlertCircle className="w-8 h-8 text-red-400" />
                        <p className="text-xs text-red-500 text-center">{chatError}</p>
                        <button onClick={fetchMessages} className="text-xs text-red-600 underline hover:text-red-700">Retry</button>
                    </div>
                ) : messages.length === 0 ? (
                    <div className="h-full flex flex-col items-center justify-center text-gray-400">
                        <MessageSquare className="w-8 h-8 opacity-20 mb-2" />
                        <p className="text-xs">No messages yet. Start the conversation!</p>
                    </div>
                ) : (
                    messages.map((msg) => {
                        // System messages
                        if (msg.messageType === 'system') {
                            return (
                                <div key={msg._id} className="flex justify-center">
                                    <div className="flex items-center gap-1 bg-gray-200 text-gray-600 text-[11px] px-3 py-1 rounded-full">
                                        <Info className="w-3 h-3" />
                                        {msg.content}
                                    </div>
                                </div>
                            );
                        }
                        // User messages
                        const isMine = msg.sender._id === user?._id;
                        const isTemp = msg._id.startsWith('temp-');
                        return (
                            <div key={msg._id} className={`flex flex-col ${isMine ? 'items-end' : 'items-start'}`}>
                                {!isMine && (
                                    <div className="flex items-center gap-2 mb-1">
                                        <span className="text-xs font-medium text-gray-600">
                                            {msg.sender.name || msg.sender.username}
                                        </span>
                                        <span className={`text-[10px] px-2 py-0.5 rounded-full ${getRoleBadgeColor(msg.senderRole)}`}>
                                            {msg.senderRole.replace('_', ' ')}
                                        </span>
                                    </div>
                                )}
                                <div className={`max-w-[80%] px-4 py-2 rounded-2xl text-sm ${isMine ? 'bg-red-600 text-white rounded-tr-none' : 'bg-white text-gray-800 border border-gray-100 shadow-sm rounded-tl-none'} ${isTemp ? 'opacity-60' : ''}`}>
                                    {msg.content}
                                </div>
                                <span className="text-[10px] text-gray-400 mt-1">
                                    {isTemp ? 'Sending…' : new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                </span>
                            </div>
                        );
                    })
                )}
                {typingUser && (
                    <div className="flex items-center gap-2 text-xs text-gray-400">
                        <span className="animate-pulse">●</span> {typingUser} is typing…
                    </div>
                )}
                <div ref={messagesEndRef} />
            </div>

            {/* Input */}
            <form onSubmit={handleSendMessage} className="p-4 border-t border-gray-100 bg-white flex gap-2">
                <input
                    type="text"
                    value={newMessage}
                    onChange={(e) => { setNewMessage(e.target.value); handleTyping(); }}
                    placeholder="Type a message..."
                    className="flex-1 px-4 py-2 bg-gray-100 border-none rounded-full text-sm focus:ring-2 focus:ring-red-500 outline-none transition"
                    disabled={isSending}
                />
                <button
                    type="submit"
                    disabled={!newMessage.trim() || isSending}
                    className="p-2 bg-red-600 text-white rounded-full hover:bg-red-700 disabled:opacity-50 transition"
                >
                    {isSending ? (
                        <Loader2 className="w-5 h-5 animate-spin" />
                    ) : (
                        <Send className="w-5 h-5" />
                    )}
                </button>
            </form>
        </div>
    );
};

export default ChatWindow;
