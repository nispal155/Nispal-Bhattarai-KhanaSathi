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
            const userUpdateRes = await updateProfile({
                username: formData.username
            });

            if (userUpdateRes.data && userUpdateRes.data.data) {
                updateAuthUser(userUpdateRes.data.data);
            }

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
                fetchProfile();
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
            <div className="flex items-center justify-center min-h-[60vh]">
                <Loader2 className="w-10 h-10 text-orange-500 animate-spin" />
            </div>
        );
    }

    const { restaurant, user: userData } = profileData || {};

    return (
        <div className="p-8">
            <div className="max-w-4xl mx-auto">
                {/* Header Area */}
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-10">
                    <div>
                        <h1 className="text-3xl font-extrabold text-gray-800 tracking-tight">Identity & Establishment</h1>
                        <p className="text-gray-500">Manage your administrative credentials and restaurant details</p>
                    </div>
                    <div className="flex gap-2 w-full sm:w-auto">
                        {!editMode ? (
                            <button
                                onClick={() => setEditMode(true)}
                                className="flex-1 sm:flex-none flex items-center justify-center gap-2 bg-gradient-to-r from-yellow-400 to-orange-500 text-white px-6 py-3 rounded-2xl font-bold transition-all shadow-md hover:shadow-lg"
                            >
                                <Edit2 className="w-4 h-4" />
                                Edit Profile
                            </button>
                        ) : (
                            <>
                                <button
                                    onClick={() => { setEditMode(false); fetchProfile(); }}
                                    className="flex-1 sm:flex-none px-6 py-3 bg-white border border-gray-200 text-gray-400 font-bold rounded-2xl hover:bg-gray-50 transition"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={handleUpdate}
                                    disabled={isSaving}
                                    className="flex-1 sm:flex-none flex items-center justify-center gap-2 bg-green-500 text-white px-6 py-3 rounded-2xl font-bold transition shadow-md hover:bg-green-600 disabled:opacity-50"
                                >
                                    {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                                    {isSaving ? "Saving..." : "Save"}
                                </button>
                            </>
                        )}
                    </div>
                </div>

                <div className="grid md:grid-cols-3 gap-8">
                    {/* Left Panel - Avatar & Identity */}
                    <div className="space-y-6">
                        <div className="bg-white rounded-[2rem] shadow-sm border border-gray-100 p-8 flex flex-col items-center">
                            <div className="relative w-36 h-36 mb-6 group">
                                <div className="absolute inset-0 rounded-full bg-gradient-to-br from-yellow-400 to-orange-500 animate-pulse-slow opacity-20 -z-10 blur-xl" />
                                <Image
                                    src={userData?.profilePicture || "/default-avatar.png"}
                                    alt="Profile"
                                    fill
                                    unoptimized
                                    className="rounded-full object-cover border-4 border-white shadow-xl"
                                />
                                {editMode && (
                                    <button
                                        onClick={() => fileInputRef.current?.click()}
                                        className="absolute inset-0 bg-black/40 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all backdrop-blur-sm"
                                    >
                                        <Camera className="w-8 h-8 text-white" />
                                    </button>
                                )}
                                <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={handleImageChange} />
                            </div>

                            <div className="w-full text-center space-y-1">
                                {editMode ? (
                                    <input
                                        type="text"
                                        value={formData.username}
                                        onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                                        className="w-full text-center text-xl font-black text-gray-800 bg-gray-50 border-none rounded-xl py-2 outline-none focus:ring-2 focus:ring-orange-500"
                                        placeholder="Username"
                                    />
                                ) : (
                                    <h2 className="text-xl font-black text-gray-800">{userData?.username}</h2>
                                )}
                                <p className="text-[10px] font-black uppercase tracking-widest text-orange-500">{userData?.role}</p>
                            </div>

                            <div className="mt-8 flex items-center gap-2 text-sm text-gray-500 font-bold bg-gray-50 px-4 py-2 rounded-xl border border-gray-100 w-full justify-center">
                                <Mail className="w-4 h-4 text-orange-500" />
                                <span className="truncate max-w-[150px]">{userData?.email}</span>
                            </div>

                            <div className={`mt-4 flex items-center gap-2 px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-tight ${userData?.isApproved ? "bg-green-100 text-green-700" : "bg-yellow-100 text-yellow-700"}`}>
                                {userData?.isApproved ? <ShieldCheck className="w-3.5 h-3.5" /> : null}
                                {userData?.isApproved ? "Verified Manager" : "Verification Pending"}
                            </div>
                        </div>
                    </div>

                    {/* Right Panel - Configuration */}
                    <div className="md:col-span-2 space-y-8">
                        <div className="bg-white rounded-[2rem] shadow-sm border border-gray-100 p-8 sm:p-10">
                            <div className="flex items-center gap-4 mb-10 pb-4 border-b border-gray-50">
                                <div className="w-12 h-12 bg-orange-50 rounded-2xl flex items-center justify-center">
                                    <Store className="w-6 h-6 text-orange-500" />
                                </div>
                                <div>
                                    <h3 className="text-xl font-black text-gray-800">Establishment Data</h3>
                                    <p className="text-xs text-gray-400 font-bold uppercase tracking-widest">Core Business Information</p>
                                </div>
                            </div>

                            <div className="grid sm:grid-cols-2 gap-8">
                                <div className="space-y-1.5">
                                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Official Name</label>
                                    {editMode ? (
                                        <input
                                            type="text"
                                            value={formData.name}
                                            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                            className="w-full text-base font-bold text-gray-800 bg-gray-50 border border-gray-100 rounded-2xl py-3 px-4 outline-none focus:ring-2 focus:ring-orange-500"
                                        />
                                    ) : (
                                        <p className="text-lg font-bold text-gray-900 bg-gray-50 px-4 py-3 rounded-2xl">{restaurant?.name}</p>
                                    )}
                                </div>
                                <div className="space-y-1.5">
                                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Contact Hotline</label>
                                    {editMode ? (
                                        <input
                                            type="tel"
                                            value={formData.contactPhone}
                                            onChange={(e) => setFormData({ ...formData, contactPhone: e.target.value })}
                                            className="w-full text-base font-bold text-gray-800 bg-gray-50 border border-gray-100 rounded-2xl py-3 px-4 outline-none focus:ring-2 focus:ring-orange-500"
                                        />
                                    ) : (
                                        <p className="text-lg font-bold text-gray-900 bg-gray-50 px-4 py-3 rounded-2xl">{restaurant?.contactPhone}</p>
                                    )}
                                </div>
                                <div className="sm:col-span-2 space-y-1.5">
                                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Location Address</label>
                                    {editMode ? (
                                        <div className="space-y-3">
                                            <input
                                                type="text"
                                                placeholder="Street Address"
                                                value={formData.addressLine1}
                                                onChange={(e) => setFormData({ ...formData, addressLine1: e.target.value })}
                                                className="w-full bg-gray-50 border border-gray-100 rounded-2xl py-3 px-4 font-bold text-gray-800 focus:ring-2 focus:ring-orange-500 outline-none"
                                            />
                                            <div className="grid grid-cols-3 gap-3">
                                                <input type="text" placeholder="City" value={formData.city} onChange={(e) => setFormData({ ...formData, city: e.target.value })} className="bg-gray-50 border border-gray-100 rounded-2xl p-3 font-bold text-sm focus:ring-2 focus:ring-orange-500 outline-none" />
                                                <input type="text" placeholder="State" value={formData.state} onChange={(e) => setFormData({ ...formData, state: e.target.value })} className="bg-gray-50 border border-gray-100 rounded-2xl p-3 font-bold text-sm focus:ring-2 focus:ring-orange-500 outline-none" />
                                                <input type="text" placeholder="Zip" value={formData.zipCode} onChange={(e) => setFormData({ ...formData, zipCode: e.target.value })} className="bg-gray-50 border border-gray-100 rounded-2xl p-3 font-bold text-sm focus:ring-2 focus:ring-orange-500 outline-none" />
                                            </div>
                                        </div>
                                    ) : (
                                        <div className="flex items-start gap-4 bg-gray-50 px-4 py-3 rounded-2xl">
                                            <MapPin className="w-5 h-5 text-gray-400 mt-0.5" />
                                            <p className="text-gray-900 font-bold">
                                                {restaurant?.address?.addressLine1}, {restaurant?.address?.city}, {restaurant?.address?.state} {restaurant?.address?.zipCode}
                                            </p>
                                        </div>
                                    )}
                                </div>
                                <div className="space-y-1.5">
                                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Operating Window</label>
                                    {editMode ? (
                                        <div className="flex items-center gap-3">
                                            <input type="time" value={formData.openingHour} onChange={(e) => setFormData({ ...formData, openingHour: e.target.value })} className="flex-1 bg-gray-50 border border-gray-100 rounded-2xl p-3 font-bold text-gray-800 outline-none" />
                                            <span className="text-gray-300 font-black">TO</span>
                                            <input type="time" value={formData.closingHour} onChange={(e) => setFormData({ ...formData, closingHour: e.target.value })} className="flex-1 bg-gray-50 border border-gray-100 rounded-2xl p-3 font-bold text-gray-800 outline-none" />
                                        </div>
                                    ) : (
                                        <div className="bg-gray-50 px-4 py-3 rounded-2xl flex items-center gap-2">
                                            <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                                            <span className="font-bold text-gray-900">{restaurant?.openingHour} - {restaurant?.closingHour}</span>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>

                        {/* Regulatory Documents */}
                        <div className="bg-white rounded-[2rem] shadow-sm border border-gray-100 p-8 sm:p-10">
                            <h3 className="text-xl font-black text-gray-800 mb-8 flex items-center gap-4">
                                <div className="w-12 h-12 bg-blue-50 rounded-2xl flex items-center justify-center">
                                    <FileText className="w-6 h-6 text-blue-500" />
                                </div>
                                <span>KYC & Compliance</span>
                            </h3>

                            <div className="grid gap-4">
                                {[
                                    { label: "Business License", val: userData?.restaurantDocuments?.businessLicense },
                                    { label: "Sanitation Permit", val: userData?.restaurantDocuments?.healthPermit },
                                    { label: "Tax Identification", val: userData?.restaurantDocuments?.taxId },
                                ].map((doc, idx) => (
                                    <div key={idx} className="flex items-center justify-between p-4 bg-gray-50 rounded-2xl border border-gray-100 group hover:bg-white transition duration-300">
                                        <span className="text-sm font-bold text-gray-500 uppercase tracking-tight ml-2">{doc.label}</span>
                                        <div className="bg-white px-4 py-1.5 rounded-lg border border-gray-100 font-mono text-xs font-black text-blue-600 shadow-sm">
                                            {doc.val || "N/A"}
                                        </div>
                                    </div>
                                ))}
                            </div>
                            <div className="mt-8 flex items-center gap-3 bg-blue-50/50 p-4 rounded-2xl border border-blue-100 border-dashed">
                                <ShieldCheck className="w-5 h-5 text-blue-500 shrink-0" />
                                <p className="text-[10px] text-blue-700 font-black uppercase tracking-tight leading-relaxed">
                                    Legal documents are read-only. Contact KhanaSathi Support for updates to regulatory credentials.
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
