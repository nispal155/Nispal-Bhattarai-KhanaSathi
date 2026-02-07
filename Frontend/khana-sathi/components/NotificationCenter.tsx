"use client";

import React, { useState, useEffect, useRef } from 'react';
import { Bell, Check, Trash2, X, Info, ShoppingBag, MessageSquare, AlertTriangle, ExternalLink } from 'lucide-react';
import { getNotifications, markRead, markAllRead, deleteNotification, NotificationData } from '@/lib/notificationService';
import { useAuth } from '@/context/AuthContext';
import { useSocket } from '@/context/SocketContext';
import toast from 'react-hot-toast';
import Link from 'next/link';

const NotificationCenter: React.FC = () => {
    const [notifications, setNotifications] = useState<NotificationData[]>([]);
    const [unreadCount, setUnreadCount] = useState(0);
    const [isOpen, setIsOpen] = useState(false);
    const [loading, setLoading] = useState(false);
    const dropdownRef = useRef<HTMLDivElement>(null);
    const { user } = useAuth();
    const { onNotification } = useSocket();

    useEffect(() => {
        if (user) {
            fetchNotifications();

            // Listen for real-time notifications via shared socket
            const unsubscribe = onNotification((data: any) => {
                setUnreadCount(prev => prev + 1);
                fetchNotifications(); // Refresh list
                toast.success(data.message || "New notification received", {
                    icon: '🔔',
                    position: 'top-right'
                });
            });

            return () => {
                unsubscribe();
            };
        }
    }, [user, onNotification]);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const fetchNotifications = async () => {
        try {
            setLoading(true);
            const res = await getNotifications();
            if (res.data?.success) {
                setNotifications(res.data.data);
                setUnreadCount(res.data.unreadCount);
            }
        } catch (error) {
            console.error('Failed to fetch notifications:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleMarkRead = async (id: string, e: React.MouseEvent) => {
        e.stopPropagation();
        try {
            await markRead(id);
            setNotifications(prev =>
                prev.map(n => n._id === id ? { ...n, isRead: true } : n)
            );
            setUnreadCount(prev => Math.max(0, prev - 1));
        } catch (error) {
            toast.error('Failed to mark as read');
        }
    };

    const handleMarkAllRead = async () => {
        try {
            await markAllRead();
            setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
            setUnreadCount(0);
            toast.success('All marked as read');
        } catch (error) {
            toast.error('Failed to mark all as read');
        }
    };

    const handleDelete = async (id: string, e: React.MouseEvent) => {
        e.stopPropagation();
        try {
            await deleteNotification(id);
            setNotifications(prev => prev.filter(n => n._id !== id));
            // Re-fetch count if it was unread
            fetchNotifications();
        } catch (error) {
            toast.error('Failed to delete notification');
        }
    };

    const getTypeIcon = (type: string) => {
        switch (type) {
            case 'order_status': return <ShoppingBag className="w-4 h-4 text-blue-500" />;
            case 'chat_message': return <MessageSquare className="w-4 h-4 text-green-500" />;
            case 'sos': return <AlertTriangle className="w-4 h-4 text-red-500" />;
            case 'promotion': return <Info className="w-4 h-4 text-purple-500" />;
            default: return <Bell className="w-4 h-4 text-gray-500" />;
        }
    };

    if (!user) return null;

    return (
        <div className="relative" ref={dropdownRef}>
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="relative p-2 text-gray-600 hover:text-gray-900 transition-colors focus:outline-none"
            >
                <Bell className="w-6 h-6" />
                {unreadCount > 0 && (
                    <span className="absolute top-1 right-1 flex h-4 min-w-[1rem] items-center justify-center rounded-full bg-red-500 px-1 text-[10px] font-bold text-white">
                        {unreadCount > 9 ? '9+' : unreadCount}
                    </span>
                )}
            </button>

            {isOpen && (
                <div className="absolute right-0 mt-2 w-80 md:w-96 bg-white rounded-2xl shadow-2xl border border-gray-100 overflow-hidden z-50">
                    <div className="p-4 border-b border-gray-100 flex items-center justify-between bg-gray-50/50">
                        <h3 className="font-bold text-gray-900">Notifications</h3>
                        {unreadCount > 0 && (
                            <button
                                onClick={handleMarkAllRead}
                                className="text-xs text-red-500 hover:text-red-600 font-semibold"
                            >
                                Mark all read
                            </button>
                        )}
                    </div>

                    <div className="max-h-[70vh] overflow-y-auto">
                        {notifications.length > 0 ? (
                            <div className="divide-y divide-gray-50">
                                {notifications.map((notif) => (
                                    <div
                                        key={notif._id}
                                        className={`p-4 hover:bg-gray-50 transition-colors flex gap-3 ${!notif.isRead ? 'bg-red-50/30' : ''}`}
                                    >
                                        <div className="mt-1 shrink-0">
                                            {getTypeIcon(notif.type)}
                                        </div>
                                        <div className="flex-1">
                                            <div className="flex justify-between items-start">
                                                <p className={`text-sm font-semibold ${!notif.isRead ? 'text-gray-900' : 'text-gray-600'}`}>
                                                    {notif.title}
                                                </p>
                                                <div className="flex gap-1 ml-2 shrink-0">
                                                    {!notif.isRead && (
                                                        <button
                                                            onClick={(e) => handleMarkRead(notif._id, e)}
                                                            className="p-1 text-gray-400 hover:text-blue-500 transition"
                                                            title="Mark as read"
                                                        >
                                                            <Check className="w-3 h-3" />
                                                        </button>
                                                    )}
                                                    <button
                                                        onClick={(e) => handleDelete(notif._id, e)}
                                                        className="p-1 text-gray-400 hover:text-red-500 transition"
                                                        title="Delete"
                                                    >
                                                        <Trash2 className="w-3 h-3" />
                                                    </button>
                                                </div>
                                            </div>
                                            <p className="text-xs text-gray-500 mt-0.5 leading-relaxed">
                                                {notif.message}
                                            </p>
                                            <div className="flex items-center justify-between mt-2">
                                                <span className="text-[10px] text-gray-400 uppercase tracking-tighter">
                                                    {new Date(notif.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                                </span>
                                                {notif.data?.orderId && (
                                                    <Link
                                                        href={
                                                            user.role === 'restaurant_admin' || user.role === 'restaurant'
                                                                ? '/orders-board'
                                                                : user.role === 'delivery_staff'
                                                                    ? '/my-deliveries'
                                                                    : `/order-tracking/${notif.data.orderId}`
                                                        }
                                                        className="text-[10px] text-red-500 font-bold flex items-center gap-0.5 hover:underline"
                                                        onClick={() => setIsOpen(false)}
                                                    >
                                                        View Order <ExternalLink className="w-2 h-2" />
                                                    </Link>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="py-12 text-center text-gray-400">
                                <Bell className="w-8 h-8 mx-auto mb-3 opacity-20" />
                                <p className="text-sm">No notifications yet</p>
                            </div>
                        )}
                    </div>

                    <div className="p-3 bg-gray-50 border-t border-gray-100 text-center">
                        <button className="text-xs font-bold text-gray-500 hover:text-gray-900">
                            Clear History
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
};

export default NotificationCenter;
