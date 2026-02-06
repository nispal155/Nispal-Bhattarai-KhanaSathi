'use client';

import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';
import { useState, useEffect } from 'react';
import {
    Settings,
    Store,
    Clock,
    MapPin,
    Phone,
    Mail,
    Loader2,
    Save,
    Bell,
    CreditCard,
    Shield,
    Image as ImageIcon
} from 'lucide-react';
import RestaurantSidebar from '@/components/RestaurantSidebar';
import toast from 'react-hot-toast';
import axios from 'axios';

const API_URL = "http://localhost:5003/api";

interface RestaurantSettings {
    name: string;
    description: string;
    cuisine: string[];
    contactPhone: string;
    contactEmail: string;
    address: {
        street: string;
        city: string;
        state: string;
        zipCode: string;
    };
    openingHours: {
        open: string;
        close: string;
    };
    isOpen: boolean;
    minimumOrder: number;
    deliveryRadius: number;
    preparationTime: number;
}

export default function SettingsPage() {
    const { user, isLoading: authLoading } = useAuth();
    const router = useRouter();
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [activeTab, setActiveTab] = useState('general');
    const [settings, setSettings] = useState<RestaurantSettings>({
        name: '',
        description: '',
        cuisine: [],
        contactPhone: '',
        contactEmail: '',
        address: {
            street: '',
            city: '',
            state: '',
            zipCode: ''
        },
        openingHours: {
            open: '09:00',
            close: '22:00'
        },
        isOpen: true,
        minimumOrder: 100,
        deliveryRadius: 5,
        preparationTime: 30
    });
    const [notifications, setNotifications] = useState({
        newOrders: true,
        orderUpdates: true,
        reviews: true,
        promotions: false
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
            const token = localStorage.getItem('token');
            const response = await axios.get(`${API_URL}/restaurants/my-restaurant`, {
                headers: { Authorization: `Bearer ${token}` }
            });

            if (response.data.success && response.data.data) {
                const restaurant = response.data.data;
                setSettings({
                    name: restaurant.name || '',
                    description: restaurant.description || '',
                    cuisine: restaurant.cuisine || [],
                    contactPhone: restaurant.contactPhone || '',
                    contactEmail: restaurant.contactEmail || '',
                    address: {
                        street: restaurant.address?.street || '',
                        city: restaurant.address?.city || '',
                        state: restaurant.address?.state || '',
                        zipCode: restaurant.address?.zipCode || ''
                    },
                    openingHours: {
                        open: restaurant.openingHours?.open || '09:00',
                        close: restaurant.openingHours?.close || '22:00'
                    },
                    isOpen: restaurant.isOpen ?? true,
                    minimumOrder: restaurant.minimumOrder || 100,
                    deliveryRadius: restaurant.deliveryRadius || 5,
                    preparationTime: restaurant.preparationTime || 30
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
            const token = localStorage.getItem('token');
            await axios.put(`${API_URL}/restaurants/my-restaurant`, settings, {
                headers: { Authorization: `Bearer ${token}` }
            });
            toast.success("Settings saved successfully!");
        } catch (error: any) {
            console.error("Error saving settings:", error);
            toast.error(error.response?.data?.message || "Failed to save settings");
        } finally {
            setSaving(false);
        }
    };

    const tabs = [
        { id: 'general', label: 'General', icon: Store },
        { id: 'hours', label: 'Operating Hours', icon: Clock },
        { id: 'delivery', label: 'Delivery', icon: MapPin },
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
                                {activeTab === 'general' && (
                                    <div className="space-y-6">
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-2">Restaurant Name</label>
                                            <input
                                                type="text"
                                                value={settings.name}
                                                onChange={(e) => setSettings({ ...settings, name: e.target.value })}
                                                className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-2">Description</label>
                                            <textarea
                                                value={settings.description}
                                                onChange={(e) => setSettings({ ...settings, description: e.target.value })}
                                                rows={3}
                                                className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                                            />
                                        </div>
                                        <div className="grid grid-cols-2 gap-4">
                                            <div>
                                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                                    <Phone className="w-4 h-4 inline mr-2" />
                                                    Contact Phone
                                                </label>
                                                <input
                                                    type="tel"
                                                    value={settings.contactPhone}
                                                    onChange={(e) => setSettings({ ...settings, contactPhone: e.target.value })}
                                                    className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                                                />
                                            </div>
                                            <div>
                                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                                    <Mail className="w-4 h-4 inline mr-2" />
                                                    Contact Email
                                                </label>
                                                <input
                                                    type="email"
                                                    value={settings.contactEmail}
                                                    onChange={(e) => setSettings({ ...settings, contactEmail: e.target.value })}
                                                    className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                                                />
                                            </div>
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                                <MapPin className="w-4 h-4 inline mr-2" />
                                                Address
                                            </label>
                                            <div className="grid grid-cols-2 gap-4">
                                                <input
                                                    type="text"
                                                    placeholder="Street"
                                                    value={settings.address.street}
                                                    onChange={(e) => setSettings({
                                                        ...settings,
                                                        address: { ...settings.address, street: e.target.value }
                                                    })}
                                                    className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                                                />
                                                <input
                                                    type="text"
                                                    placeholder="City"
                                                    value={settings.address.city}
                                                    onChange={(e) => setSettings({
                                                        ...settings,
                                                        address: { ...settings.address, city: e.target.value }
                                                    })}
                                                    className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                                                />
                                                <input
                                                    type="text"
                                                    placeholder="State"
                                                    value={settings.address.state}
                                                    onChange={(e) => setSettings({
                                                        ...settings,
                                                        address: { ...settings.address, state: e.target.value }
                                                    })}
                                                    className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                                                />
                                                <input
                                                    type="text"
                                                    placeholder="Zip Code"
                                                    value={settings.address.zipCode}
                                                    onChange={(e) => setSettings({
                                                        ...settings,
                                                        address: { ...settings.address, zipCode: e.target.value }
                                                    })}
                                                    className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                                                />
                                            </div>
                                        </div>
                                        <div className="flex items-center justify-between p-4 bg-gray-50 rounded-xl">
                                            <div>
                                                <h4 className="font-medium text-gray-800">Restaurant Status</h4>
                                                <p className="text-sm text-gray-500">Toggle to accept or pause orders</p>
                                            </div>
                                            <button
                                                onClick={() => setSettings({ ...settings, isOpen: !settings.isOpen })}
                                                className={`relative w-14 h-7 rounded-full transition ${
                                                    settings.isOpen ? 'bg-green-500' : 'bg-gray-300'
                                                }`}
                                            >
                                                <span className={`absolute top-1 w-5 h-5 bg-white rounded-full transition ${
                                                    settings.isOpen ? 'left-8' : 'left-1'
                                                }`} />
                                            </button>
                                        </div>
                                    </div>
                                )}

                                {activeTab === 'hours' && (
                                    <div className="space-y-6">
                                        <div className="grid grid-cols-2 gap-6">
                                            <div>
                                                <label className="block text-sm font-medium text-gray-700 mb-2">Opening Time</label>
                                                <input
                                                    type="time"
                                                    value={settings.openingHours.open}
                                                    onChange={(e) => setSettings({
                                                        ...settings,
                                                        openingHours: { ...settings.openingHours, open: e.target.value }
                                                    })}
                                                    className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                                                />
                                            </div>
                                            <div>
                                                <label className="block text-sm font-medium text-gray-700 mb-2">Closing Time</label>
                                                <input
                                                    type="time"
                                                    value={settings.openingHours.close}
                                                    onChange={(e) => setSettings({
                                                        ...settings,
                                                        openingHours: { ...settings.openingHours, close: e.target.value }
                                                    })}
                                                    className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                                                />
                                            </div>
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                                Average Preparation Time (minutes)
                                            </label>
                                            <input
                                                type="number"
                                                value={settings.preparationTime}
                                                onChange={(e) => setSettings({ ...settings, preparationTime: parseInt(e.target.value) || 30 })}
                                                className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                                            />
                                            <p className="text-sm text-gray-500 mt-1">This helps customers know when to expect their order</p>
                                        </div>
                                    </div>
                                )}

                                {activeTab === 'delivery' && (
                                    <div className="space-y-6">
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                                Minimum Order Amount (NPR)
                                            </label>
                                            <input
                                                type="number"
                                                value={settings.minimumOrder}
                                                onChange={(e) => setSettings({ ...settings, minimumOrder: parseInt(e.target.value) || 0 })}
                                                className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                                Delivery Radius (km)
                                            </label>
                                            <input
                                                type="number"
                                                value={settings.deliveryRadius}
                                                onChange={(e) => setSettings({ ...settings, deliveryRadius: parseInt(e.target.value) || 5 })}
                                                className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                                            />
                                            <p className="text-sm text-gray-500 mt-1">Maximum distance for delivery orders</p>
                                        </div>
                                    </div>
                                )}

                                {activeTab === 'notifications' && (
                                    <div className="space-y-4">
                                        {[
                                            { key: 'newOrders', label: 'New Orders', desc: 'Get notified when new orders arrive' },
                                            { key: 'orderUpdates', label: 'Order Updates', desc: 'Get notified about order status changes' },
                                            { key: 'reviews', label: 'New Reviews', desc: 'Get notified when customers leave reviews' },
                                            { key: 'promotions', label: 'Promotional Updates', desc: 'Receive tips and promotional suggestions' }
                                        ].map((item) => (
                                            <div key={item.key} className="flex items-center justify-between p-4 bg-gray-50 rounded-xl">
                                                <div>
                                                    <h4 className="font-medium text-gray-800">{item.label}</h4>
                                                    <p className="text-sm text-gray-500">{item.desc}</p>
                                                </div>
                                                <button
                                                    onClick={() => setNotifications({
                                                        ...notifications,
                                                        [item.key]: !notifications[item.key as keyof typeof notifications]
                                                    })}
                                                    className={`relative w-14 h-7 rounded-full transition ${
                                                        notifications[item.key as keyof typeof notifications] ? 'bg-orange-500' : 'bg-gray-300'
                                                    }`}
                                                >
                                                    <span className={`absolute top-1 w-5 h-5 bg-white rounded-full transition ${
                                                        notifications[item.key as keyof typeof notifications] ? 'left-8' : 'left-1'
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
