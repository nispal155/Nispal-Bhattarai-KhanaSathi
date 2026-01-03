"use client";

import Image from "next/image";
import { useState } from "react";
import { Paperclip, Send, Search, Phone, MoreVertical, ArrowLeft } from "lucide-react";

export default function DeliveryChat() {
  const [selectedChat, setSelectedChat] = useState(0);
  const [message, setMessage] = useState("");

  const chats = [
    {
      name: "Jane Smith (Customer)",
      avatar: "/jane.jpg",
      lastMessage: "Is my order #1234 ready for pickup?",
      time: "2:15 PM",
      online: true,
      messages: [
        { text: "Is my order #1234 ready for pickup?", time: "2:15 PM", sender: "customer" },
        { text: "Hi Jane, your order #1234 is currently being prepared. It should be ready for pickup in about 15 minutes.", time: "2:10 PM", sender: "admin" },
        { text: "Perfect, thank you! I'll be there soon.", time: "2:15 PM", sender: "customer" },
        { text: "You're welcome! See you then.", time: "2:16 PM", sender: "admin" },
      ],
    },
    {
      name: "David Lee (Customer)",
      avatar: "/logo.png",
      lastMessage: "Do you have any vegan options available?",
      time: "1:50 PM",
      online: false,
      messages: [
        { text: "Is my order #1234 ready for pickup?", time: "2:15 PM", sender: "customer" },
        { text: "Hi Jane, your order #1234 is currently being prepared. It should be ready for pickup in about 15 minutes.", time: "2:10 PM", sender: "admin" },
        { text: "Perfect, thank you! I'll be there soon.", time: "2:15 PM", sender: "customer" },
        { text: "You're welcome! See you then.", time: "2:16 PM", sender: "admin" },
      ],
    },
    {
      name: "Mike Johnson (Delivery)",
      avatar: "/mike.jpg",
      lastMessage: "Stuck in traffic, might be 10 mins late for or...",
      time: "1:30 PM",
      online: true,
      messages: [
        { text: "Is my order #1234 ready for pickup?", time: "2:15 PM", sender: "customer" },
        { text: "Hi Jane, your order #1234 is currently being prepared. It should be ready for pickup in about 15 minutes.", time: "2:10 PM", sender: "admin" },
        { text: "Perfect, thank you! I'll be there soon.", time: "2:15 PM", sender: "customer" },
        { text: "You're welcome! See you then.", time: "2:16 PM", sender: "admin" },    
      ],
    },
    {
      name: "Sarah Chen (Delivery)",
      avatar: "/sarah.jpg",
      lastMessage: "Confirmed pickup for order #9101 at 2:30 P...",
      time: "12:45 PM",
      online: false,
      messages: [],
    },
  ];

  const currentChat = chats[selectedChat];
  const messages = currentChat.messages || [];

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-50">
        <div className="px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="relative w-10 h-10">
              <Image src="/logo.png" alt="KhanaSathi" fill className="object-contain" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-red-600">KhanaSathi</h1>
              <p className="text-sm text-gray-600">Delivery</p>
            </div>
          </div>
          <div className="w-12 h-12 rounded-full overflow-hidden ring-4 ring-orange-100">
            <Image src="/delivery-admin.jpg" alt="Admin" width={48} height={48} className="object-cover" />
          </div>
        </div>
      </header>

      <div className="flex-1 flex">
        {/* Sidebar */}
        <div className="w-96 bg-white border-r border-gray-200 flex flex-col">
          <div className="p-5 border-b border-gray-200">
            <div className="relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                placeholder="Search conversations..."
                className="w-full pl-12 pr-4 py-3.5 text-black bg-gray-100 rounded-2xl focus:outline-none focus:ring-2 focus:ring-red-500 transition"
              />
            </div>
          </div>

          <div className="flex-1 overflow-y-auto">
            {chats.map((chat, index) => (
              <div
                key={index}
                onClick={() => setSelectedChat(index)}
                className={`p-5 hover:bg-gray-50 cursor-pointer transition-all border-b border-gray-100 ${
                  selectedChat === index ? "bg-red-50 border-l-4 border-l-red-500" : ""
                }`}
              >
                <div className="flex items-start gap-4">
                  <div className="relative ">
                    <div className="w-14 h-14 rounded-full overflow-hidden ring-4 ring-gray-100">
                      <Image src={chat.avatar} alt={chat.name} width={56} height={56} className="object-cover" />
                    </div>
                    {chat.online && (
                      <div className="absolute bottom-0 right-0 w-4 h-4 bg-green-500 rounded-full border-3 border-white"></div>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-1">
                      <h3 className="font-semibold text-gray-900 truncate">{chat.name}</h3>
                      <span className="text-xs text-gray-500">{chat.time}</span>
                    </div>
                    <p className="text-sm text-gray-600 truncate">{chat.lastMessage}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Chat Window */}
        <div className="flex-1 flex flex-col  from-gray-50 to-white">
          <div className="bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
            <div className="flex items-center gap-4">
              <button className="md:hidden p-2 hover:bg-gray-100 rounded-lg">
                <ArrowLeft className="w-6 h-6" />
              </button>
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-full overflow-hidden ring-4 ring-gray-100">
                  <Image src={currentChat.avatar} alt={currentChat.name} width={48} height={48} className="object-cover" />
                </div>
                <div>
                  <h2 className="font-bold text-gray-900">{currentChat.name}</h2>
                  <p className="text-sm text-green-600 flex items-center gap-2">
                    <span className="w-2 h-2 bg-green-500 rounded-full"></span>
                    {currentChat.online ? "Online" : "Offline"}
                  </p>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-4">
              <button className="p-3 hover:bg-gray-100 rounded-full transition group">
                <Phone className="w-6 h-6 text-gray-700 group-hover:text-red-600 transition" />
              </button>
              <button className="p-3 hover:bg-gray-100 rounded-full transition">
                <MoreVertical className="w-6 h-6 text-gray-700" />
              </button>
            </div>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-6 space-y-6">
            {messages.length === 0 ? (
              <div className="text-center text-gray-500 mt-20">
                <p className="text-lg">No messages yet. Start the conversation!</p>
              </div>
            ) : (
              messages.map((msg, i) => (
                <div
                  key={i}
                  className={`flex ${msg.sender === "admin" ? "justify-end" : "justify-start"}`}
                >
                  <div
                    className={`max-w-lg px-6 py-4 rounded-3xl shadow-sm ${
                      msg.sender === "admin"
                        ? "bg-red-500 text-white"
                        : "bg-gray-200 text-gray-800"
                    }`}
                  >
                    <p className="text-lg leading-relaxed">{msg.text}</p>
                    <p className={`text-xs mt-2 text-right ${msg.sender === "admin" ? "text-red-100" : "text-gray-500"}`}>
                      {msg.time}
                    </p>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Input Area */}
          <div className="bg-white border-t border-gray-200 p-6">
            <div className="flex items-center gap-4">
              <input
                type="text"
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="Type your message..."
                className="flex-1 px-6 py-4 text-black bg-gray-100 rounded-full focus:outline-none focus:ring-4 focus:ring-red-100 transition text-lg"
              />
              
              {/* File Upload */}
              <label className="cursor-pointer p-4 hover:bg-gray-100 rounded-full transition group">
                <Paperclip className="w-7 h-7 text-gray-600 group-hover:text-red-600 transition" />
                <input type="file" className="hidden" multiple />
              </label>

              {/* Send Button */}
              <button className="p-4 bg-red-500 hover:bg-red-600 text-white rounded-full shadow-lg transition transform hover:scale-110">
                <Send className="w-7 h-7" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}