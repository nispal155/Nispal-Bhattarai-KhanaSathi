'use client';

import { useParams, useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import Image from 'next/image';
import { Home, Store, FileText, Users, Shield, Settings, LogOut, Phone, MapPin, Clock, Star, FileText as FileIcon, CheckCircle } from "lucide-react";
import toast from 'react-hot-toast';
import { getRestaurantById, approveRestaurant, getOnboardingDetails } from '@/lib/restaurantService';

export default function RestaurantDetailsPage() {
    const { id } = useParams();
    const router = useRouter();
    const [restaurant, setRestaurant] = useState<any>(null);
    const [onboardingData, setOnboardingData] = useState<any>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [isApproving, setIsApproving] = useState(false);

    useEffect(() => {
        if (id) {
            fetchDetails();
        }
    }, [id]);

    const fetchDetails = async () => {
        try {
            setIsLoading(true);
            const res = await getRestaurantById(id as string);
            setRestaurant(res.data.data);

            // Fetch onboarding details (including documents) using createdBy ID
            const onboardingRes = await getOnboardingDetails(res.data.data.createdBy);
            setOnboardingData(onboardingRes.data.data);
        } catch (error: any) {
            toast.error("Failed to fetch restaurant details");
            console.error(error);
        } finally {
            setIsLoading(false);
        }
    };

    const handleApprove = async () => {
        if (!restaurant?.createdBy) return;

        try {
            setIsApproving(true);
            await approveRestaurant(restaurant.createdBy);
            toast.success("Restaurant manager approved!");
            fetchDetails(); // Refresh to update status
        } catch (error: any) {
            toast.error("Failed to approve restaurant manager");
            console.error(error);
        } finally {
            setIsApproving(false);
        }
    };

    if (isLoading) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-500"></div>
            </div>
        );
    }

    if (!restaurant) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <p className="text-xl text-gray-600">Restaurant not found</p>
            </div>
        );
    }

    const isApproved = onboardingData?.user?.isApproved;

    return (
        <div className="min-h-screen bg-gray-50 flex">
            {/* Sidebar (Same as original but with link to RM-Dashboard) */}
            <aside className="w-64 bg-white shadow-lg relative h-screen sticky top-0">
                <div className="p-6">
                    <div className="flex items-center gap-3 mb-10">
                        <Image src="/logo.png" alt="KhanaSathi" width={40} height={40} className="object-contain" />
                        <div>
                            <h1 className="text-xl font-bold text-red-600">KhanaSathi</h1>
                            <p className="text-sm text-gray-600">Admin</p>
                        </div>
                    </div>

                    <nav className="space-y-2">
                        <a href="/admin-dashboard" className="flex items-center gap-4 px-4 py-3 text-gray-700 hover:bg-gray-100 rounded-lg transition">
                            <Home className="w-5 h-5" />
                            Home
                        </a>
                        <a href="/Restaurants" className="flex items-center gap-4 px-4 py-3 bg-red-500 text-white rounded-lg font-medium shadow-md">
                            <Store className="w-5 h-5" />
                            Restaurants
                        </a>
                        {/* More links... */}
                    </nav>
                </div>
            </aside>

            {/* Main Content */}
            <div className="flex-1 overflow-auto">
                <header className="bg-white shadow-sm border-b border-gray-200 px-8 py-6 flex items-center justify-between">
                    <div className="flex items-center gap-6">
                        <h1 className="text-4xl font-bold text-gray-900">{restaurant.name}</h1>
                        <span className={`px-4 py-2 rounded-full text-sm font-medium ${isApproved ? "bg-green-100 text-green-700" : "bg-yellow-100 text-yellow-700"}`}>
                            {isApproved ? "Approved & Active" : "Pending Approval"}
                        </span>
                    </div>
                    {!isApproved && (
                        <button
                            onClick={handleApprove}
                            disabled={isApproving}
                            className="bg-green-600 hover:bg-green-700 text-white px-8 py-3 rounded-xl font-bold shadow-lg transition transform hover:scale-105 active:scale-95 disabled:bg-gray-300"
                        >
                            {isApproving ? "Approving..." : "Approve Manager"}
                        </button>
                    )}
                </header>

                <div className="p-8 max-w-7xl mx-auto">
                    <div className="grid lg:grid-cols-3 gap-10">
                        {/* Left Columns - Details */}
                        <div className="lg:col-span-2 space-y-10">
                            <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-8">
                                <h3 className="text-2xl font-bold text-gray-900 mb-6 border-b pb-4">Restaurant Details</h3>
                                <div className="grid md:grid-cols-2 gap-8">
                                    <div className="space-y-6">
                                        <div>
                                            <div className="flex items-center gap-3 mb-2">
                                                <Phone className="w-5 h-5 text-gray-400" />
                                                <span className="font-semibold text-gray-700">Contact</span>
                                            </div>
                                            <p className="text-gray-900 ml-8">{restaurant.contactPhone}</p>
                                            <p className="text-gray-900 ml-8">{restaurant.contactEmail}</p>
                                        </div>
                                        <div>
                                            <div className="flex items-center gap-3 mb-2">
                                                <MapPin className="w-5 h-5 text-gray-400" />
                                                <span className="font-semibold text-gray-700">Address</span>
                                            </div>
                                            <p className="text-gray-900 ml-8">
                                                {restaurant.address.addressLine1}<br />
                                                {restaurant.address.addressLine2 && <>{restaurant.address.addressLine2}<br /></>}
                                                {restaurant.address.city}, {restaurant.address.state} {restaurant.address.zipCode}
                                            </p>
                                        </div>
                                    </div>
                                    <div className="space-y-6">
                                        <div>
                                            <div className="flex items-center gap-3 mb-2">
                                                <Clock className="w-5 h-5 text-gray-400" />
                                                <span className="font-semibold text-gray-700">Business Hours</span>
                                            </div>
                                            <p className="text-gray-900 ml-8">{restaurant.openingHour} – {restaurant.closingHour}</p>
                                        </div>
                                        <div>
                                            <span className="font-semibold text-gray-700 block mb-3">Cuisines</span>
                                            <div className="flex flex-wrap gap-2 ml-8">
                                                {restaurant.cuisineType.map((c: string, i: number) => (
                                                    <span key={i} className="px-3 py-1 bg-red-100 text-red-700 rounded-full text-xs font-medium">
                                                        {c}
                                                    </span>
                                                ))}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Right Column - Documents & Verification */}
                        <div className="space-y-10">
                            <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-8">
                                <h3 className="text-2xl font-bold text-gray-900 mb-6 border-b pb-4 flex items-center gap-3">
                                    < Shield className="w-6 h-6 text-red-500" />
                                    Verification
                                </h3>

                                <div className="space-y-6">
                                    <div className="p-4 bg-gray-50 rounded-xl border border-gray-100">
                                        <p className="text-sm text-gray-500 mb-1">Business License</p>
                                        <div className="flex items-center justify-between">
                                            <p className="font-bold text-gray-900">{onboardingData?.user?.restaurantDocuments?.businessLicense || "Not provided"}</p>
                                            <FileIcon className="w-5 h-5 text-blue-500" />
                                        </div>
                                    </div>
                                    <div className="p-4 bg-gray-50 rounded-xl border border-gray-100">
                                        <p className="text-sm text-gray-500 mb-1">Health Permit</p>
                                        <div className="flex items-center justify-between">
                                            <p className="font-bold text-gray-900">{onboardingData?.user?.restaurantDocuments?.healthPermit || "Not provided"}</p>
                                            <FileIcon className="w-5 h-5 text-blue-500" />
                                        </div>
                                    </div>
                                    <div className="p-4 bg-gray-50 rounded-xl border border-gray-100">
                                        <p className="text-sm text-gray-500 mb-1">Tax ID / PAN</p>
                                        <div className="flex items-center justify-between">
                                            <p className="font-bold text-gray-900">{onboardingData?.user?.restaurantDocuments?.taxId || "Not provided"}</p>
                                            <FileIcon className="w-5 h-5 text-blue-500" />
                                        </div>
                                    </div>

                                    {isApproved && (
                                        <div className="mt-8 flex items-center justify-center gap-2 p-4 bg-green-50 text-green-700 rounded-2xl border border-green-200">
                                            <CheckCircle className="w-6 h-6" />
                                            <span className="font-bold">Verified Merchant</span>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
