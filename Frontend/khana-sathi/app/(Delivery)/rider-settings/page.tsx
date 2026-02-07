'use client';

import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';
import { useState, useEffect } from 'react';
import axios from 'axios';
import toast from 'react-hot-toast';
import {
  ArrowLeft,
  Bell,
  BellOff,
  Volume2,
  VolumeX,
  Moon,
  Sun,
  Shield,
  Car,
  User,
  Mail,
  Phone,
  Save,
  Loader2,
  ChevronRight,
  ToggleLeft,
  ToggleRight,
  Lock,
  Smartphone,
  MapPin
} from 'lucide-react';

const API_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:5003/api';

export default function RiderSettingsPage() {
  const { user, isLoading: authLoading, logout } = useAuth();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Notification preferences
  const [notifOrderUpdates, setNotifOrderUpdates] = useState(true);
  const [notifNewAssignments, setNotifNewAssignments] = useState(true);
  const [notifChat, setNotifChat] = useState(true);
  const [notifPromotions, setNotifPromotions] = useState(false);
  const [soundEnabled, setSoundEnabled] = useState(true);

  // Availability
  const [autoOnline, setAutoOnline] = useState(false);
  const [shareLocation, setShareLocation] = useState(true);

  // Account
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [vehicleType, setVehicleType] = useState('');
  const [vehicleModel, setVehicleModel] = useState('');
  const [licensePlate, setLicensePlate] = useState('');

  // Password
  const [showPasswordSection, setShowPasswordSection] = useState(false);
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [changingPassword, setChangingPassword] = useState(false);

  useEffect(() => {
    if (authLoading) return;
    if (!user) {
      router.push('/login');
      return;
    }
    fetchProfile();
  }, [user, router, authLoading]);

  const fetchProfile = async () => {
    try {
      const response = await axios.get(`${API_URL}/staff/profile/${user?._id}`);
      const data = response.data;
      setUsername(data.username || '');
      setEmail(data.email || '');
      setPhone(data.phone || '');
      setVehicleType(data.vehicleDetails?.type || '');
      setVehicleModel(data.vehicleDetails?.model || '');
      setLicensePlate(data.vehicleDetails?.licensePlate || '');

      // Load saved preferences from localStorage
      const prefs = localStorage.getItem(`rider_prefs_${user?._id}`);
      if (prefs) {
        const parsed = JSON.parse(prefs);
        setNotifOrderUpdates(parsed.notifOrderUpdates ?? true);
        setNotifNewAssignments(parsed.notifNewAssignments ?? true);
        setNotifChat(parsed.notifChat ?? true);
        setNotifPromotions(parsed.notifPromotions ?? false);
        setSoundEnabled(parsed.soundEnabled ?? true);
        setAutoOnline(parsed.autoOnline ?? false);
        setShareLocation(parsed.shareLocation ?? true);
      }
    } catch (error) {
      console.error('Error fetching profile:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSavePreferences = () => {
    const prefs = {
      notifOrderUpdates,
      notifNewAssignments,
      notifChat,
      notifPromotions,
      soundEnabled,
      autoOnline,
      shareLocation,
    };
    localStorage.setItem(`rider_prefs_${user?._id}`, JSON.stringify(prefs));
    toast.success('Preferences saved!');
  };

  const handleSaveProfile = async () => {
    setSaving(true);
    try {
      await axios.put(`${API_URL}/staff/update-profile/${user?._id}`, {
        username,
        phone,
        vehicleDetails: {
          type: vehicleType,
          model: vehicleModel,
          licensePlate,
        },
      });
      toast.success('Profile updated!');
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to update profile');
    } finally {
      setSaving(false);
    }
  };

  const handleChangePassword = async () => {
    if (newPassword !== confirmPassword) {
      toast.error('Passwords do not match');
      return;
    }
    if (newPassword.length < 6) {
      toast.error('Password must be at least 6 characters');
      return;
    }

    setChangingPassword(true);
    try {
      await axios.put(`${API_URL}/auth/change-password`, {
        currentPassword,
        newPassword,
      }, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('token')}`,
        },
      });
      toast.success('Password changed successfully!');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      setShowPasswordSection(false);
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to change password');
    } finally {
      setChangingPassword(false);
    }
  };

  const handleDeleteAccount = async () => {
    const confirmed = window.confirm(
      'Are you sure you want to delete your account? This action cannot be undone.'
    );
    if (!confirmed) return;

    try {
      await axios.delete(`${API_URL}/auth/delete-account`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('token')}`,
        },
      });
      toast.success('Account deleted');
      logout();
      router.push('/login');
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to delete account');
    }
  };

  if (authLoading || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <Loader2 className="w-10 h-10 text-orange-500 animate-spin" />
      </div>
    );
  }

  const ToggleSwitch = ({
    enabled,
    onToggle,
    label,
    description,
    icon: Icon,
  }: {
    enabled: boolean;
    onToggle: () => void;
    label: string;
    description?: string;
    icon?: React.ComponentType<{ className?: string }>;
  }) => (
    <div className="flex items-center justify-between py-3">
      <div className="flex items-center gap-3">
        {Icon && (
          <div className="w-9 h-9 rounded-lg bg-gray-100 flex items-center justify-center">
            <Icon className="w-4 h-4 text-gray-600" />
          </div>
        )}
        <div>
          <p className="text-sm font-medium text-gray-800">{label}</p>
          {description && <p className="text-xs text-gray-500">{description}</p>}
        </div>
      </div>
      <button
        onClick={onToggle}
        className={`relative w-11 h-6 rounded-full transition-colors ${enabled ? 'bg-orange-500' : 'bg-gray-300'}`}
      >
        <span
          className={`absolute top-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${enabled ? 'left-[22px]' : 'left-0.5'}`}
        />
      </button>
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-3xl mx-auto">
        {/* Header */}
        <div className="flex items-center gap-4 mb-8">
          <button
            onClick={() => router.push('/rider-dashboard')}
            className="p-2 hover:bg-gray-100 rounded-full transition"
          >
            <ArrowLeft className="w-6 h-6 text-gray-600" />
          </button>
          <div>
            <h1 className="text-2xl font-bold text-gray-800">Settings</h1>
            <p className="text-gray-500">Manage your preferences and account</p>
          </div>
        </div>

        {/* Notification Settings */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 mb-6">
          <h2 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
            <Bell className="w-5 h-5 text-orange-500" />
            Notification Preferences
          </h2>

          <div className="divide-y divide-gray-100">
            <ToggleSwitch
              enabled={notifNewAssignments}
              onToggle={() => setNotifNewAssignments(!notifNewAssignments)}
              label="New Delivery Assignments"
              description="Get notified when a new order is assigned to you"
              icon={Bell}
            />
            <ToggleSwitch
              enabled={notifOrderUpdates}
              onToggle={() => setNotifOrderUpdates(!notifOrderUpdates)}
              label="Order Status Updates"
              description="Notifications when order status changes"
              icon={Bell}
            />
            <ToggleSwitch
              enabled={notifChat}
              onToggle={() => setNotifChat(!notifChat)}
              label="Chat Messages"
              description="Notifications for new chat messages"
              icon={Smartphone}
            />
            <ToggleSwitch
              enabled={notifPromotions}
              onToggle={() => setNotifPromotions(!notifPromotions)}
              label="Promotions & Updates"
              description="News, tips, and promotional offers"
              icon={Mail}
            />
            <ToggleSwitch
              enabled={soundEnabled}
              onToggle={() => setSoundEnabled(!soundEnabled)}
              label="Notification Sound"
              description="Play sound for incoming notifications"
              icon={soundEnabled ? Volume2 : VolumeX}
            />
          </div>

          <button
            onClick={handleSavePreferences}
            className="mt-4 w-full py-2.5 bg-orange-500 hover:bg-orange-600 text-white rounded-xl font-medium transition flex items-center justify-center gap-2"
          >
            <Save className="w-4 h-4" />
            Save Preferences
          </button>
        </div>

        {/* Availability Settings */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 mb-6">
          <h2 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
            <MapPin className="w-5 h-5 text-green-500" />
            Availability & Location
          </h2>

          <div className="divide-y divide-gray-100">
            <ToggleSwitch
              enabled={autoOnline}
              onToggle={() => setAutoOnline(!autoOnline)}
              label="Auto Go Online"
              description="Automatically set status to online when you open the app"
              icon={Sun}
            />
            <ToggleSwitch
              enabled={shareLocation}
              onToggle={() => setShareLocation(!shareLocation)}
              label="Share Live Location"
              description="Allow customers to track your location during delivery"
              icon={MapPin}
            />
          </div>
        </div>

        {/* Account Details */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 mb-6">
          <h2 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
            <User className="w-5 h-5 text-blue-500" />
            Account Details
          </h2>

          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium text-gray-700 mb-1 block">Username</label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-orange-500 focus:border-orange-500 outline-none"
                />
              </div>
            </div>

            <div>
              <label className="text-sm font-medium text-gray-700 mb-1 block">Email</label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="email"
                  value={email}
                  disabled
                  className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-xl text-sm bg-gray-50 text-gray-500 cursor-not-allowed"
                />
              </div>
              <p className="text-xs text-gray-400 mt-1">Email cannot be changed</p>
            </div>

            <div>
              <label className="text-sm font-medium text-gray-700 mb-1 block">Phone</label>
              <div className="relative">
                <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="+977 98XXXXXXXX"
                  className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-orange-500 focus:border-orange-500 outline-none"
                />
              </div>
            </div>
          </div>

          {/* Vehicle Details */}
          <h3 className="text-sm font-bold text-gray-700 mt-6 mb-3 flex items-center gap-2">
            <Car className="w-4 h-4 text-gray-500" />
            Vehicle Details
          </h3>

          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium text-gray-700 mb-1 block">Vehicle Type</label>
              <select
                value={vehicleType}
                onChange={(e) => setVehicleType(e.target.value)}
                className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-orange-500 focus:border-orange-500 outline-none"
              >
                <option value="">Select type</option>
                <option value="motorcycle">Motorcycle</option>
                <option value="scooter">Scooter</option>
                <option value="bicycle">Bicycle</option>
                <option value="car">Car</option>
              </select>
            </div>

            <div>
              <label className="text-sm font-medium text-gray-700 mb-1 block">Vehicle Model</label>
              <input
                type="text"
                value={vehicleModel}
                onChange={(e) => setVehicleModel(e.target.value)}
                placeholder="e.g., Honda Dio"
                className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-orange-500 focus:border-orange-500 outline-none"
              />
            </div>

            <div>
              <label className="text-sm font-medium text-gray-700 mb-1 block">License Plate</label>
              <input
                type="text"
                value={licensePlate}
                onChange={(e) => setLicensePlate(e.target.value)}
                placeholder="e.g., BA 1 PA 1234"
                className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-orange-500 focus:border-orange-500 outline-none"
              />
            </div>
          </div>

          <button
            onClick={handleSaveProfile}
            disabled={saving}
            className="mt-6 w-full py-2.5 bg-blue-500 hover:bg-blue-600 text-white rounded-xl font-medium transition flex items-center justify-center gap-2 disabled:opacity-50"
          >
            {saving ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Save className="w-4 h-4" />
            )}
            {saving ? 'Saving...' : 'Save Account Details'}
          </button>
        </div>

        {/* Security */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 mb-6">
          <h2 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
            <Shield className="w-5 h-5 text-purple-500" />
            Security
          </h2>

          <button
            onClick={() => setShowPasswordSection(!showPasswordSection)}
            className="w-full flex items-center justify-between py-3 text-left"
          >
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-lg bg-purple-100 flex items-center justify-center">
                <Lock className="w-4 h-4 text-purple-600" />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-800">Change Password</p>
                <p className="text-xs text-gray-500">Update your account password</p>
              </div>
            </div>
            <ChevronRight className={`w-5 h-5 text-gray-400 transition-transform ${showPasswordSection ? 'rotate-90' : ''}`} />
          </button>

          {showPasswordSection && (
            <div className="mt-4 space-y-3 border-t border-gray-100 pt-4">
              <input
                type="password"
                placeholder="Current Password"
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-purple-500 focus:border-purple-500 outline-none"
              />
              <input
                type="password"
                placeholder="New Password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-purple-500 focus:border-purple-500 outline-none"
              />
              <input
                type="password"
                placeholder="Confirm New Password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-purple-500 focus:border-purple-500 outline-none"
              />
              <button
                onClick={handleChangePassword}
                disabled={changingPassword || !currentPassword || !newPassword || !confirmPassword}
                className="w-full py-2.5 bg-purple-500 hover:bg-purple-600 text-white rounded-xl font-medium transition disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {changingPassword ? <Loader2 className="w-4 h-4 animate-spin" /> : <Lock className="w-4 h-4" />}
                {changingPassword ? 'Changing...' : 'Change Password'}
              </button>
            </div>
          )}
        </div>

        {/* Danger Zone */}
        <div className="bg-white rounded-2xl shadow-sm border border-red-100 p-6 mb-6">
          <h2 className="text-lg font-bold text-red-600 mb-2">Danger Zone</h2>
          <p className="text-sm text-gray-500 mb-4">
            Once you delete your account, there is no going back. Please be certain.
          </p>
          <button
            onClick={handleDeleteAccount}
            className="px-6 py-2.5 bg-red-50 text-red-600 border border-red-200 rounded-xl font-medium hover:bg-red-100 transition"
          >
            Delete Account
          </button>
        </div>
      </div>
    </div>
  );
}
