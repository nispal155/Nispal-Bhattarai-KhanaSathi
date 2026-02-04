'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import AdminSidebar from '@/components/admin/AdminSidebar';
import { getAllComplaints, getComplaintStats, updateComplaintStatus, Complaint } from '@/lib/complaintService';
import toast from 'react-hot-toast';
import { MessageSquare, Loader2, AlertCircle, CheckCircle, Clock, X, ChevronRight } from 'lucide-react';

interface ComplaintStats {
    total: number;
    open: number;
    inProgress: number;
    resolved: number;
    closed: number;
    byType: Array<{ _id: string; count: number }>;
}

const TYPE_LABELS: Record<string, string> = {
    order_issue: 'Order Issue',
    delivery_issue: 'Delivery Issue',
    food_quality: 'Food Quality',
    payment_issue: 'Payment Issue',
    app_bug: 'App Bug',
    other: 'Other'
};

const STATUS_STYLES: Record<string, { bg: string; icon: React.ReactNode }> = {
    open: { bg: 'bg-red-100 text-red-700', icon: <AlertCircle className="w-4 h-4" /> },
    in_progress: { bg: 'bg-yellow-100 text-yellow-700', icon: <Clock className="w-4 h-4" /> },
    resolved: { bg: 'bg-green-100 text-green-700', icon: <CheckCircle className="w-4 h-4" /> },
    closed: { bg: 'bg-gray-100 text-gray-700', icon: <CheckCircle className="w-4 h-4" /> }
};

const PRIORITY_STYLES: Record<string, string> = {
    low: 'bg-gray-100 text-gray-600',
    medium: 'bg-blue-100 text-blue-600',
    high: 'bg-orange-100 text-orange-600',
    urgent: 'bg-red-100 text-red-600'
};

