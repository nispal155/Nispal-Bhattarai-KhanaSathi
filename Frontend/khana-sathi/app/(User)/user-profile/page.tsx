"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Camera, Bell, LogOut, Edit2, Loader2, Trash2, ShieldCheck, RotateCcw } from "lucide-react";
import { useRef, useState, useEffect } from "react";
import { useAuth } from "@/context/AuthContext";
import UserHeader from "@/components/layout/UserHeader";
import {
  getProfile,
  updateProfile,
  getAddresses,
  addAddress,
  deleteAddress,
  setDefaultAddress,
  getChildSummary,
  type ChildSpendingSnapshot,
} from "@/lib/userService";
import { getMyRestaurant, updateMyRestaurant } from "@/lib/restaurantService";
import { getMyOrders, clearOrderHistory, reorderOrder } from "@/lib/orderService";
import toast from "react-hot-toast";

interface Address {
  _id: string;
  label: string;
  addressLine1: string;
  addressLine2?: string;
  city: string;
  state: string;
  zipCode: string;
  isDefault: boolean;
}

interface Order {
  _id: string;
  orderNumber: string;
  restaurant: {
    name: string;
  };
  status: string;
  pricing: {
    total: number;
  };
  createdAt: string;
}

interface UserProfile {
  _id: string;
  name: string;
  email: string;
  role?: string;
  phone?: string;
  dateOfBirth?: string;
  profilePicture?: string;
  allergyPreferences?: string[];
  parentAccount?: string | null | {
    _id: string;
    username?: string;
    email?: string;
    phone?: string;
  };
  loyaltyPoints: number;
  createdAt: string;
}

interface RestaurantProfile {
  name?: string;
  contactPhone?: string;
  address?: {
    addressLine1?: string;
    city?: string;
    state?: string;
    zipCode?: string;
  };
  openingHour?: string;
  closingHour?: string;
}

const ALLERGY_OPTIONS = ['Dairy', 'Eggs', 'Fish', 'Shellfish', 'Tree Nuts', 'Peanuts', 'Wheat', 'Soy', 'Sesame'];

