"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { useState } from "react";
import axios from "axios";
import toast from "react-hot-toast";
import {
    Home,
    UtensilsCrossed,
    ClipboardList,
    Tag,
    FileText,
    Users,
    Wallet,
    User,
    Settings,
    LogOut,
} from "lucide-react";
import NotificationCenter from "@/components/NotificationCenter";

const API_URL = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:5003/api";

const navItems = [
    { href: "/RM-Dashboard", icon: Home, label: "Dashboard" },
    { href: "/menu", icon: UtensilsCrossed, label: "Menu" },
    { href: "/orders-board", icon: ClipboardList, label: "Orders Board" },
    { href: "/offers", icon: Tag, label: "Offers" },
    { href: "/staff", icon: Users, label: "Staff" },
    { href: "/payments", icon: Wallet, label: "Payments" },
    { href: "/analytics", icon: FileText, label: "Analytics" },
    { href: "/rm-profile", icon: User, label: "Profile" },
];

export default function RestaurantSidebar() {
    const pathname = usePathname();
    const router = useRouter();
    const { user, logout } = useAuth();
    const [isLoggingOut, setIsLoggingOut] = useState(false);

    const handleLogout = async () => {
        setIsLoggingOut(true);
        try {
            if (user?._id) {
                await axios.post(`${API_URL}/auth/logout`, { userId: user._id });
            }
        } catch (error) {
            console.error("Logout error", error);
        } finally {
            logout();
            toast.success("Logged out successfully");
            router.push("/login");
        }
    };

    return (
        <aside className="w-64 bg-white shadow-lg flex flex-col h-screen sticky top-0">
            <div className="p-6 border-b border-gray-200">
                <div className="flex items-center gap-3 mb-8">
                    <Image src="/logo.png" alt="KhanaSathi" width={40} height={40} className="object-contain" />
                    <h1 className="text-xl font-bold text-red-600 flex-1">KhanaSathi</h1>
                    <NotificationCenter />
                </div>

                <nav className="space-y-2">
                    {navItems.map((item) => {
                        const isActive = pathname === item.href ||
                            (item.href !== "/RM-Dashboard" && pathname?.startsWith(item.href));
                        return (
                            <Link
                                key={item.href}
                                href={item.href}
                                className={`flex items-center gap-4 px-4 py-3 rounded-lg font-medium transition ${isActive
                                        ? "bg-red-500 text-white"
                                        : "text-gray-700 hover:bg-gray-100"
                                    }`}
                            >
                                <item.icon className="w-5 h-5" />
                                {item.label}
                            </Link>
                        );
                    })}
                </nav>
            </div>

            <div className="mt-auto p-6 space-y-3">
                <Link 
                    href="/settings" 
                    className={`flex items-center gap-4 px-4 py-3 rounded-lg transition ${
                        pathname === '/settings' 
                            ? "bg-red-500 text-white" 
                            : "text-gray-700 hover:bg-gray-100"
                    }`}
                >
                    <Settings className="w-5 h-5" />
                    Settings
                </Link>
                <button
                    onClick={handleLogout}
                    disabled={isLoggingOut}
                    className="w-full flex items-center gap-4 px-4 py-3 text-red-600 hover:bg-red-50 rounded-lg transition disabled:opacity-50"
                >
                    <LogOut className="w-5 h-5" />
                    {isLoggingOut ? "Logging out..." : "Log Out"}
                </button>
            </div>
        </aside>
    );
}
