"use client";

import Image from "next/image";
import { useState, useEffect } from "react";
import {
  Users,
  Search,
  Bike,
  Clock,
  Star,
  Edit,
  Trash2,
  Loader2,
} from "lucide-react";
import StaffModal from "@/components/admin/StaffModal";
import { get, post, put, del } from "@/lib/api";
import AdminSidebar from "@/components/admin/AdminSidebar";
import { useAuth } from "@/context/AuthContext";

export default function DeliveryStaffManagement() {
  const { user } = useAuth();
  const [staffData, setStaffData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [currentStaff, setCurrentStaff] = useState<any>(null);
  const [modalTitle, setModalTitle] = useState("");
  const [search, setSearch] = useState('');
  const [appliedSearch, setAppliedSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [refreshKey, setRefreshKey] = useState(0);

  useEffect(() => {
    let cancelled = false;

    const loadStaff = async () => {
      try {
        setLoading(true);
        const params = new URLSearchParams();
        if (appliedSearch) params.append('search', appliedSearch);
        if (statusFilter) params.append('status', statusFilter);
        const query = params.toString() ? `?${params.toString()}` : '';

        const { data, error } = await get<any[]>(`/staff/all${query}`);
        if (cancelled) return;
        if (data) {
          setStaffData(data);
        } else if (error) {
          console.error("Error fetching staff:", error);
          setStaffData([]);
        }
      } catch (error) {
        if (!cancelled) console.error("Error fetching staff:", error);
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    loadStaff();

    return () => { cancelled = true; };
  }, [appliedSearch, statusFilter, refreshKey]);

  const handleAddClick = () => {
    setCurrentStaff(null);
    setModalTitle("Add New Staff");
    setIsModalOpen(true);
  };

  const handleEditClick = (staff: any) => {
    setCurrentStaff(staff);
    setModalTitle("Edit Staff Details");
    setIsModalOpen(true);
  };

  const handleDeleteClick = async (id: string) => {
    if (confirm("Are you sure you want to delete this staff member?")) {
      try {
        const { error } = await del(`/staff/delete/${id}`);
        if (error) {
          alert(error);
        } else {
          setRefreshKey(k => k + 1);
        }
      } catch (error) {
        console.error("Error deleting staff:", error);
        alert("Failed to delete staff");
      }
    }
  };

  const handleModalSubmit = async (data: any) => {
    try {
      let result;
      if (currentStaff) {
        result = await put<any>(`/staff/update/${currentStaff._id}`, data);
      } else {
        result = await post<any>("/staff/add", data);
      }

      if (result.error) {
        alert(result.error);
      } else {
        setRefreshKey(k => k + 1);
        setIsModalOpen(false);
      }
    } catch (error: any) {
      console.error("Error submitting:", error);
      alert("Operation failed");
    }
  };

  // Stats
  const totalDrivers = staffData.length;
  const onlineDrivers = staffData.filter((s) => s.isOnline).length;
  const onAssignment = staffData.filter((s) => s.currentAssignment !== "None").length;
  const avgRating =
    totalDrivers > 0
      ? (
        staffData.reduce((acc, curr) => acc + (curr.averageRating || 0), 0) /
        totalDrivers
      ).toFixed(1)
      : "0.0";

  return (
    <div className="min-h-screen bg-gray-50 flex">
      <AdminSidebar />
      {/* Staff Modal */}
      <StaffModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSubmit={handleModalSubmit}
        initialData={currentStaff}
        title={modalTitle}
      />


      {/* Main Content */}
      <div className="flex-1 flex flex-col">
        {/* Header */}
        <header className="bg-white shadow-sm border-b border-gray-200 px-8 py-6 flex items-center justify-between sticky top-0 z-10">
          <h2 className="text-3xl font-bold text-gray-900">Delivery Staff Management</h2>
          <div className="w-12 h-12 rounded-full overflow-hidden ring-4 ring-orange-100 flex items-center justify-center bg-gray-100">
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
        </header>

        {/* Page Content */}
        <div className="flex-1 p-8 overflow-y-auto">
          {/* Add Button */}
          <div className="flex justify-end mb-6">
            <button
              onClick={handleAddClick}
              className="bg-red-500 hover:bg-red-600 text-white px-6 py-3 rounded-full font-medium shadow-md transition flex items-center gap-2"
            >
              + Add New Staff
            </button>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
            <div className="bg-white rounded-2xl shadow-sm p-6 border border-gray-200">
              <p className="text-gray-600 mb-2 flex items-center gap-2">
                <Users className="w-5 h-5 text-blue-500" />
                Total Drivers
              </p>
              <p className="text-4xl font-bold text-gray-900">{totalDrivers}</p>
            </div>
            <div className="bg-white rounded-2xl shadow-sm p-6 border border-gray-200">
              <p className="text-gray-600 mb-2 flex items-center gap-2">
                <Bike className="w-5 h-5 text-green-500" />
                Online Now
              </p>
              <p className="text-4xl font-bold text-gray-900">{onlineDrivers}</p>
            </div>
            <div className="bg-white rounded-2xl shadow-sm p-6 border border-gray-200">
              <p className="text-gray-600 mb-2 flex items-center gap-2">
                <Clock className="w-5 h-5 text-orange-500" />
                On Assignment
              </p>
              <p className="text-4xl font-bold text-gray-900">{onAssignment}</p>
            </div>
            <div className="bg-white rounded-2xl shadow-sm p-6 border border-gray-200">
              <p className="text-gray-600 mb-2 flex items-center gap-2">
                <Star className="w-5 h-5 text-yellow-500" />
                Avg. Rating
              </p>
              <p className="text-4xl font-bold text-gray-900">{avgRating}</p>
            </div>
          </div>

          {/* Search & Filter */}
          <form onSubmit={(e) => { e.preventDefault(); setAppliedSearch(search); }} className="flex flex-col md:flex-row gap-4 mb-6">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                placeholder="Search by Email or Name..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-12 pr-4 py-3.5 text-black bg-white border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-red-500 transition"
              />
            </div>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-5 py-3.5 bg-white border text-black border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-red-500"
            >
              <option value="">All Statuses</option>
              <option value="online">Online</option>
              <option value="offline">Offline</option>
            </select>
            <button type="submit" className="px-6 py-3.5 bg-red-500 text-white rounded-xl font-medium hover:bg-red-600 transition">
              Search
            </button>
          </form>

          {/* Table */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
            {loading ? (
              <div className="flex justify-center items-center py-20">
                <Loader2 className="w-10 h-10 text-red-500 animate-spin" />
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50 border-b border-gray-200">
                    <tr>
                      <th className="text-left px-6 py-4 text-sm font-medium text-gray-600">NAME</th>
                      <th className="text-left px-6 py-4 text-sm font-medium text-gray-600">EMAIL</th>
                      <th className="text-left px-6 py-4 text-sm font-medium text-gray-600">STATUS</th>
                      <th className="text-left px-6 py-4 text-sm font-medium text-gray-600">CURRENT ASSIGNMENT</th>
                      <th className="text-left px-6 py-4 text-sm font-medium text-gray-600">COMPLETED ORDERS</th>
                      <th className="text-left px-6 py-4 text-sm font-medium text-gray-600">RATING</th>
                      <th className="text-left px-6 py-4 text-sm font-medium text-gray-600">ACTIONS</th>
                    </tr>
                  </thead>
                  <tbody>
                    {staffData.length === 0 ? (
                      <tr>
                        <td colSpan={7} className="px-6 py-12 text-center text-gray-500">
                          No delivery staff found. Click "Add New Staff" to get started!
                        </td>
                      </tr>
                    ) : (
                      staffData.map((staff) => (
                        <tr key={staff._id} className="border-b border-gray-100 hover:bg-gray-50 transition">
                          <td className="px-6 py-5 font-medium text-gray-900">{staff.username}</td>
                          <td className="px-6 py-5 text-gray-700">{staff.email}</td>
                          <td className="px-6 py-5">
                            <span
                              className={`px-4 py-2 rounded-full text-sm font-medium ${staff.isOnline
                                ? "bg-green-100 text-green-700"
                                : "bg-gray-100 text-gray-600"
                                }`}
                            >
                              {staff.isOnline ? "Online" : "Offline"}
                            </span>
                          </td>
                          <td className="px-6 py-5 text-gray-700">
                            {staff.currentAssignment || "None"}
                          </td>
                          <td className="px-6 py-5 text-gray-700">{staff.completedOrders || 0}</td>
                          <td className="px-6 py-5">
                            <span className="flex items-center gap-1 text-orange-600 font-medium">
                              {staff.averageRating || 0}{" "}
                              <Star className="w-4 h-4 fill-orange-500" />
                            </span>
                          </td>
                          <td className="px-6 py-5">
                            <div className="flex items-center gap-4">
                              <button
                                onClick={() => handleEditClick(staff)}
                                className="text-gray-600 hover:text-green-600 transition"
                              >
                                <Edit className="w-5 h-5" />
                              </button>
                              <button
                                onClick={() => handleDeleteClick(staff._id)}
                                className="text-gray-600 hover:text-red-600 transition"
                              >
                                <Trash2 className="w-5 h-5" />
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
            {!loading && staffData.length > 0 && (
              <div className="px-6 py-5 border-t border-gray-200 flex items-center justify-center gap-4">
                <button className="text-gray-600 hover:text-gray-900 disabled:opacity-50" disabled>
                  &lt; Previous
                </button>
                <span className="px-4 py-2 bg-red-500 text-white rounded-lg">1</span>
                <button className="text-gray-600 hover:text-gray-900 disabled:opacity-50" disabled>
                  Next &gt;
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <footer className="text-center text-gray-500 text-sm py-6 border-t border-gray-200">
          © 2025 KhanaSathi Admin. All rights reserved.
        </footer>
      </div>
    </div>
  );
}