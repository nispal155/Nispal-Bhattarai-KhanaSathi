"use client";

import { useState } from "react";
import { Bell, Globe, Shield, CreditCard, Mail, AppWindow, Save, Loader2 } from "lucide-react";
import AdminSidebar from "@/components/admin/AdminSidebar";
import toast from "react-hot-toast";
import Image from "next/image";
import { useAuth } from "@/context/AuthContext";

export default function AdminSettings() {
    const { user } = useAuth();
    const [saving, setSaving] = useState(false);
    const [settings, setSettings] = useState({
        maintenanceMode: false,
        emailNotifications: true,
        pushNotifications: true,
        smsNotifications: false,
        guestCheckout: true,
        currency: "NPR",
        region: "Nepal",
    });

    const handleSave = () => {
        setSaving(true);
        setTimeout(() => {
            setSaving(false);
            toast.success("Settings saved successfully");
        }, 1500);
    };

    const toggleSetting = (key: string) => {
        setSettings({ ...settings, [key]: !settings[key as keyof typeof settings] });
    };

    return (
        <div className="min-h-screen bg-gray-50 flex">
            <AdminSidebar />

            <div className="flex-1 overflow-auto">
                <header className="bg-white shadow-sm border-b border-gray-200 px-8 py-5 flex items-center justify-between sticky top-0 z-10">
                    <h2 className="text-3xl font-bold text-gray-900">System Settings</h2>
                    <div className="flex items-center gap-6">
                        <button
                            onClick={handleSave}
                            disabled={saving}
                            className="bg-red-500 hover:bg-red-600 text-white px-6 py-3 rounded-xl font-bold transition shadow-lg flex items-center gap-2 disabled:bg-red-300"
                        >
                            {saving ? <Loader2 className="w-5 h-5 animate-spin" /> : <Save className="w-5 h-5" />}
                            Save System Settings
                        </button>
                        <div className="w-12 h-12 rounded-full overflow-hidden ring-4 ring-orange-100 flex items-center justify-center bg-gray-100">
                            <Image
                                src={user?.profilePicture || `https://ui-avatars.com/api/?name=${user?.username || 'Admin'}&background=random`}
                                alt="Admin"
                                width={48}
                                height={48}
                                className="object-cover w-full h-full"
                                onError={(e) => {
                                    const target = e.target as HTMLImageElement;
                                    target.src = `https://ui-avatars.com/api/?name=${user?.username || 'Admin'}&background=random`;
                                }}
                            />
                        </div>
                    </div>
                </header>

                <div className="p-8 max-w-5xl mx-auto space-y-8">
                    {/* General Settings */}
                    <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
                        <div className="p-6 border-b border-gray-100 flex items-center gap-3 bg-gray-50/50">
                            <Globe className="w-6 h-6 text-blue-500" />
                            <h3 className="font-bold text-gray-900 text-lg">General Configuration</h3>
                        </div>
                        <div className="p-8 space-y-6">
                            <div className="flex items-center justify-between">
                                <div>
                                    <h4 className="font-semibold text-gray-900">Maintenance Mode</h4>
                                    <p className="text-sm text-gray-500">Temporarily disable the store for maintenance.</p>
                                </div>
                                <button
                                    onClick={() => toggleSetting('maintenanceMode')}
                                    className={`w-14 h-7 rounded-full p-1 transition-colors duration-200 ease-in-out ${settings.maintenanceMode ? 'bg-red-500' : 'bg-gray-200'}`}
                                >
                                    <div className={`bg-white w-5 h-5 rounded-full shadow-md transform transition-transform duration-200 ease-in-out ${settings.maintenanceMode ? 'translate-x-7' : 'translate-x-0'}`} />
                                </button>
                            </div>

                            <div className="flex items-center justify-between">
                                <div>
                                    <h4 className="font-semibold text-gray-900">Allow Guest Checkout</h4>
                                    <p className="text-sm text-gray-500">Enable customers to order without creating an account.</p>
                                </div>
                                <button
                                    onClick={() => toggleSetting('guestCheckout')}
                                    className={`w-14 h-7 rounded-full p-1 transition-colors duration-200 ease-in-out ${settings.guestCheckout ? 'bg-green-500' : 'bg-gray-200'}`}
                                >
                                    <div className={`bg-white w-5 h-5 rounded-full shadow-md transform transition-transform duration-200 ease-in-out ${settings.guestCheckout ? 'translate-x-7' : 'translate-x-0'}`} />
                                </button>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4">
                                <div>
                                    <label className="block text-sm font-semibold text-gray-700 mb-2">Default Currency</label>
                                    <select
                                        className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-red-500 focus:outline-none transition"
                                        value={settings.currency}
                                        onChange={(e) => setSettings({ ...settings, currency: e.target.value })}
                                    >
                                        <option value="NPR">NPR (Nepalese Rupee)</option>
                                        <option value="NPR">NPR (Nepalese Rupee)</option>
                                        <option value="INR">INR (Indian Rupee)</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-sm font-semibold text-gray-700 mb-2">Target Region</label>
                                    <select
                                        className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-red-500 focus:outline-none transition"
                                        value={settings.region}
                                        onChange={(e) => setSettings({ ...settings, region: e.target.value })}
                                    >
                                        <option value="Nepal">Nepal</option>
                                        <option value="Global">Global</option>
                                    </select>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Notification Settings */}
                    <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
                        <div className="p-6 border-b border-gray-100 flex items-center gap-3 bg-gray-50/50">
                            <Bell className="w-6 h-6 text-orange-500" />
                            <h3 className="font-bold text-gray-900 text-lg">Communication & Notifications</h3>
                        </div>
                        <div className="p-8 space-y-6">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-4">
                                    <Mail className="w-5 h-5 text-gray-400" />
                                    <div>
                                        <h4 className="font-semibold text-gray-900">Email Notifications</h4>
                                        <p className="text-sm text-gray-500">Send automated emails for orders and staff updates.</p>
                                    </div>
                                </div>
                                <button
                                    onClick={() => toggleSetting('emailNotifications')}
                                    className={`w-14 h-7 rounded-full p-1 transition-colors duration-200 ease-in-out ${settings.emailNotifications ? 'bg-orange-500' : 'bg-gray-200'}`}
                                >
                                    <div className={`bg-white w-5 h-5 rounded-full shadow-md transform transition-transform duration-200 ease-in-out ${settings.emailNotifications ? 'translate-x-7' : 'translate-x-0'}`} />
                                </button>
                            </div>

                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-4">
                                    <AppWindow className="w-5 h-5 text-gray-400" />
                                    <div>
                                        <h4 className="font-semibold text-gray-900">Push Notifications</h4>
                                        <p className="text-sm text-gray-500">Enable real-time browser/app notifications for admins.</p>
                                    </div>
                                </div>
                                <button
                                    onClick={() => toggleSetting('pushNotifications')}
                                    className={`w-14 h-7 rounded-full p-1 transition-colors duration-200 ease-in-out ${settings.pushNotifications ? 'bg-orange-500' : 'bg-gray-200'}`}
                                >
                                    <div className={`bg-white w-5 h-5 rounded-full shadow-md transform transition-transform duration-200 ease-in-out ${settings.pushNotifications ? 'translate-x-7' : 'translate-x-0'}`} />
                                </button>
                            </div>
                        </div>
                    </div>

                    {/* API & Security */}
                    <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
                        <div className="p-6 border-b border-gray-100 flex items-center gap-3 bg-gray-50/50">
                            <Shield className="w-6 h-6 text-green-500" />
                            <h3 className="font-bold text-gray-900 text-lg">API & Security</h3>
                        </div>
                        <div className="p-8">
                            <div className="bg-gray-50 rounded-xl p-6 border border-gray-100 mb-6">
                                <div className="flex items-center justify-between mb-2">
                                    <span className="text-xs font-bold text-gray-400 tracking-wider uppercase">Current API Key</span>
                                    <span className="text-xs text-green-600 font-semibold bg-green-50 px-2 py-1 rounded">Active</span>
                                </div>
                                <div className="flex items-center gap-3">
                                    <code className="flex-1 bg-white p-3 rounded-lg border border-gray-200 text-gray-800 font-mono text-sm opacity-50">
                                        ••••••••••••••••••••••••••••••••••••••••
                                    </code>
                                    <button className="text-sm font-bold text-red-600 hover:text-red-700">Regenerate</button>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                <footer className="text-center text-gray-500 text-sm py-8 border-t border-gray-200 mt-16">
                    © {new Date().getFullYear()} KhanaSathi. All rights reserved.
                </footer>
            </div>
        </div>
    );
}
