'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import AdminSidebar from '@/components/admin/AdminSidebar';
import { getAllOrders, getOrderStats, Order } from '@/lib/orderService';
import toast from 'react-hot-toast';
import { Search, Package, Loader2, Clock, CheckCircle, Truck, XCircle, Eye, ChefHat } from 'lucide-react';
import { formatCurrency } from '@/lib/formatters';

interface OrderStats {
    totalOrders: number;
    todayOrders: number;
    pendingOrders: number;
    completedOrders: number;
    cancelledOrders: number;
    totalRevenue: number;
}

const STATUS_OPTIONS = [
    { value: '', label: 'All Status' },
    { value: 'pending', label: 'Pending' },
    { value: 'confirmed', label: 'Confirmed' },
    { value: 'preparing', label: 'Preparing' },
    { value: 'ready', label: 'Ready' },
    { value: 'picked_up', label: 'Picked Up' },
    { value: 'on_the_way', label: 'On The Way' },
    { value: 'delivered', label: 'Delivered' },
    { value: 'cancelled', label: 'Cancelled' }
];

export default function OrderMonitoringPage() {
    const [orders, setOrders] = useState<Order[]>([]);
    const [stats, setStats] = useState<OrderStats | null>(null);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [statusFilter, setStatusFilter] = useState('');
    const [currentPage, setCurrentPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
    const [searchTrigger, setSearchTrigger] = useState(0);

    useEffect(() => {
        fetchData();
    }, [statusFilter, currentPage, searchTrigger]);

    const fetchData = async () => {
        setLoading(true);
        try {
            const [ordersRes, statsRes] = await Promise.all([
                getAllOrders({ status: statusFilter || undefined, search: search || undefined, page: currentPage, limit: 15 }),
                getOrderStats()
            ]);

            if (ordersRes.data?.success) {
                setOrders(ordersRes.data.data);
                setTotalPages(ordersRes.data.pages);
            }
            if (statsRes.data?.success) {
                setStats(statsRes.data.data);
            }
        } catch (error) {
            toast.error('Failed to fetch orders');
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    const handleSearch = (e: React.FormEvent) => {
        e.preventDefault();
        setCurrentPage(1);
        setSearchTrigger(prev => prev + 1);
    };

    const getStatusStyles = (status: string) => {
        const styles: Record<string, { bg: string; icon: React.ReactNode }> = {
            pending: { bg: 'bg-yellow-100 text-yellow-700', icon: <Clock className="w-4 h-4" /> },
            confirmed: { bg: 'bg-blue-100 text-blue-700', icon: <CheckCircle className="w-4 h-4" /> },
            preparing: { bg: 'bg-orange-100 text-orange-700', icon: <ChefHat className="w-4 h-4" /> },
            ready: { bg: 'bg-purple-100 text-purple-700', icon: <Package className="w-4 h-4" /> },
            picked_up: { bg: 'bg-indigo-100 text-indigo-700', icon: <Truck className="w-4 h-4" /> },
            on_the_way: { bg: 'bg-cyan-100 text-cyan-700', icon: <Truck className="w-4 h-4" /> },
            delivered: { bg: 'bg-green-100 text-green-700', icon: <CheckCircle className="w-4 h-4" /> },
            cancelled: { bg: 'bg-red-100 text-red-700', icon: <XCircle className="w-4 h-4" /> }
        };
        return styles[status] || { bg: 'bg-gray-100 text-gray-700', icon: <Package className="w-4 h-4" /> };
    };

    return (
        <div className="min-h-screen bg-gray-50 flex">
            <AdminSidebar />
            <main className="flex-1 p-8 overflow-y-auto h-screen">
                <header className="mb-8">
                    <h2 className="text-3xl font-bold text-gray-800">Order Monitoring</h2>
                    <p className="text-gray-500 mt-2">Track and manage all orders in real-time</p>
                </header>

                {/* Stats Cards */}
                {stats && (
                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-8">
                        <div className="bg-white rounded-xl p-4 border border-gray-100 shadow-sm">
                            <p className="text-sm text-gray-500">Total Orders</p>
                            <p className="text-2xl font-bold text-gray-800">{stats.totalOrders}</p>
                        </div>
                        <div className="bg-white rounded-xl p-4 border border-gray-100 shadow-sm">
                            <p className="text-sm text-gray-500">Today</p>
                            <p className="text-2xl font-bold text-blue-600">{stats.todayOrders}</p>
                        </div>
                        <div className="bg-white rounded-xl p-4 border border-gray-100 shadow-sm">
                            <p className="text-sm text-gray-500">Pending</p>
                            <p className="text-2xl font-bold text-yellow-600">{stats.pendingOrders}</p>
                        </div>
                        <div className="bg-white rounded-xl p-4 border border-gray-100 shadow-sm">
                            <p className="text-sm text-gray-500">Completed</p>
                            <p className="text-2xl font-bold text-green-600">{stats.completedOrders}</p>
                        </div>
                        <div className="bg-white rounded-xl p-4 border border-gray-100 shadow-sm">
                            <p className="text-sm text-gray-500">Cancelled</p>
                            <p className="text-2xl font-bold text-red-600">{stats.cancelledOrders}</p>
                        </div>
                        <div className="bg-white rounded-xl p-4 border border-gray-100 shadow-sm">
                            <p className="text-sm text-gray-500">Revenue</p>
                            <p className="text-2xl font-bold text-teal-600">{formatCurrency(stats.totalRevenue)}</p>
                        </div>
                    </div>
                )}

                {/* Filters */}
                <form onSubmit={handleSearch} className="flex flex-col md:flex-row gap-4 mb-6">
                    <div className="relative flex-1 max-w-md">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                        <input
                            type="text"
                            placeholder="Search by order number..."
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            className="w-full pl-12 pr-4 py-3 bg-white border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-red-500 text-gray-800"
                        />
                    </div>
                    <select
                        value={statusFilter}
                        onChange={(e) => { setStatusFilter(e.target.value); setCurrentPage(1); }}
                        className="px-4 py-3 bg-white border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-red-500 text-gray-800"
                    >
                        {STATUS_OPTIONS.map(opt => (
                            <option key={opt.value} value={opt.value}>{opt.label}</option>
                        ))}
                    </select>
                    <button type="submit" className="px-6 py-3 bg-red-500 text-white rounded-xl font-medium hover:bg-red-600 transition">
                        Search
                    </button>
                </form>

                {/* Orders Table */}
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
                                        <th className="text-left px-6 py-4 text-sm font-semibold text-gray-600">Order #</th>
                                        <th className="text-left px-6 py-4 text-sm font-semibold text-gray-600">Customer</th>
                                        <th className="text-left px-6 py-4 text-sm font-semibold text-gray-600">Restaurant</th>
                                        <th className="text-left px-6 py-4 text-sm font-semibold text-gray-600">Status</th>
                                        <th className="text-left px-6 py-4 text-sm font-semibold text-gray-600">Total</th>
                                        <th className="text-left px-6 py-4 text-sm font-semibold text-gray-600">Date</th>
                                        <th className="text-right px-6 py-4 text-sm font-semibold text-gray-600">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-100">
                                    {orders.length === 0 ? (
                                        <tr>
                                            <td colSpan={7} className="text-center py-10 text-gray-400">
                                                <Package className="w-12 h-12 mx-auto mb-2 opacity-50" />
                                                No orders found
                                            </td>
                                        </tr>
                                    ) : (
                                        orders.map((order) => {
                                            const statusStyle = getStatusStyles(order.status);
                                            return (
                                                <tr key={order._id} className="hover:bg-gray-50 transition">
                                                    <td className="px-6 py-4 font-medium text-gray-800">
                                                        #{order.orderNumber}
                                                    </td>
                                                    <td className="px-6 py-4">
                                                        <p className="font-medium text-gray-800">{order.customer?.username || 'N/A'}</p>
                                                        <p className="text-sm text-gray-500">{order.customer?.email || ''}</p>
                                                    </td>
                                                    <td className="px-6 py-4">
                                                        <div className="flex items-center gap-2">
                                                            {order.restaurant?.logoUrl && (
                                                                <Image
                                                                    src={order.restaurant.logoUrl}
                                                                    alt={order.restaurant.name}
                                                                    width={32}
                                                                    height={32}
                                                                    className="rounded-full"
                                                                />
                                                            )}
                                                            <span className="text-gray-800">{order.restaurant?.name || 'N/A'}</span>
                                                        </div>
                                                    </td>
                                                    <td className="px-6 py-4">
                                                        <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium ${statusStyle.bg}`}>
                                                            {statusStyle.icon}
                                                            {order.status.replace('_', ' ')}
                                                        </span>
                                                    </td>
                                                    <td className="px-6 py-4 font-medium text-gray-800">
                                                        {formatCurrency(order.pricing?.total || 0)}
                                                    </td>
                                                    <td className="px-6 py-4 text-gray-500 text-sm">
                                                        {new Date(order.createdAt).toLocaleDateString()}
                                                    </td>
                                                    <td className="px-6 py-4">
                                                        <button
                                                            onClick={() => setSelectedOrder(order)}
                                                            className="p-2 rounded-lg bg-gray-100 text-gray-600 hover:bg-gray-200 transition"
                                                            title="View details"
                                                        >
                                                            <Eye className="w-4 h-4" />
                                                        </button>
                                                    </td>
                                                </tr>
                                            );
                                        })
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

                {/* Order Detail Modal */}
                {selectedOrder && (
                    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[9999] p-4" onClick={() => setSelectedOrder(null)}>
                        <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
                            <div className="p-6 border-b border-gray-100">
                                <div className="flex items-center justify-between">
                                    <h3 className="text-xl font-bold text-gray-800">Order #{selectedOrder.orderNumber}</h3>
                                    <button onClick={() => setSelectedOrder(null)} className="text-gray-400 hover:text-gray-600">
                                        <XCircle className="w-6 h-6" />
                                    </button>
                                </div>
                            </div>
                            <div className="p-6 space-y-6">
                                {/* Status */}
                                <div>
                                    <p className="text-sm text-gray-500 mb-2">Status</p>
                                    <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium ${getStatusStyles(selectedOrder.status).bg}`}>
                                        {getStatusStyles(selectedOrder.status).icon}
                                        {selectedOrder.status.replace('_', ' ')}
                                    </span>
                                </div>

                                {/* Items */}
                                <div>
                                    <p className="text-sm text-gray-500 mb-2">Items</p>
                                    <ul className="space-y-2">
                                        {(selectedOrder.items ?? []).map((item, i) => (
                                            <li key={i} className="flex justify-between text-gray-800">
                                                <span>{item.quantity}x {item.name}</span>
                                                <span>{formatCurrency(item.price * item.quantity)}</span>
                                            </li>
                                        ))}
                                    </ul>
                                </div>

                                {/* Pricing */}
                                <div className="border-t border-gray-100 pt-4">
                                    <div className="flex justify-between text-gray-600 mb-1">
                                        <span>Subtotal</span>
                                        <span>{formatCurrency(selectedOrder.pricing?.subtotal || 0)}</span>
                                    </div>
                                    <div className="flex justify-between text-gray-600 mb-1">
                                        <span>Delivery Fee</span>
                                        <span>{formatCurrency(selectedOrder.pricing?.deliveryFee || 0)}</span>
                                    </div>
                                    <div className="flex justify-between text-gray-600 mb-1">
                                        <span>Service Fee</span>
                                        <span>{formatCurrency(selectedOrder.pricing?.serviceFee || 0)}</span>
                                    </div>
                                    {(selectedOrder.pricing?.discount || 0) > 0 && (
                                        <div className="flex justify-between text-green-600 mb-1">
                                            <span>Discount</span>
                                            <span>-{formatCurrency(selectedOrder.pricing?.discount || 0)}</span>
                                        </div>
                                    )}
                                    <div className="flex justify-between text-lg font-bold text-gray-800 mt-2 pt-2 border-t border-gray-100">
                                        <span>Total</span>
                                        <span>{formatCurrency(selectedOrder.pricing?.total || 0)}</span>
                                    </div>
                                </div>

                                {/* Delivery Address */}
                                {selectedOrder.deliveryAddress && (
                                    <div>
                                        <p className="text-sm text-gray-500 mb-2">Delivery Address</p>
                                        <p className="text-gray-800">
                                            {selectedOrder.deliveryAddress?.addressLine1 || 'N/A'}
                                            {selectedOrder.deliveryAddress?.addressLine2 && `, ${selectedOrder.deliveryAddress.addressLine2}`}
                                            {selectedOrder.deliveryAddress?.city && `, ${selectedOrder.deliveryAddress.city}`}
                                        </p>
                                    </div>
                                )}

                                {/* Rider */}
                                {selectedOrder.deliveryRider && (
                                    <div>
                                        <p className="text-sm text-gray-500 mb-2">Delivery Rider</p>
                                        <div className="flex items-center gap-3">
                                            <img
                                                src={selectedOrder.deliveryRider.profilePicture || `https://ui-avatars.com/api/?name=${selectedOrder.deliveryRider.username}&background=random`}
                                                alt={selectedOrder.deliveryRider.username}
                                                width={40}
                                                height={40}
                                                className="rounded-full w-10 h-10 object-cover"
                                            />
                                            <span className="font-medium text-gray-800">{selectedOrder.deliveryRider.username}</span>
                                        </div>
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
