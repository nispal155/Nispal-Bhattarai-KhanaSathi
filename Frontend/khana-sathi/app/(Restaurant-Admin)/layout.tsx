'use client';

import React from 'react';
import RestaurantSidebar from '@/components/RestaurantSidebar';
import RestaurantHeader from '@/components/layout/RestaurantHeader';

export default function RestaurantLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <div className="flex h-screen bg-gray-50 overflow-hidden">
            <RestaurantSidebar />
            <div className="flex-1 flex flex-col min-w-0 overflow-auto">
                <RestaurantHeader />
                <main className="flex-1">
                    {children}
                </main>
            </div>
        </div>
    );
}
