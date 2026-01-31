'use client';

import Link from 'next/link';
import Image from 'next/image';
import { useAuth } from '@/context/AuthContext';

export default function WaitingApprovalPage() {
    const { logout } = useAuth();

    return (
        <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-6">
            <div className="w-full max-w-md bg-white rounded-3xl shadow-2xl p-10 text-center">
                <div className="relative w-32 h-32 mx-auto mb-8 bg-yellow-100 rounded-full flex items-center justify-center">
                    <svg className="w-16 h-16 text-yellow-500 animate-pulse" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                    </svg>
                </div>

                <h1 className="text-3xl font-bold text-gray-800 mb-4">Under Review</h1>

                <p className="text-gray-600 mb-8 leading-relaxed">
                    Thank you for submitting your restaurant details! Our administrator is currently reviewing your documents.
                    We will notify you once your account has been approved.
                </p>

                <div className="space-y-4">
                    <div className="p-4 bg-yellow-50 rounded-xl text-yellow-800 text-sm font-medium">
                        Standard review time: 24-48 hours
                    </div>

                    <button
                        onClick={() => logout()}
                        className="w-full py-4 px-6 bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold rounded-2xl transition duration-200"
                    >
                        Log Out
                    </button>

                    <Link href="/" className="block text-yellow-600 font-semibold hover:underline mt-4">
                        Back to Home
                    </Link>
                </div>
            </div>

            <p className="mt-8 text-gray-400 text-sm">
                Need help? Contact support@khanasathi.com
            </p>
        </div>
    );
}