export default function FeedbackPage() {
    const [complaints, setComplaints] = useState<Complaint[]>([]);
    const [stats, setStats] = useState<ComplaintStats | null>(null);
    const [loading, setLoading] = useState(true);
    const [statusFilter, setStatusFilter] = useState('');
    const [typeFilter, setTypeFilter] = useState('');
    const [currentPage, setCurrentPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [selectedComplaint, setSelectedComplaint] = useState<Complaint | null>(null);
    const [resolution, setResolution] = useState('');
    const [updating, setUpdating] = useState(false);

    useEffect(() => {
        fetchData();
    }, [statusFilter, typeFilter, currentPage]);

    const fetchData = async () => {
        setLoading(true);
        try {
            const [complaintsRes, statsRes] = await Promise.all([
                getAllComplaints({ status: statusFilter || undefined, type: typeFilter || undefined, page: currentPage, limit: 15 }),
                getComplaintStats()
            ]);

            if (complaintsRes.data?.success) {
                setComplaints(complaintsRes.data.data);
                setTotalPages(complaintsRes.data.pages);
            }
            if (statsRes.data?.success) {
                setStats(statsRes.data.data);
            }
        } catch (error) {
            toast.error('Failed to fetch complaints');
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    const handleStatusUpdate = async (id: string, status: string, note?: string) => {
        setUpdating(true);
        try {
            await updateComplaintStatus(id, { status, note, resolution: resolution || undefined });
            toast.success('Complaint updated');
            setSelectedComplaint(null);
            setResolution('');
            fetchData();
        } catch {
            toast.error('Failed to update complaint');
        } finally {
            setUpdating(false);
        }
    };

    return (
        <div className="min-h-screen bg-gray-50 flex">
            <AdminSidebar />
            <main className="flex-1 p-8 overflow-auto">
                <header className="mb-8">
                    <h2 className="text-3xl font-bold text-gray-800">Feedback & Complaints</h2>
                    <p className="text-gray-500 mt-2">Manage user feedback and resolve complaints</p>
                </header>

                {/* Stats Cards */}
                {stats && (
                    <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-8">
                        <div className="bg-white rounded-xl p-4 border border-gray-100 shadow-sm">
                            <p className="text-sm text-gray-500">Total</p>
                            <p className="text-2xl font-bold text-gray-800">{stats.total}</p>
                        </div>
                        <div className="bg-white rounded-xl p-4 border border-gray-100 shadow-sm">
                            <p className="text-sm text-gray-500">Open</p>
                            <p className="text-2xl font-bold text-red-600">{stats.open}</p>
                        </div>
                        <div className="bg-white rounded-xl p-4 border border-gray-100 shadow-sm">
                            <p className="text-sm text-gray-500">In Progress</p>
                            <p className="text-2xl font-bold text-yellow-600">{stats.inProgress}</p>
                        </div>
                        <div className="bg-white rounded-xl p-4 border border-gray-100 shadow-sm">
                            <p className="text-sm text-gray-500">Resolved</p>
                            <p className="text-2xl font-bold text-green-600">{stats.resolved}</p>
                        </div>
                        <div className="bg-white rounded-xl p-4 border border-gray-100 shadow-sm">
                            <p className="text-sm text-gray-500">Closed</p>
                            <p className="text-2xl font-bold text-gray-600">{stats.closed}</p>
                        </div>
                    </div>
                )}

                {/* Filters */}
                <div className="flex flex-col md:flex-row gap-4 mb-6">
                    <select
                        value={statusFilter}
                        onChange={(e) => { setStatusFilter(e.target.value); setCurrentPage(1); }}
                        className="px-4 py-3 bg-white border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-red-500 text-gray-800"
                    >
                        <option value="">All Status</option>
                        <option value="open">Open</option>
                        <option value="in_progress">In Progress</option>
                        <option value="resolved">Resolved</option>
                        <option value="closed">Closed</option>
                    </select>
                    <select
                        value={typeFilter}
                        onChange={(e) => { setTypeFilter(e.target.value); setCurrentPage(1); }}
                        className="px-4 py-3 bg-white border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-red-500 text-gray-800"
                    >
                        <option value="">All Types</option>
                        <option value="order_issue">Order Issue</option>
                        <option value="delivery_issue">Delivery Issue</option>
                        <option value="food_quality">Food Quality</option>
                        <option value="payment_issue">Payment Issue</option>
                        <option value="app_bug">App Bug</option>
                        <option value="other">Other</option>
                    </select>
                </div>

                {/* Complaints List */}
                <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                    {loading ? (
                        <div className="flex items-center justify-center py-20">
                            <Loader2 className="w-10 h-10 animate-spin text-red-500" />
                        </div>
                    ) : complaints.length === 0 ? (
                        <div className="text-center py-20 text-gray-400">
                            <MessageSquare className="w-16 h-16 mx-auto mb-4 opacity-50" />
                            <p className="text-lg">No complaints found</p>
                        </div>
                    ) : (
                        <div className="divide-y divide-gray-100">
                            {complaints.map((complaint) => {
                                const statusStyle = STATUS_STYLES[complaint.status] || STATUS_STYLES.open;
                                return (
                                    <div
                                        key={complaint._id}
                                        onClick={() => setSelectedComplaint(complaint)}
                                        className="p-6 hover:bg-gray-50 cursor-pointer transition flex items-center gap-4"
                                    >
                                        <div className="flex-shrink-0">
                                            <Image
                                                src={complaint.user?.profilePicture || `https://ui-avatars.com/api/?name=${complaint.user?.username || 'U'}&background=random`}
                                                alt={complaint.user?.username || 'User'}
                                                width={48}
                                                height={48}
                                                className="rounded-full"
                                            />
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-center gap-2 mb-1">
                                                <h4 className="font-semibold text-gray-800 truncate">{complaint.subject}</h4>
                                                <span className={`px-2 py-0.5 rounded-full text-xs ${PRIORITY_STYLES[complaint.priority]}`}>
                                                    {complaint.priority}
                                                </span>
                                            </div>
                                            <p className="text-sm text-gray-500 truncate">{complaint.user?.username} • {TYPE_LABELS[complaint.type]}</p>
                                            <p className="text-sm text-gray-400 mt-1">{new Date(complaint.createdAt).toLocaleString()}</p>
                                        </div>
                                        <div className="flex-shrink-0 flex items-center gap-3">
                                            <span className={`inline-flex items-center gap-1 px-3 py-1.5 rounded-full text-xs font-medium ${statusStyle.bg}`}>
                                                {statusStyle.icon}
                                                {complaint.status.replace('_', ' ')}
                                            </span>
                                            <ChevronRight className="w-5 h-5 text-gray-400" />
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )}

                    {/* Pagination */}
                    {totalPages > 1 && (
                        <div className="px-6 py-4 border-t border-gray-100 flex items-center justify-center gap-2">
                            <button
                                onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                                disabled={currentPage === 1}
                                className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg disabled:opacity-50"
                            >
                                Previous
                            </button>
                            <span className="px-4 py-2 bg-red-500 text-white rounded-lg">{currentPage}</span>
                            <span className="text-gray-500">of {totalPages}</span>
                            <button
                                onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                                disabled={currentPage === totalPages}
                                className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg disabled:opacity-50"
                            >
                                Next
                            </button>
                        </div>
                    )}
                </div>

                {/* Complaint Detail Modal */}
                {selectedComplaint && (
                    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                        <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
                            <div className="p-6 border-b border-gray-100 flex items-center justify-between">
                                <h3 className="text-xl font-bold text-gray-800">Complaint Details</h3>
                                <button onClick={() => { setSelectedComplaint(null); setResolution(''); }} className="text-gray-400 hover:text-gray-600">
                                    <X className="w-6 h-6" />
                                </button>
                            </div>
                            <div className="p-6 space-y-6">
                                {/* Header Info */}
                                <div className="flex items-center gap-4">
                                    <Image
                                        src={selectedComplaint.user?.profilePicture || `https://ui-avatars.com/api/?name=${selectedComplaint.user?.username || 'U'}&background=random`}
                                        alt={selectedComplaint.user?.username || 'User'}
                                        width={56}
                                        height={56}
                                        className="rounded-full"
                                    />
                                    <div>
                                        <p className="font-semibold text-gray-800">{selectedComplaint.user?.username}</p>
                                        <p className="text-sm text-gray-500">{selectedComplaint.user?.email}</p>
                                    </div>
                                    <div className="ml-auto">
                                        <span className={`inline-flex items-center gap-1 px-3 py-1.5 rounded-full text-sm font-medium ${STATUS_STYLES[selectedComplaint.status].bg}`}>
                                            {STATUS_STYLES[selectedComplaint.status].icon}
                                            {selectedComplaint.status.replace('_', ' ')}
                                        </span>
                                    </div>
                                </div>

                                {/* Subject & Type */}
                                <div>
                                    <h4 className="text-lg font-semibold text-gray-800 mb-2">{selectedComplaint.subject}</h4>
                                    <div className="flex items-center gap-2">
                                        <span className="px-2 py-1 bg-gray-100 text-gray-600 rounded text-xs">{TYPE_LABELS[selectedComplaint.type]}</span>
                                        <span className={`px-2 py-1 rounded text-xs ${PRIORITY_STYLES[selectedComplaint.priority]}`}>{selectedComplaint.priority}</span>
                                        {selectedComplaint.order && (
                                            <span className="px-2 py-1 bg-blue-100 text-blue-600 rounded text-xs">Order #{selectedComplaint.order.orderNumber}</span>
                                        )}
                                    </div>
                                </div>

                                {/* Description */}
                                <div>
                                    <p className="text-sm text-gray-500 mb-1">Description</p>
                                    <p className="text-gray-700 bg-gray-50 p-4 rounded-lg">{selectedComplaint.description}</p>
                                </div>

                                {/* Status History */}
                                {selectedComplaint.statusHistory && selectedComplaint.statusHistory.length > 0 && (
                                    <div>
                                        <p className="text-sm text-gray-500 mb-2">History</p>
                                        <div className="space-y-2">
                                            {selectedComplaint.statusHistory.map((entry, i) => (
                                                <div key={i} className="flex items-start gap-2 text-sm">
                                                    <span className="text-gray-400">{new Date(entry.timestamp).toLocaleString()}</span>
                                                    <span className="text-gray-600">•</span>
                                                    <span className="font-medium text-gray-700">{entry.status.replace('_', ' ')}</span>
                                                    {entry.note && <span className="text-gray-500">- {entry.note}</span>}
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}

                                {/* Resolution Input */}
                                {selectedComplaint.status !== 'closed' && (
                                    <div>
                                        <p className="text-sm text-gray-500 mb-1">Resolution Note</p>
                                        <textarea
                                            value={resolution}
                                            onChange={(e) => setResolution(e.target.value)}
                                            className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-red-500 outline-none text-gray-800"
                                            rows={3}
                                            placeholder="Enter resolution details..."
                                        />
                                    </div>
                                )}

                                {/* Action Buttons */}
                                {selectedComplaint.status !== 'closed' && (
                                    <div className="flex flex-wrap gap-3 pt-4 border-t border-gray-100">
                                        {selectedComplaint.status === 'open' && (
                                            <button
                                                onClick={() => handleStatusUpdate(selectedComplaint._id, 'in_progress', 'Started working on this complaint')}
                                                disabled={updating}
                                                className="px-4 py-2 bg-yellow-500 text-white rounded-xl font-medium hover:bg-yellow-600 transition disabled:opacity-50"
                                            >
                                                Mark In Progress
                                            </button>
                                        )}
                                        {['open', 'in_progress'].includes(selectedComplaint.status) && (
                                            <button
                                                onClick={() => handleStatusUpdate(selectedComplaint._id, 'resolved', resolution || 'Issue resolved')}
                                                disabled={updating}
                                                className="px-4 py-2 bg-green-500 text-white rounded-xl font-medium hover:bg-green-600 transition disabled:opacity-50"
                                            >
                                                Mark Resolved
                                            </button>
                                        )}
                                        {selectedComplaint.status === 'resolved' && (
                                            <button
                                                onClick={() => handleStatusUpdate(selectedComplaint._id, 'closed', 'Complaint closed')}
                                                disabled={updating}
                                                className="px-4 py-2 bg-gray-500 text-white rounded-xl font-medium hover:bg-gray-600 transition disabled:opacity-50"
                                            >
                                                Close Complaint
                                            </button>
                                        )}
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                )}
            </main>
        </div>
    );
}
