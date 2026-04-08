'use client';

import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';
import { useState, useEffect, useCallback } from 'react';
import {
    ArrowLeft,
    Wallet,
    TrendingUp,
    Banknote,
    Calendar,
    Loader2,
    Clock,
    CheckCircle
} from 'lucide-react';
import toast from 'react-hot-toast';
import {
    createRiderPaymentClaim,
    getRiderClaimSummary,
    getRiderEarnings,
    getRiderPaymentClaims,
    type EarningsData,
    type RiderClaimSummary,
    type RiderPaymentClaim
} from '@/lib/riderService';

const formatDateLabel = (value: string | null | undefined) => {
    if (!value) {
        return 'Not available';
    }

    return new Date(value).toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric'
    });
};

const getClaimStatusClasses = (status: RiderPaymentClaim['status']) => {
    switch (status) {
        case 'paid':
            return 'bg-green-100 text-green-700';
        case 'approved':
            return 'bg-blue-100 text-blue-700';
        case 'rejected':
            return 'bg-red-100 text-red-700';
        default:
            return 'bg-amber-100 text-amber-700';
    }
};

export default function EarningsPage() {
    const { user, isLoading: authLoading } = useAuth();
    const router = useRouter();
    const [loading, setLoading] = useState(true);
    const [claimingPeriod, setClaimingPeriod] = useState<'daily' | 'weekly' | null>(null);
    const [earnings, setEarnings] = useState<EarningsData | null>(null);
    const [claimSummary, setClaimSummary] = useState<RiderClaimSummary | null>(null);
    const [claims, setClaims] = useState<RiderPaymentClaim[]>([]);
    const [claimStatusFilter, setClaimStatusFilter] = useState('');
    const [claimTypeFilter, setClaimTypeFilter] = useState('');
    const [referenceDate, setReferenceDate] = useState(() => new Date().toISOString().split('T')[0]);

    const fetchPageData = useCallback(async () => {
        if (!user?._id) return;

        try {
            setLoading(true);

            const [earningsResponse, summaryResponse, claimsResponse] = await Promise.all([
                getRiderEarnings(user._id),
                getRiderClaimSummary(referenceDate),
                getRiderPaymentClaims({
                    status: claimStatusFilter ? claimStatusFilter as 'pending' | 'approved' | 'paid' | 'rejected' | 'active' : undefined,
                    periodType: claimTypeFilter ? claimTypeFilter as 'daily' | 'weekly' : undefined
                })
            ]);

            if (earningsResponse.error) {
                toast.error(earningsResponse.error);
            } else {
                setEarnings(earningsResponse.data?.data || null);
            }

            if (summaryResponse.error) {
                toast.error(summaryResponse.error);
            } else {
                setClaimSummary(summaryResponse.data?.data || null);
            }

            if (claimsResponse.error) {
                toast.error(claimsResponse.error);
            } else {
                setClaims(claimsResponse.data?.data || []);
            }
        } catch (error) {
            console.error('Error fetching earnings page data:', error);
            toast.error('Failed to load rider earnings data');
        } finally {
            setLoading(false);
        }
    }, [claimStatusFilter, claimTypeFilter, referenceDate, user?._id]);

    useEffect(() => {
        if (authLoading) return;

        if (!user) {
            router.push('/login');
            return;
        }

        fetchPageData();
    }, [authLoading, fetchPageData, router, user]);

    const handleCreateClaim = async (periodType: 'daily' | 'weekly') => {
        try {
            setClaimingPeriod(periodType);
            const response = await createRiderPaymentClaim({
                periodType,
                referenceDate
            });

            if (response.error) {
                toast.error(response.error);
                return;
            }

            toast.success(response.data?.message || 'Payment claim submitted successfully');
            await fetchPageData();
        } catch (error) {
            console.error('Claim creation error:', error);
            toast.error('Failed to submit payment claim');
        } finally {
            setClaimingPeriod(null);
        }
    };

    const pendingClaimsTotal = claims
        .filter((claim) => claim.status === 'pending')
        .reduce((sum, claim) => sum + claim.amount, 0);

    const claimCards = claimSummary ? [claimSummary.daily, claimSummary.weekly] : [];

    if (authLoading || loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50">
                <Loader2 className="w-10 h-10 text-orange-500 animate-spin" />
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50 p-6">
            <div className="max-w-6xl mx-auto">
                <div className="flex items-center gap-4 mb-8">
                    <button
                        onClick={() => router.push('/rider-dashboard')}
                        className="p-2 hover:bg-gray-100 rounded-full transition"
                    >
                        <ArrowLeft className="w-6 h-6 text-gray-600" />
                    </button>
                    <div>
                        <h1 className="text-2xl font-bold text-gray-800">My Earnings</h1>
                        <p className="text-gray-500">Track your income and submit daily or weekly payment claims</p>
                    </div>
                </div>

                <div className="bg-gradient-to-r from-green-500 to-emerald-600 rounded-2xl shadow-lg p-8 mb-6 text-white">
                    <p className="text-green-100 mb-2">Total Earnings</p>
                    <p className="text-5xl font-bold">Rs. {earnings?.total.earnings || 0}</p>
                    <div className="flex flex-wrap items-center gap-6 mt-4 text-green-100 text-sm">
                        <div className="flex items-center gap-2">
                            <TrendingUp className="w-4 h-4" />
                            <span>{earnings?.total.deliveries || 0} total deliveries</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <Clock className="w-4 h-4" />
                            <span>Pending claims: Rs. {pendingClaimsTotal}</span>
                        </div>
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                    <div className="bg-white p-6 rounded-xl shadow-sm">
                        <div className="flex items-center justify-between mb-2">
                            <p className="text-gray-500 text-sm">Today</p>
                            <Banknote className="w-5 h-5 text-green-500" />
                        </div>
                        <p className="text-2xl font-bold text-gray-800">Rs. {earnings?.today.earnings || 0}</p>
                        <p className="text-xs text-gray-400 mt-1">{earnings?.today.deliveries || 0} deliveries</p>
                    </div>
                    <div className="bg-white p-6 rounded-xl shadow-sm">
                        <div className="flex items-center justify-between mb-2">
                            <p className="text-gray-500 text-sm">This Week</p>
                            <Calendar className="w-5 h-5 text-blue-500" />
                        </div>
                        <p className="text-2xl font-bold text-gray-800">Rs. {earnings?.week.earnings || 0}</p>
                        <p className="text-xs text-gray-400 mt-1">{earnings?.week.deliveries || 0} deliveries</p>
                    </div>
                    <div className="bg-white p-6 rounded-xl shadow-sm">
                        <div className="flex items-center justify-between mb-2">
                            <p className="text-gray-500 text-sm">This Month</p>
                            <Wallet className="w-5 h-5 text-orange-500" />
                        </div>
                        <p className="text-2xl font-bold text-gray-800">Rs. {earnings?.month.earnings || 0}</p>
                        <p className="text-xs text-gray-400 mt-1">{earnings?.month.deliveries || 0} deliveries</p>
                    </div>
                </div>

                <div className="bg-white rounded-2xl shadow-sm p-6 mb-6">
                    <div className="flex flex-col gap-4 mb-6 lg:flex-row lg:items-center lg:justify-between">
                        <div>
                            <h2 className="text-lg font-bold text-gray-800">Payment Claims</h2>
                            <p className="text-sm text-gray-500">Claims are calculated at Rs. 50 per delivered order. Select a date to claim that day or that week.</p>
                        </div>
                        <div className="flex items-center gap-3">
                            <label className="text-sm font-medium text-gray-600" htmlFor="claim-reference-date">Reference Date</label>
                            <input
                                id="claim-reference-date"
                                type="date"
                                value={referenceDate}
                                onChange={(event) => setReferenceDate(event.target.value)}
                                className="rounded-lg border border-gray-200 px-3 py-2 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-orange-500"
                            />
                        </div>
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                        {claimCards.map((summary) => {
                            const claimDisabled = summary.amount <= 0 || claimingPeriod !== null;
                            const isSubmittingThisCard = claimingPeriod === summary.periodType;

                            return (
                                <div key={summary.periodType} className="rounded-2xl border border-gray-200 p-5 bg-gray-50">
                                    <div className="flex items-start justify-between gap-4">
                                        <div>
                                            <p className="text-sm font-semibold uppercase tracking-wide text-orange-600">{summary.periodType}</p>
                                            <h3 className="text-xl font-bold text-gray-900 mt-1">{summary.periodLabel}</h3>
                                            <p className="text-sm text-gray-500 mt-1">
                                                {summary.deliveries} claimable deliveries, {summary.claimedDeliveries} already claimed
                                            </p>
                                        </div>
                                        {summary.existingClaim && (
                                            <span className={`px-3 py-1 rounded-full text-xs font-semibold ${getClaimStatusClasses(summary.existingClaim.status)}`}>
                                                Latest {summary.existingClaim.status}
                                            </span>
                                        )}
                                    </div>

                                    <div className="grid grid-cols-2 gap-3 mt-4">
                                        <div className="rounded-xl bg-white p-4 border border-gray-100">
                                            <p className="text-sm text-gray-500">Claimable now</p>
                                            <p className="text-2xl font-bold text-gray-900 mt-1">Rs. {summary.amount}</p>
                                        </div>
                                        <div className="rounded-xl bg-white p-4 border border-gray-100">
                                            <p className="text-sm text-gray-500">Already claimed</p>
                                            <p className="text-2xl font-bold text-gray-900 mt-1">Rs. {summary.claimedAmount}</p>
                                        </div>
                                    </div>

                                    <button
                                        onClick={() => handleCreateClaim(summary.periodType)}
                                        disabled={claimDisabled}
                                        className="mt-5 inline-flex items-center justify-center gap-2 rounded-xl bg-orange-500 px-5 py-3 text-sm font-semibold text-white transition hover:bg-orange-600 disabled:cursor-not-allowed disabled:bg-gray-300"
                                    >
                                        {isSubmittingThisCard && <Loader2 className="w-4 h-4 animate-spin" />}
                                        {summary.amount > 0 ? `Claim ${summary.periodType}` : 'No claimable amount'}
                                    </button>
                                </div>
                            );
                        })}
                    </div>
                </div>

                <div className="bg-white rounded-2xl shadow-sm p-6 mb-6">
                    <div className="flex flex-col gap-4 mb-6 lg:flex-row lg:items-center lg:justify-between">
                        <div>
                            <h3 className="text-lg font-bold text-gray-800">Claim History</h3>
                            <p className="text-sm text-gray-500">Filter by claim type or status to review rider payment requests.</p>
                        </div>
                        <div className="flex flex-col gap-3 sm:flex-row">
                            <select
                                value={claimTypeFilter}
                                onChange={(event) => setClaimTypeFilter(event.target.value)}
                                className="px-4 py-2 border border-gray-200 rounded-lg text-gray-700 focus:ring-2 focus:ring-orange-500 focus:outline-none"
                            >
                                <option value="">All claim types</option>
                                <option value="daily">Daily</option>
                                <option value="weekly">Weekly</option>
                            </select>
                            <select
                                value={claimStatusFilter}
                                onChange={(event) => setClaimStatusFilter(event.target.value)}
                                className="px-4 py-2 border border-gray-200 rounded-lg text-gray-700 focus:ring-2 focus:ring-orange-500 focus:outline-none"
                            >
                                <option value="">All statuses</option>
                                <option value="pending">Pending</option>
                                <option value="approved">Approved</option>
                                <option value="paid">Paid</option>
                                <option value="rejected">Rejected</option>
                            </select>
                        </div>
                    </div>

                    {claims.length === 0 ? (
                        <div className="text-center py-12 border-2 border-dashed border-gray-200 rounded-xl">
                            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                                <Wallet className="w-8 h-8 text-gray-300" />
                            </div>
                            <p className="text-gray-400 text-lg">No payment claims yet</p>
                            <p className="text-gray-300 text-sm mt-1">Your daily and weekly claim submissions will appear here.</p>
                        </div>
                    ) : (
                        <div className="space-y-4">
                            {claims.map((claim) => (
                                <div key={claim._id} className="rounded-2xl border border-gray-100 p-5 hover:bg-gray-50 transition">
                                    <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                                        <div>
                                            <div className="flex flex-wrap items-center gap-3">
                                                <h4 className="text-lg font-semibold text-gray-900">{claim.periodLabel}</h4>
                                                <span className="rounded-full bg-orange-100 px-3 py-1 text-xs font-semibold uppercase text-orange-700">
                                                    {claim.periodType}
                                                </span>
                                                <span className={`rounded-full px-3 py-1 text-xs font-semibold ${getClaimStatusClasses(claim.status)}`}>
                                                    {claim.status}
                                                </span>
                                            </div>
                                            <p className="text-sm text-gray-500 mt-2">
                                                Claimed on {formatDateLabel(claim.claimedAt)} for {claim.deliveriesCount} deliveries
                                            </p>
                                            {claim.adminNote && (
                                                <p className="text-sm text-gray-600 mt-2">Note: {claim.adminNote}</p>
                                            )}
                                        </div>

                                        <div className="grid grid-cols-2 gap-3 lg:min-w-[260px]">
                                            <div className="rounded-xl bg-gray-50 px-4 py-3">
                                                <p className="text-xs uppercase tracking-wide text-gray-500">Amount</p>
                                                <p className="mt-1 text-xl font-bold text-gray-900">Rs. {claim.amount}</p>
                                            </div>
                                            <div className="rounded-xl bg-gray-50 px-4 py-3">
                                                <p className="text-xs uppercase tracking-wide text-gray-500">Processed</p>
                                                <p className="mt-1 text-sm font-semibold text-gray-900">
                                                    {claim.processedAt ? formatDateLabel(claim.processedAt) : 'Awaiting review'}
                                                </p>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                <div className="bg-white rounded-2xl shadow-sm p-6">
                    <div className="flex items-center justify-between mb-6">
                        <h3 className="text-lg font-bold text-gray-800">Daily Breakdown (Last 7 Days)</h3>
                        <div className="flex items-center gap-2 text-sm text-green-600 font-medium">
                            <CheckCircle className="w-4 h-4" />
                            <span>Updated from delivered orders</span>
                        </div>
                    </div>

                    {earnings?.dailyBreakdown && earnings.dailyBreakdown.length > 0 ? (
                        <div className="space-y-3">
                            {earnings.dailyBreakdown.map((day) => (
                                <div key={day.date} className="flex items-center justify-between p-4 bg-gray-50 rounded-xl">
                                    <div>
                                        <p className="font-medium text-gray-800">
                                            {new Date(day.date).toLocaleDateString('en-US', {
                                                weekday: 'short',
                                                month: 'short',
                                                day: 'numeric'
                                            })}
                                        </p>
                                        <p className="text-sm text-gray-500">{day.deliveries} deliveries</p>
                                    </div>
                                    <p className="text-lg font-bold text-green-600">Rs. {day.earnings}</p>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="text-center py-12 border-2 border-dashed border-gray-200 rounded-xl">
                            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                                <Wallet className="w-8 h-8 text-gray-300" />
                            </div>
                            <p className="text-gray-400 text-lg">No earnings data yet</p>
                            <p className="text-gray-300 text-sm mt-1">Complete deliveries to see your earnings and claimable payments.</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
