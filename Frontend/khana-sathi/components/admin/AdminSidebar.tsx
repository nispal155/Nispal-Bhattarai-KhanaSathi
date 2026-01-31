"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, Store, FileText, Users, Shield, Settings, LogOut } from "lucide-react";
import { logout } from "@/lib/authService";

export default function AdminSidebar() {
    const pathname = usePathname();

    const navItems = [
        { name: "Home", href: "/admin-dashboard", icon: Home },
        { name: "Restaurants", href: "/Restaurants", icon: Store },
        { name: "Reports", href: "/Reports", icon: FileText },
        { name: "Delivery Staff", href: "/delivery-staff", icon: Users },
        { name: "Parental Control", href: "/parental-control", icon: Shield },
    ];

    return (
        <aside className="w-64 bg-white shadow-lg flex flex-col h-screen sticky top-0">
            {/* Top Section */}
            <div className="p-6 border-b border-gray-200">
                <div className="flex items-center gap-3 mb-10">
                    <Image
                        src="/logo.png"
                        alt="KhanaSathi"
                        width={40}
                        height={40}
                        className="object-contain"
                    />
                    <div>
                        <h1 className="text-xl font-bold text-red-600">KhanaSathi</h1>
                        <p className="text-sm text-gray-600">Admin</p>
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
                        href="#"
                        className="flex items-center gap-4 px-4 py-3 text-gray-700 hover:bg-gray-100 rounded-lg transition"
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
