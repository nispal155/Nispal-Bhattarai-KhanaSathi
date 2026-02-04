"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, Store, FileText, Users, Shield, Settings, LogOut, User, Layout, Package, Tag, MessageSquare } from "lucide-react";
import { logout } from "@/lib/authService";
import { useAuth } from "@/context/AuthContext";

export default function AdminSidebar() {
    const pathname = usePathname();
    const { user } = useAuth();

    const navItems = [
        { name: "Dashboard", href: "/admin-dashboard", icon: Home },
        { name: "Users", href: "/users", icon: Users },
        { name: "Orders", href: "/orders", icon: Package },
        { name: "Restaurants", href: "/Restaurants", icon: Store },
        { name: "Promos", href: "/promos", icon: Tag },
        { name: "Feedback", href: "/feedback", icon: MessageSquare },
        { name: "Reports", href: "/Reports", icon: FileText },
        { name: "Delivery Staff", href: "/delivery-staff", icon: Users },
        { name: "Content", href: "/admin-content", icon: Layout },
        { name: "Parental Control", href: "/parental-control", icon: Shield },
        { name: "Profile", href: "/admin-profile", icon: User },
    ];

    return (
        <aside className="w-64 bg-white shadow-lg flex flex-col h-screen sticky top-0">
            {/* Top Section */}
            <div className="p-6 border-b border-gray-200">
                <div className="flex items-center gap-3 mb-10 p-2 bg-red-50 rounded-2xl border border-red-100">
                    <div className="w-12 h-12 rounded-xl overflow-hidden flex-shrink-0 bg-white border border-red-200">
                        <Image
                            src={user?.profilePicture || `https://ui-avatars.com/api/?name=${user?.username || 'Admin'}&background=random`}
                            alt="Admin"
                            width={48}
                            height={48}
                            className="object-cover w-full h-full"
                            onError={(e) => {
                                const target = e.target as HTMLImageElement;
                                target.src = `https://ui-avatars.com/api/?name=${user?.username || 'Admin'}&background=random`;
                            }}
                        />
                    </div>
                    <div>
                        <h1 className="text-lg font-bold text-red-600 leading-tight">KhanaSathi</h1>
                        <p className="text-xs text-gray-600 font-medium line-clamp-1">{user?.username || "Admin"}</p>
                    </div>
                </div>

                <nav className="space-y-2">
                    {navItems.map((item) => {
                        const Icon = item.icon;
                        const isActive = pathname === item.href;
                        return (
                            <Link
                                key={item.href}
                                href={item.href}
                                className={`flex items-center gap-4 px-4 py-3 rounded-lg font-medium transition ${isActive
                                    ? "bg-red-500 text-white shadow-sm"
                                    : "text-gray-700 hover:bg-gray-100"
                                    }`}
                            >
                                <Icon className="w-5 h-5" />
                                {item.name}
                            </Link>
                        );
                    })}
                </nav>
            </div>

            {/* Bottom Links */}
            <div className="mt-auto p-6 border-t border-gray-200">
                <div className="space-y-3">
                    <Link
                        href="/admin-settings"
                        className={`flex items-center gap-4 px-4 py-3 rounded-lg font-medium transition ${pathname === "/admin-settings"
                            ? "bg-red-500 text-white shadow-sm"
                            : "text-gray-700 hover:bg-gray-100"
                            }`}
                    >
                        <Settings className="w-5 h-5" />
                        Settings
                    </Link>
                    <button
                        onClick={logout}
                        className="w-full flex items-center gap-4 px-4 py-3 text-red-600 hover:bg-red-50 rounded-lg transition"
                    >
                        <LogOut className="w-5 h-5" />
                        Logout
                    </button>
                </div>
            </div>
        </aside>
    );
}
