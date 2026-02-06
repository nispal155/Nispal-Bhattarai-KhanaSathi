'use client';

import { useEffect, useState, useRef } from 'react';
import Image from 'next/image';
import { useAuth } from '@/context/AuthContext';
import { getOnboardingDetails, updateMyRestaurant } from '@/lib/restaurantService';
import { updateProfile } from '@/lib/userService';
import toast from 'react-hot-toast';
import { Store, User, Mail, Phone, MapPin, FileText, ShieldCheck, Edit2, Save, X, Loader2, Camera, ArrowLeft } from 'lucide-react';
import { useRouter } from 'next/navigation';

export default function RestaurantProfilePage() {
    const { user, updateUser: updateAuthUser } = useAuth();
    const router = useRouter();
    const [profileData, setProfileData] = useState<any>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);
    const [editMode, setEditMode] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    // Form state
    const [formData, setFormData] = useState({
        username: '',
        name: '',
        contactPhone: '',
        addressLine1: '',
        city: '',
        state: '',
        zipCode: '',
        openingHour: '',
        closingHour: '',
    });

    useEffect(() => {
        if (user?._id) {
            fetchProfile();
        }
    }, [user]);

    const fetchProfile = async () => {
        try {
            setIsLoading(true);
            const res = await getOnboardingDetails(user?._id as string);
            const data = res?.data?.data;
            setProfileData(data);

            // Sync form state
            if (data) {
                setFormData({
                    username: data.user?.username || '',
                    name: data.restaurant?.name || '',
                    contactPhone: data.restaurant?.contactPhone || '',
                    addressLine1: data.restaurant?.address?.addressLine1 || '',
                    city: data.restaurant?.address?.city || '',
                    state: data.restaurant?.address?.state || '',
                    zipCode: data.restaurant?.address?.zipCode || '',
                    openingHour: data.restaurant?.openingHour || '',
                    closingHour: data.restaurant?.closingHour || '',
                });
            }
        } catch (error) {
            toast.error("Failed to load profile details");
        } finally {
            setIsLoading(false);
        }
    };

    const handleUpdate = async () => {
        try {
            setIsSaving(true);

            // 1. Update User Profile (Name/Username)
            const userUpdateRes = await updateProfile({
                username: formData.username
            });

            if (userUpdateRes.data && userUpdateRes.data.data) {
                updateAuthUser(userUpdateRes.data.data);
            }

            // 2. Update Restaurant Details
            const restaurantUpdateRes = await updateMyRestaurant({
                name: formData.name,
                contactPhone: formData.contactPhone,
                addressLine1: formData.addressLine1,
                city: formData.city,
                state: formData.state,
                zipCode: formData.zipCode,
                openingHour: formData.openingHour,
                closingHour: formData.closingHour
            });

            if (restaurantUpdateRes.data?.success) {
                toast.success("Profile updated successfully");
                setEditMode(false);
                fetchProfile(); // Refresh data
            } else {
                toast.error(restaurantUpdateRes.error || "Failed to update restaurant details");
            }

        } catch (error: any) {
            toast.error(error.message || "Something went wrong");
        } finally {
            setIsSaving(false);
        }
    };

    const handleImageChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        if (!file.type.startsWith('image/')) {
            toast.error("Please upload an image file");
            return;
        }

        const reader = new FileReader();
        reader.onloadend = async () => {
            const base64String = reader.result as string;
            setIsSaving(true);
            try {
                const response = await updateProfile({ profilePicture: base64String });
                const resData = response?.data?.data;
                if (resData) {
                    updateAuthUser(resData);
                    setProfileData((prev: any) => ({
                        ...prev,
                        user: resData
                    }));
                    toast.success("Profile picture updated!");
                }
            } catch (error) {
                toast.error("Failed to update profile picture");
            } finally {
                setIsSaving(false);
            }
        };
        reader.readAsDataURL(file);
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
                <button
                    onClick={() => router.back()}
                    className="flex items-center gap-2 text-gray-500 hover:text-gray-700 transition-colors mb-6 group"
                >
                    <ArrowLeft className="w-5 h-5 group-hover:-translate-x-1 transition-transform" />
                    Back
                </button>
                <div className="flex justify-between items-center mb-8">
                    <h1 className="text-4xl font-bold text-gray-900">My Profile</h1>
                    {!editMode ? (
                        <button
                            onClick={() => setEditMode(true)}
                            className="flex items-center gap-2 bg-yellow-500 hover:bg-yellow-600 text-white px-6 py-2.5 rounded-2xl font-bold transition-all shadow-lg shadow-yellow-200"
                        >
                            <Edit2 className="w-5 h-5" />
                            Edit Profile
                        </button>
                    ) : (
                        <div className="flex gap-3">
                            <button
                                onClick={() => {
                                    setEditMode(false);
                                    fetchProfile();
                                }}
                                className="flex items-center gap-2 bg-gray-200 hover:bg-gray-300 text-gray-700 px-6 py-2.5 rounded-2xl font-bold transition-all"
                            >
                                <X className="w-5 h-5" />
                                Cancel
                            </button>
                            <button
                                onClick={handleUpdate}
                                disabled={isSaving}
                                className="flex items-center gap-2 bg-yellow-500 hover:bg-yellow-600 text-white px-6 py-2.5 rounded-2xl font-bold transition-all shadow-lg shadow-yellow-200 disabled:opacity-50"
                            >
                                {isSaving ? <Loader2 className="w-5 h-5 animate-spin" /> : <Save className="w-5 h-5" />}
                                {isSaving ? "Saving..." : "Save Changes"}
                            </button>
                        </div>
                    )}
                </div>

                <div className="grid md:grid-cols-3 gap-8">
                    {/* Left Column - Personal Info */}
                    <div className="space-y-8">
                        <div className="bg-white rounded-3xl shadow-sm border border-gray-100 p-8 text-center">
                            <div className="relative w-32 h-32 mx-auto mb-6 group">
                                <Image
                                    src={userData?.profilePicture || "/default-avatar.png"}
                                    alt="Profile"
                                    fill
                                    unoptimized
                                    className="rounded-full object-cover ring-4 ring-yellow-50"
                                />
                                {editMode && (
                                    <button
                                        onClick={() => fileInputRef.current?.click()}
                                        className="absolute inset-0 bg-black/40 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                                    >
                                        <Camera className="w-8 h-8 text-white" />
                                    </button>
                                )}
                                <input
                                    type="file"
                                    ref={fileInputRef}
                                    className="hidden"
                                    accept="image/*"
                                    onChange={handleImageChange}
                                />
                            </div>

                            {editMode ? (
                                <input
                                    type="text"
                                    value={formData.username}
                                    onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                                    className="w-full text-center text-2xl font-bold text-gray-900 bg-gray-50 border-none rounded-xl py-1 focus:ring-2 focus:ring-yellow-500"
                                    placeholder="Username"
                                />
                            ) : (
                                <h2 className="text-2xl font-bold text-gray-900">{userData?.username}</h2>
                            )}

                            <p className="text-gray-500 capitalize">{userData?.role}</p>

                            <div className={`mt-6 inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm font-bold ${userData?.isApproved ? "bg-green-100 text-green-700" : "bg-yellow-100 text-yellow-700"}`}>
                                {userData?.isApproved ? <ShieldCheck className="w-4 h-4" /> : null}
                                {userData?.isApproved ? "Verified Manager" : "Verification Pending"}
                            </div>
                        </div>

                        <div className="bg-white rounded-3xl shadow-sm border border-gray-100 p-8 space-y-4">
                            <div className="flex items-center gap-4 text-gray-700">
                                <Mail className="w-5 h-5 text-yellow-500" />
                                <span className="truncate">{userData?.email}</span>
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
                                    {editMode ? (
                                        <input
                                            type="text"
                                            value={formData.name}
                                            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                            className="w-full text-lg font-bold text-gray-900 bg-gray-50 border-none rounded-xl py-2 px-3 focus:ring-2 focus:ring-yellow-500"
                                        />
                                    ) : (
                                        <p className="text-xl font-bold text-gray-900">{restaurant?.name}</p>
                                    )}
                                </div>
                                <div>
                                    <p className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-2">Contact Phone</p>
                                    {editMode ? (
                                        <input
                                            type="tel"
                                            value={formData.contactPhone}
                                            onChange={(e) => setFormData({ ...formData, contactPhone: e.target.value })}
                                            className="w-full text-lg font-bold text-gray-900 bg-gray-50 border-none rounded-xl py-2 px-3 focus:ring-2 focus:ring-yellow-500"
                                        />
                                    ) : (
                                        <p className="text-xl font-bold text-gray-900">{restaurant?.contactPhone}</p>
                                    )}
                                </div>
                                <div className="sm:col-span-2">
                                    <p className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-2">Address</p>
                                    {editMode ? (
                                        <div className="space-y-3">
                                            <input
                                                type="text"
                                                placeholder="Address Line 1"
                                                value={formData.addressLine1}
                                                onChange={(e) => setFormData({ ...formData, addressLine1: e.target.value })}
                                                className="w-full text-gray-900 bg-gray-50 border-none rounded-xl py-2 px-3 focus:ring-2 focus:ring-yellow-500"
                                            />
                                            <div className="grid grid-cols-3 gap-3">
                                                <input
                                                    type="text"
                                                    placeholder="City"
                                                    value={formData.city}
                                                    onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                                                    className="w-full text-gray-900 bg-gray-50 border-none rounded-xl py-2 px-3 focus:ring-2 focus:ring-yellow-500"
                                                />
                                                <input
                                                    type="text"
                                                    placeholder="State"
                                                    value={formData.state}
                                                    onChange={(e) => setFormData({ ...formData, state: e.target.value })}
                                                    className="w-full text-gray-900 bg-gray-50 border-none rounded-xl py-2 px-3 focus:ring-2 focus:ring-yellow-500"
                                                />
                                                <input
                                                    type="text"
                                                    placeholder="Zip Code"
                                                    value={formData.zipCode}
                                                    onChange={(e) => setFormData({ ...formData, zipCode: e.target.value })}
                                                    className="w-full text-gray-900 bg-gray-50 border-none rounded-xl py-2 px-3 focus:ring-2 focus:ring-yellow-500"
                                                />
                                            </div>
                                        </div>
                                    ) : (
                                        <p className="text-gray-900">
                                            {restaurant?.address?.addressLine1}, {restaurant?.address?.city}, {restaurant?.address?.state} {restaurant?.address?.zipCode}
                                        </p>
                                    )}
                                </div>
                                <div>
                                    <p className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-2">Business Hours</p>
                                    {editMode ? (
                                        <div className="flex items-center gap-3">
                                            <input
                                                type="time"
                                                value={formData.openingHour}
                                                onChange={(e) => setFormData({ ...formData, openingHour: e.target.value })}
                                                className="text-gray-900 bg-gray-50 border-none rounded-xl py-2 px-3 focus:ring-2 focus:ring-yellow-500"
                                            />
                                            <span className="text-gray-400">-</span>
                                            <input
                                                type="time"
                                                value={formData.closingHour}
                                                onChange={(e) => setFormData({ ...formData, closingHour: e.target.value })}
                                                className="text-gray-900 bg-gray-50 border-none rounded-xl py-2 px-3 focus:ring-2 focus:ring-yellow-500"
                                            />
                                        </div>
                                    ) : (
                                        <p className="text-gray-900">{restaurant?.openingHour} - {restaurant?.closingHour}</p>
                                    )}
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
                            <p className="mt-4 text-sm text-gray-400 text-center italic">Document changes require admin intervention for security reasons.</p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
