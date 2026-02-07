import { get, put, del } from './api';

export interface NotificationData {
    _id: string;
    user: string;
    type: 'order_status' | 'chat_message' | 'promotion' | 'system' | 'sos';
    title: string;
    message: string;
    data?: {
        orderId?: string;
        chatId?: string;
        thread?: string;
        link?: string;
    };
    isRead: boolean;
    createdAt: string;
}

export interface NotificationsResponse {
    success: boolean;
    data: NotificationData[];
    unreadCount: number;
}

export const getNotifications = () => get<NotificationsResponse>('/notifications');
export const markAllRead = () => put<{ success: boolean }>('/notifications/mark-all-read', {});
export const markRead = (id: string) => put<{ success: boolean; data: NotificationData }>(`/notifications/${id}/mark-read`, {});
export const deleteNotification = (id: string) => del<{ success: boolean }>(`/notifications/${id}`);
