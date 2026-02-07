'use client';

import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';
import { useState, useEffect, useRef } from 'react';
import Image from 'next/image';
import axios from 'axios';
import toast from 'react-hot-toast';
import {
  ArrowLeft,
  Camera,
  User,
  Mail,
  Phone,
  Car,
  FileText,
  Save,
  Loader2
} from 'lucide-react';

const API_URL = `${process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:5003/api"}/staff`;

interface UserProfile {
  _id: string;
  username: string;
  email: string;
  profilePicture?: string;
  vehicleDetails?: {
    type?: string;
    model?: string;
    licensePlate?: string;
  };
  documents?: {
    driversLicense?: string;
    vehicleInsurance?: string;
  };
}

export default function RiderProfilePage() {
  const { user, isLoading: authLoading } = useAuth();
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [profileData, setProfileData] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [previewImage, setPreviewImage] = useState<string | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

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
      const response = await axios.get(`${API_URL}/profile/${user?._id}`);
      setProfileData(response.data);
      if (response.data.profilePicture) {
        setPreviewImage(response.data.profilePicture);
      }
    } catch (error) {
      console.error("Error fetching profile:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleImageClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreviewImage(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSaveProfile = async () => {
    if (!selectedFile || !previewImage) {
      toast.error("No new image selected");
      return;
    }

    setSaving(true);
    try {
      // Send base64 image directly as the backend expects
      await axios.put(`${API_URL}/update-profile-picture`, {
        userId: user?._id,
        profilePicture: previewImage // previewImage is already base64 from FileReader
      });

      toast.success("Profile picture updated!");
      setSelectedFile(null);
    } catch (error) {
      console.error("Error saving:", error);
      toast.error("Failed to update profile picture");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <Loader2 className="w-10 h-10 text-orange-500 animate-spin" />
      </div>
    );
  }

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
          <h1 className="text-2xl font-bold text-gray-800">My Profile</h1>
        </div>

        {/* Profile Picture Section */}
        <div className="bg-white rounded-2xl shadow-sm p-8 mb-6">
          <div className="flex flex-col items-center">
            <div
              onClick={handleImageClick}
              className="relative w-32 h-32 rounded-full overflow-hidden border-4 border-orange-400 cursor-pointer group"
            >
              {previewImage ? (
                <Image
                  src={previewImage}
                  alt="Profile"
                  fill
                  className="object-cover"
                />
              ) : (
                <div className="w-full h-full bg-gradient-to-br from-yellow-400 to-orange-500 flex items-center justify-center text-white text-4xl font-bold">
                  {user?.username?.charAt(0).toUpperCase()}
                </div>
              )}
              <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition">
                <Camera className="w-8 h-8 text-white" />
              </div>
            </div>
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileChange}
              accept="image/*"
              className="hidden"
            />
            <p className="mt-4 text-2xl font-bold text-gray-800">{user?.username}</p>
            <p className="text-gray-500">{user?.email}</p>

            {selectedFile && (
              <button
                onClick={handleSaveProfile}
                disabled={saving}
                className="mt-4 px-6 py-2 bg-orange-500 text-white rounded-lg font-medium flex items-center gap-2 hover:bg-orange-600 transition disabled:opacity-50"
              >
                {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                Save Picture
              </button>
            )}
          </div>
        </div>

        {/* Vehicle Details Section */}
        <div className="bg-white rounded-2xl shadow-sm p-6 mb-6">
          <h3 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
            <Car className="w-5 h-5 text-orange-500" />
            Vehicle Details
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="p-4 bg-gray-50 rounded-xl">
              <p className="text-xs text-gray-500 mb-1">Vehicle Type</p>
              <p className="font-medium text-gray-800">{profileData?.vehicleDetails?.type || 'Not set'}</p>
            </div>
            <div className="p-4 bg-gray-50 rounded-xl">
              <p className="text-xs text-gray-500 mb-1">Model</p>
              <p className="font-medium text-gray-800">{profileData?.vehicleDetails?.model || 'Not set'}</p>
            </div>
            <div className="p-4 bg-gray-50 rounded-xl">
              <p className="text-xs text-gray-500 mb-1">License Plate</p>
              <p className="font-medium text-gray-800">{profileData?.vehicleDetails?.licensePlate || 'Not set'}</p>
            </div>
          </div>
        </div>

        {/* Documents Section */}
        <div className="bg-white rounded-2xl shadow-sm p-6">
          <h3 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
            <FileText className="w-5 h-5 text-orange-500" />
            Documents
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="p-4 bg-gray-50 rounded-xl">
              <p className="text-xs text-gray-500 mb-1">Driver's License</p>
              <p className="font-medium text-gray-800">{profileData?.documents?.driversLicense || 'Not uploaded'}</p>
            </div>
            <div className="p-4 bg-gray-50 rounded-xl">
              <p className="text-xs text-gray-500 mb-1">Vehicle Insurance</p>
              <p className="font-medium text-gray-800">{profileData?.documents?.vehicleInsurance || 'Not uploaded'}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}