"use client";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import { getAllRestaurants, deleteRestaurant } from "@/lib/restaurantService";
import Image from "next/image";
import AdminSidebar from "@/components/admin/AdminSidebar";
import { Search, Eye, Edit, Trash2 } from "lucide-react";
import { useAuth } from "@/context/AuthContext";

export default function Restaurants() {
  const { user } = useAuth();
  const [restaurants, setRestaurants] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [appliedSearch, setAppliedSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [cuisineFilter, setCuisineFilter] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [allCuisines, setAllCuisines] = useState<string[]>([]);

  // A refresh key to force useEffect re-run after delete
  const [refreshKey, setRefreshKey] = useState(0);

  useEffect(() => {
    let cancelled = false;

    const loadRestaurants = async () => {
      try {
        setLoading(true);
        const res = await getAllRestaurants({
          search: appliedSearch || undefined,
          status: statusFilter || undefined,
          cuisine: cuisineFilter || undefined,
          page: currentPage,
          limit: 15,
        });
        if (cancelled) return;
        if (res.data && res.data.data) {
          setRestaurants(res.data.data);
          setTotalPages(res.data.pages || 1);
          setTotalCount(res.data.total || res.data.data.length);

          // Build cuisine list from first unfiltered load
          if (!appliedSearch && !statusFilter && !cuisineFilter) {
            const cuisines = new Set<string>();
            res.data.data.forEach((r: any) => {
              if (r.cuisineType && Array.isArray(r.cuisineType)) {
                r.cuisineType.forEach((c: string) => {
                  // Handle comma-separated values within a single array element
                  if (c.includes(',')) {
                    c.split(',').map(s => s.trim()).filter(Boolean).forEach(s => cuisines.add(s));
                  } else if (c.trim()) {
                    cuisines.add(c.trim());
                  }
                });
              }
            });
            setAllCuisines(Array.from(cuisines).sort());
          }
        } else {
          setRestaurants([]);
          setTotalPages(1);
          setTotalCount(0);
        }
      } catch (err: any) {
        if (!cancelled) toast.error("Failed to load restaurants");
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    loadRestaurants();

    return () => { cancelled = true; };
  }, [appliedSearch, statusFilter, cuisineFilter, currentPage, refreshKey]);

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this restaurant?")) return;

    try {
      await deleteRestaurant(id);
      toast.success("Restaurant deleted");
      setRefreshKey(k => k + 1);
    } catch (err) {
      toast.error("Failed to delete restaurant");
    }
  };


  const router = useRouter();

  return (
    <div className="min-h-screen bg-gray-50 flex">
      <AdminSidebar />

      {/* Main Content */}
      <div className="flex-1 overflow-auto">
        {/* Header */}
        <header className="bg-white shadow-sm border-b border-gray-200 px-8 py-6 flex items-center justify-between">
          <h2 className="text-3xl font-bold text-gray-900">Restaurants</h2>
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

        {/* Filters */}
        <div className="p-8">
          <form onSubmit={(e) => { e.preventDefault(); setCurrentPage(1); setAppliedSearch(search); }} className="flex flex-col md:flex-row gap-4 mb-8">

            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                placeholder="Search restaurants..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-12 pr-4 text-black py-3.5 bg-white border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-red-500 transition"
              />
            </div>
            <select
              value={statusFilter}
              onChange={(e) => { setStatusFilter(e.target.value); setCurrentPage(1); }}
              className="px-5 py-3.5 text-black bg-white border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-red-500"
            >
              <option value="">All Statuses</option>
              <option value="active">Active</option>
              <option value="deactivated">Deactivated</option>
            </select>
            <select
              value={cuisineFilter}
              onChange={(e) => { setCuisineFilter(e.target.value); setCurrentPage(1); }}
              className="px-5 py-3.5 text-black bg-white border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-red-500"
            >
              <option value="">All Cuisines</option>
              {allCuisines.map((c) => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
            <button
              type="button"
              onClick={() => { setSearch(''); setAppliedSearch(''); setStatusFilter(''); setCuisineFilter(''); setCurrentPage(1); }}
              className="px-6 py-3.5 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl font-medium transition"
            >
              Reset Filters
            </button>
            <button type="button" onClick={() => router.push("/add-restaurants")}
              className="bg-red-500 hover:bg-red-600 text-white px-6 py-3 rounded-full font-medium shadow-md transition"
            >
              Add Restaurant
            </button>
          </form>

          {/* Table */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="text-left px-6 py-4 text-sm font-medium text-gray-600">Restaurant Name</th>
                    <th className="text-left px-6 py-4 text-sm font-medium text-gray-600">Rating</th>
                    <th className="text-left px-6 py-4 text-sm font-medium text-gray-600">Status</th>
                    <th className="text-left px-6 py-4 text-sm font-medium text-gray-600">Contact Info</th>
                    <th className="text-left px-6 py-4 text-sm font-medium text-gray-600">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {loading ? (
                    <tr>
                      <td colSpan={5} className="text-center py-10 text-gray-500">
                        Loading restaurants...
                      </td>
                    </tr>
                  ) : restaurants.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="text-center py-10 text-gray-500">
                        No restaurants found
                      </td>
                    </tr>
                  ) : (
                    restaurants.map((restaurant) => (
                      <tr
                        key={restaurant._id}
                        className="border-b border-gray-100 hover:bg-gray-50 transition"
                      >
                        {/* Name */}
                        <td className="px-6 py-6">
                          <div className="flex items-center gap-4">
                            <div className="w-12 h-12 rounded-lg overflow-hidden ring-4 ring-gray-100">
                              <Image
                                src={restaurant.logoUrl || "/placeholder.png"}
                                alt={restaurant.name}
                                width={48}
                                height={48}
                                className="object-cover"
                              />
                            </div>
                            <span className="font-medium text-gray-900">
                              {restaurant.name}
                            </span>
                          </div>
                        </td>

                        {/* Rating (placeholder for now) */}
                        <td className="px-6 py-6">
                          <span className="text-orange-600 font-medium">★ 4.5</span>
                        </td>

                        {/* Status */}
                        <td className="px-6 py-6">
                          <span
                            className={`px-4 py-2 rounded-full text-sm font-medium ${restaurant.isActive
                              ? "bg-green-100 text-green-700"
                              : "bg-red-100 text-red-700"
                              }`}
                          >
                            {restaurant.isActive ? "Active" : "Deactivated"}
                          </span>
                        </td>

                        {/* Contact */}
                        <td className="px-6 py-6 text-gray-700 whitespace-pre-line">
                          {restaurant.contactPhone}
                          {"\n"}
                          {restaurant.contactEmail}
                        </td>

                        {/* Actions */}
                        <td className="px-6 py-6">
                          <div className="flex items-center gap-4">
                            <button
                              onClick={() => router.push(`/view-restaurants/${restaurant._id}`)}
                              className="text-gray-600 hover:text-blue-600 transition"
                            >
                              <Eye className="w-5 h-5" />
                            </button>

                            <button
                              onClick={() => router.push(`/edit-restaurants/${restaurant._id}`)}
                              className="text-gray-600 hover:text-green-600 transition"
                            >
                              <Edit className="w-5 h-5" />
                            </button>

                            <button
                              onClick={() => handleDelete(restaurant._id)}
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

            {/* Pagination */}
            <div className="px-6 py-5 border-t border-gray-200 flex items-center justify-between">
              <p className="text-gray-600 text-sm">Showing {restaurants.length} of {totalCount} restaurants</p>
              {totalPages > 1 && (
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                    disabled={currentPage === 1}
                    className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg disabled:opacity-50 transition"
                  >
                    Previous
                  </button>
                  <span className="px-4 py-2 bg-red-500 text-white rounded-lg">{currentPage}</span>
                  <span className="text-gray-500">of {totalPages}</span>
                  <button
                    onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                    disabled={currentPage === totalPages}
                    className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg disabled:opacity-50 transition"
                  >
                    Next
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Footer */}
        <footer className="text-center text-gray-500 text-sm py-6 border-t border-gray-200">
          © 2025 KhanaSathi. All rights reserved.
        </footer>
      </div>
    </div>
  );
}