'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import Image from 'next/image';
import toast from 'react-hot-toast';
import axios from 'axios';

// Update with correct port if needed
const API_URL = `${process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:5003/api"}/staff`;

export default function OnboardingPage() {
    const router = useRouter();
    const { user, login } = useAuth();
    const [formData, setFormData] = useState({
        vehicleType: 'Motorcycle',
        vehicleModel: '',
        licensePlate: '',
        driversLicense: '',
        vehicleInsurance: ''
    });
    const [isLoading, setIsLoading] = useState(false);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!formData.vehicleModel || !formData.licensePlate || !formData.driversLicense || !formData.vehicleInsurance) {
            toast.error("Please fill in all fields");
            return;
        }

        if (!user?._id) {
            toast.error("User session not found. Please login again.");
            return;
        }

        setIsLoading(true);

        try {
            const response = await axios.put(`${API_URL}/complete-profile`, {
                ...formData,
                userId: user._id
            });

            toast.success("Profile completed successfully!");

            // Update local user state if needed, or just redirect
            // Assuming context executes a refresh or we just push to profile
            // Ideally we should update the context "user" object to have isProfileComplete: true
            // But for now, redirection works.

            router.push('/rider-dashboard');
        } catch (error: any) {
            console.error(error);
            toast.error(error.response?.data?.message || "Failed to complete profile");
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-4">
            <div className="w-full max-w-2xl bg-white rounded-2xl shadow-xl overflow-hidden">
                <div className="bg-yellow-500 p-6 text-center text-white">
                    <h1 className="text-3xl font-bold">Complete Your Profile</h1>
                    <p className="mt-2 text-yellow-100">Please provide your vehicle and document details to start delivering.</p>
                </div>

                <form onSubmit={handleSubmit} className="p-8 space-y-6">
                    {/* Vehicle Details Section */}
                    <div>
                        <h3 className="text-lg font-semibold text-gray-800 mb-4 pb-2 border-b">Vehicle Details</h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">Vehicle Type</label>
                                <select
                                    name="vehicleType"
                                    value={formData.vehicleType}
                                    onChange={handleChange}
                                    className="w-full p-3 bg-gray-50 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-500 focus:outline-none text-black"
                                >
                                    <option value="Motorcycle">Motorcycle</option>
                                    <option value="Scooter">Scooter</option>
                                    <option value="Bicycle">Bicycle</option>
                                    <option value="Car">Car</option>
                                </select>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">Vehicle Model</label>
                                <input
                                    type="text"
                                    name="vehicleModel"
                                    value={formData.vehicleModel}
                                    onChange={handleChange}
                                    placeholder="e.g. Honda CBR250RR"
                                    className="w-full p-3 bg-gray-50 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-500 focus:outline-none text-black"
                                />
                            </div>

                            <div className="md:col-span-2">
                                <label className="block text-sm font-medium text-gray-700 mb-2">License Plate</label>
                                <input
                                    type="text"
                                    name="licensePlate"
                                    value={formData.licensePlate}
                                    onChange={handleChange}
                                    placeholder="e.g. SR78901"
                                    className="w-full p-3 bg-gray-50 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-500 focus:outline-none text-black"
                                />
                            </div>
                        </div>
                    </div>

                    {/* Documents Section */}
                    <div>
                        <h3 className="text-lg font-semibold text-gray-800 mb-4 pb-2 border-b">Documents</h3>
                        <div className="grid grid-cols-1 gap-6">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">Driver's License Number</label>
                                <input
                                    type="text"
                                    name="driversLicense"
                                    value={formData.driversLicense}
                                    onChange={handleChange}
                                    placeholder="Enter your license number"
                                    className="w-full p-3 bg-gray-50 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-500 focus:outline-none text-black"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">Vehicle Insurance Number</label>
                                <input
                                    type="text"
                                    name="vehicleInsurance"
                                    value={formData.vehicleInsurance}
                                    onChange={handleChange}
                                    placeholder="Enter your insurance policy number"
                                    className="w-full p-3 bg-gray-50 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-500 focus:outline-none text-black"
                                />
                            </div>
                        </div>
                    </div>

                    <button
                        type="submit"
                        disabled={isLoading}
                        className="w-full bg-yellow-500 text-white font-bold text-lg py-4 rounded-xl hover:bg-yellow-600 transition shadow-md disabled:bg-gray-300 disabled:cursor-not-allowed"
                    >
                        {isLoading ? 'Saving...' : 'Complete Profile'}
                    </button>
                </form>
            </div>
        </div>
    );
}
