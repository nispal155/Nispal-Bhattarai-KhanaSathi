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
    Truck,
    Clock
} from 'lucide-react';
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
            <div className="flex items-center justify-center min-h-[60vh]">
                <Loader2 className="w-10 h-10 text-orange-500 animate-spin" />
            </div>
        );
    }

    return (
        <div className="p-8">
            <div className="max-w-4xl mx-auto">
                {/* Header */}
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-8">
                    <div>
                        <h1 className="text-3xl font-bold text-gray-800">System Settings</h1>
                        <p className="text-gray-500">Configure your restaurant delivery and alerts</p>
                    </div>
                    <button
                        onClick={handleSave}
                        disabled={saving || loading}
                        className="w-full sm:w-auto flex items-center justify-center gap-2 px-6 py-3 bg-gradient-to-r from-yellow-400 to-orange-500 text-white font-bold rounded-xl shadow-md hover:shadow-lg transition disabled:opacity-50"
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
                    <div className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden">
                        {/* Custom Tabs */}
                        <div className="flex bg-gray-50/50 p-2 border-b border-gray-100 gap-1">
                            {tabs.map((tab) => (
                                <button
                                    key={tab.id}
                                    onClick={() => setActiveTab(tab.id)}
                                    className={`flex-1 flex items-center justify-center gap-2 px-6 py-3 rounded-2xl font-bold text-sm transition ${activeTab === tab.id
                                            ? 'bg-white text-orange-600 shadow-sm'
                                            : 'text-gray-400 hover:text-gray-600'
                                        }`}
                                >
                                    <tab.icon className="w-4 h-4" />
                                    {tab.label}
                                </button>
                            ))}
                        </div>

                        {/* Tab Content */}
                        <div className="p-8">
                            {activeTab === 'delivery' && (
                                <div className="space-y-8 animate-in fade-in slide-in-from-bottom-2 duration-300">
                                    <div className="space-y-6">
                                        <div className="grid md:grid-cols-2 gap-6">
                                            <div className="space-y-1.5">
                                                <label className="text-xs font-bold text-gray-400 uppercase tracking-wider ml-1">
                                                    Min Order Amount (NPR)
                                                </label>
                                                <div className="relative">
                                                    <span className="absolute left-4 top-1/2 -translate-y-1/2 font-bold text-gray-400 text-sm">Rs.</span>
                                                    <input
                                                        type="number"
                                                        value={delivery.minimumOrder}
                                                        onChange={(e) => setDelivery({ ...delivery, minimumOrder: parseInt(e.target.value) || 0 })}
                                                        className="w-full pl-12 pr-4 py-3 bg-gray-50 border border-gray-100 rounded-2xl font-bold text-gray-700 focus:ring-2 focus:ring-orange-500 outline-none"
                                                    />
                                                </div>
                                                <p className="text-[10px] text-gray-400 font-medium ml-1">Customers cannot checkout if their cart is below this.</p>
                                            </div>
                                            <div className="space-y-1.5">
                                                <label className="text-xs font-bold text-gray-400 uppercase tracking-wider ml-1">
                                                    Delivery Radius (KM)
                                                </label>
                                                <div className="relative">
                                                    <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                                                    <input
                                                        type="number"
                                                        value={delivery.deliveryRadius}
                                                        onChange={(e) => setDelivery({ ...delivery, deliveryRadius: parseInt(e.target.value) || 5 })}
                                                        className="w-full pl-12 pr-4 py-3 bg-gray-50 border border-gray-100 rounded-2xl font-bold text-gray-700 focus:ring-2 focus:ring-orange-500 outline-none"
                                                    />
                                                </div>
                                                <p className="text-[10px] text-gray-400 font-medium ml-1">Max service area from your location.</p>
                                            </div>
                                        </div>

                                        <div className="p-6 bg-orange-50/30 border border-orange-100/50 rounded-2xl">
                                            <div className="flex items-center gap-2 mb-4">
                                                <Clock className="w-5 h-5 text-orange-500" />
                                                <h4 className="text-sm font-bold text-gray-800">Estimated Delivery Window</h4>
                                            </div>
                                            <div className="grid grid-cols-2 gap-4">
                                                <div className="space-y-1">
                                                    <label className="text-[10px] font-bold text-gray-400 uppercase">Min Minutes</label>
                                                    <input
                                                        type="number"
                                                        value={delivery.deliveryTimeMin}
                                                        onChange={(e) => setDelivery({ ...delivery, deliveryTimeMin: parseInt(e.target.value) || 20 })}
                                                        className="w-full px-4 py-2 bg-white border border-orange-100 rounded-xl font-bold text-gray-700 outline-none focus:ring-2 focus:ring-orange-500"
                                                    />
                                                </div>
                                                <div className="space-y-1">
                                                    <label className="text-[10px] font-bold text-gray-400 uppercase">Max Minutes</label>
                                                    <input
                                                        type="number"
                                                        value={delivery.deliveryTimeMax}
                                                        onChange={(e) => setDelivery({ ...delivery, deliveryTimeMax: parseInt(e.target.value) || 45 })}
                                                        className="w-full px-4 py-2 bg-white border border-orange-100 rounded-xl font-bold text-gray-700 outline-none focus:ring-2 focus:ring-orange-500"
                                                    />
                                                </div>
                                            </div>
                                            <p className="text-[10px] text-orange-600 font-bold uppercase mt-3 tracking-tight">Time shown to customers: {delivery.deliveryTimeMin}-{delivery.deliveryTimeMax} MINS</p>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {activeTab === 'notifications' && (
                                <div className="space-y-4 animate-in fade-in slide-in-from-bottom-2 duration-300">
                                    {[
                                        { key: 'push' as const, label: 'Real-time Alerts', desc: 'Browser and mobile push for new orders' },
                                        { key: 'email' as const, label: 'Email Reports', desc: 'Daily summaries and confirmation logs' },
                                        { key: 'sms' as const, label: 'Urgent SMS', desc: 'Fallback alerts for critical system updates' }
                                    ].map((item) => (
                                        <div key={item.key} className="flex items-center justify-between p-5 bg-gray-50/50 border border-gray-100 rounded-2xl group hover:border-orange-200 transition">
                                            <div>
                                                <h4 className="font-bold text-gray-800 text-sm">{item.label}</h4>
                                                <p className="text-xs text-gray-500 mt-0.5">{item.desc}</p>
                                            </div>
                                            <button
                                                onClick={() => setNotifications({
                                                    ...notifications,
                                                    [item.key]: !notifications[item.key]
                                                })}
                                                className={`relative w-12 h-6 rounded-full transition ${notifications[item.key] ? 'bg-orange-500 shadow-sm' : 'bg-gray-300'
                                                    }`}
                                            >
                                                <span className={`absolute top-1 w-4 h-4 bg-white rounded-full transition ${notifications[item.key] ? 'left-7' : 'left-1'
                                                    }`} />
                                            </button>
                                        </div>
                                    ))}

                                    <div className="p-4 bg-blue-50/50 border border-blue-100 rounded-2xl flex items-start gap-3 mt-8">
                                        <Bell className="w-5 h-5 text-blue-500 shrink-0 mt-0.5" />
                                        <p className="text-xs text-blue-700 font-medium leading-relaxed">
                                            <strong>Pro Tip:</strong> Keeping Push Notifications active is highly recommended to ensure you never miss an incoming order. We use secure channels for all alerts.
                                        </p>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
