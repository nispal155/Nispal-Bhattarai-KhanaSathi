import { get, put } from './api';

export interface ChatMessage {
    _id: string;
    order: string;
    sender: {
        _id: string;
        name: string;
        profilePicture?: string;
    };
    senderRole: 'customer' | 'restaurant' | 'rider' | 'admin';
    content: string;
    attachments?: string[];
    isRead: boolean;
    createdAt: string;
}

interface ChatResponse {
    success: boolean;
    data: ChatMessage[];
}

/**
 * GET chat history for an order
 */
export async function getOrderMessages(orderId: string) {
    return get<ChatResponse>(`/chat/${orderId}`);
}

/**
 * Mark messages as read for an order
 */
export async function markAsRead(orderId: string) {
    return put<{ success: boolean; message: string }>(`/chat/${orderId}/read`, {});
}

/**
 * GET chat history for an order (alias)
 */
export async function getChatMessages(orderId: string) {
    return getOrderMessages(orderId);
}

/**
 * POST a new chat message
 */
export async function sendMessage(data: { orderId: string; message: string; senderRole: string }) {
    return put<{ success: boolean; data: ChatMessage }>(`/chat/${data.orderId}`, {
        message: data.message,
        senderRole: data.senderRole
    });
}
