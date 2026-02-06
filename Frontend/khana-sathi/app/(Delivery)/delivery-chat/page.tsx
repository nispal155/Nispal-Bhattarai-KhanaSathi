"use client";

import Image from "next/image";
import { useState, useEffect } from "react";
import { Search, ArrowLeft, MessageSquare, Loader2, User, Package } from "lucide-react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { getActiveChats, ActiveChat, ChatThread } from "@/lib/chatService";
import ChatWindow from "@/components/Chat/ChatWindow";

export default function DeliveryChat() {
  const { user, isLoading: authLoading } = useAuth();
  const router = useRouter();
  const [chats, setChats] = useState<ActiveChat[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [selectedChat, setSelectedChat] = useState<{ orderId: string; thread: ChatThread; name: string; role: 'customer' | 'restaurant' | 'delivery_staff' } | null>(null);

  useEffect(() => {
    if (authLoading) return;
    if (!user) { router.push("/login"); return; }
    fetchChats();
    const interval = setInterval(fetchChats, 15000);
    return () => clearInterval(interval);
  }, [user, authLoading]);

  const fetchChats = async () => {
    try {
      const res = await getActiveChats();
      if (res.data?.success) setChats(res.data.data);
    } catch (err) {
      console.error("Failed to fetch chats:", err);
    } finally {
      setLoading(false);
    }
  };

  const filtered = chats.filter(c =>
    c.participantName.toLowerCase().includes(search.toLowerCase()) ||
    c.orderNumber?.toLowerCase().includes(search.toLowerCase())
  );

  const threadLabel = (t: string) =>
    t.split("-").map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(" ↔ ");

  const timeAgo = (d: string) => {
    const diff = Date.now() - new Date(d).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return "Just now";
    if (mins < 60) return `${mins}m ago`;
    const hrs = Math.floor(mins / 60);
    if (hrs < 24) return `${hrs}h ago`;
    return `${Math.floor(hrs / 24)}d ago`;
  };

  if (authLoading || !user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <Loader2 className="w-10 h-10 text-orange-500 animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-50">
        <div className="px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button onClick={() => router.push("/rider-dashboard")} className="p-2 hover:bg-gray-100 rounded-full transition">
              <ArrowLeft className="w-5 h-5 text-gray-600" />
            </button>
            <div className="relative w-10 h-10">
              <Image src="/logo.png" alt="KhanaSathi" fill className="object-contain" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-red-600">Messages</h1>
              <p className="text-sm text-gray-600">Your active conversations</p>
            </div>
          </div>
          <div className="w-12 h-12 rounded-full bg-orange-100 flex items-center justify-center text-orange-600 font-bold text-lg">
            {user.username?.charAt(0).toUpperCase()}
          </div>
        </div>
      </header>

      <div className="flex-1 flex">
        {/* Chat List */}
        <div className={`${selectedChat ? 'hidden md:flex' : 'flex'} w-full md:w-96 bg-white border-r border-gray-200 flex-col`}>
          <div className="p-5 border-b border-gray-200">
            <div className="relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search conversations..."
                className="w-full pl-12 pr-4 py-3.5 text-black bg-gray-100 rounded-2xl focus:outline-none focus:ring-2 focus:ring-red-500 transition"
              />
            </div>
          </div>

          <div className="flex-1 overflow-y-auto">
            {loading ? (
              <div className="flex items-center justify-center py-20">
                <Loader2 className="w-8 h-8 animate-spin text-orange-500" />
              </div>
            ) : filtered.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-20 text-gray-400">
                <MessageSquare className="w-12 h-12 mb-3 opacity-30" />
                <p className="font-medium">No active conversations</p>
                <p className="text-sm mt-1">Messages will appear when you have active orders</p>
              </div>
            ) : (
              filtered.map((chat, i) => {
                const isSelected = selectedChat?.orderId === chat.orderId && selectedChat?.thread === chat.thread;
                return (
                  <div
                    key={`${chat.orderId}-${chat.thread}-${i}`}
                    onClick={() => setSelectedChat({
                      orderId: chat.orderId,
                      thread: chat.thread,
                      name: chat.participantName,
                      role: chat.participantRole as 'customer' | 'restaurant' | 'delivery_staff'
                    })}
                    className={`p-5 hover:bg-gray-50 cursor-pointer transition-all border-b border-gray-100 ${isSelected ? "bg-red-50 border-l-4 border-l-red-500" : ""}`}
                  >
                    <div className="flex items-start gap-4">
                      <div className="w-14 h-14 rounded-full bg-gray-100 flex items-center justify-center shrink-0">
                        {chat.participantAvatar ? (
                          <Image src={chat.participantAvatar} alt={chat.participantName} width={56} height={56} className="rounded-full object-cover" />
                        ) : (
                          <User className="w-7 h-7 text-gray-400" />
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between mb-1">
                          <h3 className="font-semibold text-gray-900 truncate">{chat.participantName}</h3>
                          <span className="text-xs text-gray-500">{chat.lastMessage ? timeAgo(chat.lastMessage.createdAt) : ""}</span>
                        </div>
                        <p className="text-sm text-gray-600 truncate">{chat.lastMessage?.content || "No messages yet"}</p>
                        <div className="flex items-center gap-2 mt-1">
                          <span className="text-[10px] bg-gray-100 text-gray-500 px-2 py-0.5 rounded-full flex items-center gap-1">
                            <Package className="w-3 h-3" /> #{chat.orderNumber}
                          </span>
                          <span className="text-[10px] bg-blue-50 text-blue-600 px-2 py-0.5 rounded-full">{threadLabel(chat.thread)}</span>
                          {chat.unreadCount > 0 && (
                            <span className="ml-auto bg-red-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-full min-w-[20px] text-center">{chat.unreadCount}</span>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Right side: selected chat or placeholder */}
        <div className={`${selectedChat ? 'flex' : 'hidden md:flex'} flex-1 flex-col`}>
          {selectedChat ? (
            <div className="flex-1 relative">
              {/* Back button on mobile */}
              <button
                onClick={() => setSelectedChat(null)}
                className="md:hidden absolute top-4 left-4 z-50 p-2 bg-white rounded-full shadow-md"
              >
                <ArrowLeft className="w-5 h-5 text-gray-600" />
              </button>
              <ChatWindow
                orderId={selectedChat.orderId}
                recipientName={selectedChat.name}
                recipientRole={selectedChat.role === 'delivery_staff' ? 'delivery_staff' : selectedChat.role === 'restaurant' ? 'restaurant' : 'customer'}
                chatThread={selectedChat.thread}
                onClose={() => setSelectedChat(null)}
              />
            </div>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center text-gray-400">
              <MessageSquare className="w-16 h-16 mb-4 opacity-20" />
              <p className="text-lg font-medium">Select a conversation</p>
              <p className="text-sm mt-1">Choose a chat from the sidebar to start messaging</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}