"use client";

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { ShoppingCart, User as UserIcon, HelpCircle, Home, Users, Copy, ChevronDown } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { getMyGroupCarts, GroupCart } from '@/lib/groupCartService';
import NotificationCenter from '../NotificationCenter';
import toast from 'react-hot-toast';

const UserHeader: React.FC = () => {
    const { user } = useAuth();
    const [activeGCs, setActiveGCs] = useState<GroupCart[]>([]);
    const [showGCDropdown, setShowGCDropdown] = useState(false);

    useEffect(() => {
        let cancelled = false;

        const fetchNavState = async () => {
            if (!user) {
                if (!cancelled) {
                    setActiveGCs([]);
                }
                return;
            }

            if (user.role === 'child') {
                if (!cancelled) {
                    setActiveGCs([]);
                }
                return;
            }

            try {
                const res = await getMyGroupCarts();
                const payload = res.data;
                const carts = Array.isArray(payload?.data)
                    ? payload.data
                    : Array.isArray(payload as unknown)
                        ? (payload as unknown as GroupCart[])
                        : [];
                const active = (Array.isArray(carts) ? carts : []).filter(
                    (gc: GroupCart) => gc.status === 'open' || gc.status === 'locked' || gc.status === 'payment_pending'
                );
                if (!cancelled) {
                    setActiveGCs(active);
                }
            } catch {
                if (!cancelled) {
                    setActiveGCs([]);
                }
            }
        };

        fetchNavState();

        return () => {
            cancelled = true;
        };
    }, [user]);

    const copyCode = (code: string) => {
        navigator.clipboard.writeText(code);
        toast.success('Invite code copied!');
    };

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

                        {/* Group Order with active cart dropdown */}
                        {user?.role !== 'child' && <div className="relative">
                            <button
                                onClick={() => setShowGCDropdown(!showGCDropdown)}
                                className="flex items-center gap-2 text-gray-600 hover:text-gray-900 transition-colors"
                            >
                                <Users className="w-4 h-4" />
                                <span>Group Order</span>
                                {activeGCs.length > 0 && (
                                    <span className="w-5 h-5 bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center -ml-1">
                                        {activeGCs.length}
                                    </span>
                                )}
                                <ChevronDown className="w-3 h-3" />
                            </button>

                            {showGCDropdown && (
                                <>
                                    <div className="fixed inset-0 z-40" onClick={() => setShowGCDropdown(false)} />
                                    <div className="absolute top-full right-0 mt-2 w-72 bg-white rounded-xl shadow-lg border border-gray-100 z-50 py-2 overflow-hidden">
                                        {activeGCs.length > 0 ? (
                                            <>
                                                <p className="px-4 py-1.5 text-[10px] uppercase tracking-wider text-gray-400 font-semibold">Active Group Carts</p>
                                                {activeGCs.map((gc) => (
                                                    <div key={gc._id} className="px-4 py-2.5 hover:bg-gray-50 transition">
                                                        <Link
                                                            href={`/group-cart/${gc._id}`}
                                                            className="block"
                                                            onClick={() => setShowGCDropdown(false)}
                                                        >
                                                            <p className="text-sm font-semibold text-gray-800 truncate">{gc.name}</p>
                                                            <div className="flex items-center gap-2 mt-1">
                                                                <span className="text-[11px] font-mono bg-red-50 border border-red-100 text-red-600 px-1.5 py-0.5 rounded tracking-wider">
                                                                    {gc.inviteCode}
                                                                </span>
                                                                <button
                                                                    onClick={(e) => { e.preventDefault(); e.stopPropagation(); copyCode(gc.inviteCode); }}
                                                                    className="text-gray-300 hover:text-red-500 transition"
                                                                    title="Copy invite code"
                                                                >
                                                                    <Copy className="w-3 h-3" />
                                                                </button>
                                                                <span className="text-[11px] text-gray-400">
                                                                    {gc.members?.length || 1} member{(gc.members?.length || 1) > 1 ? 's' : ''}
                                                                </span>
                                                            </div>
                                                        </Link>
                                                    </div>
                                                ))}
                                                <div className="border-t border-gray-100 mt-1 pt-1">
                                                    <Link
                                                        href="/group-cart"
                                                        onClick={() => setShowGCDropdown(false)}
                                                        className="block px-4 py-2 text-xs text-center text-red-500 hover:bg-red-50 transition font-medium"
                                                    >
                                                        View all group carts →
                                                    </Link>
                                                </div>
                                            </>
                                        ) : (
                                            <div className="px-4 py-4 text-center">
                                                <p className="text-sm text-gray-500 mb-2">No active group carts</p>
                                                <Link
                                                    href="/group-cart"
                                                    onClick={() => setShowGCDropdown(false)}
                                                    className="inline-block text-xs text-red-500 hover:text-red-600 font-medium"
                                                >
                                                    Create or join one →
                                                </Link>
                                            </div>
                                        )}
                                    </div>
                                </>
                            )}
                        </div>}
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
                                unoptimized
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
