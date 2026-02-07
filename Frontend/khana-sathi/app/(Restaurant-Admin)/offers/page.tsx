'use client';

import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';
import { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import {
    Tag, Plus, Trash2, Edit, ToggleLeft, ToggleRight,
    Loader2, Percent, DollarSign, Calendar, X,
    Globe, Store, Shield, Lock
} from 'lucide-react';
import {
    getPromoCodes, createPromoCode, updatePromoCode,
    deletePromoCode, togglePromoCodeStatus, PromoCode
} from '@/lib/promoService';

export default function OffersPage() {
    const { user, isLoading: authLoading } = useAuth();
    const router = useRouter();
    const [loading, setLoading] = useState(true);
    const [offers, setOffers] = useState<PromoCode[]>([]);
    const [showModal, setShowModal] = useState(false);
    const [editingOffer, setEditingOffer] = useState<PromoCode | null>(null);
    const [filterTab, setFilterTab] = useState<'mine' | 'global'>('mine');
    const [formData, setFormData] = useState({
        code: '',
        description: '',
        discountType: 'percentage' as 'percentage' | 'fixed',
        discountValue: 0,
        minOrderAmount: 0,
        maxDiscount: 0,
        validFrom: '',
        validUntil: '',
        usageLimit: 0
    });
    const [submitting, setSubmitting] = useState(false);

    useEffect(() => {
        if (authLoading) return;
        if (!user) { router.push('/login'); return; }
        fetchOffers();
    }, [user, router, authLoading]);

    const fetchOffers = async () => {
        try {
            setLoading(true);
            const response = await getPromoCodes();
            if (response.data?.data) {
                setOffers(response.data.data);
            }
        } catch (error) {
            console.error("Error fetching offers:", error);
            toast.error("Failed to load offers");
        } finally {
            setLoading(false);
        }
    };

    const isOwnOffer = (offer: PromoCode) => {
        if (!user || !offer.createdBy) return false;
        const creatorId = typeof offer.createdBy === 'string' ? offer.createdBy : offer.createdBy._id;
        return creatorId === user._id;
    };

    const canModify = (offer: PromoCode) => {
        if (offer.createdByRole === 'admin') return false;
        return isOwnOffer(offer);
    };

    const myOffers = offers.filter(o => o.scope === 'restaurant' && isOwnOffer(o));
    const globalOffers = offers.filter(o => o.scope === 'global');

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!formData.code || !formData.description || !formData.validFrom || !formData.validUntil) {
            toast.error("Please fill all required fields");
            return;
        }
        try {
            setSubmitting(true);
            const payload = {
                ...formData,
                minOrderAmount: formData.minOrderAmount || undefined,
                maxDiscount: formData.maxDiscount || undefined,
                usageLimit: formData.usageLimit || undefined
            };
            if (editingOffer) {
                await updatePromoCode(editingOffer._id, payload);
                toast.success("Offer updated successfully!");
            } else {
                await createPromoCode(payload);
                toast.success("Offer created successfully!");
            }
            setShowModal(false);
            setEditingOffer(null);
            setFormData({ code: '', description: '', discountType: 'percentage', discountValue: 0, minOrderAmount: 0, maxDiscount: 0, validFrom: '', validUntil: '', usageLimit: 0 });
            fetchOffers();
        } catch (error: unknown) {
            const err = error as { response?: { data?: { message?: string } } };
            toast.error(err.response?.data?.message || "Failed to save offer");
        } finally {
            setSubmitting(false);
        }
    };

    const handleDelete = async (id: string) => {
        if (!confirm("Are you sure you want to delete this offer?")) return;
        try {
            await deletePromoCode(id);
            toast.success("Offer deleted");
            fetchOffers();
        } catch {
            toast.error("Failed to delete offer");
        }
    };

    const handleEdit = (offer: PromoCode) => {
        setEditingOffer(offer);
        setFormData({
            code: offer.code,
            description: offer.description,
            discountType: offer.discountType,
            discountValue: offer.discountValue,
            minOrderAmount: offer.minOrderAmount || 0,
            maxDiscount: offer.maxDiscount || 0,
            validFrom: offer.validFrom?.split('T')[0] || '',
            validUntil: offer.validUntil?.split('T')[0] || '',
            usageLimit: offer.usageLimit || 0
        });
        setShowModal(true);
    };

    const handleToggle = async (id: string) => {
        try {
            await togglePromoCodeStatus(id);
            toast.success("Status updated");
            fetchOffers();
        } catch {
            toast.error("Failed to update status");
        }
    };

    const isExpired = (date: string) => new Date(date) < new Date();

    if (authLoading) {
        return (
            <div className="flex items-center justify-center min-h-[60vh]">
                <Loader2 className="w-10 h-10 text-orange-500 animate-spin" />
            </div>
        );
    }

    const displayOffers = filterTab === 'mine' ? myOffers : globalOffers;

    return (
        <div className="p-8">
            <div className="max-w-6xl mx-auto">
                {/* Header Section */}
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-8">
                    <div>
                        <h1 className="text-3xl font-bold text-gray-800">Offers & Promotions</h1>
                        <p className="text-gray-500">Manage your custom promo codes and view global deals</p>
                    </div>
                    <button
                        onClick={() => { setEditingOffer(null); setFormData({ code: '', description: '', discountType: 'percentage', discountValue: 0, minOrderAmount: 0, maxDiscount: 0, validFrom: '', validUntil: '', usageLimit: 0 }); setShowModal(true); }}
                        className="w-full sm:w-auto flex items-center justify-center gap-2 px-6 py-3 bg-gradient-to-r from-yellow-400 to-orange-500 text-white font-bold rounded-xl shadow-md hover:shadow-lg transition"
                    >
                        <Plus className="w-5 h-5" />
                        Create New Offer
                    </button>
                </div>

                {/* Filter Tabs */}
                <div className="flex bg-white p-1.5 rounded-2xl border border-gray-100 w-fit mb-8 gap-1">
                    <button
                        onClick={() => setFilterTab('mine')}
                        className={`px-5 py-2.5 rounded-xl text-sm font-bold transition flex items-center gap-2 ${filterTab === 'mine' ? 'bg-orange-500 text-white shadow-sm' : 'text-gray-500 hover:bg-gray-50'}`}
                    >
                        <Store className="w-4 h-4" /> My Restaurant
                        <span className={`text-[10px] px-2 py-0.5 rounded-full ${filterTab === 'mine' ? 'bg-white/20' : 'bg-gray-100'}`}>{myOffers.length}</span>
                    </button>
                    <button
                        onClick={() => setFilterTab('global')}
                        className={`px-5 py-2.5 rounded-xl text-sm font-bold transition flex items-center gap-2 ${filterTab === 'global' ? 'bg-blue-500 text-white shadow-sm' : 'text-gray-500 hover:bg-gray-50'}`}
                    >
                        <Globe className="w-4 h-4" /> Global Deals
                        <span className={`text-[10px] px-2 py-0.5 rounded-full ${filterTab === 'global' ? 'bg-white/20' : 'bg-gray-100'}`}>{globalOffers.length}</span>
                    </button>
                </div>

                {/* Content Area */}
                {loading ? (
                    <div className="flex items-center justify-center py-20">
                        <Loader2 className="w-10 h-10 text-orange-500 animate-spin" />
                    </div>
                ) : displayOffers.length === 0 ? (
                    <div className="bg-white rounded-2xl shadow-sm p-12 text-center border-2 border-dashed border-gray-100">
                        <div className="w-20 h-20 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-4">
                            {filterTab === 'mine' ? <Tag className="w-10 h-10 text-gray-300" /> : <Globe className="w-10 h-10 text-gray-300" />}
                        </div>
                        <h3 className="text-xl font-bold text-gray-800 mb-2">
                            {filterTab === 'mine' ? 'No Active Promo Codes' : 'No Global Promotions'}
                        </h3>
                        <p className="text-gray-500 mb-6 max-w-sm mx-auto">
                            {filterTab === 'mine' ? 'Reward your loyal customers with special discounts and offers.' : 'KhanaSathi platform-wide deals will appear here.'}
                        </p>
                        {filterTab === 'mine' && (
                            <button
                                onClick={() => setShowModal(true)}
                                className="px-6 py-3 bg-orange-500 text-white rounded-xl font-bold hover:bg-orange-600 transition"
                            >
                                Create Your First Deal
                            </button>
                        )}
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {displayOffers.map((offer) => {
                            const editable = canModify(offer);
                            const isGlobal = offer.scope === 'global';

                            return (
                                <div key={offer._id} className={`bg-white rounded-2xl shadow-sm p-6 border-l-4 ${isGlobal ? 'border-l-blue-500 border-gray-100' : 'border-l-orange-500 border-gray-100'} hover:shadow-md transition ${isExpired(offer.validUntil) ? 'opacity-60 grayscale-[0.5]' : ''}`}>
                                    <div className="flex items-start justify-between mb-4">
                                        <div className="flex items-center gap-3">
                                            <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${isGlobal ? 'bg-blue-50' : 'bg-orange-50'}`}>
                                                {isGlobal ? <Globe className="w-6 h-6 text-blue-600" /> : <Tag className="w-6 h-6 text-orange-600" />}
                                            </div>
                                            <div>
                                                <p className="font-bold text-lg text-gray-800 tracking-tight">{offer.code}</p>
                                                <p className="text-sm font-bold text-red-600">
                                                    {offer.discountType === 'percentage' ? `${offer.discountValue}% OFF` : `Rs. ${offer.discountValue} FLAT`}
                                                </p>
                                            </div>
                                        </div>
                                        {editable && (
                                            <button
                                                onClick={() => handleToggle(offer._id)}
                                                className={`p-1 transition ${offer.isActive ? 'text-green-600 hover:text-green-700' : 'text-gray-400'}`}
                                            >
                                                {offer.isActive ? <ToggleRight className="w-8 h-8" /> : <ToggleLeft className="w-8 h-8" />}
                                            </button>
                                        )}
                                    </div>

                                    <p className="text-gray-600 text-sm mb-4 line-clamp-2 min-h-[40px]">{offer.description}</p>

                                    <div className="space-y-2 mb-6 text-[11px] font-bold uppercase tracking-wider text-gray-400">
                                        <div className="flex items-center gap-2">
                                            <Calendar className="w-3.5 h-3.5" />
                                            <span>Ends: {new Date(offer.validUntil).toLocaleDateString()}</span>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <Store className="w-3.5 h-3.5" />
                                            <span>Min Order: Rs. {offer.minOrderAmount || 0}</span>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <Plus className="w-3.5 h-3.5 rotate-45" />
                                            <span>Used: {offer.usedCount || 0} / {offer.usageLimit || '∞'}</span>
                                        </div>
                                    </div>

                                    <div className="flex items-center justify-between pt-4 border-t border-gray-50">
                                        <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-tight ${offer.isActive && !isExpired(offer.validUntil) ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
                                            {offer.isActive && !isExpired(offer.validUntil) ? 'Active' : 'Disabled'}
                                        </span>
                                        <div className="flex items-center gap-1">
                                            {editable ? (
                                                <>
                                                    <button onClick={() => handleEdit(offer)} className="p-1.5 text-gray-400 hover:text-blue-500 hover:bg-blue-50 rounded-lg transition">
                                                        <Edit className="w-4 h-4" />
                                                    </button>
                                                    <button onClick={() => handleDelete(offer._id)} className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition">
                                                        <Trash2 className="w-4 h-4" />
                                                    </button>
                                                </>
                                            ) : (
                                                <div className="flex items-center gap-1.5 text-[10px] text-gray-400 font-bold italic uppercase px-2 py-1 bg-gray-50 rounded">
                                                    <Lock className="w-3 h-3" /> Managed By KhanaSathi
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>

            {/* Create / Edit Modal */}
            {showModal && (
                <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-[110] p-4 backdrop-blur-sm">
                    <div className="bg-white rounded-3xl shadow-2xl max-w-md w-full max-h-[95vh] overflow-y-auto">
                        <div className="p-6 border-b border-gray-100 flex items-center justify-between sticky top-0 bg-white/80 backdrop-blur-md z-10">
                            <h3 className="text-xl font-bold text-gray-800">{editingOffer ? 'Edit Promotion' : 'New Promo Code'}</h3>
                            <button onClick={() => { setShowModal(false); setEditingOffer(null); }} className="p-2 hover:bg-gray-100 rounded-full transition">
                                <X className="w-5 h-5 text-gray-500" />
                            </button>
                        </div>
                        <form onSubmit={handleSubmit} className="p-6 space-y-5">
                            <div className="bg-orange-50 border border-orange-100 rounded-2xl p-4 text-xs font-semibold text-orange-700 flex items-center gap-3">
                                <Store className="w-5 h-5 flex-shrink-0" />
                                This offer will only be visible and usable for your restaurant's customers.
                            </div>

                            <div className="space-y-1.5">
                                <label className="text-xs font-bold text-gray-400 uppercase tracking-wider ml-1">Promo Code *</label>
                                <input type="text" value={formData.code}
                                    onChange={(e) => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
                                    className="w-full px-4 py-3 bg-gray-50 border border-gray-100 rounded-2xl focus:ring-2 focus:ring-orange-500 outline-none font-bold"
                                    placeholder="e.g., WELCOME20"
                                />
                            </div>

                            <div className="space-y-1.5">
                                <label className="text-xs font-bold text-gray-400 uppercase tracking-wider ml-1">Description *</label>
                                <textarea value={formData.description}
                                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                    className="w-full px-4 py-3 bg-gray-50 border border-gray-100 rounded-2xl focus:ring-2 focus:ring-orange-500 outline-none min-h-[80px]"
                                    placeholder="Briefly explain the offer..."
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-1.5">
                                    <label className="text-xs font-bold text-gray-400 uppercase tracking-wider ml-1">Type</label>
                                    <select value={formData.discountType}
                                        onChange={(e) => setFormData({ ...formData, discountType: e.target.value as 'percentage' | 'fixed' })}
                                        className="w-full px-4 py-3 bg-gray-50 border border-gray-100 rounded-2xl focus:ring-2 focus:ring-orange-500 outline-none font-bold text-sm"
                                    >
                                        <option value="percentage">Percentage (%)</option>
                                        <option value="fixed">Fixed (Rs.)</option>
                                    </select>
                                </div>
                                <div className="space-y-1.5">
                                    <label className="text-xs font-bold text-gray-400 uppercase tracking-wider ml-1">Value *</label>
                                    <input type="number" value={formData.discountValue}
                                        onChange={(e) => setFormData({ ...formData, discountValue: Number(e.target.value) })}
                                        className="w-full px-4 py-3 bg-gray-50 border border-gray-100 rounded-2xl focus:ring-2 focus:ring-orange-500 outline-none font-bold text-sm"
                                    />
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-1.5">
                                    <label className="text-xs font-bold text-gray-400 uppercase tracking-wider ml-1">Min Order</label>
                                    <input type="number" value={formData.minOrderAmount}
                                        onChange={(e) => setFormData({ ...formData, minOrderAmount: Number(e.target.value) })}
                                        className="w-full px-4 py-3 bg-gray-50 border border-gray-100 rounded-2xl focus:ring-2 focus:ring-orange-500 outline-none text-sm"
                                        placeholder="Min Rs."
                                    />
                                </div>
                                <div className="space-y-1.5">
                                    <label className="text-xs font-bold text-gray-400 uppercase tracking-wider ml-1">Max Discount</label>
                                    <input type="number" value={formData.maxDiscount}
                                        onChange={(e) => setFormData({ ...formData, maxDiscount: Number(e.target.value) })}
                                        className="w-full px-4 py-3 bg-gray-50 border border-gray-100 rounded-2xl focus:ring-2 focus:ring-orange-500 outline-none text-sm"
                                        placeholder="Max Rs."
                                    />
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-1.5">
                                    <label className="text-xs font-bold text-gray-400 uppercase tracking-wider ml-1">Starts</label>
                                    <input type="date" value={formData.validFrom}
                                        onChange={(e) => setFormData({ ...formData, validFrom: e.target.value })}
                                        className="w-full px-4 py-3 bg-gray-50 border border-gray-100 rounded-2xl focus:ring-2 focus:ring-orange-500 outline-none text-sm"
                                    />
                                </div>
                                <div className="space-y-1.5">
                                    <label className="text-xs font-bold text-gray-400 uppercase tracking-wider ml-1">Ends</label>
                                    <input type="date" value={formData.validUntil}
                                        onChange={(e) => setFormData({ ...formData, validUntil: e.target.value })}
                                        className="w-full px-4 py-3 bg-gray-50 border border-gray-100 rounded-2xl focus:ring-2 focus:ring-orange-500 outline-none text-sm"
                                    />
                                </div>
                            </div>

                            <button type="submit" disabled={submitting}
                                className="w-full py-4 bg-gradient-to-r from-yellow-400 via-orange-500 to-red-500 text-white font-bold rounded-2xl shadow-xl hover:shadow-2xl transition disabled:opacity-50 mt-4 active:scale-95"
                            >
                                {submitting ? <Loader2 className="w-6 h-6 animate-spin mx-auto" /> : (editingOffer ? 'Update Promotion' : 'Launch Promotion')}
                            </button>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
