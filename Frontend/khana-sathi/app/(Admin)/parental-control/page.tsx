"use client";

import AdminSidebar from "@/components/admin/AdminSidebar";
import { Shield, Clock } from "lucide-react";

export default function ParentalControl() {
  return (
    <div className="min-h-screen bg-gray-50 flex">
      <AdminSidebar />

      <div className="flex-1 overflow-auto">
        <header className="bg-white shadow-sm border-b border-gray-200 px-8 py-6">
          <h2 className="text-3xl font-bold text-gray-900">Parental Control</h2>
        </header>

        <div className="flex-1 flex items-center justify-center p-8 min-h-[70vh]">
          <div className="text-center max-w-md">
            <div className="w-24 h-24 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <Shield className="w-12 h-12 text-red-500" />
            </div>
            <h3 className="text-2xl font-bold text-gray-900 mb-3">Coming Soon</h3>
            <p className="text-gray-500 mb-6">
              The Parental Control feature is currently under development. 
              This will allow parents to monitor and manage their children&apos;s ordering activities.
            </p>
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-yellow-50 text-yellow-700 rounded-full text-sm font-medium">
              <Clock className="w-4 h-4" />
              Under Development
            </div>
          </div>
        </div>

        <footer className="text-center text-gray-500 text-sm py-6 border-t border-gray-200">
          © 2025 Khana Sathi Admin. All rights reserved.
        </footer>
      </div>
    </div>
  );
}