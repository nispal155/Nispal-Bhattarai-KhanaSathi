'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import AdminSidebar from '@/components/admin/AdminSidebar';
import {
    getPromoCodes, createPromoCode, updatePromoCode, deletePromoCode,
    togglePromoCodeStatus, broadcastPromo, getPromoAuditLog,
    PromoCode, CreatePromoInput, AuditLogEntry
} from '@/lib/promoService';
import { getAllRestaurants } from '@/lib/restaurantService';
import toast from 'react-hot-toast';
import {
    Tag, Plus, Loader2, Trash2, Edit, ToggleLeft, ToggleRight,
    Percent, DollarSign, X, Send, Globe, Store, Shield, ClipboardList, ChevronDown
} from 'lucide-react';

export default function PromoManagementPage() {
    const { user } = useAuth();
    const [promos, setPromos] = useState<PromoCode[]>([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [editingPromo, setEditingPromo] = useState<PromoCode | null>(null);
    const [restaurants, setRestaurants] = useState<{ _id: string; name: string }[]>([]);
    const [filterScope, setFilterScope] = useState<'all' | 'global' | 'restaurant'>('all');
    const [auditModal, setAuditModal] = useState<{ code: string; logs: AuditLogEntry[] } | null>(null);
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
        perUserLimit: 1,
        scope: 'global',
        applicableRestaurants: []
    });

    useEffect(() => {
        fetchPromos();
        fetchRestaurants();
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

    const fetchRestaurants = async () => {
        try {
            const res = await getAllRestaurants();
            if (res.data) {
                const list = Array.isArray(res.data) ? res.data : (res.data as unknown as { data: { _id: string; name: string }[] }).data || [];
                setRestaurants(list.map((r: { _id: string; name: string }) => ({ _id: r._id, name: r.name })));
            }
        } catch {
            console.error('Failed to load restaurants');
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
                perUserLimit: promo.perUserLimit,
                scope: promo.scope || 'global',
                applicableRestaurants: promo.applicableRestaurants?.map(r => typeof r === 'string' ? r : r._id) || []
            });
        } else {
            setEditingPromo(null);
            setFormData({
                code: '', description: '', discountType: 'percentage', discountValue: 10,
                minOrderAmount: 0, maxDiscount: 100,
                validFrom: new Date().toISOString().split('T')[0],
                validUntil: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
                usageLimit: undefined, perUserLimit: 1, scope: 'global', applicableRestaurants: []
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
        } catch {
            toast.error('Failed to broadcast offer', { id: tid });
        }
    };

    const handleViewAudit = async (id: string) => {
        try {
            const res = await getPromoAuditLog(id);
            if (res.data?.success) {
                setAuditModal(res.data.data);
            }
        } catch {
            toast.error('Failed to fetch audit log');
        }
    };

    const isExpired = (date: string) => new Date(date) < new Date();

    const getCreatorLabel = (promo: PromoCode) => {
        if (!promo.createdBy || typeof promo.createdBy === 'string') return null;
        return promo.createdBy.role === 'restaurant' ? promo.createdBy.username : 'Super Admin';
    };

    const getRestaurantName = (promo: PromoCode) => {
        if (!promo.restaurant) return null;
        return typeof promo.restaurant === 'string' ? promo.restaurant : promo.restaurant.name;
    };

    const filteredPromos = promos.filter(p => {
        if (filterScope === 'all') return true;
        return p.scope === filterScope;
    });

    return (
        <div className="min-h-screen bg-gray-50 flex">
            <AdminSidebar />
            <main className="flex-1 p-8 overflow-auto">
                <header className="flex items-center justify-between mb-8">
                    <div>
                        <h2 className="text-3xl font-bold text-gray-800">Offer Management</h2>
                        <p className="text-gray-500 mt-2">Manage global and restaurant-specific offers with full control</p>
                    </div>
                    <button
                        onClick={() => handleOpenModal()}
                        className="flex items-center gap-2 px-6 py-3 bg-red-500 text-white rounded-xl font-medium hover:bg-red-600 transition shadow-lg"
                    >
                        <Plus className="w-5 h-5" /> Create Offer
                    </button>
                </header>

                {/* Scope Filter Tabs */}
                <div className="flex gap-2 mb-6">
                    {(['all', 'global', 'restaurant'] as const).map(tab => (
                        <button
                            key={tab}
                            onClick={() => setFilterScope(tab)}
                            className={`px-4 py-2 rounded-xl text-sm font-medium transition flex items-center gap-2 ${filterScope === tab ? 'bg-red-500 text-white shadow' : 'bg-white text-gray-600 hover:bg-gray-100 border border-gray-200'}`}
                        >
                            {tab === 'all' && <Tag className="w-4 h-4" />}
                            {tab === 'global' && <Globe className="w-4 h-4" />}
                            {tab === 'restaurant' && <Store className="w-4 h-4" />}
                            {tab === 'all' ? 'All Offers' : tab === 'global' ? 'Global' : 'Restaurant-Specific'}
                            <span className="bg-white/20 text-xs px-2 py-0.5 rounded-full">
                                {tab === 'all' ? promos.length : promos.filter(p => p.scope === tab).length}
                            </span>
                        </button>
                    ))}
                </div>

                {/* Promos Grid */}
                {loading ? (
                    <div className="flex items-center justify-center py-20">
                        <Loader2 className="w-10 h-10 animate-spin text-red-500" />
                    </div>
                ) : filteredPromos.length === 0 ? (
                    <div className="text-center py-20 text-gray-400">
                        <Tag className="w-16 h-16 mx-auto mb-4 opacity-50" />
                        <p className="text-lg">No offers found</p>
                        <p className="text-sm">Create a new promotional campaign</p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {filteredPromos.map((promo) => (
                            <div
                                key={promo._id}
                                className={`bg-white rounded-2xl shadow-sm border overflow-hidden ${isExpired(promo.validUntil) ? 'border-gray-200 opacity-60' : 'border-gray-100'}`}
                            >
                                <div className={`p-6 ${promo.isActive && !isExpired(promo.validUntil) ? (promo.scope === 'global' ? 'bg-gradient-to-r from-red-500 to-orange-500' : 'bg-gradient-to-r from-blue-500 to-purple-500') : 'bg-gray-400'}`}>
                                    <div className="flex items-center justify-between mb-2">
                                        <span className="text-white/80 text-sm font-medium flex items-center gap-1">
                                            {promo.discountType === 'percentage' ? <Percent className="w-4 h-4" /> : <DollarSign className="w-4 h-4" />}
                                            {promo.discountType}
                                        </span>
                                        <div className="flex items-center gap-2">
                                            <span className={`text-xs px-2 py-1 rounded-full font-medium flex items-center gap-1 ${promo.scope === 'global' ? 'bg-white/20 text-white' : 'bg-white/30 text-white'}`}>
                                                {promo.scope === 'global' ? <Globe className="w-3 h-3" /> : <Store className="w-3 h-3" />}
                                                {promo.scope === 'global' ? 'Global' : 'Restaurant'}
                                            </span>
                                            {promo.isActive && !isExpired(promo.validUntil) ? (
                                                <span className="bg-green-400/30 text-white text-xs px-2 py-1 rounded-full">Active</span>
                                            ) : (
                                                <span className="bg-white/20 text-white text-xs px-2 py-1 rounded-full">Inactive</span>
                                            )}
                                        </div>
                                    </div>
                                    <p className="text-3xl font-bold text-white">{promo.code}</p>
                                    <p className="text-white/90 text-lg mt-1">
                                        {promo.discountType === 'percentage' ? `${promo.discountValue}% OFF` : `Rs. ${promo.discountValue} OFF`}
                                    </p>
                                </div>
                                <div className="p-4 space-y-3">
                                    <p className="text-gray-600 text-sm">{promo.description}</p>
                                    {promo.scope === 'restaurant' && getRestaurantName(promo) && (
                                        <div className="flex items-center gap-1 text-xs">
                                            <Store className="w-3.5 h-3.5 text-purple-500" />
                                            <span className="text-purple-700 font-medium">{getRestaurantName(promo)}</span>
                                        </div>
                                    )}
                                    <div className="flex items-center justify-between text-xs text-gray-500">
                                        <span>Min: Rs. {promo.minOrderAmount || 0}</span>
                                        <span>Used: {promo.usedCount}/{promo.usageLimit || '∞'}</span>
                                    </div>
                                    <div className="text-xs text-gray-400">
                                        Valid: {new Date(promo.validFrom).toLocaleDateString()} - {new Date(promo.validUntil).toLocaleDateString()}
                                    </div>
                                    {/* Creator & Role badges */}
                                    <div className="flex items-center gap-2 flex-wrap">
                                        {getCreatorLabel(promo) && (
                                            <span className={`text-xs px-2 py-0.5 rounded-full ${promo.createdByRole === 'restaurant' ? 'bg-orange-100 text-orange-700' : 'bg-blue-100 text-blue-700'}`}>
                                                <Shield className="w-3 h-3 inline mr-1" />
                                                {getCreatorLabel(promo)}
                                            </span>
                                        )}
                                    </div>
                                    {/* Action buttons — Admin can always edit/delete/toggle */}
                                    <div className="flex items-center justify-end gap-2 pt-2 border-t border-gray-100">
                                        <button onClick={() => handleViewAudit(promo._id)} className="p-2 rounded-lg hover:bg-gray-100 transition" title="View Audit Log">
                                            <ClipboardList className="w-5 h-5 text-gray-400" />
                                        </button>
                                        <button onClick={() => handleToggle(promo._id)} className="p-2 rounded-lg hover:bg-gray-100 transition" title="Toggle status">
                                            {promo.isActive ? <ToggleRight className="w-5 h-5 text-green-500" /> : <ToggleLeft className="w-5 h-5 text-gray-400" />}
                                        </button>
                                        <button onClick={() => handleOpenModal(promo)} className="p-2 rounded-lg hover:bg-gray-100 transition" title="Edit">
                                            <Edit className="w-5 h-5 text-blue-500" />
                                        </button>
                                        <button onClick={() => handleDelete(promo._id)} className="p-2 rounded-lg hover:bg-red-50 transition" title="Delete">
                                            <Trash2 className="w-5 h-5 text-red-500" />
                                        </button>
                                        {promo.isActive && !isExpired(promo.validUntil) && (
                                            <button
                                                onClick={() => handleBroadcast(promo._id, promo.code)}
                                                className="p-2 ml-1 bg-red-500 text-white rounded-lg hover:bg-red-600 transition flex items-center gap-1 text-xs font-bold"
                                                title="Broadcast to all customers"
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

                {/* Create / Edit Modal */}
                {showModal && (
                    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                        <div className="bg-white rounded-2xl max-w-lg w-full max-h-[90vh] overflow-y-auto">
                            <div className="p-6 border-b border-gray-100 flex items-center justify-between">
                                <h3 className="text-xl font-bold text-gray-800">{editingPromo ? 'Edit Offer' : 'Create Offer'}</h3>
                                <button onClick={() => setShowModal(false)} className="text-gray-400 hover:text-gray-600">
                                    <X className="w-6 h-6" />
                                </button>
                            </div>
                            <form onSubmit={handleSubmit} className="p-6 space-y-4">
                                {/* Scope selector (Admin only) */}
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">Offer Scope</label>
                                    <div className="flex gap-3">
                                        <button type="button"
                                            onClick={() => setFormData({ ...formData, scope: 'global', applicableRestaurants: [] })}
                                            className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl border-2 transition font-medium ${formData.scope === 'global' ? 'border-red-500 bg-red-50 text-red-700' : 'border-gray-200 text-gray-500 hover:border-gray-300'}`}
                                        >
                                            <Globe className="w-5 h-5" /> Global
                                        </button>
                                        <button type="button"
                                            onClick={() => setFormData({ ...formData, scope: 'restaurant' })}
                                            className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl border-2 transition font-medium ${formData.scope === 'restaurant' ? 'border-purple-500 bg-purple-50 text-purple-700' : 'border-gray-200 text-gray-500 hover:border-gray-300'}`}
                                        >
                                            <Store className="w-5 h-5" /> Restaurant
                                        </button>
                                    </div>
                                </div>

                                {/* Restaurant selector when scope is restaurant */}
                                {formData.scope === 'restaurant' && (
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Target Restaurant</label>
                                        <div className="relative">
                                            <select
                                                value={formData.applicableRestaurants?.[0] || ''}
                                                onChange={(e) => setFormData({ ...formData, applicableRestaurants: e.target.value ? [e.target.value] : [] })}
                                                className="w-full px-4 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-red-500 outline-none text-gray-800 appearance-none"
                                            >
                                                <option value="">Select a restaurant</option>
                                                {restaurants.map(r => (
                                                    <option key={r._id} value={r._id}>{r.name}</option>
                                                ))}
                                            </select>
                                            <ChevronDown className="w-4 h-4 text-gray-400 absolute right-3 top-3 pointer-events-none" />
                                        </div>
                                    </div>
                                )}

                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Code</label>
                                        <input type="text" required value={formData.code}
                                            onChange={(e) => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
                                            className="w-full px-4 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-red-500 outline-none text-gray-800"
                                            placeholder="SAVE20"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Type</label>
                                        <select value={formData.discountType}
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
                                    <input type="text" required value={formData.description}
                                        onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                        className="w-full px-4 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-red-500 outline-none text-gray-800"
                                        placeholder="Get 20% off on your first order"
                                    />
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Discount Value</label>
                                        <input type="number" required value={formData.discountValue}
                                            onChange={(e) => setFormData({ ...formData, discountValue: Number(e.target.value) })}
                                            className="w-full px-4 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-red-500 outline-none text-gray-800"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Max Discount</label>
                                        <input type="number" value={formData.maxDiscount || ''}
                                            onChange={(e) => setFormData({ ...formData, maxDiscount: Number(e.target.value) || undefined })}
                                            className="w-full px-4 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-red-500 outline-none text-gray-800"
                                            placeholder="100"
                                        />
                                    </div>
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Min Order Amount</label>
                                        <input type="number" value={formData.minOrderAmount || ''}
                                            onChange={(e) => setFormData({ ...formData, minOrderAmount: Number(e.target.value) || undefined })}
                                            className="w-full px-4 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-red-500 outline-none text-gray-800"
                                            placeholder="500"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Usage Limit</label>
                                        <input type="number" value={formData.usageLimit || ''}
                                            onChange={(e) => setFormData({ ...formData, usageLimit: Number(e.target.value) || undefined })}
                                            className="w-full px-4 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-red-500 outline-none text-gray-800"
                                            placeholder="Unlimited"
                                        />
                                    </div>
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Valid From</label>
                                        <input type="date" required value={formData.validFrom}
                                            onChange={(e) => setFormData({ ...formData, validFrom: e.target.value })}
                                            className="w-full px-4 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-red-500 outline-none text-gray-800"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Valid Until</label>
                                        <input type="date" required value={formData.validUntil}
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

                {/* Audit Log Modal */}
                {auditModal && (
                    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                        <div className="bg-white rounded-2xl max-w-lg w-full max-h-[80vh] overflow-y-auto">
                            <div className="p-6 border-b border-gray-100 flex items-center justify-between sticky top-0 bg-white z-10">
                                <h3 className="text-lg font-bold text-gray-800 flex items-center gap-2">
                                    <ClipboardList className="w-5 h-5 text-gray-500" />
                                    Audit Log — {auditModal.code}
                                </h3>
                                <button onClick={() => setAuditModal(null)} className="text-gray-400 hover:text-gray-600">
                                    <X className="w-6 h-6" />
                                </button>
                            </div>
                            <div className="p-6">
                                {auditModal.logs.length === 0 ? (
                                    <p className="text-gray-400 text-center py-8">No audit entries</p>
                                ) : (
                                    <div className="space-y-4">
                                        {auditModal.logs.map((log, idx) => (
                                            <div key={idx} className="border-l-4 border-gray-200 pl-4 py-2">
                                                <div className="flex items-center justify-between">
                                                    <span className={`text-sm font-semibold capitalize ${log.action === 'created' ? 'text-green-600' : log.action === 'deleted' ? 'text-red-600' : 'text-blue-600'}`}>
                                                        {log.action}
                                                    </span>
                                                    <span className="text-xs text-gray-400">{new Date(log.timestamp).toLocaleString()}</span>
                                                </div>
                                                <p className="text-xs text-gray-500 mt-1">
                                                    By: {typeof log.performedBy === 'string' ? log.performedBy : log.performedBy?.username || 'Unknown'}
                                                    <span className="ml-2 px-1.5 py-0.5 bg-gray-100 rounded text-gray-500">{log.performedByRole}</span>
                                                </p>
                                                {log.changes && Object.keys(log.changes).length > 0 && (
                                                    <div className="mt-2 text-xs bg-gray-50 rounded-lg p-2 space-y-1">
                                                        {Object.entries(log.changes).map(([key, val]) => (
                                                            <div key={key} className="text-gray-600">
                                                                <span className="font-medium">{key}:</span> {String((val as { from: unknown }).from)} → {String((val as { to: unknown }).to)}
                                                            </div>
                                                        ))}
                                                    </div>
                                                )}
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                )}
            </main>
        </div>
    );
}
