"use client";

import { useRef, useState, useEffect } from "react";
import Image from "next/image";
import { Camera, Mail, Phone, User, Shield, Loader2 } from "lucide-react";
import AdminSidebar from "@/components/admin/AdminSidebar";
import { useAuth } from "@/context/AuthContext";
import { getProfile, updateProfile } from "@/lib/userService";
import toast from "react-hot-toast";

export default function AdminProfile() {
    const { user: authUser, updateUser: updateAuthUser } = useAuth();
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [profile, setProfile] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [updating, setUpdating] = useState(false);
    const [formData, setFormData] = useState({
        username: "",
        email: "",
        phone: "",
    });

    useEffect(() => {
        const fetchProfile = async () => {
            try {
                const response = await getProfile();
                if (response.data && response.data.data) {
                    const userData = response.data.data;
                    setProfile(userData);
                    setFormData({
                        username: userData.username || "",
                        email: userData.email || "",
                        phone: userData.phone || "",
                    });
                }
            } catch (error) {
                console.error("Error fetching admin profile:", error);
                toast.error("Failed to load profile");
            } finally {
                setLoading(false);
            }
        };

        if (authUser) {
            fetchProfile();
        }
    }, [authUser]);

    const handleImageChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        // Basic validation
        if (!file.type.startsWith('image/')) {
            toast.error("Please upload an image file");
            return;
        }
        if (file.size > 2 * 1024 * 1024) {
            toast.error("Image size should be less than 2MB");
            return;
        }

        const reader = new FileReader();
        reader.onloadend = async () => {
            const base64String = reader.result as string;
            setUpdating(true);
            try {
                const response = await updateProfile({ profilePicture: base64String });
                if (response.data && response.data.data) {
                    setProfile(response.data.data);
                    updateAuthUser(response.data.data);
                    toast.success("Profile picture updated!");
                } else {
                    console.error("Profile update failed:", response.error);
                    toast.error(response.error || "Failed to update picture");
                }
            } catch (error) {
                console.error("Upload error caught:", error);
                toast.error("An error occurred during upload");
            } finally {
                setUpdating(false);
            }
        };
        reader.readAsDataURL(file);
    };

    const handleUpdate = async (e: React.FormEvent) => {
        e.preventDefault();
        setUpdating(true);
        try {
            const response = await updateProfile(formData);
            if (response.data && response.data.data) {
                setProfile(response.data.data);
                updateAuthUser(response.data.data);
                toast.success("Profile updated successfully");
            } else {
                toast.error(response.error || "Update failed");
            }
        } catch (error) {
            toast.error("An error occurred during update");
        } finally {
            setUpdating(false);
        }
    };

    if (loading) {
        return (
            <div className="flex h-screen items-center justify-center bg-gray-50">
                <Loader2 className="w-10 h-10 text-red-500 animate-spin" />
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50 flex">
            <AdminSidebar />

            <div className="flex-1 overflow-auto">
                <header className="bg-white shadow-sm border-b border-gray-200 px-8 py-5 flex items-center justify-between">
                    <h2 className="text-3xl font-bold text-gray-900">Admin Profile</h2>
                    <div className="w-12 h-12 rounded-full overflow-hidden ring-4 ring-orange-100 flex items-center justify-center bg-gray-100">
                        <Image
                            src={authUser?.profilePicture || `https://ui-avatars.com/api/?name=${authUser?.username || 'Admin'}&background=random`}
                            alt="Admin"
                            width={48}
                            height={48}
                            className="object-cover w-full h-full"
                            onError={(e) => {
                                const target = e.target as HTMLImageElement;
                                target.src = `https://ui-avatars.com/api/?name=${authUser?.username || 'Admin'}&background=random`;
                            }}
                        />
                    </div>
                </header>

                <div className="p-8 max-w-4xl mx-auto">
                    <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
                        <div className="h-32 bg-gradient-to-r from-red-500 to-orange-500"></div>
                        <div className="px-8 pb-8">
                            <div className="relative -mt-16 mb-6 flex justify-center">
                                <div className="relative">
                                    <div className="w-32 h-32 rounded-full border-4 border-white overflow-hidden bg-gray-100 shadow-lg relative group">
                                        <Image
                                            src={profile?.profilePicture || `https://ui-avatars.com/api/?name=${profile?.username || 'Admin'}&background=random`}
                                            alt="Admin Profile"
                                            width={128}
                                            height={128}
                                            className="object-cover w-full h-full"
                                            onError={(e) => {
                                                const target = e.target as HTMLImageElement;
                                                target.src = `https://ui-avatars.com/api/?name=${profile?.username || 'Admin'}&background=random`;
                                            }}
                                        />
                                        {updating && (
                                            <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                                                <Loader2 className="w-8 h-8 text-white animate-spin" />
                                            </div>
                                        )}
                                    </div>
                                    <input
                                        type="file"
                                        ref={fileInputRef}
                                        onChange={handleImageChange}
                                        accept="image/*"
                                        className="hidden"
                                    />
                                    <button
                                        type="button"
                                        onClick={() => fileInputRef.current?.click()}
                                        disabled={updating}
                                        className="absolute bottom-1 right-1 bg-red-500 text-white p-2 rounded-full hover:bg-red-600 transition shadow-md disabled:bg-gray-400 disabled:cursor-not-allowed"
                                    >
                                        <Camera className="w-5 h-5" />
                                    </button>
                                </div>
                            </div>

                            <form onSubmit={handleUpdate} className="space-y-6">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div>
                                        <label className="block text-sm font-semibold text-gray-700 mb-2 flex items-center gap-2">
                                            <User className="w-4 h-4" /> Username
                                        </label>
                                        <input
                                            type="text"
                                            value={formData.username}
                                            onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                                            className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-red-500 focus:outline-none transition"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-semibold text-gray-700 mb-2 flex items-center gap-2">
                                            <Mail className="w-4 h-4" /> Email Address
                                        </label>
                                        <input
                                            type="email"
                                            value={formData.email}
                                            disabled
                                            className="w-full p-3 bg-gray-100 border border-gray-200 rounded-xl text-gray-500 cursor-not-allowed"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-semibold text-gray-700 mb-2 flex items-center gap-2">
                                            <Phone className="w-4 h-4" /> Phone Number
                                        </label>
                                        <input
                                            type="text"
                                            value={formData.phone}
                                            onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                                            className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-red-500 focus:outline-none transition"
                                            placeholder="Not provided"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-semibold text-gray-700 mb-2 flex items-center gap-2">
                                            <Shield className="w-4 h-4" /> Role
                                        </label>
                                        <input
                                            type="text"
                                            value="Super Admin"
                                            disabled
                                            className="w-full p-3 bg-gray-100 border border-gray-200 rounded-xl text-gray-500 cursor-not-allowed"
                                        />
                                    </div>
                                </div>

                                <div className="pt-4 border-t border-gray-100 flex justify-end">
                                    <button
                                        type="submit"
                                        disabled={updating}
                                        className="bg-red-500 hover:bg-red-600 text-white px-8 py-3 rounded-xl font-bold transition shadow-lg disabled:bg-red-300 flex items-center gap-2"
                                    >
                                        {updating ? <Loader2 className="w-5 h-5 animate-spin" /> : null}
                                        Save Changes
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>

                    <div className="mt-8 grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm">
                            <h4 className="font-bold text-gray-900 mb-4">Account Security</h4>
                            <p className="text-sm text-gray-600 mb-6">Manage your password and security settings to keep your account safe.</p>
                            <button className="text-red-600 font-semibold hover:underline">Change Password →</button>
                        </div>
                        <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm">
                            <h4 className="font-bold text-gray-900 mb-4">Account Activity</h4>
                            <p className="text-sm text-gray-600 mb-6">View your recent login activity and manage active sessions.</p>
                            <button className="text-red-600 font-semibold hover:underline">View Activity Log →</button>
                        </div>
                    </div>
                </div>

                <footer className="text-center text-gray-500 text-sm py-8 border-t border-gray-200 mt-16">
                    © {new Date().getFullYear()} KhanaSathi. All rights reserved.
                </footer>
            </div>
        </div>
    );
}
