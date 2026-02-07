'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import toast from 'react-hot-toast';
import { onboardRestaurant as onboardRestaurantApi } from '@/lib/restaurantService';
import { Store, MapPin, Clock, FileText, Send, Building2, Utensils, Loader2 } from 'lucide-react';

export default function RestaurantOnboardingPage() {
    const router = useRouter();
    const { user } = useAuth();
    const [formData, setFormData] = useState({
        name: '',
        addressLine1: '',
        addressLine2: '',
        city: '',
        state: '',
        zipCode: '',
        cuisineType: '',
        openingHour: '',
        closingHour: '',
        contactPhone: '',
        contactEmail: '',
        logoUrl: '',
        businessLicense: '',
        healthPermit: '',
        taxId: ''
    });
    const [isLoading, setIsLoading] = useState(false);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        const requiredFields = ['name', 'addressLine1', 'city', 'state', 'zipCode', 'cuisineType', 'openingHour', 'closingHour', 'contactPhone', 'contactEmail', 'businessLicense'];
        for (const field of requiredFields) {
            if (!formData[field as keyof typeof formData]) {
                toast.error(`Required: ${field.replace(/([A-Z])/g, ' $1').toLowerCase()}`);
                return;
            }
        }

        if (!user?._id) return;

        setIsLoading(true);

        try {
            const onboardData = {
                name: formData.name,
                address: {
                    addressLine1: formData.addressLine1,
                    addressLine2: formData.addressLine2,
                    city: formData.city,
                    state: formData.state,
                    zipCode: formData.zipCode
                },
                cuisineType: formData.cuisineType,
                openingHour: formData.openingHour,
                closingHour: formData.closingHour,
                contactPhone: formData.contactPhone,
                contactEmail: formData.contactEmail,
                logoUrl: formData.logoUrl,
                documents: {
                    businessLicense: formData.businessLicense,
                    healthPermit: formData.healthPermit,
                    taxId: formData.taxId
                }
            };

            const response = await onboardRestaurantApi(onboardData);

            if (response.error) {
                toast.error(response.error);
            } else {
                toast.success("Application submitted!");
                router.push('/waiting-approval');
            }
        } catch (error: any) {
            toast.error("Failed to submit details");
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="p-8">
            <div className="max-w-4xl mx-auto">
                {/* Header Area */}
                <div className="mb-12 text-center sm:text-left">
                    <h1 className="text-4xl font-extrabold text-gray-800 tracking-tight mb-2">Partner Onboarding</h1>
                    <p className="text-gray-500 font-medium">Configure your establishment credentials for administrative review.</p>
                </div>

                <form onSubmit={handleSubmit} className="space-y-10">
                    {/* Basic Context */}
                    <div className="bg-white rounded-[2.5rem] shadow-sm border border-gray-100 p-8 sm:p-12 relative overflow-hidden">
                        <div className="absolute top-0 right-0 w-32 h-32 bg-yellow-50/50 rounded-full blur-3xl -z-10 translate-x-12 -translate-y-12" />

                        <div className="flex items-center gap-4 mb-10">
                            <div className="w-12 h-12 bg-orange-50 rounded-2xl flex items-center justify-center">
                                <Store className="w-6 h-6 text-orange-500" />
                            </div>
                            <h3 className="text-xl font-black text-gray-800">General Identity</h3>
                        </div>

                        <div className="grid md:grid-cols-2 gap-8">
                            <div className="md:col-span-2 space-y-1.5">
                                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Restaurant Legal Name</label>
                                <input
                                    type="text"
                                    name="name"
                                    value={formData.name}
                                    onChange={handleChange}
                                    placeholder="The Grand Palace, etc."
                                    className="w-full p-4 bg-gray-50 border border-gray-100 rounded-2xl font-bold text-gray-800 focus:ring-2 focus:ring-orange-500 outline-none transition"
                                />
                            </div>

                            <div className="space-y-1.5">
                                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Cuisine Specialities</label>
                                <input
                                    type="text"
                                    name="cuisineType"
                                    value={formData.cuisineType}
                                    onChange={handleChange}
                                    placeholder="Nepali, Continental, Chinese..."
                                    className="w-full p-4 bg-gray-50 border border-gray-100 rounded-2xl font-bold text-gray-800 focus:ring-2 focus:ring-orange-500 outline-none transition"
                                />
                            </div>

                            <div className="space-y-1.5">
                                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Asset Branding (URL)</label>
                                <input
                                    type="text"
                                    name="logoUrl"
                                    value={formData.logoUrl}
                                    onChange={handleChange}
                                    placeholder="Link to square logo..."
                                    className="w-full p-4 bg-gray-50 border border-gray-100 rounded-2xl font-bold text-gray-800 focus:ring-2 focus:ring-orange-500 outline-none transition"
                                />
                            </div>
                        </div>
                    </div>

                    {/* Operational Window */}
                    <div className="bg-white rounded-[2.5rem] shadow-sm border border-gray-100 p-8 sm:p-12">
                        <div className="flex items-center gap-4 mb-10">
                            <div className="w-12 h-12 bg-blue-50 rounded-2xl flex items-center justify-center">
                                <Clock className="w-6 h-6 text-blue-500" />
                            </div>
                            <h3 className="text-xl font-black text-gray-800">Logistics & Communication</h3>
                        </div>

                        <div className="grid md:grid-cols-2 gap-8">
                            <div className="space-y-1.5">
                                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Official Hotline</label>
                                <input
                                    type="text"
                                    name="contactPhone"
                                    value={formData.contactPhone}
                                    onChange={handleChange}
                                    className="w-full p-4 bg-gray-50 border border-gray-100 rounded-2xl font-bold text-gray-800 focus:ring-2 focus:ring-orange-500 outline-none transition"
                                />
                            </div>
                            <div className="space-y-1.5">
                                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Business Support Email</label>
                                <input
                                    type="email"
                                    name="contactEmail"
                                    value={formData.contactEmail}
                                    onChange={handleChange}
                                    className="w-full p-4 bg-gray-50 border border-gray-100 rounded-2xl font-bold text-gray-800 focus:ring-2 focus:ring-orange-500 outline-none transition"
                                />
                            </div>
                            <div className="space-y-1.5">
                                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Shift Start</label>
                                <input
                                    type="time"
                                    name="openingHour"
                                    value={formData.openingHour}
                                    onChange={handleChange}
                                    className="w-full p-4 bg-gray-50 border border-gray-100 rounded-2xl font-bold text-gray-800 focus:ring-2 focus:ring-orange-500 outline-none transition"
                                />
                            </div>
                            <div className="space-y-1.5">
                                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Shift End</label>
                                <input
                                    type="time"
                                    name="closingHour"
                                    value={formData.closingHour}
                                    onChange={handleChange}
                                    className="w-full p-4 bg-gray-50 border border-gray-100 rounded-2xl font-bold text-gray-800 focus:ring-2 focus:ring-orange-500 outline-none transition"
                                />
                            </div>
                        </div>
                    </div>

                    {/* Geographical Location */}
                    <div className="bg-white rounded-[2.5rem] shadow-sm border border-gray-100 p-8 sm:p-12">
                        <div className="flex items-center gap-4 mb-10">
                            <div className="w-12 h-12 bg-green-50 rounded-2xl flex items-center justify-center">
                                <MapPin className="w-6 h-6 text-green-500" />
                            </div>
                            <h3 className="text-xl font-black text-gray-800">Physical Location</h3>
                        </div>

                        <div className="grid md:grid-cols-2 gap-6">
                            <div className="md:col-span-2 space-y-1.5">
                                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Address Entry</label>
                                <input
                                    type="text"
                                    name="addressLine1"
                                    value={formData.addressLine1}
                                    onChange={handleChange}
                                    placeholder="Street, Block, Landmark..."
                                    className="w-full p-4 bg-gray-50 border border-gray-100 rounded-2xl font-bold text-gray-800 focus:ring-2 focus:ring-orange-500 outline-none transition"
                                />
                            </div>
                            <div className="space-y-1.5">
                                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">City</label>
                                <input type="text" name="city" value={formData.city} onChange={handleChange} className="w-full p-4 bg-gray-50 border border-gray-100 rounded-2xl font-bold text-gray-800 focus:ring-2 focus:ring-orange-500 outline-none transition" />
                            </div>
                            <div className="space-y-1.5">
                                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">State / Province</label>
                                <input type="text" name="state" value={formData.state} onChange={handleChange} className="w-full p-4 bg-gray-50 border border-gray-100 rounded-2xl font-bold text-gray-800 focus:ring-2 focus:ring-orange-500 outline-none transition" />
                            </div>
                            <div className="space-y-1.5">
                                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Zip / Postal</label>
                                <input type="text" name="zipCode" value={formData.zipCode} onChange={handleChange} className="w-full p-4 bg-gray-50 border border-gray-100 rounded-2xl font-bold text-gray-800 focus:ring-2 focus:ring-orange-500 outline-none transition" />
                            </div>
                        </div>
                    </div>

                    {/* Regulatory Verification */}
                    <div className="bg-white rounded-[2.5rem] shadow-sm border border-gray-100 p-8 sm:p-12 relative overflow-hidden">
                        <div className="absolute bottom-0 left-0 w-32 h-32 bg-orange-50/50 rounded-full blur-3xl -z-10 -translate-x-12 translate-y-12" />

                        <div className="flex items-center gap-4 mb-10">
                            <div className="w-12 h-12 bg-gray-50 rounded-2xl flex items-center justify-center">
                                <FileText className="w-6 h-6 text-gray-500" />
                            </div>
                            <h3 className="text-xl font-black text-gray-800">Credentials & KYC</h3>
                        </div>

                        <div className="grid gap-6">
                            <div className="space-y-1.5">
                                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Business Registration (PAN/VAT)</label>
                                <input type="text" name="businessLicense" value={formData.businessLicense} onChange={handleChange} className="w-full p-4 bg-gray-50 border border-gray-100 rounded-2xl font-bold text-gray-800 focus:ring-2 focus:ring-orange-500 outline-none transition" />
                            </div>
                            <div className="space-y-1.5">
                                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Sanitation & Health Permit</label>
                                <input type="text" name="healthPermit" value={formData.healthPermit} onChange={handleChange} className="w-full p-4 bg-gray-50 border border-gray-100 rounded-2xl font-bold text-gray-800 focus:ring-2 focus:ring-orange-500 outline-none transition" />
                            </div>
                            <div className="space-y-1.5">
                                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Additional Tax Reference</label>
                                <input type="text" name="taxId" value={formData.taxId} onChange={handleChange} className="w-full p-4 bg-gray-50 border border-gray-100 rounded-2xl font-bold text-gray-800 focus:ring-2 focus:ring-orange-500 outline-none transition" />
                            </div>
                        </div>
                    </div>

                    <button
                        type="submit"
                        disabled={isLoading}
                        className="w-full bg-gradient-to-r from-yellow-400 to-orange-500 text-white font-black text-xl py-6 rounded-[2rem] transition shadow-xl hover:shadow-orange-200 disabled:opacity-50 active:scale-[0.98] flex items-center justify-center gap-3"
                    >
                        {isLoading ? <Loader2 className="w-6 h-6 animate-spin" /> : <Send className="w-6 h-6" />}
                        {isLoading ? 'Processing Request...' : 'Finalize & Submit Application'}
                    </button>
                </form>

                <p className="mt-12 text-center text-gray-400 text-[10px] font-black uppercase tracking-[0.2em] max-w-sm mx-auto leading-loose">
                    By submitting, you agree to the KhanaSathi Partner Terms of Service and Merchant Compliance Policy.
                </p>
            </div>
        </div>
    );
}
