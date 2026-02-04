"use client";

import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { ShoppingCart, User as UserIcon, HelpCircle, Home } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import NotificationCenter from '../NotificationCenter';

const UserHeader: React.FC = () => {
    const { user } = useAuth();

    return (
        <nav className="bg-white border-b border-gray-200 sticky top-0 z-50">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex justify-between items-center h-16">
                    {/* Logo */}
                    <Link href="/" className="flex items-center gap-2">
                        <div className="w-10 h-10 bg-red-500 rounded-full flex items-center justify-center">
                            <span className="text-white text-xl">🍜</span>
                        </div>
                        <div>
                            <span className="text-red-500 font-bold text-lg">Khana Sathi</span>
                        </div>
                    </Link>

                    {/* Navigation Links */}
                    <div className="hidden md:flex items-center gap-6">
                        <Link href="/browse-restaurants" className="flex items-center gap-2 text-gray-600 hover:text-gray-900 transition-colors">
                            <Home className="w-4 h-4" /> <span>Home</span>
                        </Link>
                        <Link href="/cart" className="flex items-center gap-2 text-gray-600 hover:text-gray-900 transition-colors">
                            <ShoppingCart className="w-4 h-4" /> <span>Cart</span>
                        </Link>
                        <Link href="/user-profile" className="flex items-center gap-2 text-gray-600 hover:text-gray-900 transition-colors">
                            <UserIcon className="w-4 h-4" /> <span>Profile</span>
                        </Link>
                        <Link href="/support" className="flex items-center gap-2 text-gray-600 hover:text-gray-900 transition-colors">
                            <HelpCircle className="w-4 h-4" /> <span>Support</span>
                        </Link>
                    </div>

                    {/* Right Side Tools */}
                    <div className="flex items-center gap-2 md:gap-4">
                        {user && <span className="hidden sm:inline text-sm text-gray-700 font-medium">Hi, {user.username}</span>}

                        <NotificationCenter />

                        <div className="w-9 h-9 md:w-10 md:h-10 rounded-full bg-pink-100 border border-gray-100 overflow-hidden shrink-0">
                            <Image
                                src={user?.profilePicture || `https://ui-avatars.com/api/?name=${user?.username || 'User'}&background=random`}
                                alt="Profile"
                                width={40}
                                height={40}
                                className="object-cover w-full h-full"
                                onError={(e) => {
                                    const target = e.target as HTMLImageElement;
                                    target.src = `https://ui-avatars.com/api/?name=${user?.username || 'User'}&background=random`;
                                }}
                            />
                        </div>
                    </div>
                </div>
            </div>
        </nav>
    );
};

export default UserHeader;
