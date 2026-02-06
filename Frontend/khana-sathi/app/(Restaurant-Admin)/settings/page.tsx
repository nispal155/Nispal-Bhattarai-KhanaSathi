'use client';

import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';
import { useState, useEffect } from 'react';
import {
    Settings,
    MapPin,
    Loader2,
    Save,
    Bell,
    Truck
} from 'lucide-react';
import RestaurantSidebar from '@/components/RestaurantSidebar';
import toast from 'react-hot-toast';
import { getMyRestaurant, updateMyRestaurant } from '@/lib/restaurantService';
import { put } from '@/lib/api';

interface DeliverySettings {
    minimumOrder: number;
    deliveryRadius: number;
    deliveryTimeMin: number;
    deliveryTimeMax: number;
}

interface NotificationPrefs {
    push: boolean;
    email: boolean;
    sms: boolean;
}

export default function SettingsPage() {
    const { user, isLoading: authLoading } = useAuth();
    const router = useRouter();
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [activeTab, setActiveTab] = useState('delivery');
    const [delivery, setDelivery] = useState<DeliverySettings>({
        minimumOrder: 0,
        deliveryRadius: 5,
        deliveryTimeMin: 30,
        deliveryTimeMax: 45
    });
    const [notifications, setNotifications] = useState<NotificationPrefs>({
        push: true,
        email: true,
        sms: false
    });

    useEffect(() => {
        if (authLoading) return;
        if (!user) {
            router.push('/login');
            return;
        }
        fetchSettings();
    }, [user, router, authLoading]);

    const fetchSettings = async () => {
        try {
            setLoading(true);
            const res = await getMyRestaurant();
            if (res.data?.success && res.data.data) {
                const r = res.data.data;
                setDelivery({
                    minimumOrder: r.minimumOrder ?? 0,
                    deliveryRadius: r.deliveryRadius ?? 5,
                    deliveryTimeMin: r.deliveryTime?.min ?? 30,
                    deliveryTimeMax: r.deliveryTime?.max ?? 45
                });
            }

            // Load notification prefs from user profile
            if (user?.notifications) {
                setNotifications({
                    push: user.notifications.push ?? true,
                    email: user.notifications.email ?? true,
                    sms: user.notifications.sms ?? false
                });
            }
        } catch (error) {
            console.error("Error fetching settings:", error);
            toast.error("Failed to load settings");
        } finally {
            setLoading(false);
        }
    };

    const handleSave = async () => {
        try {
            setSaving(true);

            if (activeTab === 'delivery') {
                const res = await updateMyRestaurant({
                    minimumOrder: delivery.minimumOrder,
                    deliveryRadius: delivery.deliveryRadius,
                    deliveryTimeMin: delivery.deliveryTimeMin,
                    deliveryTimeMax: delivery.deliveryTimeMax
                } as any);
                if (res.error) {
                    toast.error(res.error);
                    return;
                }
                toast.success("Delivery settings saved!");
            } else if (activeTab === 'notifications') {
                const res = await put('/users/profile', { notifications });
                if (res.error) {
                    toast.error(res.error);
                    return;
                }
                toast.success("Notification preferences saved!");
            }
        } catch (error: any) {
            console.error("Error saving settings:", error);
            toast.error("Failed to save settings");
        } finally {
            setSaving(false);
        }
    };

    const tabs = [
        { id: 'delivery', label: 'Delivery', icon: Truck },
        { id: 'notifications', label: 'Notifications', icon: Bell }
    ];

    if (authLoading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50">
                <Loader2 className="w-10 h-10 text-orange-500 animate-spin" />
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50 flex">
            <RestaurantSidebar />
            <div className="flex-1 p-6">
                <div className="max-w-4xl mx-auto">
                    {/* Header */}
                    <div className="flex items-center justify-between mb-8">
                        <div>
                            <h1 className="text-2xl font-bold text-gray-800">Settings</h1>
                            <p className="text-gray-500">Manage your restaurant settings</p>
                        </div>
                        <button
                            onClick={handleSave}
                            disabled={saving || loading}
                            className="flex items-center gap-2 px-6 py-3 bg-orange-500 text-white rounded-xl font-medium hover:bg-orange-600 transition disabled:opacity-50"
                        >
                            {saving ? <Loader2 className="w-5 h-5 animate-spin" /> : <Save className="w-5 h-5" />}
                            Save Changes
                        </button>
                    </div>

                    {loading ? (
                        <div className="flex items-center justify-center py-20">
                            <Loader2 className="w-10 h-10 text-orange-500 animate-spin" />
                        </div>
                    ) : (
                        <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
                            {/* Tabs */}
                            <div className="flex border-b border-gray-100">
                                {tabs.map((tab) => (
                                    <button
                                        key={tab.id}
                                        onClick={() => setActiveTab(tab.id)}
                                        className={`flex items-center gap-2 px-6 py-4 font-medium transition ${
                                            activeTab === tab.id
                                                ? 'text-orange-600 border-b-2 border-orange-500 bg-orange-50'
                                                : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
                                        }`}
                                    >
                                        <tab.icon className="w-5 h-5" />
                                        {tab.label}
                                    </button>
                                ))}
                            </div>

                            {/* Tab Content */}
                            <div className="p-6">
                                {activeTab === 'delivery' && (
                                    <div className="space-y-6">
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                                Minimum Order Amount (NPR)
                                            </label>
                                            <input
                                                type="number"
                                                value={delivery.minimumOrder}
                                                onChange={(e) => setDelivery({ ...delivery, minimumOrder: parseInt(e.target.value) || 0 })}
                                                className="w-full px-4 py-3 border border-gray-200 rounded-xl text-gray-800 focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                                            />
                                            <p className="text-sm text-gray-500 mt-1">Minimum amount required to place an order</p>
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                                Delivery Radius (km)
                                            </label>
                                            <input
                                                type="number"
                                                value={delivery.deliveryRadius}
                                                onChange={(e) => setDelivery({ ...delivery, deliveryRadius: parseInt(e.target.value) || 5 })}
                                                className="w-full px-4 py-3 border border-gray-200 rounded-xl text-gray-800 focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                                            />
                                            <p className="text-sm text-gray-500 mt-1">Maximum distance for delivery orders</p>
                                        </div>
                                        <div className="grid grid-cols-2 gap-6">
                                            <div>
                                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                                    Min Delivery Time (minutes)
                                                </label>
                                                <input
                                                    type="number"
                                                    value={delivery.deliveryTimeMin}
                                                    onChange={(e) => setDelivery({ ...delivery, deliveryTimeMin: parseInt(e.target.value) || 20 })}
                                                    className="w-full px-4 py-3 border border-gray-200 rounded-xl text-gray-800 focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                                                />
                                            </div>
                                            <div>
                                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                                    Max Delivery Time (minutes)
                                                </label>
                                                <input
                                                    type="number"
                                                    value={delivery.deliveryTimeMax}
                                                    onChange={(e) => setDelivery({ ...delivery, deliveryTimeMax: parseInt(e.target.value) || 45 })}
                                                    className="w-full px-4 py-3 border border-gray-200 rounded-xl text-gray-800 focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                                                />
                                            </div>
                                        </div>
                                        <p className="text-sm text-gray-500">Estimated delivery time shown to customers</p>
                                    </div>
                                )}

                                {activeTab === 'notifications' && (
                                    <div className="space-y-4">
                                        {[
                                            { key: 'push' as const, label: 'Push Notifications', desc: 'Receive real-time push notifications for new orders and updates' },
                                            { key: 'email' as const, label: 'Email Notifications', desc: 'Get email alerts for order confirmations and summaries' },
                                            { key: 'sms' as const, label: 'SMS Notifications', desc: 'Receive text messages for urgent order updates' }
                                        ].map((item) => (
                                            <div key={item.key} className="flex items-center justify-between p-4 bg-gray-50 rounded-xl">
                                                <div>
                                                    <h4 className="font-medium text-gray-800">{item.label}</h4>
                                                    <p className="text-sm text-gray-500">{item.desc}</p>
                                                </div>
                                                <button
                                                    onClick={() => setNotifications({
                                                        ...notifications,
                                                        [item.key]: !notifications[item.key]
                                                    })}
                                                    className={`relative w-14 h-7 rounded-full transition ${
                                                        notifications[item.key] ? 'bg-orange-500' : 'bg-gray-300'
                                                    }`}
                                                >
                                                    <span className={`absolute top-1 w-5 h-5 bg-white rounded-full transition ${
                                                        notifications[item.key] ? 'left-8' : 'left-1'
                                                    }`} />
                                                </button>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