export default function ProfilePage() {
  const router = useRouter();
  const { user, logout, updateUser: updateAuthUser, isAuthenticated, isLoading: authLoading } = useAuth();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [activeTab, setActiveTab] = useState("personal");
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [clearingHistory, setClearingHistory] = useState(false);
  const [reorderingOrderId, setReorderingOrderId] = useState<string | null>(null);
  const [editMode, setEditMode] = useState(false);
  const [showAddAddress, setShowAddAddress] = useState(false);
  const [newAddress, setNewAddress] = useState({
    label: "Home",
    addressLine1: "",
    addressLine2: "",
    city: "",
    state: "",
    zipCode: "",
  });
  const [restaurant, setRestaurant] = useState<RestaurantProfile | null>(null);
  const [childSpending, setChildSpending] = useState<ChildSpendingSnapshot | null>(null);
  const [restaurantEdit, setRestaurantEdit] = useState({
    name: "",
    contactPhone: "",
    addressLine1: "",
    city: "",
    state: "",
    zipCode: "",
    openingHour: "",
    closingHour: ""
  });

  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      toast.error("Please login to view your profile");
      window.location.href = '/login';
      return;
    }
    if (isAuthenticated) {
      fetchData();
    }
  }, [isAuthenticated, authLoading, user?.role]);

  const fetchData = async () => {
    try {
      setLoading(true);
      const results = await Promise.all([
        getProfile(),
        getAddresses(),
        getMyOrders(),
        user?.role === 'restaurant' ? getMyRestaurant() : Promise.resolve({ data: null }),
        user?.role === 'child' ? getChildSummary() : Promise.resolve({ data: null }),
      ]);
      const [profileRes, addressesRes, ordersRes, restaurantRes, childSummaryRes] = results;

      // Handle the nested response structure - extract actual data from API response
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const profileResData = profileRes?.data as any;
      const profileData = profileResData?.data || profileResData;

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const addressesResData = addressesRes?.data as any;
      const addressesData = addressesResData?.data || addressesResData || [];

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const ordersResData = ordersRes?.data as any;
      const ordersData = ordersResData?.data || ordersResData || [];

      console.log('Profile data loaded:', profileData);
      console.log('Addresses loaded:', addressesData);
      console.log('Orders loaded:', ordersData);

      if (profileData) {
        setProfile({
          _id: profileData._id || '',
          name: profileData.username || profileData.name || '',
          email: profileData.email || '',
          role: profileData.role || '',
          phone: profileData.phone || '',
          dateOfBirth: profileData.dateOfBirth || '',
          profilePicture: profileData.profilePicture || '',
          allergyPreferences: Array.isArray(profileData.allergyPreferences) ? profileData.allergyPreferences : [],
          parentAccount: profileData.parentAccount || null,
          loyaltyPoints: profileData.loyaltyPoints || 0,
          createdAt: profileData.createdAt || '',
        });
      }

      // Map addresses to ensure all required fields have defaults
      const mappedAddresses: Address[] = (Array.isArray(addressesData) ? addressesData : []).map((addr: Address) => ({
        ...addr,
        state: addr.state || '',
      }));
      setAddresses(mappedAddresses);
      setOrders(Array.isArray(ordersData) ? ordersData : []);

      // Handle restaurant data
      if (user?.role === 'restaurant') {
        const restaurantData = (restaurantRes as { data?: { data?: RestaurantProfile } | RestaurantProfile | null })?.data;
        const rData = restaurantData?.data || restaurantData;
        if (rData) {
          setRestaurant(rData);
          setRestaurantEdit({
            name: rData.name || "",
            contactPhone: rData.contactPhone || "",
            addressLine1: rData.address?.addressLine1 || "",
            city: rData.address?.city || "",
            state: rData.address?.state || "",
            zipCode: rData.address?.zipCode || "",
            openingHour: rData.openingHour || "",
            closingHour: rData.closingHour || ""
          });
        }
      }

      if (user?.role === 'child') {
        const childSummaryData = (childSummaryRes as { data?: { data?: { spending?: ChildSpendingSnapshot } } | { spending?: ChildSpendingSnapshot } | null })?.data;
        const childSummary = childSummaryData?.data || childSummaryData;
        setChildSpending(childSummary?.spending || null);
      } else {
        setChildSpending(null);
      }
    } catch (err) {
      console.error("Error fetching data:", err);
      toast.error("Failed to load profile data");
    } finally {
      setLoading(false);
    }
  };

  const handleClearHistory = async () => {
    if (!confirm("Are you sure you want to clean your order history? This will hide all completed and cancelled orders from your view.")) return;

    try {
      setClearingHistory(true);
      const res = await clearOrderHistory();
      if (res.data?.success) {
        toast.success("Order history cleaned");
        // Refresh orders
        const ordersRes = await getMyOrders();
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const ordersResData = ordersRes?.data as any;
        const ordersData = ordersResData?.data || ordersResData || [];
        setOrders(Array.isArray(ordersData) ? ordersData : []);
      } else {
        toast.error(res.data?.message || "Failed to clear history");
      }
    } catch (error) {
      console.error("Clear history error:", error);
      toast.error("Failed to clear history");
    } finally {
      setClearingHistory(false);
    }
  };

  const handleReorder = async (orderId: string) => {
    try {
      setReorderingOrderId(orderId);
      const response = await reorderOrder(orderId);

      if (response.error) {
        toast.error(response.error);
        return;
      }

      const reorderData = response.data?.data;
      const skippedItems = reorderData?.skippedItems || [];

      if (skippedItems.length > 0) {
        const preview = skippedItems
          .slice(0, 2)
          .map((item) => `${item.name} (${item.reason})`)
          .join(", ");
        const extra = skippedItems.length > 2 ? ` and ${skippedItems.length - 2} more` : "";
        toast.success(`${response.data?.message || "Meal added to cart"}. Skipped: ${preview}${extra}`);
      } else {
        toast.success(response.data?.message || "Meal added to cart");
      }

      router.push("/cart");
    } catch (error) {
      console.error("Reorder error:", error);
      toast.error("Failed to reorder this meal");
    } finally {
      setReorderingOrderId(null);
    }
  };

  const handleImageChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

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
      setSaving(true);
      try {
        const response = await updateProfile({ profilePicture: base64String });
        if (response.data && response.data.data) {
          const updatedData = response.data.data;
          setProfile(p => p ? { ...p, profilePicture: updatedData.profilePicture } : null);
          updateAuthUser(updatedData);
          toast.success("Profile picture updated!");
        } else {
          console.error("User profile update failed:", response.error);
          toast.error(response.error || "Failed to update profile picture");
        }
      } catch (error) {
        console.error("User upload error caught:", error);
        toast.error("Failed to update profile picture");
      } finally {
        setSaving(false);
      }
    };
    reader.readAsDataURL(file);
  };

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!profile) return;

    try {
      setSaving(true);
      const response = await updateProfile({
        username: profile.name,
        phone: profile.phone,
        dateOfBirth: profile.dateOfBirth,
        allergyPreferences: profile.allergyPreferences || [],
      });
      if (response.data && response.data.data) {
        updateAuthUser(response.data.data);

        // If restaurant manager, also update restaurant details
        if (user?.role === 'restaurant') {
          const restResponse = await updateMyRestaurant(restaurantEdit);
          if (restResponse.data && restResponse.data.data) {
            setRestaurant(restResponse.data.data);
          }
        }

        toast.success("Profile updated successfully");
      }
      setEditMode(false);
    } catch (err) {
      console.error("Error updating profile:", err);
    } finally {
      setSaving(false);
    }
  };

  const handleAddAddress = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setSaving(true);
      await addAddress({
        ...newAddress,
        label: newAddress.label as 'Home' | 'Office' | 'Other',
        isDefault: false,
      });
      await fetchData();
      setShowAddAddress(false);
      setNewAddress({
        label: "Home",
        addressLine1: "",
        addressLine2: "",
        city: "",
        state: "",
        zipCode: "",
      });
      toast.success("Address added successfully");
    } catch (err) {
      console.error("Error adding address:", err);
      toast.error("Failed to add address");
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteAddress = async (id: string) => {
    if (!confirm("Are you sure you want to delete this address?")) return;
    try {
      await deleteAddress(id);
      await fetchData();
      toast.success("Address deleted");
    } catch (err) {
      console.error("Error deleting address:", err);
      toast.error("Failed to delete address");
    }
  };

  const handleSetDefault = async (id: string) => {
    try {
      await setDefaultAddress(id);
      await fetchData();
      toast.success("Default address updated");
    } catch (err) {
      console.error("Error setting default:", err);
      toast.error("Failed to set default address");
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const formatCurrency = (value: number | null | undefined) => {
    if (value === null || value === undefined) {
      return "No limit";
    }
    return `Rs. ${value.toLocaleString("en-IN")}`;
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "delivered": return "text-green-600";
      case "cancelled": return "text-red-600";
      case "pending": return "text-yellow-600";
      default: return "text-blue-600";
    }
  };

  const tabs = [
    { id: "personal", label: "Personal Info", icon: "👤" },
    { id: "orders", label: "Order History", icon: "📦" },
    ...(user?.role === "customer" ? [{ id: "parental", label: "Parental Control", icon: "🛡️" }] : []),
    { id: "settings", label: "Settings", icon: "⚙️" },
  ];
  const parentAccountDetails = profile?.parentAccount && typeof profile.parentAccount === "object"
    ? profile.parentAccount
    : null;

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-red-500" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <UserHeader />

      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Profile Header */}
        <div className="bg-white rounded-xl border border-gray-200 p-6 mb-6">
          <div className="flex flex-col sm:flex-row items-center gap-6">
            <div className="relative">
              <div className="w-24 h-24 rounded-full bg-pink-200 overflow-hidden relative group">
                <Image
                  src={profile?.profilePicture || `https://ui-avatars.com/api/?name=${profile?.name || 'User'}&background=random&size=96`}
                  alt={profile?.name || "User"}
                  width={96}
                  height={96}
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    const target = e.target as HTMLImageElement;
                    target.src = `https://ui-avatars.com/api/?name=${profile?.name || 'User'}&background=random&size=96`;
                  }}
                />
                {saving && (
                  <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                    <Loader2 className="w-6 h-6 text-white animate-spin" />
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
                onClick={() => fileInputRef.current?.click()}
                disabled={saving}
                className="absolute bottom-0 right-0 w-8 h-8 bg-red-500 rounded-full flex items-center justify-center text-white hover:bg-red-600 transition-colors disabled:bg-gray-400"
              >
                <Camera className="w-4 h-4" />
              </button>
            </div>

            <div className="flex-1 text-center sm:text-left">
              <h1 className="text-2xl font-bold text-gray-900">{profile?.name}</h1>
              <p className="text-gray-600">{profile?.email}</p>
              <p className="text-gray-500 text-sm">Member since {profile?.createdAt ? formatDate(profile.createdAt) : "N/A"}</p>
            </div>

            <div className="flex gap-6 text-center">
              <div className="px-4">
                <div className="text-2xl font-bold text-red-500">{profile?.loyaltyPoints || 0}</div>
                <div className="text-sm text-gray-500">Points</div>
                <div className="mt-1 text-xs text-gray-400">Redeem value: Rs. {profile?.loyaltyPoints || 0}</div>
              </div>
              <div className="px-4 border-l border-gray-200">
                <div className="text-2xl font-bold text-gray-900">{orders.length}</div>
                <div className="text-sm text-gray-500">Orders</div>
              </div>
            </div>
          </div>
        </div>

        {user?.role === "customer" && (
          <div className="mb-6 rounded-xl border border-orange-200 bg-orange-50 p-4">
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h2 className="text-sm font-semibold text-orange-900">Loyalty Rewards</h2>
                <p className="text-sm text-orange-700">Earn 1 point for every Rs. 100 spent. Redeem 1 point as Rs. 1 off during checkout.</p>
              </div>
              <div className="rounded-lg bg-white px-4 py-2 text-sm font-semibold text-orange-900 shadow-sm">
                Balance: {profile?.loyaltyPoints || 0} pts
              </div>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Sidebar Tabs */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`w-full flex items-center gap-3 px-4 py-3 text-left transition-colors ${activeTab === tab.id
                    ? "bg-red-50 text-red-500 border-l-4 border-red-500"
                    : "hover:bg-gray-50 text-gray-700"
                    }`}
                >
                  <span>{tab.icon}</span>
                  <span className="font-medium">{tab.label}</span>
                </button>
              ))}

              <div className="border-t border-gray-200">
                <button
                  onClick={() => logout()}
                  className="w-full flex items-center gap-3 px-4 py-3 text-left text-red-500 hover:bg-red-50 transition-colors"
                >
                  <LogOut className="w-5 h-5" />
                  <span className="font-medium">Log Out</span>
                </button>
              </div>
            </div>
          </div>

          {/* Main Content */}
          <div className="lg:col-span-3">
            {/* Personal Info Tab */}
            {activeTab === "personal" && (
              <div className="bg-white rounded-xl border border-gray-200 p-6">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-lg font-semibold text-gray-900">Personal Information</h2>
                  {!editMode && (
                    <button
                      onClick={() => setEditMode(true)}
                      className="flex items-center gap-2 text-red-500 hover:text-red-600"
                    >
                      <Edit2 className="w-4 h-4" />
                      Edit
                    </button>
                  )}
                </div>

                <form onSubmit={handleUpdateProfile}>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-500 mb-1">Full Name</label>
                      {editMode ? (
                        <input
                          type="text"
                          value={profile?.name || ""}
                          onChange={(e) => setProfile(p => p ? { ...p, name: e.target.value } : null)}
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500"
                        />
                      ) : (
                        <p className="text-gray-900">{profile?.name}</p>
                      )}
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-500 mb-1">Email Address</label>
                      <p className="text-gray-900">{profile?.email}</p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-500 mb-1">Phone Number</label>
                      {editMode && user?.role !== 'restaurant' ? (
                        <input
                          type="tel"
                          value={profile?.phone || ""}
                          onChange={(e) => setProfile(p => p ? { ...p, phone: e.target.value } : null)}
                          placeholder="+977 98XXXXXXXX"
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500"
                        />
                      ) : (
                        <p className="text-gray-900">{profile?.phone || "Not set"}</p>
                      )}
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-500 mb-1">Date of Birth</label>
                      {editMode && user?.role !== 'restaurant' ? (
                        <input
                          type="date"
                          value={profile?.dateOfBirth?.split("T")[0] || ""}
                          onChange={(e) => setProfile(p => p ? { ...p, dateOfBirth: e.target.value } : null)}
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500"
                        />
                      ) : (
                        <p className="text-gray-900">{profile?.dateOfBirth ? formatDate(profile.dateOfBirth) : "Not set"}</p>
                      )}
                    </div>
                    {user?.role !== 'restaurant' && (
                      <div className="md:col-span-2">
                        <label className="block text-sm font-medium text-gray-500 mb-2">Allergy Preferences</label>
                        {editMode ? (
                          <div className="rounded-xl border border-gray-200 bg-gray-50 p-4">
                            <p className="mb-3 text-sm text-gray-600">
                              Select allergies to help KhanaSathi warn you about risky menu items and safer food suggestions.
                            </p>
                            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                              {ALLERGY_OPTIONS.map((allergy) => {
                                const selected = profile?.allergyPreferences?.includes(allergy);
                                return (
                                  <label
                                    key={allergy}
                                    className={`flex cursor-pointer items-center gap-2 rounded-lg border px-3 py-2 text-sm transition ${
                                      selected
                                        ? "border-red-300 bg-red-50 text-red-700"
                                        : "border-gray-200 bg-white text-gray-700 hover:border-red-200"
                                    }`}
                                  >
                                    <input
                                      type="checkbox"
                                      className="h-4 w-4 rounded border-gray-300 text-red-500 focus:ring-red-500"
                                      checked={selected}
                                      onChange={(e) =>
                                        setProfile((current) => {
                                          if (!current) return current;
                                          const currentAllergies = current.allergyPreferences || [];
                                          return {
                                            ...current,
                                            allergyPreferences: e.target.checked
                                              ? [...currentAllergies, allergy]
                                              : currentAllergies.filter((item) => item !== allergy)
                                          };
                                        })
                                      }
                                    />
                                    <span>{allergy}</span>
                                  </label>
                                );
                              })}
                            </div>
                          </div>
                        ) : profile?.allergyPreferences?.length ? (
                          <div className="flex flex-wrap gap-2">
                            {profile.allergyPreferences.map((allergy) => (
                              <span
                                key={allergy}
                                className="rounded-full bg-red-50 px-3 py-1 text-sm font-medium text-red-700"
                              >
                                {allergy}
                              </span>
                            ))}
                          </div>
                        ) : (
                          <p className="text-gray-900">No allergy preferences saved</p>
                        )}
                      </div>
                    )}
                  </div>

                  {user?.role === 'child' && (
                    <div className="mt-8 rounded-xl border border-blue-100 bg-blue-50 p-5">
                      <div className="flex items-center gap-2 mb-4">
                        <ShieldCheck className="w-5 h-5 text-blue-600" />
                        <h3 className="text-base font-semibold text-blue-900">Linked Parent Details</h3>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                        <div>
                          <p className="text-blue-700 font-medium mb-1">Parent Name</p>
                          <p className="text-gray-900">{parentAccountDetails?.username || "Not available"}</p>
                        </div>
                        <div>
                          <p className="text-blue-700 font-medium mb-1">Parent Email</p>
                          <p className="text-gray-900">{parentAccountDetails?.email || "Not available"}</p>
                        </div>
                        <div>
                          <p className="text-blue-700 font-medium mb-1">Parent Phone</p>
                          <p className="text-gray-900">{parentAccountDetails?.phone || "Not available"}</p>
                        </div>
                      </div>

                      <div className="mt-6 border-t border-blue-100 pt-5">
                        <h4 className="text-sm font-semibold text-blue-900">Remaining Spending Limits</h4>
                        {childSpending ? (
                          <div className="mt-3 grid grid-cols-1 gap-4 md:grid-cols-3">
                            {[
                              { label: "Daily", summary: childSpending.daily },
                              { label: "Weekly", summary: childSpending.weekly },
                              { label: "Monthly", summary: childSpending.monthly },
                            ].map(({ label, summary }) => (
                              <div key={label} className="rounded-xl border border-blue-100 bg-white p-4 shadow-sm">
                                <p className="text-xs font-semibold uppercase tracking-wide text-blue-700">{label}</p>
                                <p className="mt-2 text-lg font-bold text-gray-900">{formatCurrency(summary.remaining)}</p>
                                <p className="text-xs text-gray-500">Remaining now</p>
                                <div className="mt-3 space-y-1 text-sm text-gray-600">
                                  <p>Used: {formatCurrency(summary.used)}</p>
                                  <p>Limit: {formatCurrency(summary.limit)}</p>
                                </div>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <p className="mt-3 text-sm text-gray-600">Spending summary is not available right now.</p>
                        )}
                      </div>
                    </div>
                  )}

                  {editMode && (
                    <div className="flex gap-4 mt-6">
                      <button
                        type="submit"
                        disabled={saving}
                        className="px-6 py-2 bg-red-500 hover:bg-red-600 text-white rounded-lg font-medium transition-colors disabled:opacity-50"
                      >
                        {saving ? "Saving..." : "Save Changes"}
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setEditMode(false);
                          fetchData();
                        }}
                        className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg font-medium hover:bg-gray-50 transition-colors"
                      >
                        Cancel
                      </button>
                    </div>
                  )}
                </form>

                {/* Restaurant Details Section - Only for Restaurant Managers */}
                {user?.role === 'restaurant' && restaurant && (
                  <div className="mt-10 pt-10 border-t border-gray-200">
                    <div className="flex items-center justify-between mb-6">
                      <h2 className="text-lg font-semibold text-gray-900 border-l-4 border-red-500 pl-3">Restaurant Details</h2>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div>
                        <label className="block text-sm font-medium text-gray-500 mb-1">Restaurant Name</label>
                        {editMode ? (
                          <input
                            type="text"
                            value={restaurantEdit.name}
                            onChange={(e) => setRestaurantEdit(r => ({ ...r, name: e.target.value }))}
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500"
                          />
                        ) : (
                          <p className="text-gray-900 font-medium">{restaurant.name}</p>
                        )}
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-500 mb-1">Contact Phone</label>
                        {editMode ? (
                          <input
                            type="tel"
                            value={restaurantEdit.contactPhone}
                            onChange={(e) => setRestaurantEdit(r => ({ ...r, contactPhone: e.target.value }))}
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500"
                          />
                        ) : (
                          <p className="text-gray-900">{restaurant.contactPhone || "Not set"}</p>
                        )}
                      </div>
                      <div className="md:col-span-2">
                        <label className="block text-sm font-medium text-gray-500 mb-1">Address</label>
                        {editMode ? (
                          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                            <input
                              type="text"
                              placeholder="Address Line 1"
                              value={restaurantEdit.addressLine1}
                              onChange={(e) => setRestaurantEdit(r => ({ ...r, addressLine1: e.target.value }))}
                              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500"
                            />
                            <input
                              type="text"
                              placeholder="City"
                              value={restaurantEdit.city}
                              onChange={(e) => setRestaurantEdit(r => ({ ...r, city: e.target.value }))}
                              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500"
                            />
                            <input
                              type="text"
                              placeholder="State"
                              value={restaurantEdit.state}
                              onChange={(e) => setRestaurantEdit(r => ({ ...r, state: e.target.value }))}
                              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500"
                            />
                            <input
                              type="text"
                              placeholder="Zip Code"
                              value={restaurantEdit.zipCode}
                              onChange={(e) => setRestaurantEdit(r => ({ ...r, zipCode: e.target.value }))}
                              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500"
                            />
                          </div>
                        ) : (
                          <p className="text-gray-900">
                            {restaurant.address?.addressLine1}{restaurant.address?.city ? `, ${restaurant.address.city}` : ""}{restaurant.address?.state ? `, ${restaurant.address.state}` : ""}{restaurant.address?.zipCode ? ` ${restaurant.address.zipCode}` : ""}
                            {!restaurant.address?.addressLine1 && "Not set"}
                          </p>
                        )}
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-500 mb-1">Business Hours</label>
                        {editMode ? (
                          <div className="flex items-center gap-2">
                            <input
                              type="time"
                              value={restaurantEdit.openingHour}
                              onChange={(e) => setRestaurantEdit(r => ({ ...r, openingHour: e.target.value }))}
                              className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500"
                            />
                            <span className="text-gray-500">to</span>
                            <input
                              type="time"
                              value={restaurantEdit.closingHour}
                              onChange={(e) => setRestaurantEdit(r => ({ ...r, closingHour: e.target.value }))}
                              className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500"
                            />
                          </div>
                        ) : (
                          <p className="text-gray-900 flex items-center gap-2">
                            <span className="px-2 py-1 bg-green-50 text-green-700 text-xs font-semibold rounded uppercase">Open</span>
                            {restaurant.openingHour || "00:00"} - {restaurant.closingHour || "00:00"}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Order History Tab */}
            {activeTab === "orders" && (
              <div className="bg-white rounded-xl border border-gray-200 p-6">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-lg font-semibold text-gray-900">Order History</h2>
                  {orders.length > 0 && (
                    <button
                      onClick={handleClearHistory}
                      disabled={clearingHistory}
                      className="text-sm font-medium text-red-500 hover:text-red-600 disabled:opacity-50 flex items-center gap-1"
                    >
                      {clearingHistory ? (
                        <>
                          <Loader2 className="w-4 h-4 animate-spin" />
                          Cleaning...
                        </>
                      ) : (
                        <>
                          <Trash2 className="w-4 h-4" />
                          Clean History
                        </>
                      )}
                    </button>
                  )}
                </div>

                <div className="space-y-4">
                  {orders.length === 0 ? (
                    <p className="text-gray-500 text-center py-8">No orders yet. Start ordering!</p>
                  ) : (
                    orders.map((order) => (
                      <div
                        key={order._id}
                        className="rounded-lg border border-gray-200 p-4 transition-colors hover:bg-gray-50"
                      >
                        <Link
                          href={`/order-tracking/${order._id}`}
                          className="flex items-center justify-between"
                        >
                          <div className="flex items-center gap-4">
                            <div className="w-12 h-12 rounded-lg bg-red-100 flex items-center justify-center">
                              <span className="text-xl">🍽️</span>
                            </div>
                            <div>
                              <h3 className="font-medium text-gray-900">{order.restaurant?.name || "Restaurant"}</h3>
                              <p className="text-sm text-gray-500">
                                {order.orderNumber} • {formatDate(order.createdAt)}
                              </p>
                            </div>
                          </div>
                          <div className="text-right">
                            <p className="font-semibold text-gray-900">Rs. {order.pricing?.total || 0}</p>
                            <span className={`text-sm capitalize ${getStatusColor(order.status)}`}>
                              {order.status?.replace("_", " ")}
                            </span>
                          </div>
                        </Link>

                        <div className="mt-4 flex justify-end border-t border-gray-100 pt-4">
                          <button
                            type="button"
                            onClick={() => handleReorder(order._id)}
                            disabled={reorderingOrderId === order._id}
                            className="inline-flex items-center gap-2 rounded-lg border border-red-200 px-4 py-2 text-sm font-medium text-red-600 transition-colors hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-60"
                          >
                            {reorderingOrderId === order._id ? (
                              <>
                                <Loader2 className="h-4 w-4 animate-spin" />
                                Reordering...
                              </>
                            ) : (
                              <>
                                <RotateCcw className="h-4 w-4" />
                                Reorder Meal
                              </>
                            )}
                          </button>
                        </div>
                      </div>
                    ))
                  )}
                </div>

                {orders.length > 0 && (
                  <button className="w-full mt-4 text-red-500 hover:text-red-600 font-medium">
                    View All Orders
                  </button>
                )}
              </div>
            )}

            {/* Settings Tab */}
            {activeTab === "parental" && user?.role === "customer" && (
              <div className="bg-white rounded-xl border border-gray-200 p-6">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <h2 className="text-lg font-semibold text-gray-900">Parental Control</h2>
                    <p className="text-gray-600 mt-2">
                      Create a child account with email and password, then manage onboarding and verification status.
                    </p>
                  </div>
                  <ShieldCheck className="w-7 h-7 text-red-500 shrink-0" />
                </div>

                <div className="mt-6">
                  <Link
                    href="/parental-control"
                    className="inline-flex items-center px-5 py-2.5 bg-red-500 text-white rounded-lg font-medium hover:bg-red-600 transition-colors"
                  >
                    Open Parental Control
                  </Link>
                </div>
              </div>
            )}

            {/* Settings Tab */}
            {activeTab === "settings" && (
              <div className="space-y-6">
                <div className="bg-white rounded-xl border border-gray-200 p-6">
                  <h2 className="text-lg font-semibold text-gray-900 mb-4">Notifications</h2>

                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <Bell className="w-5 h-5 text-gray-500" />
                        <div>
                          <p className="font-medium text-gray-900">Push Notifications</p>
                          <p className="text-sm text-gray-500">Receive order updates</p>
                        </div>
                      </div>
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input type="checkbox" className="sr-only peer" defaultChecked />
                        <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-red-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-red-500"></div>
                      </label>
                    </div>

                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <Bell className="w-5 h-5 text-gray-500" />
                        <div>
                          <p className="font-medium text-gray-900">Email Notifications</p>
                          <p className="text-sm text-gray-500">Offers and promotions</p>
                        </div>
                      </div>
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input type="checkbox" className="sr-only peer" />
                        <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-red-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-red-500"></div>
                      </label>
                    </div>
                  </div>
                </div>

                <div className="bg-white rounded-xl border border-gray-200 p-6">
                  <h2 className="text-lg font-semibold text-red-500 mb-4">Danger Zone</h2>
                  <button className="px-4 py-2 border border-red-300 text-red-500 rounded-lg hover:bg-red-50 transition-colors">
                    Delete Account
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Footer */}

    </div >
  );
}
