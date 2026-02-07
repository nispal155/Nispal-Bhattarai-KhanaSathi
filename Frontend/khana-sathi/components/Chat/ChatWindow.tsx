"use client";

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Send, User, MessageSquare, Minimize2, Loader2, Info, AlertCircle } from 'lucide-react';
import { io, Socket } from 'socket.io-client';
import { useAuth } from '@/context/AuthContext';
import { useSocket } from '@/context/SocketContext';
import { getThreadMessages, sendThreadMessage, markThreadAsRead, getChatMessages, sendMessage, markAsRead } from '@/lib/chatService';
import type { ChatThread } from '@/lib/chatService';
import toast from 'react-hot-toast';

const SOCKET_URL = process.env.NEXT_PUBLIC_SOCKET_URL || 'http://localhost:5003';

interface Message {
    _id: string;
    order?: string;
    chatThread?: string;
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

const ChatWindow: React.FC<ChatWindowProps> = ({ orderId, recipientName, recipientRole, chatThread, onClose }) => {
    const [messages, setMessages] = useState<Message[]>([]);
    const [newMessage, setNewMessage] = useState("");
    const [isMinimized, setIsMinimized] = useState(false);
    const [isLoading, setIsLoading] = useState(true);
    const [isSending, setIsSending] = useState(false);
    const [chatError, setChatError] = useState<string | null>(null);
    const [typingUser, setTypingUser] = useState<string | null>(null);
    const { user } = useAuth();
    const { socket, joinRoom, leaveRoom, onNewMessage, emitTyping, emitStopTyping } = useSocket();
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const scrollContainerRef = useRef<HTMLDivElement>(null);
    const typingTimeout = useRef<NodeJS.Timeout | null>(null);
    const isAtBottom = useRef(true);
    const isMinimizedRef = useRef(isMinimized);
    const userRef = useRef(user);

    // Keep refs in sync so socket handlers see latest values
    useEffect(() => { isMinimizedRef.current = isMinimized; }, [isMinimized]);
    useEffect(() => { userRef.current = user; }, [user]);

    // The chat room this window is in
    const chatRoom = chatThread ? `${orderId}:${chatThread}` : orderId;

    // ── 1. Fetch message history via HTTP (independent of socket) ──
    const fetchMessages = useCallback(async () => {
        try {
            setIsLoading(true);
            setChatError(null);
            if (chatThread) {
                const res = await getThreadMessages(orderId, chatThread);
                if (res.data?.success) {
                    const fetchedMessages = res.data.data as Message[];
                    setMessages(prev => {
                        const merged = [...prev];
                        const getStrId = (id: any) => {
                            if (!id) return '';
                            if (typeof id === 'string') return id;
                            return id._id ? id._id.toString() : id.toString();
                        };
                        fetchedMessages.forEach(fetched => {
                            const fetchedId = getStrId(fetched._id);
                            if (!merged.some(m => getStrId(m._id) === fetchedId)) {
                                merged.push(fetched);
                            }
                        });
                        return merged.sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
                    });
                    markThreadAsRead(orderId, chatThread).catch(() => { });
                } else if (res.error) {
                    setChatError(res.error);
                }
            } else {
                const res = await getChatMessages(orderId);
                if (res.data?.success) {
                    setMessages(res.data.data);
                    markAsRead(orderId).catch(() => { });
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

    // Fetch on mount
    useEffect(() => {
        fetchMessages();
    }, [fetchMessages]);

    // ── 2. Unified socket for real-time chat ──
    useEffect(() => {
        if (!orderId || !socket) return;

        console.log('[Chat] Using global socket for room:', chatRoom);
        joinRoom(chatRoom);

        const unsubscribe = onNewMessage((message: Message) => {
            // Comparison helper for IDs (handles ObjectId vs string vs Object with _id)
            const getStrId = (id: any) => {
                if (!id) return '';
                if (typeof id === 'string') return id;
                if (typeof id === 'object') return id._id ? id._id.toString() : id.toString();
                return String(id);
            };

            const currentThread = chatThread;
            const msgThread = message.chatThread;
            const currentOrderId = getStrId(orderId);
            const msgOrderId = getStrId(message.order);

            // Filter: only accept messages for this thread (if specified)
            if (currentThread && msgThread && msgThread !== currentThread) {
                return;
            }

            // Filter: only accept messages for this order
            if (msgOrderId && currentOrderId && msgOrderId !== currentOrderId) {
                return;
            }

            console.log('[Chat] Accepted socket message, updating state');
            setMessages(prev => {
                const messageId = getStrId(message._id);
                // Remove matching optimistic (temp-*) message by content
                const withoutTemp = prev.filter(
                    m => !(String(m._id).startsWith('temp-') && m.content.trim() === message.content.trim())
                );
                // Deduplicate by real _id
                if (withoutTemp.some(m => getStrId(m._id) === messageId)) {
                    return withoutTemp;
                }
                return [...withoutTemp, message].sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
            });

            // Toast when chat is minimized and message is from the other party
            const currentUser = userRef.current;
            if (currentUser && message.sender._id !== currentUser._id && isMinimizedRef.current) {
                toast.success(`New message from ${message.sender.name || message.sender.username || recipientName}`);
            }
        });

        const handleTypingEvent = ({ username }: { userId?: string; username?: string }) => {
            setTypingUser(username || 'Someone');
        };

        const handleStopTypingEvent = () => {
            setTypingUser(null);
        };

        socket.on('typing', handleTypingEvent);
        socket.on('stopTyping', handleStopTypingEvent);

        return () => {
            leaveRoom(chatRoom);
            unsubscribe();
            socket.off('typing', handleTypingEvent);
            socket.off('stopTyping', handleStopTypingEvent);
        };
    }, [orderId, chatThread, chatRoom, socket, joinRoom, leaveRoom, onNewMessage, recipientName, user]);

    // Unified scroll handler
    const handleScroll = () => {
        if (!scrollContainerRef.current) return;
        const { scrollTop, scrollHeight, clientHeight } = scrollContainerRef.current;
        const distanceFromBottom = scrollHeight - scrollTop - clientHeight;
        isAtBottom.current = distanceFromBottom < 100;
    };

    const scrollToBottom = (behavior: ScrollBehavior = "smooth") => {
        if (!scrollContainerRef.current) return;
        scrollContainerRef.current.scrollTo({
            top: scrollContainerRef.current.scrollHeight,
            behavior
        });
    };

    // Scroll strategy when messages change
    useEffect(() => {
        const lastMsg = messages[messages.length - 1];
        const isMine = lastMsg && (lastMsg.sender?._id || lastMsg.sender) === user?._id;

        // Always scroll if I sent the message, or if I'm already at the bottom
        if (isMine || isAtBottom.current) {
            scrollToBottom("smooth");
        }
    }, [messages, user?._id]);

    // Initial scroll on load
    useEffect(() => {
        if (!isLoading && messages.length > 0) {
            // Use setTimeout to ensure DOM is rendered
            const timer = setTimeout(() => {
                scrollToBottom("auto"); // Instant snap on load
                isAtBottom.current = true;
            }, 100);
            return () => clearTimeout(timer);
        }
    }, [isLoading, messages.length]);

    const handleTyping = () => {
        if (socket?.connected && user) {
            emitTyping(chatRoom);
            if (typingTimeout.current) clearTimeout(typingTimeout.current);
            typingTimeout.current = setTimeout(() => {
                emitStopTyping(chatRoom);
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
        if (socket?.connected) emitStopTyping(chatRoom);

        // Optimistic message – show immediately
        const tempId = `temp-${Date.now()}`;
        const optimisticMsg: Message = {
            _id: tempId,
            sender: { _id: user._id, username: user.username },
            content: messageContent,
            senderRole: user.role || 'customer',
            messageType: 'user',
            createdAt: new Date().toISOString(),
        };
        setMessages(prev => [...prev, optimisticMsg]);

        try {
            console.log('[Chat] Sending message:', messageContent);
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

            // Replace optimistic msg with real one (if socket hasn't already)
            if (savedMsg) {
                const getStrId = (id: any) => {
                    if (!id) return '';
                    if (typeof id === 'string') return id;
                    if (typeof id === 'object') return id._id ? id._id.toString() : id.toString();
                    return String(id);
                };

                const savedId = getStrId(savedMsg._id);
                setMessages(prev => {
                    // Replace optimistic message with the real one from DB
                    // Also deduplicate by _id in case socket message arrived first
                    const filtered = prev.filter(m => getStrId(m._id) !== tempId && getStrId(m._id) !== savedId);
                    return [...filtered, savedMsg!].sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
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
        <div className="fixed bottom-6 right-6 w-80 md:w-96 max-h-[calc(100vh-100px)] bg-white rounded-2xl shadow-2xl border border-gray-100 flex flex-col z-50 overflow-hidden transform transition-all duration-300">
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
            <div
                ref={scrollContainerRef}
                onScroll={handleScroll}
                className="flex-1 min-h-[300px] overflow-y-auto p-4 space-y-4 bg-gray-50 scrollbar-thin scroll-smooth"
                style={{
                    scrollbarWidth: 'thin',
                    scrollbarColor: '#ef4444 #f9fafb',
                    msOverflowStyle: 'none'
                }}
            >
                <style jsx>{`
                    div::-webkit-scrollbar {
                        width: 6px;
                    }
                    div::-webkit-scrollbar-track {
                        background: #f9fafb;
                    }
                    div::-webkit-scrollbar-thumb {
                        background-color: #ef4444;
                        border-radius: 20px;
                        border: 2px solid #f9fafb;
                    }
                `}</style>
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
                        const getStrId = (id: any) => {
                            if (!id) return '';
                            if (typeof id === 'string') return id;
                            if (typeof id === 'object') return id._id ? id._id.toString() : id.toString();
                            return String(id);
                        };
                        const isMine = getStrId(msg.sender?._id || msg.sender) === getStrId(user?._id);
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
