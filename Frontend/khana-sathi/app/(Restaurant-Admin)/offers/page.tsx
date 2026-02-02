'use client';

import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';
import { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import {
    Tag,
    Plus,
    Trash2,
    ToggleLeft,
    ToggleRight,
    Loader2,
    Percent,
    DollarSign,
    Calendar,
    X
} from 'lucide-react';
import { getPromoCodes, createPromoCode, deletePromoCode, togglePromoCodeStatus, PromoCode } from '@/lib/promoService';
import RestaurantSidebar from '@/components/RestaurantSidebar';

export default function OffersPage() {
    const { user, isLoading: authLoading } = useAuth();
    const router = useRouter();
    const [loading, setLoading] = useState(true);
    const [offers, setOffers] = useState<PromoCode[]>([]);
    const [showModal, setShowModal] = useState(false);
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
        if (!user) {
            router.push('/login');
            return;
        }
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

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!formData.code || !formData.description || !formData.validFrom || !formData.validUntil) {
            toast.error("Please fill all required fields");
            return;
        }

        try {
            setSubmitting(true);
            await createPromoCode({
                ...formData,
                minOrderAmount: formData.minOrderAmount || undefined,
                maxDiscount: formData.maxDiscount || undefined,
                usageLimit: formData.usageLimit || undefined
            });
            toast.success("Offer created successfully!");
            setShowModal(false);
            setFormData({
                code: '', description: '', discountType: 'percentage', discountValue: 0,
                minOrderAmount: 0, maxDiscount: 0, validFrom: '', validUntil: '', usageLimit: 0
            });
            fetchOffers();
        } catch (error: any) {
            toast.error(error.response?.data?.message || "Failed to create offer");
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
        } catch (error) {
            toast.error("Failed to delete offer");
        }
    };

    const handleToggle = async (id: string) => {
        try {
            await togglePromoCodeStatus(id);
            toast.success("Status updated");
            fetchOffers();
        } catch (error) {
            toast.error("Failed to update status");
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
                            <h1 className="text-2xl font-bold text-gray-800">Offers & Promotions</h1>
                            <p className="text-gray-500">Manage your restaurant promo codes</p>
                        </div>
                        <button
                            onClick={() => setShowModal(true)}
                            className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-yellow-400 to-orange-500 text-white font-semibold rounded-xl shadow-md hover:shadow-lg transition"
                        >
                            <Plus className="w-5 h-5" />
                            Create Offer
                        </button>
                    </div>

                    {/* Offers Grid */}
                    {loading ? (
                        <div className="flex items-center justify-center py-20">
                            <Loader2 className="w-10 h-10 text-orange-500 animate-spin" />
                        </div>
                    ) : offers.length === 0 ? (
                        <div className="bg-white rounded-2xl shadow-sm p-12 text-center">
                            <div className="w-20 h-20 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-4">
                                <Tag className="w-10 h-10 text-orange-500" />
                            </div>
                            <h3 className="text-xl font-bold text-gray-800 mb-2">No Offers Yet</h3>
                            <p className="text-gray-500 mb-6">Create your first promo code to attract more customers</p>
                            <button
                                onClick={() => setShowModal(true)}
                                className="px-6 py-3 bg-orange-500 text-white rounded-xl hover:bg-orange-600 transition"
                            >
                                Create Your First Offer
                            </button>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {offers.map((offer) => (
                                <div key={offer._id} className="bg-white rounded-2xl shadow-sm p-6 border border-gray-100">
                                    <div className="flex items-start justify-between mb-4">
                                        <div className="flex items-center gap-3">
                                            <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${offer.discountType === 'percentage' ? 'bg-purple-100' : 'bg-green-100'}`}>
                                                {offer.discountType === 'percentage' ? (
                                                    <Percent className="w-6 h-6 text-purple-600" />
                                                ) : (
                                                    <DollarSign className="w-6 h-6 text-green-600" />
                                                )}
                                            </div>
                                            <div>
                                                <p className="font-bold text-lg text-gray-800">{offer.code}</p>
                                                <p className="text-sm text-gray-500">{offer.discountType === 'percentage' ? `${offer.discountValue}% off` : `Rs. ${offer.discountValue} off`}</p>
                                            </div>
                                        </div>
                                        <button
                                            onClick={() => handleToggle(offer._id)}
                                            className={`p-1 rounded ${offer.isActive ? 'text-green-600' : 'text-gray-400'}`}
                                        >
                                            {offer.isActive ? <ToggleRight className="w-8 h-8" /> : <ToggleLeft className="w-8 h-8" />}
                                        </button>
                                    </div>

                                    <p className="text-gray-600 text-sm mb-4">{offer.description}</p>

                                    <div className="flex items-center gap-2 text-xs text-gray-400 mb-4">
                                        <Calendar className="w-4 h-4" />
                                        <span>Valid until {new Date(offer.validUntil).toLocaleDateString()}</span>
                                    </div>

                                    <div className="flex items-center gap-2 pt-4 border-t border-gray-100">
                                        <span className={`px-2 py-1 rounded-full text-xs ${offer.isActive ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600'}`}>
                                            {offer.isActive ? 'Active' : 'Inactive'}
                                        </span>
                                        <span className="text-xs text-gray-400">Used {offer.usedCount || 0} times</span>
                                        <div className="flex-1"></div>
                                        <button onClick={() => handleDelete(offer._id)} className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition">
                                            <Trash2 className="w-4 h-4" />
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {/* Create Modal */}
                {showModal && (
                    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                        <div className="bg-white rounded-2xl shadow-xl max-w-md w-full max-h-[90vh] overflow-y-auto">
                            <div className="p-6 border-b border-gray-100 flex items-center justify-between">
                                <h3 className="text-xl font-bold text-gray-800">Create New Offer</h3>
                                <button onClick={() => setShowModal(false)} className="p-2 hover:bg-gray-100 rounded-full">
                                    <X className="w-5 h-5 text-gray-500" />
                                </button>
                            </div>
                            <form onSubmit={handleSubmit} className="p-6 space-y-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Promo Code *</label>
                                    <input
                                        type="text"
                                        value={formData.code}
                                        onChange={(e) => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
                                        className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-orange-500 focus:outline-none"
                                        placeholder="e.g., SAVE20"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Description *</label>
                                    <input
                                        type="text"
                                        value={formData.description}
                                        onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                        className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-orange-500 focus:outline-none"
                                        placeholder="e.g., Get 20% off on orders above Rs. 500"
                                    />
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Discount Type</label>
                                        <select
                                            value={formData.discountType}
                                            onChange={(e) => setFormData({ ...formData, discountType: e.target.value as 'percentage' | 'fixed' })}
                                            className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-orange-500 focus:outline-none"
                                        >
                                            <option value="percentage">Percentage (%)</option>
                                            <option value="fixed">Fixed Amount (Rs.)</option>
                                        </select>
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Discount Value *</label>
                                        <input
                                            type="number"
                                            value={formData.discountValue}
                                            onChange={(e) => setFormData({ ...formData, discountValue: Number(e.target.value) })}
                                            className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-orange-500 focus:outline-none"
                                        />
                                    </div>
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Min Order Amount</label>
                                        <input
                                            type="number"
                                            value={formData.minOrderAmount}
                                            onChange={(e) => setFormData({ ...formData, minOrderAmount: Number(e.target.value) })}
                                            className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-orange-500 focus:outline-none"
                                            placeholder="Optional"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Max Discount</label>
                                        <input
                                            type="number"
                                            value={formData.maxDiscount}
                                            onChange={(e) => setFormData({ ...formData, maxDiscount: Number(e.target.value) })}
                                            className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-orange-500 focus:outline-none"
                                            placeholder="Optional"
                                        />
                                    </div>
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Valid From *</label>
                                        <input
                                            type="date"
                                            value={formData.validFrom}
                                            onChange={(e) => setFormData({ ...formData, validFrom: e.target.value })}
                                            className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-orange-500 focus:outline-none"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Valid Until *</label>
                                        <input
                                            type="date"
                                            value={formData.validUntil}
                                            onChange={(e) => setFormData({ ...formData, validUntil: e.target.value })}
                                            className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-orange-500 focus:outline-none"
                                        />
                                    </div>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Usage Limit</label>
                                    <input
                                        type="number"
                                        value={formData.usageLimit}
                                        onChange={(e) => setFormData({ ...formData, usageLimit: Number(e.target.value) })}
                                        className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-orange-500 focus:outline-none"
                                        placeholder="Leave 0 for unlimited"
                                    />
                                </div>
                                <button
                                    type="submit"
                                    disabled={submitting}
                                    className="w-full py-3 bg-gradient-to-r from-yellow-400 to-orange-500 text-white font-semibold rounded-xl shadow-md hover:shadow-lg transition disabled:opacity-50"
                                >
                                    {submitting ? 'Creating...' : 'Create Offer'}
                                </button>
                            </form>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
