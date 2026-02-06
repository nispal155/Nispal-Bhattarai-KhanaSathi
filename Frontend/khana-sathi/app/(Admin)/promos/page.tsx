'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import AdminSidebar from '@/components/admin/AdminSidebar';
import { getPromoCodes, createPromoCode, updatePromoCode, deletePromoCode, togglePromoCodeStatus, broadcastPromo, PromoCode, CreatePromoInput } from '@/lib/promoService';
import toast from 'react-hot-toast';
import { Tag, Plus, Loader2, Trash2, Edit, ToggleLeft, ToggleRight, Percent, DollarSign, X, Send } from 'lucide-react';

export default function PromoManagementPage() {
    const { user } = useAuth();
    const [promos, setPromos] = useState<PromoCode[]>([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [editingPromo, setEditingPromo] = useState<PromoCode | null>(null);
    const [formData, setFormData] = useState<CreatePromoInput>({
        code: '',
        description: '',
        discountType: 'percentage',
        discountValue: 10,
        minOrderAmount: 0,
        maxDiscount: 100,
        validFrom: new Date().toISOString().split('T')[0],
        validUntil: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        usageLimit: undefined,
        perUserLimit: 1
    });

    useEffect(() => {
        fetchPromos();
    }, []);

    const fetchPromos = async () => {
        setLoading(true);
        try {
            const res = await getPromoCodes();
            if (res.data?.success) {
                setPromos(res.data.data);
            }
        } catch (error) {
            toast.error('Failed to fetch promo codes');
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    const handleOpenModal = (promo?: PromoCode) => {
        if (promo) {
            setEditingPromo(promo);
            setFormData({
                code: promo.code,
                description: promo.description,
                discountType: promo.discountType,
                discountValue: promo.discountValue,
                minOrderAmount: promo.minOrderAmount,
                maxDiscount: promo.maxDiscount,
                validFrom: promo.validFrom.split('T')[0],
                validUntil: promo.validUntil.split('T')[0],
                usageLimit: promo.usageLimit,
                perUserLimit: promo.perUserLimit
            });
        } else {
            setEditingPromo(null);
            setFormData({
                code: '',
                description: '',
                discountType: 'percentage',
                discountValue: 10,
                minOrderAmount: 0,
                maxDiscount: 100,
                validFrom: new Date().toISOString().split('T')[0],
                validUntil: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
                usageLimit: undefined,
                perUserLimit: 1
            });
        }
        setShowModal(true);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            if (editingPromo) {
                await updatePromoCode(editingPromo._id, formData);
                toast.success('Promo code updated');
            } else {
                await createPromoCode(formData);
                toast.success('Promo code created');
            }
            setShowModal(false);
            fetchPromos();
        } catch {
            toast.error('Failed to save promo code');
        }
    };

    const handleToggle = async (id: string) => {
        try {
            await togglePromoCodeStatus(id);
            toast.success('Status toggled');
            fetchPromos();
        } catch {
            toast.error('Failed to toggle status');
        }
    };

    const handleDelete = async (id: string) => {
        if (!confirm('Are you sure you want to delete this promo code?')) return;
        try {
            await deletePromoCode(id);
            toast.success('Promo code deleted');
            fetchPromos();
        } catch {
            toast.error('Failed to delete promo code');
        }
    };

    const handleBroadcast = async (id: string, code: string) => {
        if (!confirm(`Broadcast "${code}" to all customers?`)) return;

        const tid = toast.loading('Broadcasting offer...');
        try {
            const res = await broadcastPromo(id);
            if (res.data?.success) {
                toast.success(res.data.message || 'Offer broadcasted successfully!', { id: tid });
            } else {
                toast.error('Failed to broadcast offer', { id: tid });
            }
        } catch (error) {
            toast.error('Failed to broadcast offer', { id: tid });
            console.error(error);
        }
    };

    const isExpired = (date: string) => new Date(date) < new Date();

    const isOwnPromo = (promo: PromoCode) => {
        if (!user || !promo.createdBy) return false;
        const creatorId = typeof promo.createdBy === 'string' ? promo.createdBy : promo.createdBy._id;
        return creatorId === user._id;
    };

    const getCreatorLabel = (promo: PromoCode) => {
        if (!promo.createdBy || typeof promo.createdBy === 'string') return null;
        return promo.createdBy.role === 'restaurant' ? promo.createdBy.username : 'Admin';
    };

    return (
        <div className="min-h-screen bg-gray-50 flex">
            <AdminSidebar />
            <main className="flex-1 p-8 overflow-auto">
                <header className="flex items-center justify-between mb-8">
                    <div>
                        <h2 className="text-3xl font-bold text-gray-800">Promo Management</h2>
                        <p className="text-gray-500 mt-2">Create and manage promotional offers</p>
                    </div>
                    <button
                        onClick={() => handleOpenModal()}
                        className="flex items-center gap-2 px-6 py-3 bg-red-500 text-white rounded-xl font-medium hover:bg-red-600 transition shadow-lg"
                    >
                        <Plus className="w-5 h-5" /> Create Promo
                    </button>
                </header>

                {/* Promos Grid */}
                {loading ? (
                    <div className="flex items-center justify-center py-20">
                        <Loader2 className="w-10 h-10 animate-spin text-red-500" />
                    </div>
                ) : promos.length === 0 ? (
                    <div className="text-center py-20 text-gray-400">
                        <Tag className="w-16 h-16 mx-auto mb-4 opacity-50" />
                        <p className="text-lg">No promo codes yet</p>
                        <p className="text-sm">Create your first promotional campaign</p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {promos.map((promo) => (
                            <div
                                key={promo._id}
                                className={`bg-white rounded-2xl shadow-sm border overflow-hidden ${isExpired(promo.validUntil) ? 'border-gray-200 opacity-60' : 'border-gray-100'}`}
                            >
                                <div className={`p-6 ${promo.isActive && !isExpired(promo.validUntil) ? 'bg-gradient-to-r from-red-500 to-orange-500' : 'bg-gray-400'}`}>
                                    <div className="flex items-center justify-between mb-2">
                                        <span className="text-white/80 text-sm font-medium">{promo.discountType === 'percentage' ? <Percent className="w-4 h-4 inline" /> : <DollarSign className="w-4 h-4 inline" />} {promo.discountType}</span>
                                        {promo.isActive && !isExpired(promo.validUntil) ? (
                                            <span className="bg-white/20 text-white text-xs px-2 py-1 rounded-full">Active</span>
                                        ) : (
                                            <span className="bg-white/20 text-white text-xs px-2 py-1 rounded-full">Inactive</span>
                                        )}
                                    </div>
                                    <p className="text-3xl font-bold text-white">{promo.code}</p>
                                    <p className="text-white/90 text-lg mt-1">
                                        {promo.discountType === 'percentage' ? `${promo.discountValue}% OFF` : `Rs. ${promo.discountValue} OFF`}
                                    </p>
                                </div>
                                <div className="p-4 space-y-3">
                                    <p className="text-gray-600 text-sm">{promo.description}</p>
                                    <div className="flex items-center justify-between text-xs text-gray-500">
                                        <span>Min: Rs. {promo.minOrderAmount || 0}</span>
                                        <span>Used: {promo.usedCount}/{promo.usageLimit || '∞'}</span>
                                    </div>
                                    <div className="text-xs text-gray-400">
                                        Valid: {new Date(promo.validFrom).toLocaleDateString()} - {new Date(promo.validUntil).toLocaleDateString()}
                                    </div>
                                    {getCreatorLabel(promo) && (
                                        <div className="text-xs">
                                            <span className={`px-2 py-0.5 rounded-full ${typeof promo.createdBy === 'object' && promo.createdBy?.role === 'restaurant' ? 'bg-orange-100 text-orange-700' : 'bg-blue-100 text-blue-700'}`}>
                                                Created by: {getCreatorLabel(promo)}
                                            </span>
                                        </div>
                                    )}
                                    <div className="flex items-center justify-end gap-2 pt-2 border-t border-gray-100">
                                        {isOwnPromo(promo) && (
                                            <button onClick={() => handleToggle(promo._id)} className="p-2 rounded-lg hover:bg-gray-100 transition" title="Toggle status">
                                                {promo.isActive ? <ToggleRight className="w-5 h-5 text-green-500" /> : <ToggleLeft className="w-5 h-5 text-gray-400" />}
                                            </button>
                                        )}
                                        {isOwnPromo(promo) && (
                                            <button onClick={() => handleOpenModal(promo)} className="p-2 rounded-lg hover:bg-gray-100 transition" title="Edit">
                                                <Edit className="w-5 h-5 text-blue-500" />
                                            </button>
                                        )}
                                        {isOwnPromo(promo) && (
                                            <button onClick={() => handleDelete(promo._id)} className="p-2 rounded-lg hover:bg-red-50 transition" title="Delete">
                                                <Trash2 className="w-5 h-5 text-red-500" />
                                            </button>
                                        )}
                                        {promo.isActive && !isExpired(promo.validUntil) && (
                                            <button
                                                onClick={() => handleBroadcast(promo._id, promo.code)}
                                                className="p-2 ml-1 bg-red-500 text-white rounded-lg hover:bg-red-600 transition flex items-center gap-1 text-xs font-bold"
                                                title="Broadcast notification to todos users"
                                            >
                                                <Send className="w-3.5 h-3.5" /> Push
                                            </button>
                                        )}
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}

                {/* Modal */}
                {showModal && (
                    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                        <div className="bg-white rounded-2xl max-w-lg w-full">
                            <div className="p-6 border-b border-gray-100 flex items-center justify-between">
                                <h3 className="text-xl font-bold text-gray-800">{editingPromo ? 'Edit Promo Code' : 'Create Promo Code'}</h3>
                                <button onClick={() => setShowModal(false)} className="text-gray-400 hover:text-gray-600">
                                    <X className="w-6 h-6" />
                                </button>
                            </div>
                            <form onSubmit={handleSubmit} className="p-6 space-y-4">
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Code</label>
                                        <input
                                            type="text"
                                            required
                                            value={formData.code}
                                            onChange={(e) => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
                                            className="w-full px-4 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-red-500 outline-none text-gray-800"
                                            placeholder="SAVE20"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Type</label>
                                        <select
                                            value={formData.discountType}
                                            onChange={(e) => setFormData({ ...formData, discountType: e.target.value as 'percentage' | 'fixed' })}
                                            className="w-full px-4 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-red-500 outline-none text-gray-800"
                                        >
                                            <option value="percentage">Percentage</option>
                                            <option value="fixed">Fixed Amount</option>
                                        </select>
                                    </div>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                                    <input
                                        type="text"
                                        required
                                        value={formData.description}
                                        onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                        className="w-full px-4 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-red-500 outline-none text-gray-800"
                                        placeholder="Get 20% off on your first order"
                                    />
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Discount Value</label>
                                        <input
                                            type="number"
                                            required
                                            value={formData.discountValue}
                                            onChange={(e) => setFormData({ ...formData, discountValue: Number(e.target.value) })}
                                            className="w-full px-4 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-red-500 outline-none text-gray-800"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Max Discount</label>
                                        <input
                                            type="number"
                                            value={formData.maxDiscount || ''}
                                            onChange={(e) => setFormData({ ...formData, maxDiscount: Number(e.target.value) || undefined })}
                                            className="w-full px-4 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-red-500 outline-none text-gray-800"
                                            placeholder="100"
                                        />
                                    </div>
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Min Order Amount</label>
                                        <input
                                            type="number"
                                            value={formData.minOrderAmount || ''}
                                            onChange={(e) => setFormData({ ...formData, minOrderAmount: Number(e.target.value) || undefined })}
                                            className="w-full px-4 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-red-500 outline-none text-gray-800"
                                            placeholder="500"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Usage Limit</label>
                                        <input
                                            type="number"
                                            value={formData.usageLimit || ''}
                                            onChange={(e) => setFormData({ ...formData, usageLimit: Number(e.target.value) || undefined })}
                                            className="w-full px-4 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-red-500 outline-none text-gray-800"
                                            placeholder="Unlimited"
                                        />
                                    </div>
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Valid From</label>
                                        <input
                                            type="date"
                                            required
                                            value={formData.validFrom}
                                            onChange={(e) => setFormData({ ...formData, validFrom: e.target.value })}
                                            className="w-full px-4 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-red-500 outline-none text-gray-800"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Valid Until</label>
                                        <input
                                            type="date"
                                            required
                                            value={formData.validUntil}
                                            onChange={(e) => setFormData({ ...formData, validUntil: e.target.value })}
                                            className="w-full px-4 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-red-500 outline-none text-gray-800"
                                        />
                                    </div>
                                </div>
                                <div className="flex justify-end gap-3 pt-4">
                                    <button type="button" onClick={() => setShowModal(false)} className="px-6 py-2 text-gray-600 hover:bg-gray-100 rounded-xl transition">
                                        Cancel
                                    </button>
                                    <button type="submit" className="px-6 py-2 bg-red-500 text-white rounded-xl font-medium hover:bg-red-600 transition">
                                        {editingPromo ? 'Update' : 'Create'}
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                )}
            </main>
        </div>
    );
}
