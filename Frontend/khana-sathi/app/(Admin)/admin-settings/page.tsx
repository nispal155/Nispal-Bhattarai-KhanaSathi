"use client";

import { useEffect, useState } from "react";
import {
    Bell,
    CreditCard,
    Loader2,
    Save,
    ShieldAlert,
    MessageSquare,
    CheckCircle2,
    AlertTriangle
} from "lucide-react";
import Image from "next/image";
import toast from "react-hot-toast";
import AdminSidebar from "@/components/admin/AdminSidebar";
import ChatWindow from "@/components/Chat/ChatWindow";
import { useAuth } from "@/context/AuthContext";
import { getTransactionLogs } from "@/lib/analyticsService";
import { getSystemSettings, updateSystemSettings, type SystemSettings } from "@/lib/settingsService";
import {
    getAdminSupportTickets,
    updateSupportTicket,
    type SupportTicket
} from "@/lib/supportService";
import { getActiveChats, type ActiveChat, type ChatThread } from "@/lib/chatService";

const defaultSettings: SystemSettings = {
    maintenanceMode: false,
    guestCheckout: true,
    notifications: {
        email: true,
        push: true,
        sms: false,
    },
    currency: "NPR",
    region: "Nepal",
    paymentGateways: {
        esewa: true,
        khalti: true,
        cod: true,
    },
};

type TransactionLog = {
    id: string;
    source: string;
    orderNumber: string;
    customerName: string;
    restaurantName: string;
    paymentMethod: string;
    paymentStatus: string;
    amount: number;
    reference: string;
    createdAt: string;
};

