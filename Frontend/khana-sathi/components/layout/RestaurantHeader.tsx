'use client';

import React from 'react';
import Image from 'next/image';
import { useAuth } from '@/context/AuthContext';
import NotificationCenter from '../NotificationCenter';

const RestaurantHeader: React.FC = () => {
    const { user } = useAuth();

    return (
        <header className="bg-white shadow-sm border-b border-gray-200 px-8 py-4 flex items-center justify-between sticky top-0 z-30">
            <div>
                <h2 className="text-xl font-bold text-gray-800">Restaurant Portal</h2>
                <p className="text-xs text-gray-500">Managing Khana Sathi Partner</p>
            </div>

            <div className="flex items-center gap-6">
                {user && (
                    <div className="text-right hidden sm:block">
                        <p className="text-sm font-bold text-gray-900">{user.username}</p>
                        <p className="text-[10px] text-gray-500 uppercase">{user.role?.replace('_', ' ') || 'RESTAURANT'}</p>
                    </div>
                )}

                <NotificationCenter />

                <div className="w-10 h-10 rounded-full overflow-hidden ring-2 ring-red-100 shrink-0">
                    <Image
                        src={user?.profilePicture || `https://ui-avatars.com/api/?name=${user?.username || 'Admin'}&background=random`}
                        alt="Profile"
                        width={40}
                        height={40}
                        unoptimized
                        className="object-cover w-full h-full"
                    />
                </div>
            </div>
        </header>
    );
};

export default RestaurantHeader;
