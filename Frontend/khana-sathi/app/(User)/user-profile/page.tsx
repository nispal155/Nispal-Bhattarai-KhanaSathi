"use client";

import Image from "next/image";
import Link from "next/link";
import { Camera, MapPin, CreditCard, Bell, Shield, HelpCircle, LogOut, ChevronRight, Edit2, Loader2, Plus, Trash2 } from "lucide-react";
import { useRef, useState, useEffect } from "react";
import { useAuth } from "@/context/AuthContext";
import { getProfile, updateProfile, getAddresses, addAddress, deleteAddress, setDefaultAddress } from "@/lib/userService";
import { getMyOrders } from "@/lib/orderService";
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
  phone?: string;
  dateOfBirth?: string;
  profilePicture?: string;
  loyaltyPoints: number;
  createdAt: string;
}

export default function ProfilePage() {
  const { logout, updateUser: updateAuthUser } = useAuth();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [activeTab, setActiveTab] = useState("personal");
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
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

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [profileRes, addressesRes, ordersRes] = await Promise.all([
        getProfile(),
        getAddresses(),
        getMyOrders(),
      ]);

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

      if (profileData) {
        setProfile({
          _id: profileData._id || '',
          name: profileData.username || profileData.name || '',
          email: profileData.email || '',
          phone: profileData.phone || '',
          dateOfBirth: profileData.dateOfBirth || '',
          profilePicture: profileData.profilePicture || '',
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
    } catch (err) {
      console.error("Error fetching data:", err);
    } finally {
      setLoading(false);
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
      });
      if (response.data && response.data.data) {
        updateAuthUser(response.data.data);
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
    } catch (err) {
      console.error("Error adding address:", err);
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteAddress = async (id: string) => {
    if (!confirm("Are you sure you want to delete this address?")) return;
    try {
      await deleteAddress(id);
      await fetchData();
    } catch (err) {
      console.error("Error deleting address:", err);
    }
  };

  const handleSetDefault = async (id: string) => {
    try {
      await setDefaultAddress(id);
      await fetchData();
    } catch (err) {
      console.error("Error setting default:", err);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "delivered": return "text-green-600";
      case "cancelled": return "text-red-600";
      case "pending": return "text-yellow-600";
      default: return "text-blue-600";
    }
  };

  const paymentMethods = [
    {
      id: "1",
      type: "eSewa",
      detail: "Connected",
      icon: "💚",
    },
    {
      id: "2",
      type: "Card",
      detail: "**** **** **** 4532",
      icon: "💳",
    },
  ];

  const tabs = [
    { id: "personal", label: "Personal Info", icon: "👤" },
    { id: "addresses", label: "Addresses", icon: "📍" },
    { id: "payments", label: "Payment Methods", icon: "💳" },
    { id: "orders", label: "Order History", icon: "📦" },
    { id: "settings", label: "Settings", icon: "⚙️" },
  ];

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-red-500" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Navigation */}
      <nav className="bg-white border-b border-gray-200 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <Link href="/" className="flex items-center gap-2">
              <div className="w-10 h-10 bg-red-500 rounded-full flex items-center justify-center">
                <span className="text-white text-xl">🍜</span>
              </div>
              <div>
                <span className="text-red-500 font-bold text-lg">Khana Sathi</span>
              </div>
            </Link>

            <div className="hidden md:flex items-center gap-8">
              <Link href="/browse-restaurants" className="flex items-center gap-2 text-gray-600 hover:text-gray-900">
                <span>🏠</span> Home
              </Link>
              <Link href="/cart" className="flex items-center gap-2 text-gray-600 hover:text-gray-900">
                <span>🛒</span> Cart
              </Link>
              <Link href="/user-profile" className="flex items-center gap-2 bg-gray-900 text-white px-4 py-2 rounded-full text-sm">
                <span>👤</span> Profile
              </Link>
              <Link href="/support" className="flex items-center gap-2 text-gray-600 hover:text-gray-900">
                <span>💬</span> Support
              </Link>
            </div>

            <div className="w-10 h-10 rounded-full bg-pink-200 overflow-hidden">
              <Image src={profile?.profilePicture || "/avatar.jpg"} alt="Profile" width={40} height={40} className="object-cover w-full h-full" />
            </div>
          </div>
        </div>
      </nav>

      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Profile Header */}
        <div className="bg-white rounded-xl border border-gray-200 p-6 mb-6">
          <div className="flex flex-col sm:flex-row items-center gap-6">
            <div className="relative">
              <div className="w-24 h-24 rounded-full bg-pink-200 overflow-hidden relative group">
                <Image
                  src={profile?.profilePicture || "/avatar.jpg"}
                  alt={profile?.name || "User"}
                  width={96}
                  height={96}
                  className="w-full h-full object-cover"
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
              </div>
              <div className="px-4 border-l border-gray-200">
                <div className="text-2xl font-bold text-gray-900">{orders.length}</div>
                <div className="text-sm text-gray-500">Orders</div>
              </div>
            </div>
          </div>
        </div>

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
                      {editMode ? (
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
                      {editMode ? (
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
                  </div>

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
              </div>
            )}

            {/* Addresses Tab */}
            {activeTab === "addresses" && (
              <div className="bg-white rounded-xl border border-gray-200 p-6">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-lg font-semibold text-gray-900">Saved Addresses</h2>
                  <button
                    onClick={() => setShowAddAddress(true)}
                    className="flex items-center gap-2 bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-lg transition-colors"
                  >
                    <Plus className="w-4 h-4" />
                    Add New
                  </button>
                </div>

                {showAddAddress && (
                  <form onSubmit={handleAddAddress} className="mb-6 p-4 border border-gray-200 rounded-lg">
                    <h3 className="font-medium text-gray-900 mb-4">Add New Address</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Label</label>
                        <select
                          value={newAddress.label}
                          onChange={(e) => setNewAddress(a => ({ ...a, label: e.target.value }))}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                        >
                          <option value="Home">Home</option>
                          <option value="Office">Office</option>
                          <option value="Other">Other</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Address Line 1</label>
                        <input
                          type="text"
                          value={newAddress.addressLine1}
                          onChange={(e) => setNewAddress(a => ({ ...a, addressLine1: e.target.value }))}
                          required
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Address Line 2</label>
                        <input
                          type="text"
                          value={newAddress.addressLine2}
                          onChange={(e) => setNewAddress(a => ({ ...a, addressLine2: e.target.value }))}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">City</label>
                        <input
                          type="text"
                          value={newAddress.city}
                          onChange={(e) => setNewAddress(a => ({ ...a, city: e.target.value }))}
                          required
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">State</label>
                        <input
                          type="text"
                          value={newAddress.state}
                          onChange={(e) => setNewAddress(a => ({ ...a, state: e.target.value }))}
                          required
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Zip Code</label>
                        <input
                          type="text"
                          value={newAddress.zipCode}
                          onChange={(e) => setNewAddress(a => ({ ...a, zipCode: e.target.value }))}
                          required
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                        />
                      </div>
                    </div>
                    <div className="flex gap-3 mt-4">
                      <button
                        type="submit"
                        disabled={saving}
                        className="px-4 py-2 bg-red-500 hover:bg-red-600 text-white rounded-lg disabled:opacity-50"
                      >
                        {saving ? "Saving..." : "Save Address"}
                      </button>
                      <button
                        type="button"
                        onClick={() => setShowAddAddress(false)}
                        className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
                      >
                        Cancel
                      </button>
                    </div>
                  </form>
                )}

                <div className="space-y-4">
                  {addresses.length === 0 ? (
                    <p className="text-gray-500 text-center py-8">No addresses saved yet.</p>
                  ) : (
                    addresses.map((address) => (
                      <div
                        key={address._id}
                        className="flex items-start justify-between p-4 border border-gray-200 rounded-lg"
                      >
                        <div className="flex items-start gap-3">
                          <div className="w-10 h-10 rounded-full bg-red-100 flex items-center justify-center shrink-0">
                            <MapPin className="w-5 h-5 text-red-500" />
                          </div>
                          <div>
                            <div className="flex items-center gap-2">
                              <h3 className="font-medium text-gray-900">{address.label}</h3>
                              {address.isDefault && (
                                <span className="px-2 py-0.5 bg-green-100 text-green-700 text-xs rounded-full">
                                  Default
                                </span>
                              )}
                            </div>
                            <p className="text-gray-600">
                              {address.addressLine1}
                              {address.addressLine2 && `, ${address.addressLine2}`}
                            </p>
                            <p className="text-gray-600 text-sm">
                              {address.city}, {address.state} {address.zipCode}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          {!address.isDefault && (
                            <button
                              onClick={() => handleSetDefault(address._id)}
                              className="text-sm text-blue-600 hover:text-blue-700"
                            >
                              Set Default
                            </button>
                          )}
                          <button
                            onClick={() => handleDeleteAddress(address._id)}
                            className="text-gray-400 hover:text-red-500"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}

            {/* Payment Methods Tab */}
            {activeTab === "payments" && (
              <div className="bg-white rounded-xl border border-gray-200 p-6">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-lg font-semibold text-gray-900">Payment Methods</h2>
                  <button className="flex items-center gap-2 bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-lg transition-colors">
                    <CreditCard className="w-4 h-4" />
                    Add New
                  </button>
                </div>

                <div className="space-y-4">
                  {paymentMethods.map((method) => (
                    <div
                      key={method.id}
                      className="flex items-center justify-between p-4 border border-gray-200 rounded-lg"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-12 h-12 rounded-lg bg-gray-100 flex items-center justify-center">
                          <span className="text-2xl">{method.icon}</span>
                        </div>
                        <div>
                          <h3 className="font-medium text-gray-900">{method.type}</h3>
                          <p className="text-sm text-gray-500">{method.detail}</p>
                        </div>
                      </div>
                      <button className="text-gray-400 hover:text-gray-600">
                        <ChevronRight className="w-5 h-5" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Order History Tab */}
            {activeTab === "orders" && (
              <div className="bg-white rounded-xl border border-gray-200 p-6">
                <h2 className="text-lg font-semibold text-gray-900 mb-6">Order History</h2>

                <div className="space-y-4">
                  {orders.length === 0 ? (
                    <p className="text-gray-500 text-center py-8">No orders yet. Start ordering!</p>
                  ) : (
                    orders.map((order) => (
                      <Link
                        key={order._id}
                        href={`/order-tracking/${order._id}`}
                        className="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:bg-gray-50 cursor-pointer transition-colors"
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
                  <h2 className="text-lg font-semibold text-gray-900 mb-4">Security</h2>

                  <div className="space-y-4">
                    <button className="w-full flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
                      <div className="flex items-center gap-3">
                        <Shield className="w-5 h-5 text-gray-500" />
                        <span className="font-medium text-gray-900">Change Password</span>
                      </div>
                      <ChevronRight className="w-5 h-5 text-gray-400" />
                    </button>

                    <button className="w-full flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
                      <div className="flex items-center gap-3">
                        <HelpCircle className="w-5 h-5 text-gray-500" />
                        <span className="font-medium text-gray-900">Help & Support</span>
                      </div>
                      <ChevronRight className="w-5 h-5 text-gray-400" />
                    </button>
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

    </div>
  );
}
