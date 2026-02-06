'use client';

import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';
import { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import {
    Users,
    Plus,
    Edit,
    Trash2,
    Phone,
    Mail,
    Loader2,
    X,
} from 'lucide-react';
import RestaurantSidebar from '@/components/RestaurantSidebar';
import { get, post, put, del } from '@/lib/api';

interface StaffMember {
    _id: string;
    name: string;
    email: string;
    phone?: string;
    role: 'chef' | 'cashier' | 'waiter' | 'manager';
    status: 'active' | 'inactive';
    createdAt: string;
}

export default function StaffPage() {
    const { user, isLoading: authLoading } = useAuth();
    const router = useRouter();
    const [loading, setLoading] = useState(true);
    const [staff, setStaff] = useState<StaffMember[]>([]);
    const [showModal, setShowModal] = useState(false);
    const [editingId, setEditingId] = useState<string | null>(null);
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        phone: '',
        role: 'waiter' as 'chef' | 'cashier' | 'waiter' | 'manager'
    });
    const [submitting, setSubmitting] = useState(false);

    useEffect(() => {
        if (authLoading) return;
        if (!user) {
            router.push('/login');
            return;
        }
        fetchStaff();
    }, [user, router, authLoading]);

    const fetchStaff = async () => {
        try {
            setLoading(true);
            const response = await get<{ success: boolean; data: StaffMember[] }>('/restaurants/my-restaurant/staff');
            if (response.data?.data) {
                setStaff(response.data.data);
            }
        } catch (error) {
            console.error("Error fetching staff:", error);
            toast.error("Failed to load staff");
        } finally {
            setLoading(false);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!formData.name || !formData.email) {
            toast.error("Please fill all required fields");
            return;
        }

        try {
            setSubmitting(true);
            if (editingId) {
                await put(`/restaurants/my-restaurant/staff/${editingId}`, formData);
                toast.success("Staff updated successfully!");
            } else {
                await post('/restaurants/my-restaurant/staff', formData);
                toast.success("Staff added successfully!");
            }
            setShowModal(false);
            setEditingId(null);
            setFormData({ name: '', email: '', phone: '', role: 'waiter' });
            fetchStaff();
        } catch (error: any) {
            toast.error(error.response?.data?.message || "Failed to save staff member");
        } finally {
            setSubmitting(false);
        }
    };

    const handleEdit = (member: StaffMember) => {
        setFormData({
            name: member.name,
            email: member.email,
            phone: member.phone || '',
            role: member.role
        });
        setEditingId(member._id);
        setShowModal(true);
    };

    const handleDelete = async (id: string) => {
        if (!confirm("Are you sure you want to remove this staff member?")) return;
        try {
            await del(`/restaurants/my-restaurant/staff/${id}`);
            toast.success("Staff removed");
            fetchStaff();
        } catch (error) {
            toast.error("Failed to remove staff member");
        }
    };

    const getRoleColor = (role: string) => {
        switch (role) {
            case 'chef': return 'bg-orange-100 text-orange-700';
            case 'manager': return 'bg-purple-100 text-purple-700';
            case 'cashier': return 'bg-green-100 text-green-700';
            default: return 'bg-blue-100 text-blue-700';
        }
    };

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
                <div className="max-w-6xl mx-auto">
                    {/* Header */}
                    <div className="flex items-center justify-between mb-8">
                        <div>
                            <h1 className="text-2xl font-bold text-gray-800">Staff Management</h1>
                            <p className="text-gray-500">Manage your restaurant staff</p>
                        </div>
                        <button
                            onClick={() => { setEditingId(null); setFormData({ name: '', email: '', phone: '', role: 'waiter' }); setShowModal(true); }}
                            className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-yellow-400 to-orange-500 text-white font-semibold rounded-xl shadow-md hover:shadow-lg transition"
                        >
                            <Plus className="w-5 h-5" />
                            Add Staff
                        </button>
                    </div>

                    {/* Staff Grid */}
                    {loading ? (
                        <div className="flex items-center justify-center py-20">
                            <Loader2 className="w-10 h-10 text-orange-500 animate-spin" />
                        </div>
                    ) : staff.length === 0 ? (
                        <div className="bg-white rounded-2xl shadow-sm p-12 text-center">
                            <div className="w-20 h-20 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                                <Users className="w-10 h-10 text-blue-500" />
                            </div>
                            <h3 className="text-xl font-bold text-gray-800 mb-2">No Staff Members Yet</h3>
                            <p className="text-gray-500 mb-6">Add your restaurant staff to manage roles and schedules</p>
                            <button
                                onClick={() => setShowModal(true)}
                                className="px-6 py-3 bg-orange-500 text-white rounded-xl hover:bg-orange-600 transition"
                            >
                                Add Your First Staff Member
                            </button>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {staff.map((member) => (
                                <div key={member._id} className="bg-white rounded-2xl shadow-sm p-6 border border-gray-100">
                                    <div className="flex items-start justify-between mb-4">
                                        <div className="flex items-center gap-3">
                                            <div className="w-12 h-12 rounded-full bg-gradient-to-br from-yellow-400 to-orange-500 flex items-center justify-center text-white font-bold text-lg">
                                                {member.name.charAt(0).toUpperCase()}
                                            </div>
                                            <div>
                                                <p className="font-bold text-gray-800">{member.name}</p>
                                                <span className={`text-xs px-2 py-1 rounded-full ${getRoleColor(member.role)}`}>
                                                    {member.role.charAt(0).toUpperCase() + member.role.slice(1)}
                                                </span>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="space-y-2 mb-4">
                                        <p className="text-sm text-gray-600 flex items-center gap-2">
                                            <Mail className="w-4 h-4 text-gray-400" />
                                            {member.email}
                                        </p>
                                        {member.phone && (
                                            <p className="text-sm text-gray-600 flex items-center gap-2">
                                                <Phone className="w-4 h-4 text-gray-400" />
                                                {member.phone}
                                            </p>
                                        )}
                                    </div>

                                    <div className="flex items-center gap-2 pt-4 border-t border-gray-100">
                                        <span className={`px-2 py-1 rounded-full text-xs ${member.status === 'active' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600'}`}>
                                            {member.status === 'active' ? 'Active' : 'Inactive'}
                                        </span>
                                        <div className="flex-1"></div>
                                        <button onClick={() => handleEdit(member)} className="p-2 text-blue-500 hover:bg-blue-50 rounded-lg transition">
                                            <Edit className="w-4 h-4" />
                                        </button>
                                        <button onClick={() => handleDelete(member._id)} className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition">
                                            <Trash2 className="w-4 h-4" />
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {/* Add/Edit Modal */}
                {showModal && (
                    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                        <div className="bg-white rounded-2xl shadow-xl max-w-md w-full">
                            <div className="p-6 border-b border-gray-100 flex items-center justify-between">
                                <h3 className="text-xl font-bold text-gray-800">{editingId ? 'Edit Staff' : 'Add Staff Member'}</h3>
                                <button onClick={() => { setShowModal(false); setEditingId(null); }} className="p-2 hover:bg-gray-100 rounded-full">
                                    <X className="w-5 h-5 text-gray-500" />
                                </button>
                            </div>
                            <form onSubmit={handleSubmit} className="p-6 space-y-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Full Name *</label>
                                    <input
                                        type="text"
                                        value={formData.name}
                                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                        className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-orange-500 focus:outline-none"
                                        placeholder="e.g., John Doe"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Email *</label>
                                    <input
                                        type="email"
                                        value={formData.email}
                                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                        className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-orange-500 focus:outline-none"
                                        placeholder="e.g., john@example.com"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Phone</label>
                                    <input
                                        type="tel"
                                        value={formData.phone}
                                        onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                                        className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-orange-500 focus:outline-none"
                                        placeholder="e.g., 9841234567"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Role</label>
                                    <select
                                        value={formData.role}
                                        onChange={(e) => setFormData({ ...formData, role: e.target.value as any })}
                                        className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-orange-500 focus:outline-none"
                                    >
                                        <option value="waiter">Waiter</option>
                                        <option value="chef">Chef</option>
                                        <option value="cashier">Cashier</option>
                                        <option value="manager">Manager</option>
                                    </select>
                                </div>
                                <button
                                    type="submit"
                                    disabled={submitting}
                                    className="w-full py-3 bg-gradient-to-r from-yellow-400 to-orange-500 text-white font-semibold rounded-xl shadow-md hover:shadow-lg transition disabled:opacity-50"
                                >
                                    {submitting ? 'Saving...' : (editingId ? 'Update Staff' : 'Add Staff')}
                                </button>
                            </form>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
