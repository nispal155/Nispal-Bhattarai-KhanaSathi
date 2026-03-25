"use client";

import { useEffect, useState } from "react";
import { ChevronDown, ChevronUp, Mail, Phone, MapPin, Send, Loader2, ShieldAlert } from "lucide-react";
import toast from "react-hot-toast";
import UserHeader from "@/components/layout/UserHeader";
import { useAuth } from "@/context/AuthContext";
import {
    createSupportTicket,
    getMySupportTickets,
    type SupportTicket,
    type SupportTicketCategory,
    type SupportTicketPriority
} from "@/lib/supportService";

const categoryOptions: Array<{ value: SupportTicketCategory; label: string }> = [
    { value: "order_issue", label: "Order Issue" },
    { value: "payment_issue", label: "Payment Issue" },
    { value: "delivery_issue", label: "Delivery Issue" },
    { value: "restaurant_issue", label: "Restaurant Issue" },
    { value: "account_issue", label: "Account Issue" },
    { value: "technical_issue", label: "Technical Issue" },
    { value: "other", label: "Other" }
];

const priorityOptions: Array<{ value: SupportTicketPriority; label: string }> = [
    { value: "medium", label: "Normal" },
    { value: "high", label: "High" },
    { value: "urgent", label: "Urgent" },
    { value: "low", label: "Low" }
];

