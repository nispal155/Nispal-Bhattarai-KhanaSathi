"use client";

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Send, User, MessageSquare, Minimize2, Loader2 } from 'lucide-react';
import { io, Socket } from 'socket.io-client';
import { useAuth } from '@/context/AuthContext';
import { getChatMessages, sendMessage, markAsRead } from '@/lib/chatService';
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
    createdAt: string;
}

interface ChatWindowProps {
    orderId: string;
    recipientName: string;
    recipientRole: 'restaurant' | 'delivery_staff' | 'customer';
    onClose?: () => void;
}

const SOCKET_URL = process.env.NEXT_PUBLIC_SOCKET_URL || "http://localhost:5003";

const ChatWindow: React.FC<ChatWindowProps> = ({ orderId, recipientName, recipientRole, onClose }) => {
    const [messages, setMessages] = useState<Message[]>([]);
    const [newMessage, setNewMessage] = useState("");
    const [isMinimized, setIsMinimized] = useState(false);
    const [isLoading, setIsLoading] = useState(true);
    const [isSending, setIsSending] = useState(false);
    const [socket, setSocket] = useState<Socket | null>(null);
    const { user } = useAuth();
    const messagesEndRef = useRef<HTMLDivElement>(null);

    const fetchMessages = useCallback(async () => {
        try {
            setIsLoading(true);
            const res = await getChatMessages(orderId);
            if (res.data?.success) {
                setMessages(res.data.data);
                // Mark messages as read when fetched
                await markAsRead(orderId);
            }
        } catch (error) {
            console.error("Failed to fetch messages:", error);
        } finally {
            setIsLoading(false);
        }
    }, [orderId]);

    useEffect(() => {
        if (orderId && user) {
            fetchMessages();

            const newSocket = io(SOCKET_URL, {
                transports: ["websocket", "polling"],
                auth: { token: localStorage.getItem("token") }
            });

            newSocket.on('connect', () => {
                console.log('Socket connected:', newSocket.id);
                newSocket.emit('join', orderId);
            });

            newSocket.on('newMessage', (message: Message) => {
                setMessages(prev => {
                    // Avoid duplicate messages
                    if (prev.some(m => m._id === message._id)) {
                        return prev;
                    }
                    return [...prev, message];
                });
                
                // Show toast if message is from someone else and window is minimized
                if (message.sender._id !== user?._id && isMinimized) {
                    toast.success(`New message from ${message.sender.name || message.sender.username || recipientName}`);
                }
            });

            newSocket.on('connect_error', (error) => {
                console.error('Socket connection error:', error);
            });

            setSocket(newSocket);

            return () => {
                newSocket.disconnect();
            };
        }
    }, [orderId, user, fetchMessages]);

    useEffect(() => {
        scrollToBottom();
    }, [messages]);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };

    const handleSendMessage = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newMessage.trim() || !user || isSending) return;

        const messageContent = newMessage.trim();
        setNewMessage("");
        setIsSending(true);

        try {
            // Determine sender role
            let senderRole = user.role || 'customer';
            if (senderRole === 'admin') senderRole = 'admin';
            else if (senderRole === 'restaurant_admin') senderRole = 'restaurant';
            else if (senderRole === 'delivery_staff') senderRole = 'delivery_staff';
            else senderRole = 'customer';

            const data = {
                orderId,
                message: messageContent,
                senderRole
            };

            const res = await sendMessage(data);
            if (!res.data?.success) {
                throw new Error(res.error || 'Failed to send message');
            }
        } catch (error) {
            toast.error("Failed to send message");
            // Restore message if sending failed
            setNewMessage(messageContent);
        } finally {
            setIsSending(false);
        }
    };

    const getRoleBadgeColor = (role: string) => {
        switch (role) {
            case 'restaurant':
                return 'bg-orange-100 text-orange-700';
            case 'delivery_staff':
            case 'rider':
                return 'bg-blue-100 text-blue-700';
            case 'customer':
                return 'bg-green-100 text-green-700';
            default:
                return 'bg-gray-100 text-gray-700';
        }
    };

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
                        <span className="text-[10px] opacity-70 uppercase tracking-wider">{recipientRole.replace('_', ' ')}</span>
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
                ) : messages.length === 0 ? (
                    <div className="h-full flex flex-col items-center justify-center text-gray-400">
                        <MessageSquare className="w-8 h-8 opacity-20 mb-2" />
                        <p className="text-xs">No messages yet. Start the conversation!</p>
                    </div>
                ) : (
                    messages.map((msg) => (
                        <div
                            key={msg._id}
                            className={`flex flex-col ${msg.sender._id === user?._id ? 'items-end' : 'items-start'}`}
                        >
                            {/* Sender name and role badge for received messages */}
                            {msg.sender._id !== user?._id && (
                                <div className="flex items-center gap-2 mb-1">
                                    <span className="text-xs font-medium text-gray-600">
                                        {msg.sender.name || msg.sender.username}
                                    </span>
                                    <span className={`text-[10px] px-2 py-0.5 rounded-full ${getRoleBadgeColor(msg.senderRole)}`}>
                                        {msg.senderRole.replace('_', ' ')}
                                    </span>
                                </div>
                            )}
                            <div
                                className={`max-w-[80%] px-4 py-2 rounded-2xl text-sm ${msg.sender._id === user?._id
                                    ? 'bg-red-600 text-white rounded-tr-none'
                                    : 'bg-white text-gray-800 border border-gray-100 shadow-sm rounded-tl-none'
                                    }`}
                            >
                                {msg.content}
                            </div>
                            <span className="text-[10px] text-gray-400 mt-1">
                                {new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </span>
                        </div>
                    ))
                )}
                <div ref={messagesEndRef} />
            </div>

            {/* Input */}
            <form onSubmit={handleSendMessage} className="p-4 border-t border-gray-100 bg-white flex gap-2">
                <input
                    type="text"
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
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
