'use client';

import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';
import { Clock, ShieldAlert, LogOut, ArrowLeft } from 'lucide-react';

export default function WaitingApprovalPage() {
    const { logout } = useAuth();

    return (
        <div className="flex flex-col items-center justify-center p-8 min-h-[70vh]">
            <div className="w-full max-w-md bg-white rounded-[2.5rem] shadow-xl shadow-gray-100 border border-gray-100 p-10 text-center relative overflow-hidden">
                {/* Accent background element */}
                <div className="absolute -top-24 -right-24 w-48 h-48 bg-yellow-50 rounded-full blur-3xl -z-10" />
                <div className="absolute -bottom-24 -left-24 w-48 h-48 bg-orange-50 rounded-full blur-3xl -z-10" />

                <div className="relative w-24 h-24 mx-auto mb-8 bg-gradient-to-br from-yellow-400 to-orange-500 rounded-3xl flex items-center justify-center shadow-lg shadow-yellow-200 rotate-3">
                    <Clock className="w-12 h-12 text-white animate-pulse" />
                </div>

                <h1 className="text-3xl font-black text-gray-800 mb-4 tracking-tight">Credentials Under Review</h1>

                <p className="text-gray-500 mb-8 leading-relaxed font-medium">
                    Our compliance team is currently verifying your establishment's documentation.
                    You will receive partial access to your dashboard once approved.
                </p>

                <div className="space-y-4">
                    <div className="p-4 bg-orange-50 border border-orange-100 rounded-2xl flex items-center gap-3">
                        <ShieldAlert className="w-5 h-5 text-orange-500 shrink-0" />
                        <p className="text-left text-[10px] font-black text-orange-700 uppercase tracking-widest leading-tight">
                            Review Cycle: 24 - 48 Hours
                        </p>
                    </div>

                    <button
                        onClick={() => logout()}
                        className="w-full py-4 px-6 bg-gray-50 hover:bg-gray-100 text-gray-500 font-black uppercase text-xs tracking-widest rounded-2xl transition duration-300 flex items-center justify-center gap-2"
                    >
                        <LogOut className="w-4 h-4" />
                        Terminate Session
                    </button>

                    <Link
                        href="/"
                        className="flex items-center justify-center gap-2 text-orange-600 font-black uppercase text-[10px] tracking-[0.2em] hover:text-orange-700 transition px-4 py-2"
                    >
                        <ArrowLeft className="w-3 h-3" />
                        Dashboard Home
                    </Link>
                </div>
            </div>

            <p className="mt-10 text-gray-400 text-xs font-bold uppercase tracking-widest">
                Support: help@khanasathi.com
            </p>
        </div>
    );
}
