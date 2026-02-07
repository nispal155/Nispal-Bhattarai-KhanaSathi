'use client';

import React from 'react';
import { useChat } from '@/context/ChatContext';
import ChatWindow from '@/components/Chat/ChatWindow';

const GlobalChatOverlay: React.FC = () => {
    const { activeChat, closeChat } = useChat();

    if (!activeChat) return null;

    return (
        <div className="fixed inset-0 pointer-events-none z-[60]">
            <div className="absolute inset-0 pointer-events-auto flex items-end justify-end p-6">
                <ChatWindow
                    orderId={activeChat.orderId}
                    recipientName={activeChat.recipientName}
                    recipientRole={activeChat.recipientRole}
                    chatThread={activeChat.chatThread}
                    onClose={closeChat}
                />
            </div>
        </div>
    );
};

export default GlobalChatOverlay;
