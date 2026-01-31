'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import toast from 'react-hot-toast';
import axios from 'axios';

const API_URL = "http://localhost:5003/api/restaurants";

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

        // Basic validation
        const requiredFields = ['name', 'addressLine1', 'city', 'state', 'zipCode', 'cuisineType', 'openingHour', 'closingHour', 'contactPhone', 'contactEmail', 'businessLicense'];
        for (const field of requiredFields) {
            if (!formData[field as keyof typeof formData]) {
                toast.error(`Please fill in ${field}`);
                return;
            }
        }

        if (!user?._id) {
            toast.error("User session not found. Please login again.");
            return;
        }

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

            const token = localStorage.getItem('token');
            await axios.put(`${API_URL}/onboard`, onboardData, {
                headers: {
                    Authorization: `Bearer ${token}`
                }
            });

            toast.success("Onboarding details submitted successfully!");
            router.push('/waiting-approval');
        } catch (error: any) {
            console.error(error);
            toast.error(error.response?.data?.message || "Failed to submit onboarding details");
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-gray-50 flex flex-col items-center py-12 px-4">
            <div className="w-full max-w-3xl bg-white rounded-2xl shadow-xl overflow-hidden">
                <div className="bg-yellow-500 p-8 text-center text-white">
                    <h1 className="text-4xl font-bold">Restaurant Onboarding</h1>
                    <p className="mt-2 text-yellow-100 text-lg">Tell us about your restaurant to get started.</p>
                </div>

                <form onSubmit={handleSubmit} className="p-10 space-y-8">
                    {/* Basic Info Section */}
                    <section>
                        <h3 className="text-xl font-bold text-gray-800 mb-6 pb-2 border-b-2 border-yellow-500 inline-block">Restaurant Information</h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="md:col-span-2">
                                <label className="block text-sm font-semibold text-gray-700 mb-2">Restaurant Name</label>
                                <input
                                    type="text"
                                    name="name"
                                    value={formData.name}
                                    onChange={handleChange}
                                    placeholder="e.g. The Gourmet Hub"
                                    className="w-full p-4 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-yellow-500 focus:outline-none text-black transition"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-2">Cuisine Types (comma separated)</label>
                                <input
                                    type="text"
                                    name="cuisineType"
                                    value={formData.cuisineType}
                                    onChange={handleChange}
                                    placeholder="e.g. Italian, Mexican, Asian"
                                    className="w-full p-4 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-yellow-500 focus:outline-none text-black transition"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-2">Logo URL (Optional)</label>
                                <input
                                    type="text"
                                    name="logoUrl"
                                    value={formData.logoUrl}
                                    onChange={handleChange}
                                    placeholder="https://example.com/logo.png"
                                    className="w-full p-4 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-yellow-500 focus:outline-none text-black transition"
                                />
                            </div>
                        </div>
                    </section>

                    {/* Contact Section */}
                    <section>
                        <h3 className="text-xl font-bold text-gray-800 mb-6 pb-2 border-b-2 border-yellow-500 inline-block">Contact & Hours</h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-2">Contact Phone</label>
                                <input
                                    type="text"
                                    name="contactPhone"
                                    value={formData.contactPhone}
                                    onChange={handleChange}
                                    placeholder="+1 234 567 890"
                                    className="w-full p-4 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-yellow-500 focus:outline-none text-black transition"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-2">Contact Email</label>
                                <input
                                    type="email"
                                    name="contactEmail"
                                    value={formData.contactEmail}
                                    onChange={handleChange}
                                    placeholder="contact@restaurant.com"
                                    className="w-full p-4 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-yellow-500 focus:outline-none text-black transition"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-2">Opening Hour</label>
                                <input
                                    type="time"
                                    name="openingHour"
                                    value={formData.openingHour}
                                    onChange={handleChange}
                                    className="w-full p-4 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-yellow-500 focus:outline-none text-black transition"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-2">Closing Hour</label>
                                <input
                                    type="time"
                                    name="closingHour"
                                    value={formData.closingHour}
                                    onChange={handleChange}
                                    className="w-full p-4 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-yellow-500 focus:outline-none text-black transition"
                                />
                            </div>
                        </div>
                    </section>

                    {/* Address Section */}
                    <section>
                        <h3 className="text-xl font-bold text-gray-800 mb-6 pb-2 border-b-2 border-yellow-500 inline-block">Location</h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="md:col-span-2">
                                <label className="block text-sm font-semibold text-gray-700 mb-2">Address Line 1</label>
                                <input
                                    type="text"
                                    name="addressLine1"
                                    value={formData.addressLine1}
                                    onChange={handleChange}
                                    placeholder="123 Street Name"
                                    className="w-full p-4 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-yellow-500 focus:outline-none text-black transition"
                                />
                            </div>

                            <div className="md:col-span-2">
                                <label className="block text-sm font-semibold text-gray-700 mb-2">Address Line 2 (Optional)</label>
                                <input
                                    type="text"
                                    name="addressLine2"
                                    value={formData.addressLine2}
                                    onChange={handleChange}
                                    placeholder="Suite, Apartment, etc."
                                    className="w-full p-4 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-yellow-500 focus:outline-none text-black transition"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-2">City</label>
                                <input
                                    type="text"
                                    name="city"
                                    value={formData.city}
                                    onChange={handleChange}
                                    className="w-full p-4 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-yellow-500 focus:outline-none text-black transition"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-2">State</label>
                                <input
                                    type="text"
                                    name="state"
                                    value={formData.state}
                                    onChange={handleChange}
                                    className="w-full p-4 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-yellow-500 focus:outline-none text-black transition"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-2">Zip Code</label>
                                <input
                                    type="text"
                                    name="zipCode"
                                    value={formData.zipCode}
                                    onChange={handleChange}
                                    className="w-full p-4 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-yellow-500 focus:outline-none text-black transition"
                                />
                            </div>
                        </div>
                    </section>

                    {/* Documents Section */}
                    <section>
                        <h3 className="text-xl font-bold text-gray-800 mb-6 pb-2 border-b-2 border-yellow-500 inline-block">Verification Documents</h3>
                        <div className="grid grid-cols-1 gap-6">
                            <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-2">Business License / Registration Number</label>
                                <input
                                    type="text"
                                    name="businessLicense"
                                    value={formData.businessLicense}
                                    onChange={handleChange}
                                    placeholder="Enter license number"
                                    className="w-full p-4 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-yellow-500 focus:outline-none text-black transition"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-2">Health Permit Number</label>
                                <input
                                    type="text"
                                    name="healthPermit"
                                    value={formData.healthPermit}
                                    onChange={handleChange}
                                    placeholder="Enter health permit number"
                                    className="w-full p-4 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-yellow-500 focus:outline-none text-black transition"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-2">Tax ID / PAN Number</label>
                                <input
                                    type="text"
                                    name="taxId"
                                    value={formData.taxId}
                                    onChange={handleChange}
                                    placeholder="Enter tax identification number"
                                    className="w-full p-4 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-yellow-500 focus:outline-none text-black transition"
                                />
                            </div>
                        </div>
                    </section>

                    <button
                        type="submit"
                        disabled={isLoading}
                        className="w-full bg-yellow-500 text-white font-bold text-xl py-5 rounded-2xl hover:bg-yellow-600 transition shadow-lg disabled:bg-gray-300 disabled:cursor-not-allowed transform hover:scale-[1.01] active:scale-[0.99]"
                    >
                        {isLoading ? 'Processing...' : 'Submit for Approval'}
                    </button>
                </form>
            </div>
        </div>
    );
}