export default function SupportPage() {
    const { user } = useAuth();
    const [openFaq, setOpenFaq] = useState<number | null>(0);
    const [tickets, setTickets] = useState<SupportTicket[]>([]);
    const [loadingTickets, setLoadingTickets] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [form, setForm] = useState({
        category: "order_issue" as SupportTicketCategory,
        priority: "medium" as SupportTicketPriority,
        subject: "",
        message: ""
    });

    const faqs = [
        {
            question: "How do I track my order?",
            answer: "You can track your order in real-time by going to the Profile section and opening an active order. Live status and rider updates are shown there automatically."
        },
        {
            question: "What payment methods do you accept?",
            answer: "KhanaSathi supports Cash on Delivery, eSewa, and Khalti. If an option is unavailable, the admin may have temporarily disabled that gateway."
        },
        {
            question: "How can I cancel my order?",
            answer: "You can cancel from the order details page during the early confirmation window. After that, submit a support ticket and our team will help."
        },
        {
            question: "Do you offer refunds?",
            answer: "Refund eligibility depends on payment method and order stage. For prepaid issues or missing items, create a support ticket so the team can review it quickly."
        }
    ];

    useEffect(() => {
        void loadTickets();
    }, []);

    const loadTickets = async () => {
        try {
            setLoadingTickets(true);
            const response = await getMySupportTickets();
            const data = response.data?.data || [];
            setTickets(Array.isArray(data) ? data : []);
        } catch (error) {
            console.error("Failed to load support tickets:", error);
        } finally {
            setLoadingTickets(false);
        }
    };

    const handleSubmit = async (event: React.FormEvent) => {
        event.preventDefault();

        if (!user) {
            toast.error("Please log in to submit a support request.");
            return;
        }

        if (!form.subject.trim() || !form.message.trim()) {
            toast.error("Please complete both the subject and message.");
            return;
        }

        try {
            setSubmitting(true);
            const response = await createSupportTicket(form);

            if (response.error) {
                toast.error(response.error);
                return;
            }

            toast.success(response.data?.message || "Support ticket submitted");
            setForm({
                category: "order_issue",
                priority: "medium",
                subject: "",
                message: ""
            });
            await loadTickets();
        } catch (error) {
            console.error("Failed to submit support ticket:", error);
            toast.error("Failed to submit your request");
        } finally {
            setSubmitting(false);
        }
    };

    const getStatusBadge = (status: string) => {
        if (status === "resolved") return "bg-green-50 text-green-700";
        if (status === "in_progress") return "bg-blue-50 text-blue-700";
        if (status === "closed") return "bg-gray-100 text-gray-700";
        return "bg-amber-50 text-amber-700";
    };

    return (
        <div className="min-h-screen bg-gray-50">
            <UserHeader />

            <div className="bg-red-600 py-16 text-white">
                <div className="mx-auto max-w-7xl px-4 text-center">
                    <h1 className="mb-4 text-4xl font-bold">Support & Complaints</h1>
                    <p className="text-xl opacity-90">
                        Report order issues, payment problems, or delivery concerns and keep track of the response here.
                    </p>
                </div>
            </div>

            <div className="mx-auto max-w-7xl px-4 py-12">
                <div className="grid grid-cols-1 gap-12 lg:grid-cols-2">
                    <div>
                        <h2 className="mb-6 text-2xl font-bold text-gray-900">Frequently Asked Questions</h2>
                        <div className="space-y-4">
                            {faqs.map((faq, index) => (
                                <div key={faq.question} className="overflow-hidden rounded-lg border border-gray-200 bg-white">
                                    <button
                                        onClick={() => setOpenFaq(openFaq === index ? null : index)}
                                        className="flex w-full items-center justify-between p-4 text-left font-medium text-gray-900 transition hover:bg-gray-50"
                                    >
                                        {faq.question}
                                        {openFaq === index ? <ChevronUp className="h-5 w-5 text-red-500" /> : <ChevronDown className="h-5 w-5 text-gray-400" />}
                                    </button>
                                    {openFaq === index && (
                                        <div className="border-t border-gray-100 bg-gray-50 p-4 pt-3 text-gray-600">
                                            {faq.answer}
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>
                    </div>

                    <div className="rounded-xl border border-gray-200 bg-white p-8 shadow-sm">
                        <div className="mb-6 flex items-start gap-3">
                            <ShieldAlert className="mt-1 h-5 w-5 text-red-500" />
                            <div>
                                <h2 className="text-2xl font-bold text-gray-900">Create a support ticket</h2>
                                <p className="text-sm text-gray-500">
                                    The admin team can review complaints from customers, restaurants, and delivery staff from the same queue.
                                </p>
                            </div>
                        </div>

                        <form className="space-y-4" onSubmit={handleSubmit}>
                            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                                <div>
                                    <label className="mb-1 block text-sm font-medium text-gray-700">Category</label>
                                    <select
                                        value={form.category}
                                        onChange={(event) => setForm((current) => ({ ...current, category: event.target.value as SupportTicketCategory }))}
                                        className="w-full rounded-lg border border-gray-300 px-4 py-2 focus:outline-none focus:ring-2 focus:ring-red-500"
                                    >
                                        {categoryOptions.map((option) => (
                                            <option key={option.value} value={option.value}>
                                                {option.label}
                                            </option>
                                        ))}
                                    </select>
                                </div>
                                <div>
                                    <label className="mb-1 block text-sm font-medium text-gray-700">Priority</label>
                                    <select
                                        value={form.priority}
                                        onChange={(event) => setForm((current) => ({ ...current, priority: event.target.value as SupportTicketPriority }))}
                                        className="w-full rounded-lg border border-gray-300 px-4 py-2 focus:outline-none focus:ring-2 focus:ring-red-500"
                                    >
                                        {priorityOptions.map((option) => (
                                            <option key={option.value} value={option.value}>
                                                {option.label}
                                            </option>
                                        ))}
                                    </select>
                                </div>
                            </div>
                            <div>
                                <label className="mb-1 block text-sm font-medium text-gray-700">Subject</label>
                                <input
                                    type="text"
                                    value={form.subject}
                                    onChange={(event) => setForm((current) => ({ ...current, subject: event.target.value }))}
                                    className="w-full rounded-lg border border-gray-300 px-4 py-2 focus:outline-none focus:ring-2 focus:ring-red-500"
                                    placeholder="Missing item from my order"
                                />
                            </div>
                            <div>
                                <label className="mb-1 block text-sm font-medium text-gray-700">Message</label>
                                <textarea
                                    rows={5}
                                    value={form.message}
                                    onChange={(event) => setForm((current) => ({ ...current, message: event.target.value }))}
                                    className="w-full rounded-lg border border-gray-300 px-4 py-2 focus:outline-none focus:ring-2 focus:ring-red-500"
                                    placeholder="Describe the issue, payment problem, or complaint in detail..."
                                />
                            </div>
                            <button
                                type="submit"
                                disabled={submitting}
                                className="flex w-full items-center justify-center gap-2 rounded-lg bg-red-600 py-3 font-bold text-white transition hover:bg-red-700 disabled:cursor-not-allowed disabled:bg-red-300"
                            >
                                {submitting ? <Loader2 className="h-5 w-5 animate-spin" /> : <Send className="h-5 w-5" />}
                                {submitting ? "Submitting..." : "Send Message"}
                            </button>
                        </form>

                        <div className="mt-8 grid grid-cols-1 gap-6 border-t border-gray-100 pt-6 text-center md:grid-cols-3">
                            <div className="flex flex-col items-center">
                                <div className="mb-2 flex h-10 w-10 items-center justify-center rounded-full bg-red-100">
                                    <Phone className="h-5 w-5 text-red-600" />
                                </div>
                                <span className="text-sm font-medium text-gray-900">Call Us</span>
                                <span className="text-xs text-gray-500">+977 1-4XXXXXX</span>
                            </div>
                            <div className="flex flex-col items-center">
                                <div className="mb-2 flex h-10 w-10 items-center justify-center rounded-full bg-red-100">
                                    <Mail className="h-5 w-5 text-red-600" />
                                </div>
                                <span className="text-sm font-medium text-gray-900">Email Us</span>
                                <span className="text-xs text-gray-500">help@khanasathi.com</span>
                            </div>
                            <div className="flex flex-col items-center">
                                <div className="mb-2 flex h-10 w-10 items-center justify-center rounded-full bg-red-100">
                                    <MapPin className="h-5 w-5 text-red-600" />
                                </div>
                                <span className="text-sm font-medium text-gray-900">Visit Us</span>
                                <span className="text-xs text-gray-500">Kathmandu, Nepal</span>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="mt-12 rounded-xl border border-gray-200 bg-white p-8 shadow-sm">
                    <div className="mb-6 flex items-center justify-between">
                        <div>
                            <h2 className="text-2xl font-bold text-gray-900">Your recent tickets</h2>
                            <p className="text-sm text-gray-500">Track the latest support or complaint requests you have submitted.</p>
                        </div>
                    </div>

                    {loadingTickets ? (
                        <div className="flex items-center justify-center py-10">
                            <Loader2 className="h-6 w-6 animate-spin text-red-500" />
                        </div>
                    ) : tickets.length === 0 ? (
                        <p className="rounded-xl border border-dashed border-gray-200 py-10 text-center text-gray-500">
                            No support tickets yet. Your submitted issues will appear here.
                        </p>
                    ) : (
                        <div className="space-y-4">
                            {tickets.map((ticket) => (
                                <div key={ticket._id} className="rounded-xl border border-gray-200 p-4">
                                    <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                                        <div>
                                            <div className="flex flex-wrap items-center gap-2">
                                                <h3 className="font-semibold text-gray-900">{ticket.subject}</h3>
                                                <span className={`rounded-full px-3 py-1 text-xs font-semibold ${getStatusBadge(ticket.status)}`}>
                                                    {ticket.status.replace("_", " ")}
                                                </span>
                                            </div>
                                            <p className="mt-2 text-sm text-gray-600">{ticket.message}</p>
                                            <p className="mt-2 text-xs text-gray-500">
                                                {ticket.category.replace("_", " ")} • Priority: {ticket.priority} • {new Date(ticket.createdAt).toLocaleString()}
                                            </p>
                                        </div>
                                        {ticket.resolution && (
                                            <div className="rounded-lg bg-green-50 px-4 py-3 text-sm text-green-700 md:max-w-xs">
                                                <span className="font-semibold">Resolution:</span> {ticket.resolution}
                                            </div>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
