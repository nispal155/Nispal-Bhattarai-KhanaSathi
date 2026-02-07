'use client';

import React, { createContext, useContext, useState, ReactNode } from 'react';
import type { ChatThread } from '@/lib/chatService';

interface ActiveChat {
    orderId: string;
    recipientName: string;
    recipientRole: 'restaurant' | 'delivery_staff' | 'customer';
    chatThread?: ChatThread;
}

interface ChatContextType {
    activeChat: ActiveChat | null;
    openChat: (chat: ActiveChat) => void;
    closeChat: () => void;
}

const ChatContext = createContext<ChatContextType>({
    activeChat: null,
    openChat: () => { },
    closeChat: () => { },
});

export const useChat = () => useContext(ChatContext);

export function ChatProvider({ children }: { children: ReactNode }) {
    const [activeChat, setActiveChat] = useState<ActiveChat | null>(null);

    const openChat = (chat: ActiveChat) => {
        setActiveChat(chat);
    };

    const closeChat = () => {
        setActiveChat(null);
    };

    return (
        <ChatContext.Provider value={{ activeChat, openChat, closeChat }}>
            {children}
        </ChatContext.Provider>
    );
}