export default function AdminSettings() {
    const { user } = useAuth();
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [settings, setSettings] = useState<SystemSettings>(defaultSettings);
    const [logs, setLogs] = useState<TransactionLog[]>([]);
    const [gateways, setGateways] = useState<Record<string, { enabled: boolean; paidCount: number; pendingCount: number; failedCount: number }>>({});
    const [tickets, setTickets] = useState<SupportTicket[]>([]);
    const [ticketSummary, setTicketSummary] = useState<Record<string, number>>({});
    const [activeChats, setActiveChats] = useState<ActiveChat[]>([]);
    const [selectedChat, setSelectedChat] = useState<ActiveChat | null>(null);
    const [workingTicketId, setWorkingTicketId] = useState<string | null>(null);

    useEffect(() => {
        void loadAdminData();
    }, []);

    const loadAdminData = async () => {
        try {
            setLoading(true);
            const [settingsRes, transactionRes, ticketRes, chatsRes] = await Promise.all([
                getSystemSettings(),
                getTransactionLogs(),
                getAdminSupportTickets(),
                getActiveChats(),
            ]);

            if (settingsRes.data?.data) {
                setSettings(settingsRes.data.data);
            }

            if (transactionRes.success) {
                setGateways(transactionRes.data?.gateways || {});
                setLogs(transactionRes.data?.logs || []);
            }

            if (ticketRes.data?.data) {
                setTickets(ticketRes.data.data);
                setTicketSummary(ticketRes.data.summary || {});
            }

            if (chatsRes.data?.data) {
                setActiveChats(chatsRes.data.data);
            }
        } catch (error) {
            console.error("Failed to load admin settings:", error);
            toast.error("Failed to load admin operations data");
        } finally {
            setLoading(false);
        }
    };

    const toggleBooleanSetting = (key: "maintenanceMode" | "guestCheckout") => {
        setSettings((current) => ({ ...current, [key]: !current[key] }));
    };

    const toggleNotification = (key: keyof SystemSettings["notifications"]) => {
        setSettings((current) => ({
            ...current,
            notifications: {
                ...current.notifications,
                [key]: !current.notifications[key],
            },
        }));
    };

    const toggleGateway = (key: keyof SystemSettings["paymentGateways"]) => {
        setSettings((current) => ({
            ...current,
            paymentGateways: {
                ...current.paymentGateways,
                [key]: !current.paymentGateways[key],
            },
        }));
    };

    const handleSave = async () => {
        try {
            setSaving(true);
            const response = await updateSystemSettings(settings);

            if (response.error) {
                toast.error(response.error);
                return;
            }

            toast.success(response.data?.message || "System settings saved");
            await loadAdminData();
        } catch (error) {
            console.error("Failed to save settings:", error);
            toast.error("Failed to save settings");
        } finally {
            setSaving(false);
        }
    };

    const handleTicketUpdate = async (ticketId: string, payload: { status: SupportTicket["status"]; resolution?: string }) => {
        try {
            setWorkingTicketId(ticketId);
            const response = await updateSupportTicket(ticketId, {
                status: payload.status,
                resolution: payload.resolution,
            });

            if (response.error) {
                toast.error(response.error);
                return;
            }

            toast.success(response.data?.message || "Support ticket updated");
            await loadAdminData();
        } catch (error) {
            console.error("Failed to update ticket:", error);
            toast.error("Failed to update support ticket");
        } finally {
            setWorkingTicketId(null);
        }
    };

    const renderToggle = (enabled: boolean, onClick: () => void, activeClass = "bg-red-500") => (
        <button
            onClick={onClick}
            className={`relative h-7 w-14 rounded-full p-1 transition-colors ${enabled ? activeClass : "bg-gray-200"}`}
        >
            <span className={`block h-5 w-5 rounded-full bg-white shadow-md transition-transform ${enabled ? "translate-x-7" : "translate-x-0"}`} />
        </button>
    );

    return (
        <div className="min-h-screen bg-gray-50 flex">
            <AdminSidebar />

            <div className="flex-1 overflow-auto">
                <header className="sticky top-0 z-10 flex items-center justify-between border-b border-gray-200 bg-white px-8 py-5 shadow-sm">
                    <div>
                        <h2 className="text-3xl font-bold text-gray-900">Admin Operations</h2>
                        <p className="text-sm text-gray-500">Manage gateways, complaints, live support chat, and system rules from one place.</p>
                    </div>
                    <div className="flex items-center gap-6">
                        <button
                            onClick={handleSave}
                            disabled={saving}
                            className="flex items-center gap-2 rounded-xl bg-red-500 px-6 py-3 font-bold text-white transition hover:bg-red-600 disabled:cursor-not-allowed disabled:bg-red-300"
                        >
                            {saving ? <Loader2 className="h-5 w-5 animate-spin" /> : <Save className="h-5 w-5" />}
                            Save Changes
                        </button>
                        <div className="flex h-12 w-12 items-center justify-center overflow-hidden rounded-full bg-gray-100 ring-4 ring-orange-100">
                            <Image
                                src={user?.profilePicture || `https://ui-avatars.com/api/?name=${user?.username || "Admin"}&background=random`}
                                alt="Admin"
                                width={48}
                                height={48}
                                className="h-full w-full object-cover"
                            />
                        </div>
                    </div>
                </header>

                <div className="mx-auto max-w-7xl space-y-8 p-8">
                    {loading ? (
                        <div className="flex items-center justify-center py-20">
                            <Loader2 className="h-10 w-10 animate-spin text-red-500" />
                        </div>
                    ) : (
                        <>
                            <div className="grid grid-cols-1 gap-8 xl:grid-cols-[1.2fr_1fr]">
                                <div className="space-y-8">
                                    <section className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">
                                        <div className="flex items-center gap-3 border-b border-gray-100 bg-gray-50/70 p-6">
                                            <CreditCard className="h-6 w-6 text-red-500" />
                                            <div>
                                                <h3 className="text-lg font-bold text-gray-900">Payment Gateways</h3>
                                                <p className="text-sm text-gray-500">Enable or pause gateways and monitor recent transaction behavior.</p>
                                            </div>
                                        </div>
                                        <div className="space-y-6 p-6">
                                            {(["esewa", "khalti", "cod"] as const).map((gatewayKey) => {
                                                const gatewayMetrics = gateways[gatewayKey];
                                                return (
                                                    <div key={gatewayKey} className="rounded-2xl border border-gray-100 bg-gray-50 p-5">
                                                        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                                                            <div>
                                                                <h4 className="text-lg font-semibold capitalize text-gray-900">{gatewayKey}</h4>
                                                                <p className="text-sm text-gray-500">
                                                                    Paid: {gatewayMetrics?.paidCount || 0} • Pending: {gatewayMetrics?.pendingCount || 0} • Failed: {gatewayMetrics?.failedCount || 0}
                                                                </p>
                                                            </div>
                                                            {renderToggle(settings.paymentGateways[gatewayKey], () => toggleGateway(gatewayKey))}
                                                        </div>
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    </section>

                                    <section className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">
                                        <div className="flex items-center gap-3 border-b border-gray-100 bg-gray-50/70 p-6">
                                            <Bell className="h-6 w-6 text-orange-500" />
                                            <div>
                                                <h3 className="text-lg font-bold text-gray-900">System Controls</h3>
                                                <p className="text-sm text-gray-500">Control platform behavior and admin notification channels.</p>
                                            </div>
                                        </div>
                                        <div className="space-y-6 p-6">
                                            <div className="flex items-center justify-between">
                                                <div>
                                                    <h4 className="font-semibold text-gray-900">Maintenance Mode</h4>
                                                    <p className="text-sm text-gray-500">Pause key customer operations for maintenance windows.</p>
                                                </div>
                                                {renderToggle(settings.maintenanceMode, () => toggleBooleanSetting("maintenanceMode"))}
                                            </div>
                                            <div className="flex items-center justify-between">
                                                <div>
                                                    <h4 className="font-semibold text-gray-900">Guest Checkout</h4>
                                                    <p className="text-sm text-gray-500">Allow orders without an account when needed.</p>
                                                </div>
                                                {renderToggle(settings.guestCheckout, () => toggleBooleanSetting("guestCheckout"), "bg-green-500")}
                                            </div>
                                            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                                                <div>
                                                    <label className="mb-2 block text-sm font-semibold text-gray-700">Currency</label>
                                                    <select
                                                        value={settings.currency}
                                                        onChange={(event) => setSettings((current) => ({ ...current, currency: event.target.value }))}
                                                        className="w-full rounded-xl border border-gray-300 bg-white px-4 py-3 focus:outline-none focus:ring-2 focus:ring-red-500"
                                                    >
                                                        <option value="NPR">NPR</option>
                                                        <option value="INR">INR</option>
                                                        <option value="USD">USD</option>
                                                    </select>
                                                </div>
                                                <div>
                                                    <label className="mb-2 block text-sm font-semibold text-gray-700">Region</label>
                                                    <input
                                                        value={settings.region}
                                                        onChange={(event) => setSettings((current) => ({ ...current, region: event.target.value }))}
                                                        className="w-full rounded-xl border border-gray-300 bg-white px-4 py-3 focus:outline-none focus:ring-2 focus:ring-red-500"
                                                    />
                                                </div>
                                            </div>
                                            <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                                                {([
                                                    { key: "email", label: "Email Alerts" },
                                                    { key: "push", label: "Push Alerts" },
                                                    { key: "sms", label: "SMS Alerts" },
                                                ] as const).map((item) => (
                                                    <div key={item.key} className="flex items-center justify-between rounded-xl border border-gray-100 bg-gray-50 px-4 py-3">
                                                        <span className="font-medium text-gray-800">{item.label}</span>
                                                        {renderToggle(settings.notifications[item.key], () => toggleNotification(item.key), "bg-orange-500")}
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    </section>

                                    <section className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">
                                        <div className="flex items-center gap-3 border-b border-gray-100 bg-gray-50/70 p-6">
                                            <ShieldAlert className="h-6 w-6 text-amber-500" />
                                            <div>
                                                <h3 className="text-lg font-bold text-gray-900">Complaints & Issues</h3>
                                                <p className="text-sm text-gray-500">Handle incoming support tickets from customers, restaurants, and riders.</p>
                                            </div>
                                        </div>
                                        <div className="p-6">
                                            <div className="mb-4 flex flex-wrap gap-3">
                                                {[
                                                    { label: "Open", value: ticketSummary.open || 0, className: "bg-amber-50 text-amber-700" },
                                                    { label: "In Progress", value: ticketSummary.in_progress || 0, className: "bg-blue-50 text-blue-700" },
                                                    { label: "Resolved", value: ticketSummary.resolved || 0, className: "bg-green-50 text-green-700" },
                                                ].map((item) => (
                                                    <span key={item.label} className={`rounded-full px-4 py-2 text-sm font-semibold ${item.className}`}>
                                                        {item.label}: {item.value}
                                                    </span>
                                                ))}
                                            </div>
                                            <div className="space-y-4">
                                                {tickets.slice(0, 6).map((ticket) => (
                                                    <div key={ticket._id} className="rounded-2xl border border-gray-100 p-4">
                                                        <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
                                                            <div>
                                                                <div className="flex flex-wrap items-center gap-2">
                                                                    <h4 className="font-semibold text-gray-900">{ticket.subject}</h4>
                                                                    <span className="rounded-full bg-gray-100 px-3 py-1 text-xs font-semibold text-gray-700">
                                                                        {ticket.priority}
                                                                    </span>
                                                                    <span className="rounded-full bg-red-50 px-3 py-1 text-xs font-semibold text-red-700">
                                                                        {ticket.submittedByRole}
                                                                    </span>
                                                                </div>
                                                                <p className="mt-2 text-sm text-gray-600">{ticket.message}</p>
                                                                <p className="mt-2 text-xs text-gray-500">
                                                                    {ticket.category.replaceAll("_", " ")} • {new Date(ticket.createdAt).toLocaleString()}
                                                                </p>
                                                            </div>
                                                            <div className="flex flex-wrap gap-2">
                                                                <button
                                                                    onClick={() => handleTicketUpdate(ticket._id, { status: "in_progress" })}
                                                                    disabled={workingTicketId === ticket._id}
                                                                    className="rounded-lg border border-blue-200 px-3 py-2 text-sm font-semibold text-blue-700 transition hover:bg-blue-50 disabled:opacity-50"
                                                                >
                                                                    Start
                                                                </button>
                                                                <button
                                                                    onClick={() => handleTicketUpdate(ticket._id, { status: "resolved", resolution: "Resolved by admin support team." })}
                                                                    disabled={workingTicketId === ticket._id}
                                                                    className="rounded-lg border border-green-200 px-3 py-2 text-sm font-semibold text-green-700 transition hover:bg-green-50 disabled:opacity-50"
                                                                >
                                                                    Resolve
                                                                </button>
                                                            </div>
                                                        </div>
                                                    </div>
                                                ))}
                                                {tickets.length === 0 && (
                                                    <p className="rounded-xl border border-dashed border-gray-200 py-8 text-center text-gray-500">
                                                        No active complaints right now.
                                                    </p>
                                                )}
                                            </div>
                                        </div>
                                    </section>
                                </div>

                                <div className="space-y-8">
                                    <section className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">
                                        <div className="flex items-center gap-3 border-b border-gray-100 bg-gray-50/70 p-6">
                                            <MessageSquare className="h-6 w-6 text-blue-500" />
                                            <div>
                                                <h3 className="text-lg font-bold text-gray-900">Live Chat Monitoring</h3>
                                                <p className="text-sm text-gray-500">Watch real-time support and conflict-resolution threads across active orders.</p>
                                            </div>
                                        </div>
                                        <div className="space-y-4 p-6">
                                            {activeChats.slice(0, 8).map((chat) => (
                                                <div key={`${chat.orderId}-${chat.thread}`} className="rounded-2xl border border-gray-100 p-4">
                                                    <div className="flex items-start justify-between gap-4">
                                                        <div>
                                                            <h4 className="font-semibold text-gray-900">
                                                                #{chat.orderNumber} • {chat.participantName}
                                                            </h4>
                                                            <p className="mt-1 text-sm text-gray-500">
                                                                {chat.thread.replaceAll("-", " ")} • {chat.orderStatus.replaceAll("_", " ")}
                                                            </p>
                                                            <p className="mt-2 text-sm text-gray-700">
                                                                {chat.lastMessage?.content || "No messages yet"}
                                                            </p>
                                                        </div>
                                                        <div className="text-right">
                                                            <span className="rounded-full bg-blue-50 px-3 py-1 text-xs font-semibold text-blue-700">
                                                                {chat.unreadCount} unread
                                                            </span>
                                                            <button
                                                                onClick={() => setSelectedChat(chat)}
                                                                className="mt-3 block rounded-lg bg-gray-900 px-3 py-2 text-sm font-semibold text-white transition hover:bg-black"
                                                            >
                                                                Monitor
                                                            </button>
                                                        </div>
                                                    </div>
                                                </div>
                                            ))}
                                            {activeChats.length === 0 && (
                                                <p className="rounded-xl border border-dashed border-gray-200 py-8 text-center text-gray-500">
                                                    No active support chats right now.
                                                </p>
                                            )}
                                        </div>
                                    </section>

                                    <section className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">
                                        <div className="flex items-center gap-3 border-b border-gray-100 bg-gray-50/70 p-6">
                                            <CheckCircle2 className="h-6 w-6 text-green-500" />
                                            <div>
                                                <h3 className="text-lg font-bold text-gray-900">Transaction Logs</h3>
                                                <p className="text-sm text-gray-500">Recent gateway activity across prepaid and COD orders.</p>
                                            </div>
                                        </div>
                                        <div className="space-y-4 p-6">
                                            {logs.slice(0, 8).map((log) => (
                                                <div key={`${log.source}-${log.id}`} className="rounded-2xl border border-gray-100 p-4">
                                                    <div className="flex items-start justify-between gap-4">
                                                        <div>
                                                            <h4 className="font-semibold text-gray-900">{log.orderNumber}</h4>
                                                            <p className="text-sm text-gray-500">
                                                                {log.customerName} • {log.restaurantName}
                                                            </p>
                                                            <p className="mt-2 text-sm text-gray-700">
                                                                {log.paymentMethod.toUpperCase()} • Ref: {log.reference}
                                                            </p>
                                                        </div>
                                                        <div className="text-right">
                                                            <p className="font-bold text-gray-900">Rs. {log.amount.toLocaleString()}</p>
                                                            <span className={`rounded-full px-3 py-1 text-xs font-semibold ${
                                                                log.paymentStatus === "paid" || log.paymentStatus === "completed"
                                                                    ? "bg-green-50 text-green-700"
                                                                    : log.paymentStatus === "failed"
                                                                        ? "bg-red-50 text-red-700"
                                                                        : "bg-amber-50 text-amber-700"
                                                            }`}>
                                                                {log.paymentStatus}
                                                            </span>
                                                        </div>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </section>

                                    <section className="rounded-2xl border border-red-100 bg-red-50 p-6">
                                        <div className="flex items-start gap-3">
                                            <AlertTriangle className="mt-1 h-5 w-5 text-red-500" />
                                            <div>
                                                <h3 className="font-bold text-red-900">Gateway Safety Reminder</h3>
                                                <p className="mt-2 text-sm text-red-800">
                                                    Disabling a gateway immediately prevents new checkouts through that method. Existing prepaid verification callbacks can still complete.
                                                </p>
                                            </div>
                                        </div>
                                    </section>
                                </div>
                            </div>
                        </>
                    )}
                </div>

                {selectedChat && (
                    <div className="fixed bottom-6 right-6 z-50 w-full max-w-md">
                        <ChatWindow
                            orderId={selectedChat.orderId}
                            recipientName={selectedChat.participantName}
                            recipientRole={selectedChat.participantRole as "restaurant" | "delivery_staff" | "customer"}
                            chatThread={selectedChat.thread as ChatThread}
                            onClose={() => setSelectedChat(null)}
                        />
                    </div>
                )}
            </div>
        </div>
    );
}
