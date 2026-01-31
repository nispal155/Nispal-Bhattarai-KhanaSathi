"use client";

import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import { ChevronDown, ChevronUp, Mail, Phone, MapPin, Send } from "lucide-react";

export default function SupportPage() {
    const [openFaq, setOpenFaq] = useState<number | null>(0);

    const faqs = [
        {
            question: "How do I track my order?",
            answer: "You can track your order in real-time by going to the 'Profile' section and clicking on 'Order History'. Select your active order to see its live status on the map."
        },
        {
            question: "What payment methods do you accept?",
            answer: "We currently accept Cash on Delivery (COD), eSewa, and Khalti. We are working on adding card payments soon!"
        },
        {
            question: "How can I cancel my order?",
            answer: "You can cancel your order from the Order Details page before the restaurant confirms it. Once confirmed/preparing, please contact support immediately."
        },
        {
            question: "Do you offer refunds?",
            answer: "Refunds are processed for cancelled prepaid orders within 24-48 hours. For quality issues, please contact us with photos of the food."
        }
    ];

    return (
        <div className="min-h-screen bg-gray-50">
            {/* Navigation (Simplified for Support) */}
            <nav className="bg-white border-b border-gray-200 sticky top-0 z-50">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex justify-between items-center h-16">
                        <Link href="/" className="flex items-center gap-2">
                            <div className="w-10 h-10 bg-red-500 rounded-full flex items-center justify-center">
                                <span className="text-white text-xl">🍜</span>
                            </div>
                            <div>
                                <span className="text-red-500 font-bold text-lg">Khana Sathi</span>
                            </div>
                        </Link>

                        <div className="hidden md:flex items-center gap-8">
                            <Link href="/browse-restaurants" className="flex items-center gap-2 text-gray-600 hover:text-gray-900">
                                <span>🏠</span> Home
                            </Link>
                            <Link href="/cart" className="flex items-center gap-2 text-gray-600 hover:text-gray-900">
                                <span>🛒</span> Cart
                            </Link>
                            <Link href="/user-profile" className="flex items-center gap-2 text-gray-600 hover:text-gray-900">
                                <span>👤</span> Profile
                            </Link>
                            <Link href="/support" className="flex items-center gap-2 bg-gray-900 text-white px-4 py-2 rounded-full text-sm">
                                <span>💬</span> Support
                            </Link>
                        </div>

                        <div className="w-10 h-10 rounded-full bg-pink-200 overflow-hidden">
                            <Image src="/avatar.jpg" alt="Profile" width={40} height={40} className="object-cover" />
                        </div>
                    </div>
                </div>
            </nav>

            {/* Hero Section */}
            <div className="bg-red-600 text-white py-16">
                <div className="max-w-7xl mx-auto px-4 text-center">
                    <h1 className="text-4xl font-bold mb-4">How can we help you?</h1>
                    <p className="text-xl opacity-90">We are here to ensure you have the best food experience.</p>
                </div>
            </div>

            <div className="max-w-7xl mx-auto px-4 py-12">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">

                    {/* FAQs */}
                    <div>
                        <h2 className="text-2xl font-bold text-gray-900 mb-6">Frequently Asked Questions</h2>
                        <div className="space-y-4">
                            {faqs.map((faq, index) => (
                                <div key={index} className="bg-white rounded-lg border border-gray-200 overflow-hidden">
                                    <button
                                        onClick={() => setOpenFaq(openFaq === index ? null : index)}
                                        className="w-full flex items-center justify-between p-4 text-left font-medium text-gray-900 hover:bg-gray-50 transition"
                                    >
                                        {faq.question}
                                        {openFaq === index ? <ChevronUp className="w-5 h-5 text-red-500" /> : <ChevronDown className="w-5 h-5 text-gray-400" />}
                                    </button>
                                    {openFaq === index && (
                                        <div className="p-4 pt-0 text-gray-600 bg-gray-50 border-t border-gray-100">
                                            {faq.answer}
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Contact Form */}
                    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8">
                        <h2 className="text-2xl font-bold text-gray-900 mb-6">Send us a message</h2>
                        <form className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Subject</label>
                                <input type="text" className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:outline-none" placeholder="Order Issue" />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Message</label>
                                <textarea rows={4} className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:outline-none" placeholder="Describe your issue..."></textarea>
                            </div>
                            <button className="w-full bg-red-600 hover:bg-red-700 text-white font-bold py-3 rounded-lg flex items-center justify-center gap-2 transition">
                                <Send className="w-5 h-5" />
                                Send Message
                            </button>
                        </form>

                        <div className="mt-8 pt-6 border-t border-gray-100 grid grid-cols-1 md:grid-cols-3 gap-6 text-center">
                            <div className="flex flex-col items-center">
                                <div className="w-10 h-10 bg-red-100 rounded-full flex items-center justify-center mb-2">
                                    <Phone className="w-5 h-5 text-red-600" />
                                </div>
                                <span className="text-sm font-medium text-gray-900">Call Us</span>
                                <span className="text-xs text-gray-500">+977 1-4XXXXXX</span>
                            </div>
                            <div className="flex flex-col items-center">
                                <div className="w-10 h-10 bg-red-100 rounded-full flex items-center justify-center mb-2">
                                    <Mail className="w-5 h-5 text-red-600" />
                                </div>
                                <span className="text-sm font-medium text-gray-900">Email Us</span>
                                <span className="text-xs text-gray-500">help@khanasathi.com</span>
                            </div>
                            <div className="flex flex-col items-center">
                                <div className="w-10 h-10 bg-red-100 rounded-full flex items-center justify-center mb-2">
                                    <MapPin className="w-5 h-5 text-red-600" />
                                </div>
                                <span className="text-sm font-medium text-gray-900">Visit Us</span>
                                <span className="text-xs text-gray-500">Kathmandu, Nepal</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
