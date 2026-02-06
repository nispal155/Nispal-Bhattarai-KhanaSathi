'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import AdminSidebar from '@/components/admin/AdminSidebar';
import { getAllUsers, getUserStats, adminUpdateUser, adminDeleteUser, UserProfile } from '@/lib/userService';
import toast from 'react-hot-toast';
import { Search, Users, Loader2, CheckCircle, XCircle, Trash2, Shield, UserCheck, UserX } from 'lucide-react';

interface UserStats {
    totalUsers: number;
    customers: number;
    restaurants: number;
    deliveryStaff: number;
    verifiedUsers: number;
    approvedManagers: number;
}

export default function UserManagementPage() {
    const [users, setUsers] = useState<UserProfile[]>([]);
    const [stats, setStats] = useState<UserStats | null>(null);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [appliedSearch, setAppliedSearch] = useState('');
    const [roleFilter, setRoleFilter] = useState('');
    const [currentPage, setCurrentPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [refreshKey, setRefreshKey] = useState(0);

    useEffect(() => {
        let cancelled = false;

        const loadData = async () => {
            setLoading(true);
            try {
                const [usersRes, statsRes] = await Promise.all([
                    getAllUsers({ role: roleFilter || undefined, search: appliedSearch || undefined, page: currentPage, limit: 15 }),
                    getUserStats()
                ]);

                if (cancelled) return;

                if (usersRes.data?.success) {
                    setUsers(usersRes.data.data);
                    setTotalPages(usersRes.data.pages);
                } else {
                    setUsers([]);
                    setTotalPages(1);
                    if (usersRes.error) {
                        toast.error(usersRes.error);
                    }
                }
                if (statsRes.data?.success) {
                    setStats(statsRes.data.data);
                }
            } catch (error) {
                if (!cancelled) {
                    toast.error('Failed to fetch users');
                    console.error(error);
                }
            } finally {
                if (!cancelled) {
                    setLoading(false);
                }
            }
        };

        loadData();

        return () => { cancelled = true; };
    }, [roleFilter, currentPage, appliedSearch, refreshKey]);

    const handleSearch = (e: React.FormEvent) => {
        e.preventDefault();
        setCurrentPage(1);
        setAppliedSearch(search);
    };

    const handleApprove = async (userId: string, currentStatus: boolean) => {
        try {
            await adminUpdateUser(userId, { isApproved: !currentStatus });
            toast.success(currentStatus ? 'User suspended' : 'User approved');
            setRefreshKey(k => k + 1);
        } catch {
            toast.error('Failed to update user status');
        }
    };

    const handleVerify = async (userId: string, currentStatus: boolean) => {
        try {
            await adminUpdateUser(userId, { isVerified: !currentStatus });
            toast.success(currentStatus ? 'Verification removed' : 'User verified');
            setRefreshKey(k => k + 1);
        } catch {
            toast.error('Failed to verify user');
        }
    };

    const handleDelete = async (userId: string) => {
        if (!confirm('Are you sure you want to delete this user? This action cannot be undone.')) return;
        try {
            await adminDeleteUser(userId);
            toast.success('User deleted successfully');
            setRefreshKey(k => k + 1);
        } catch {
            toast.error('Failed to delete user');
        }
    };

    const getRoleBadge = (role: string) => {
        const colors: Record<string, string> = {
            customer: 'bg-blue-100 text-blue-700',
            restaurant: 'bg-purple-100 text-purple-700',
            delivery_staff: 'bg-orange-100 text-orange-700',
            admin: 'bg-red-100 text-red-700'
        };
        return colors[role] || 'bg-gray-100 text-gray-700';
    };

    return (
        <div className="min-h-screen bg-gray-50 flex">
            <AdminSidebar />
            <main className="flex-1 p-8 overflow-auto">
                <header className="mb-8">
                    <h2 className="text-3xl font-bold text-gray-800">User Management</h2>
                    <p className="text-gray-500 mt-2">Manage all user accounts across the platform</p>
                </header>

                {/* Stats Cards */}
                {stats && (
                    <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4 mb-8">
                        <div className="bg-white rounded-xl p-4 border border-gray-100 shadow-sm">
                            <p className="text-sm text-gray-500">Total Users</p>
                            <p className="text-2xl font-bold text-gray-800">{stats.totalUsers}</p>
                        </div>
                        <div className="bg-white rounded-xl p-4 border border-gray-100 shadow-sm">
                            <p className="text-sm text-gray-500">Customers</p>
                            <p className="text-2xl font-bold text-blue-600">{stats.customers}</p>
                        </div>
                        <div className="bg-white rounded-xl p-4 border border-gray-100 shadow-sm">
                            <p className="text-sm text-gray-500">Restaurants</p>
                            <p className="text-2xl font-bold text-purple-600">{stats.restaurants}</p>
                        </div>
                        <div className="bg-white rounded-xl p-4 border border-gray-100 shadow-sm">
                            <p className="text-sm text-gray-500">Delivery Staff</p>
                            <p className="text-2xl font-bold text-orange-600">{stats.deliveryStaff}</p>
                        </div>
                        <div className="bg-white rounded-xl p-4 border border-gray-100 shadow-sm">
                            <p className="text-sm text-gray-500">Verified</p>
                            <p className="text-2xl font-bold text-green-600">{stats.verifiedUsers}</p>
                        </div>
                        <div className="bg-white rounded-xl p-4 border border-gray-100 shadow-sm">
                            <p className="text-sm text-gray-500">Approved</p>
                            <p className="text-2xl font-bold text-teal-600">{stats.approvedManagers}</p>
                        </div>
                    </div>
                )}

                {/* Filters */}
                <form onSubmit={handleSearch} className="flex flex-col md:flex-row gap-4 mb-6">
                    <div className="relative flex-1 max-w-md">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                        <input
                            type="text"
                            placeholder="Search by name or email..."
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            className="w-full pl-12 pr-4 py-3 bg-white border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-red-500 text-gray-800"
                        />
                    </div>
                    <select
                        value={roleFilter}
                        onChange={(e) => { setRoleFilter(e.target.value); setCurrentPage(1); }}
                        className="px-4 py-3 bg-white border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-red-500 text-gray-800"
                    >
                        <option value="">All Roles</option>
                        <option value="customer">Customers</option>
                        <option value="restaurant">Restaurants</option>
                        <option value="delivery_staff">Delivery Staff</option>
                        <option value="admin">Admins</option>
                    </select>
                    <button type="submit" className="px-6 py-3 bg-red-500 text-white rounded-xl font-medium hover:bg-red-600 transition">
                        Search
                    </button>
                </form>

                {/* Users Table */}
                <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                    {loading ? (
                        <div className="flex items-center justify-center py-20">
                            <Loader2 className="w-10 h-10 animate-spin text-red-500" />
                        </div>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="w-full">
                                <thead className="bg-gray-50 border-b border-gray-200">
                                    <tr>
                                        <th className="text-left px-6 py-4 text-sm font-semibold text-gray-600">User</th>
                                        <th className="text-left px-6 py-4 text-sm font-semibold text-gray-600">Role</th>
                                        <th className="text-left px-6 py-4 text-sm font-semibold text-gray-600">Status</th>
                                        <th className="text-left px-6 py-4 text-sm font-semibold text-gray-600">Joined</th>
                                        <th className="text-right px-6 py-4 text-sm font-semibold text-gray-600">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-100">
                                    {users.length === 0 ? (
                                        <tr>
                                            <td colSpan={5} className="text-center py-10 text-gray-400">
                                                <Users className="w-12 h-12 mx-auto mb-2 opacity-50" />
                                                No users found
                                            </td>
                                        </tr>
                                    ) : (
                                        users.map((user) => (
                                            <tr key={user._id} className="hover:bg-gray-50 transition">
                                                <td className="px-6 py-4">
                                                    <div className="flex items-center gap-3">
                                                        <div className="w-10 h-10 rounded-full overflow-hidden bg-gray-100">
                                                            <Image
                                                                src={user.profilePicture || `https://ui-avatars.com/api/?name=${user.username}&background=random`}
                                                                alt={user.username}
                                                                width={40}
                                                                height={40}
                                                                className="object-cover"
                                                            />
                                                        </div>
                                                        <div>
                                                            <p className="font-medium text-gray-800">{user.username}</p>
                                                            <p className="text-sm text-gray-500">{user.email}</p>
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4">
                                                    <span className={`px-3 py-1 rounded-full text-xs font-medium ${getRoleBadge(user.role)}`}>
                                                        {user.role.replace('_', ' ')}
                                                    </span>
                                                </td>
                                                <td className="px-6 py-4">
                                                    <div className="flex items-center gap-2">
                                                        {user.isVerified ? (
                                                            <span className="flex items-center gap-1 text-green-600 text-sm">
                                                                <CheckCircle className="w-4 h-4" /> Verified
                                                            </span>
                                                        ) : (
                                                            <span className="flex items-center gap-1 text-gray-400 text-sm">
                                                                <XCircle className="w-4 h-4" /> Unverified
                                                            </span>
                                                        )}
                                                        {user.isApproved && (
                                                            <span className="flex items-center gap-1 text-teal-600 text-sm ml-2">
                                                                <Shield className="w-4 h-4" /> Approved
                                                            </span>
                                                        )}
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4 text-gray-500 text-sm">
                                                    {new Date(user.createdAt).toLocaleDateString()}
                                                </td>
                                                <td className="px-6 py-4">
                                                    <div className="flex items-center justify-end gap-2">
                                                        <button
                                                            onClick={() => handleVerify(user._id, user.isVerified)}
                                                            className={`p-2 rounded-lg transition ${user.isVerified ? 'bg-gray-100 text-gray-600 hover:bg-gray-200' : 'bg-green-100 text-green-600 hover:bg-green-200'}`}
                                                            title={user.isVerified ? 'Remove verification' : 'Verify user'}
                                                        >
                                                            <UserCheck className="w-4 h-4" />
                                                        </button>
                                                        <button
                                                            onClick={() => handleApprove(user._id, user.isApproved)}
                                                            className={`p-2 rounded-lg transition ${user.isApproved ? 'bg-red-100 text-red-600 hover:bg-red-200' : 'bg-teal-100 text-teal-600 hover:bg-teal-200'}`}
                                                            title={user.isApproved ? 'Suspend user' : 'Approve user'}
                                                        >
                                                            {user.isApproved ? <UserX className="w-4 h-4" /> : <Shield className="w-4 h-4" />}
                                                        </button>
                                                        <button
                                                            onClick={() => handleDelete(user._id)}
                                                            className="p-2 rounded-lg bg-red-50 text-red-500 hover:bg-red-100 transition"
                                                            title="Delete user"
                                                        >
                                                            <Trash2 className="w-4 h-4" />
                                                        </button>
                                                    </div>
                                                </td>
                                            </tr>
                                        ))
                                    )}
                                </tbody>
                            </table>
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
            </main>
        </div>
    );
}
