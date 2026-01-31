'use client';

import { useEffect, useState } from 'react';
import Image from 'next/image';
import { useAuth } from '@/context/AuthContext';
import { getOnboardingDetails } from '@/lib/restaurantService';
import toast from 'react-hot-toast';
import { Store, User, Mail, Phone, MapPin, FileText, ShieldCheck } from 'lucide-react';

export default function RestaurantProfilePage() {
    const { user } = useAuth();
    const [profileData, setProfileData] = useState<any>(null);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        if (user?._id) {
            fetchProfile();
        }
    }, [user]);

    const fetchProfile = async () => {
        try {
            setIsLoading(true);
            const res = await getOnboardingDetails(user?._id as string);
            setProfileData(res.data.data);
        } catch (error) {
            toast.error("Failed to load profile details");
        } finally {
            setIsLoading(false);
        }
    };

    if (isLoading) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-yellow-500"></div>
            </div>
        );
    }

    const { restaurant, user: userData } = profileData || {};

    return (
        <div className="min-h-screen bg-gray-50 p-8">
            <div className="max-w-4xl mx-auto">
                <h1 className="text-4xl font-bold text-gray-900 mb-8">My Profile</h1>

                <div className="grid md:grid-cols-3 gap-8">
                    {/* Left Column - Personal Info */}
                    <div className="space-y-8">
                        <div className="bg-white rounded-3xl shadow-sm border border-gray-100 p-8 text-center">
                            <div className="relative w-32 h-32 mx-auto mb-6">
                                <Image
                                    src={userData?.profilePicture || "/default-avatar.png"}
                                    alt="Profile"
                                    fill
                                    className="rounded-full object-cover ring-4 ring-yellow-50"
                                />
                            </div>
                            <h2 className="text-2xl font-bold text-gray-900">{userData?.username}</h2>
                            <p className="text-gray-500 capitalize">{userData?.role}</p>

                            <div className={`mt-6 inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm font-bold ${userData?.isApproved ? "bg-green-100 text-green-700" : "bg-yellow-100 text-yellow-700"}`}>
                                {userData?.isApproved ? <ShieldCheck className="w-4 h-4" /> : null}
                                {userData?.isApproved ? "Verified Manager" : "Verification Pending"}
                            </div>
                        </div>

                        <div className="bg-white rounded-3xl shadow-sm border border-gray-100 p-8 space-y-4">
                            <div className="flex items-center gap-4 text-gray-700">
                                <Mail className="w-5 h-5 text-yellow-500" />
                                <span>{userData?.email}</span>
                            </div>
                        </div>
                    </div>

                    {/* Right Column - Restaurant Info */}
                    <div className="md:col-span-2 space-y-8">
                        <div className="bg-white rounded-3xl shadow-sm border border-gray-100 p-10">
                            <h3 className="text-2xl font-bold text-gray-900 mb-8 flex items-center gap-3">
                                <Store className="w-7 h-7 text-yellow-500" />
                                Restaurant Details
                            </h3>

                            <div className="grid sm:grid-cols-2 gap-10">
                                <div>
                                    <p className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-2">Restaurant Name</p>
                                    <p className="text-xl font-bold text-gray-900">{restaurant?.name}</p>
                                </div>
                                <div>
                                    <p className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-2">Contact Phone</p>
                                    <p className="text-xl font-bold text-gray-900">{restaurant?.contactPhone}</p>
                                </div>
                                <div className="sm:col-span-2">
                                    <p className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-2">Address</p>
                                    <p className="text-gray-900">
                                        {restaurant?.address?.addressLine1}, {restaurant?.address?.city}, {restaurant?.address?.state} {restaurant?.address?.zipCode}
                                    </p>
                                </div>
                                <div>
                                    <p className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-2">Business Hours</p>
                                    <p className="text-gray-900">{restaurant?.openingHour} - {restaurant?.closingHour}</p>
                                </div>
                            </div>
                        </div>

                        <div className="bg-white rounded-3xl shadow-sm border border-gray-100 p-10">
                            <h3 className="text-2xl font-bold text-gray-900 mb-8 flex items-center gap-3">
                                <FileText className="w-7 h-7 text-yellow-500" />
                                Uploaded Documents
                            </h3>

                            <div className="space-y-4">
                                <div className="flex items-center justify-between p-5 bg-gray-50 rounded-2xl border border-gray-100">
                                    <span className="font-semibold text-gray-700">Business License</span>
                                    <span className="text-gray-900 font-mono">{userData?.restaurantDocuments?.businessLicense}</span>
                                </div>
                                <div className="flex items-center justify-between p-5 bg-gray-50 rounded-2xl border border-gray-100">
                                    <span className="font-semibold text-gray-700">Health Permit</span>
                                    <span className="text-gray-900 font-mono">{userData?.restaurantDocuments?.healthPermit}</span>
                                </div>
                                <div className="flex items-center justify-between p-5 bg-gray-50 rounded-2xl border border-gray-100">
                                    <span className="font-semibold text-gray-700">Tax ID / PAN</span>
                                    <span className="text-gray-900 font-mono">{userData?.restaurantDocuments?.taxId}</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
