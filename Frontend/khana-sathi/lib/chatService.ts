import { get, post, put } from './api';

// ─── Types ──────────────────────────────────────────────────────────────────

export type ChatThread = 'customer-restaurant' | 'customer-rider' | 'restaurant-rider';

export interface ChatMessage {
    _id: string;
    order: string;
    chatThread: ChatThread;
    sender: {
        _id: string;
        name?: string;
        username?: string;
        profilePicture?: string;
    };
    senderRole: 'customer' | 'restaurant' | 'rider' | 'delivery_staff' | 'admin';
    messageType: 'user' | 'system';
    content: string;
    attachments?: string[];
    readBy: string[];
    createdAt: string;
}

export interface ThreadInfo {
    thread: ChatThread;
    participantName: string;
    participantRole: string;
    participantAvatar?: string;
}

export interface ChatAvailability {
    orderId: string;
    orderNumber: string;
    orderStatus: string;
    threads: ThreadInfo[];
}

export interface ActiveChat {
    orderId: string;
    orderNumber: string;
    orderStatus: string;
    thread: ChatThread;
    participantName: string;
    participantAvatar: string;
    participantRole: string;
    lastMessage: {
        content: string;
        senderName: string;
        senderRole: string;
        messageType: string;
        createdAt: string;
    } | null;
    unreadCount: number;
    updatedAt: string;
}

// ─── Thread-aware API ───────────────────────────────────────────────────────

/** Get which threads are available for an order */
export async function getChatAvailability(orderId: string) {
    return get<{ success: boolean; data: ChatAvailability }>(`/chat/${orderId}/availability`);
}

/** Get messages for a specific thread */
export async function getThreadMessages(orderId: string, thread: ChatThread) {
    return get<{ success: boolean; data: ChatMessage[] }>(`/chat/${orderId}/${thread}`);
}

/** Send message to a specific thread */
export async function sendThreadMessage(orderId: string, thread: ChatThread, message: string) {
    return post<{ success: boolean; data: ChatMessage }>(`/chat/${orderId}/${thread}`, { message });
}

/** Mark thread messages as read */
export async function markThreadAsRead(orderId: string, thread: ChatThread) {
    return put<{ success: boolean; message: string }>(`/chat/${orderId}/${thread}/read`, {});
}

/** Get all active chat threads for current user */
export async function getActiveChats() {
    return get<{ success: boolean; data: ActiveChat[] }>('/chat/active');
}

// ─── Legacy API (backward compat) ──────────────────────────────────────────

export async function getOrderMessages(orderId: string) {
    return get<{ success: boolean; data: ChatMessage[] }>(`/chat/${orderId}`);
}

export async function getChatMessages(orderId: string) {
    return getOrderMessages(orderId);
}

export async function markAsRead(orderId: string) {
    return put<{ success: boolean; message: string }>(`/chat/${orderId}/read`, {});
}

export async function sendMessage(data: { orderId: string; message: string; senderRole: string; thread?: ChatThread }) {
    return post<{ success: boolean; data: ChatMessage }>(`/chat/${data.orderId}`, {
        message: data.message,
        senderRole: data.senderRole,
        thread: data.thread
    });
}
