"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Image from "next/image";
import { Save, Loader2, Upload, MapPin, X, Store } from "lucide-react";
import AdminSidebar from "@/components/admin/AdminSidebar";
import { useAuth } from "@/context/AuthContext";
import toast from "react-hot-toast";
import { getRestaurantById, updateRestaurant } from "@/lib/restaurantService";

export default function EditRestaurant() {
    const { id } = useParams();
    const router = useRouter();
    const { user: admin } = useAuth();

    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [logoPreview, setLogoPreview] = useState<string>("");

    const [formData, setFormData] = useState({
        name: "",
        contactPhone: "",
        contactEmail: "",
        openingHour: "09:00",
        closingHour: "22:00",
        cuisineType: [] as string[],
        addressLine1: "",
        addressLine2: "",
        city: "",
        state: "",
        zipCode: "",
        isActive: true,
        deliveryTimeMin: 30,
        deliveryTimeMax: 45,
        priceRange: "Rs.Rs.",
        tags: [] as string[],
    });

    const [newCuisine, setNewCuisine] = useState("");
    const [newTag, setNewTag] = useState("");

    const handleAddTag = () => {
        if (newTag && !formData.tags.includes(newTag)) {
            setFormData({
                ...formData,
                tags: [...formData.tags, newTag]
            });
            setNewTag("");
        }
    };

    const handleRemoveTag = (tag: string) => {
        setFormData({
            ...formData,
            tags: formData.tags.filter((t: string) => t !== tag)
        });
    };

    useEffect(() => {
        if (id) {
            fetchRestaurant();
        }
    }, [id]);

    const fetchRestaurant = async () => {
        try {
            setLoading(true);
            const res = await getRestaurantById(id as string);
            if (res?.data?.data) {
                const data = res.data.data;

                setFormData({
                    name: data.name || "",
                    contactPhone: data.contactPhone || "",
                    contactEmail: data.contactEmail || "",
                    openingHour: data.openingHour || "09:00",
                    closingHour: data.closingHour || "22:00",
                    cuisineType: data.cuisineType || [],
                    addressLine1: data.address?.addressLine1 || "",
                    addressLine2: data.address?.addressLine2 || "",
                    city: data.address?.city || "",
                    state: data.address?.state || "",
                    zipCode: data.address?.zipCode || "",
                    isActive: data.isActive ?? true,
                    deliveryTimeMin: data.deliveryTime?.min || 30,
                    deliveryTimeMax: data.deliveryTime?.max || 45,
                    priceRange: data.priceRange ? data.priceRange.replace(/\$/g, "Rs.") : "Rs.Rs.",
                    tags: data.tags || [],
                });

                if (data.logoUrl) {
                    setLogoPreview(data.logoUrl);
                }
            }
        } catch (error) {
            toast.error("Failed to load restaurant details");
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    const handleLogoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            const reader = new FileReader();
            reader.onloadend = () => {
                setLogoPreview(reader.result as string);
            };
            reader.readAsDataURL(file);
        }
    };

    const handleAddCuisine = () => {
        if (newCuisine && !formData.cuisineType.includes(newCuisine)) {
            setFormData({
                ...formData,
                cuisineType: [...formData.cuisineType, newCuisine]
            });
            setNewCuisine("");
        }
    };

    const handleRemoveCuisine = (cuisine: string) => {
        setFormData({
            ...formData,
            cuisineType: formData.cuisineType.filter((c: string) => c !== cuisine)
        });
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            setSaving(true);

            const payload = {
                ...formData,
                logoUrl: logoPreview,
            };

            await updateRestaurant(id as string, payload);
            toast.success("Restaurant updated successfully");
            router.push("/Restaurants");
        } catch (error) {
            toast.error("Failed to update restaurant");
            console.error(error);
        } finally {
            setSaving(false);
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <Loader2 className="w-12 h-12 text-red-500 animate-spin" />
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50 flex">
            <AdminSidebar />

            <div className="flex-1 overflow-auto">
                <header className="bg-white shadow-sm border-b border-gray-200 px-8 py-6 flex items-center justify-between sticky top-0 z-10">
                    <div>
                        <h2 className="text-3xl font-bold text-gray-900">Edit Restaurant</h2>
                        <p className="text-gray-500 text-sm mt-1">Configure {formData.name} settings</p>
                    </div>
                    <div className="flex items-center gap-4">
                        <button
                            onClick={() => router.back()}
                            className="px-6 py-2.5 bg-white border border-gray-300 rounded-xl font-medium text-gray-700 hover:bg-gray-50 transition"
                        >
                            Cancel
                        </button>
                        <button
                            onClick={handleSubmit}
                            disabled={saving}
                            className="bg-red-500 hover:bg-red-600 text-white px-8 py-2.5 rounded-xl font-bold shadow-lg transition flex items-center gap-2 disabled:bg-red-300"
                        >
                            {saving ? <Loader2 className="w-5 h-5 animate-spin" /> : <Save className="w-5 h-5" />}
                            Save Changes
                        </button>
                        <div className="w-10 h-10 rounded-full overflow-hidden ring-2 ring-orange-100 flex items-center justify-center bg-gray-100 ml-2">
                            <Image
                                src={admin?.profilePicture || `https://ui-avatars.com/api/?name=${admin?.username || 'Admin'}&background=random`}
                                alt="Admin"
                                width={40}
                                height={40}
                                className="object-cover w-full h-full"
                                onError={(e) => {
                                    const target = e.target as HTMLImageElement;
                                    target.src = `https://ui-avatars.com/api/?name=${admin?.username || 'Admin'}&background=random`;
                                }}
                            />
                        </div>
                    </div>
                </header>

                <main className="p-8 max-w-5xl mx-auto space-y-8">
                    <form onSubmit={handleSubmit} className="space-y-8">
                        {/* Logo Upload Section */}
                        <section className="bg-white rounded-2xl shadow-sm border border-gray-200 p-8">
                            <h3 className="text-xl font-bold text-gray-900 mb-6 flex items-center gap-2">
                                <Upload className="w-5 h-5 text-red-500" />
                                Restaurant Logo
                            </h3>
                            <div className="flex flex-col md:flex-row items-center gap-8">
                                <div className="relative group w-40 h-40">
                                    <div className="w-40 h-40 rounded-full overflow-hidden ring-4 ring-gray-100 bg-gray-50 flex items-center justify-center border-2 border-dashed border-gray-300 group-hover:border-red-400 transition">
                                        {logoPreview ? (
                                            <Image src={logoPreview} alt="Logo Preview" fill className="object-cover" />
                                        ) : (
                                            <Store className="w-16 h-16 text-gray-300" />
                                        )}
                                    </div>
                                    <label className="absolute bottom-2 right-2 bg-red-500 p-2.5 rounded-full text-white cursor-pointer shadow-lg hover:bg-red-600 transition group-hover:scale-110 active:scale-95">
                                        <Upload className="w-5 h-5" />
                                        <input type="file" className="hidden" accept="image/*" onChange={handleLogoChange} />
                                    </label>
                                </div>
                                <div className="flex-1 space-y-2">
                                    <h4 className="font-semibold text-gray-900">Upload a high-quality logo</h4>
                                    <p className="text-sm text-gray-500">Recommended size: 512x512px. Supported formats: JPG, PNG, WebP.</p>
                                    <button
                                        type="button"
                                        onClick={() => (document.querySelector('input[type="file"]') as HTMLInputElement)?.click()}
                                        className="text-red-500 font-medium text-sm hover:underline"
                                    >
                                        Select new image
                                    </button>
                                </div>
                            </div>
                        </section>

                        {/* Basic Information */}
                        <section className="bg-white rounded-2xl shadow-sm border border-gray-200 p-8">
                            <h3 className="text-xl font-bold text-gray-900 mb-6">General Information</h3>
                            <div className="grid md:grid-cols-2 gap-6">
                                <div className="md:col-span-2">
                                    <label className="block text-sm font-semibold text-gray-700 mb-2">Restaurant Name</label>
                                    <input
                                        type="text"
                                        value={formData.name}
                                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                        className="w-full px-5 py-3.5 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-red-500 focus:outline-none transition font-medium"
                                        placeholder="Enter restaurant name"
                                        required
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-semibold text-gray-700 mb-2">Contact Number</label>
                                    <input
                                        type="tel"
                                        value={formData.contactPhone}
                                        onChange={(e) => setFormData({ ...formData, contactPhone: e.target.value })}
                                        className="w-full px-5 py-3.5 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-red-500 focus:outline-none transition font-medium"
                                        placeholder="+977-XXXXXXXXXX"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-semibold text-gray-700 mb-2">Contact Email</label>
                                    <input
                                        type="email"
                                        value={formData.contactEmail}
                                        onChange={(e) => setFormData({ ...formData, contactEmail: e.target.value })}
                                        className="w-full px-5 py-3.5 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-red-500 focus:outline-none transition font-medium"
                                        placeholder="rest@example.com"
                                    />
                                </div>
                                <div className="flex items-center justify-between p-4 bg-gray-50 rounded-xl border border-gray-100">
                                    <div>
                                        <h4 className="font-semibold text-gray-900 text-sm">Active Visibility</h4>
                                        <p className="text-xs text-gray-500">Enable or disable restaurant presence.</p>
                                    </div>
                                    <button
                                        type="button"
                                        onClick={() => setFormData({ ...formData, isActive: !formData.isActive })}
                                        className={`w-12 h-6 rounded-full transition relative ${formData.isActive ? "bg-green-500" : "bg-gray-300"}`}
                                    >
                                        <span className={`absolute top-1 bg-white w-4 h-4 rounded-full transition-all ${formData.isActive ? "right-1" : "left-1"}`} />
                                    </button>
                                </div>
                            </div>
                        </section>

                        {/* Location Section */}
                        <section className="bg-white rounded-2xl shadow-sm border border-gray-200 p-8">
                            <h3 className="text-xl font-bold text-gray-900 mb-6 flex items-center gap-2">
                                <MapPin className="w-5 h-5 text-red-500" />
                                Address & Location
                            </h3>
                            <div className="grid md:grid-cols-2 gap-6">
                                <div className="md:col-span-2">
                                    <label className="block text-sm font-semibold text-gray-700 mb-2">Address Line 1</label>
                                    <input
                                        type="text"
                                        value={formData.addressLine1}
                                        onChange={(e) => setFormData({ ...formData, addressLine1: e.target.value })}
                                        className="w-full px-5 py-3.5 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-red-500 focus:outline-none transition"
                                        placeholder="Street address, P.O. box"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-semibold text-gray-700 mb-2">City</label>
                                    <input
                                        type="text"
                                        value={formData.city}
                                        onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                                        className="w-full px-5 py-3.5 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-red-500 focus:outline-none transition"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-semibold text-gray-700 mb-2">State / Zone</label>
                                    <input
                                        type="text"
                                        value={formData.state}
                                        onChange={(e) => setFormData({ ...formData, state: e.target.value })}
                                        className="w-full px-5 py-3.5 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-red-500 focus:outline-none transition"
                                    />
                                </div>
                            </div>
                        </section>

                        {/* Operation & Cuisine */}
                        <section className="bg-white rounded-2xl shadow-sm border border-gray-200 p-8">
                            <h3 className="text-xl font-bold text-gray-900 mb-6">Operation Details</h3>
                            <div className="grid md:grid-cols-2 gap-8">
                                <div className="space-y-6">
                                    <div className="grid grid-cols-2 gap-4">
                                        <div>
                                            <label className="block text-sm font-semibold text-gray-700 mb-2">Opening Hour</label>
                                            <input
                                                type="time"
                                                value={formData.openingHour}
                                                onChange={(e) => setFormData({ ...formData, openingHour: e.target.value })}
                                                className="w-full px-5 py-3.5 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-red-500 focus:outline-none font-medium"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-semibold text-gray-700 mb-2">Closing Hour</label>
                                            <input
                                                type="time"
                                                value={formData.closingHour}
                                                onChange={(e) => setFormData({ ...formData, closingHour: e.target.value })}
                                                className="w-full px-5 py-3.5 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-red-500 focus:outline-none font-medium"
                                            />
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-2 gap-4">
                                        <div>
                                            <label className="block text-sm font-semibold text-gray-700 mb-2">Min Delivery Time (min)</label>
                                            <input
                                                type="number"
                                                value={formData.deliveryTimeMin}
                                                onChange={(e) => setFormData({ ...formData, deliveryTimeMin: parseInt(e.target.value) })}
                                                className="w-full px-5 py-3.5 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-red-500 focus:outline-none font-medium"
                                                min="0"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-semibold text-gray-700 mb-2">Max Delivery Time (min)</label>
                                            <input
                                                type="number"
                                                value={formData.deliveryTimeMax}
                                                onChange={(e) => setFormData({ ...formData, deliveryTimeMax: parseInt(e.target.value) })}
                                                className="w-full px-5 py-3.5 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-red-500 focus:outline-none font-medium"
                                                min="0"
                                            />
                                        </div>
                                    </div>

                                    <div>
                                        <label className="block text-sm font-semibold text-gray-700 mb-2">Price Range</label>
                                        <select
                                            value={formData.priceRange}
                                            onChange={(e) => setFormData({ ...formData, priceRange: e.target.value })}
                                            className="w-full px-5 py-3.5 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-red-500 focus:outline-none font-medium"
                                        >
                                            <option value="Rs.">Rs. (Budget Friendly)</option>
                                            <option value="Rs.Rs.">Rs.Rs. (Moderate)</option>
                                            <option value="Rs.Rs.Rs.">Rs.Rs.Rs. (Premium)</option>
                                            <option value="Rs.Rs.Rs.Rs.">Rs.Rs.Rs.Rs. (Luxury)</option>
                                        </select>
                                    </div>
                                </div>

                                <div className="space-y-4">
                                    <label className="block text-sm font-semibold text-gray-700">Cuisine Types</label>
                                    <div className="flex gap-2">
                                        <input
                                            type="text"
                                            value={newCuisine}
                                            onChange={(e) => setNewCuisine(e.target.value)}
                                            onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddCuisine())}
                                            className="flex-1 px-5 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-red-500 focus:outline-none"
                                            placeholder="Add cuisine (e.g. Italian)"
                                        />
                                        <button
                                            type="button"
                                            onClick={handleAddCuisine}
                                            className="px-6 py-3 bg-gray-900 text-white rounded-xl font-bold hover:bg-black transition"
                                        >
                                            Add
                                        </button>
                                    </div>
                                    <div className="flex flex-wrap gap-2 pt-2">
                                        {formData.cuisineType.map((cuisine: string) => (
                                            <span
                                                key={cuisine}
                                                className="flex items-center gap-2 px-4 py-2 bg-red-50 text-red-700 rounded-full text-sm font-bold border border-red-100 group"
                                            >
                                                {cuisine}
                                                <button
                                                    type="button"
                                                    onClick={() => handleRemoveCuisine(cuisine)}
                                                    className="hover:text-red-900 transition"
                                                >
                                                    <X className="w-4 h-4" />
                                                </button>
                                            </span>
                                        ))}
                                    </div>

                                    {/* Tags Management */}
                                    <div className="space-y-4 pt-4 border-t border-gray-100">
                                        <label className="block text-sm font-semibold text-gray-700">Tags (for search & discovery)</label>
                                        <div className="flex gap-2">
                                            <input
                                                type="text"
                                                value={newTag}
                                                onChange={(e) => setNewTag(e.target.value)}
                                                onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddTag())}
                                                className="flex-1 px-5 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-red-500 focus:outline-none"
                                                placeholder="Add tag (e.g. popular)"
                                            />
                                            <button
                                                type="button"
                                                onClick={handleAddTag}
                                                className="px-6 py-3 bg-gray-100 text-gray-700 rounded-xl font-bold hover:bg-gray-200 transition"
                                            >
                                                Add
                                            </button>
                                        </div>
                                        <div className="flex flex-wrap gap-2 pt-2">
                                            {formData.tags.map((tag: string) => (
                                                <span
                                                    key={tag}
                                                    className="flex items-center gap-2 px-4 py-2 bg-gray-100 text-gray-700 rounded-full text-sm font-bold border border-gray-200 group"
                                                >
                                                    {tag}
                                                    <button
                                                        type="button"
                                                        onClick={() => handleRemoveTag(tag)}
                                                        className="hover:text-red-900 transition"
                                                    >
                                                        <X className="w-4 h-4" />
                                                    </button>
                                                </span>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </section>
                    </form>
                </main>

                <footer className="text-center text-gray-500 text-sm py-8 border-t border-gray-200 mt-16">
                    © {new Date().getFullYear()} KhanaSathi Admin. All rights reserved.
                </footer>
            </div>
        </div>
    );
}
