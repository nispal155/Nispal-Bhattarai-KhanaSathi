"use client";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { Eye, Edit, Trash2 } from "lucide-react";
import AdminSidebar from "@/components/admin/AdminSidebar";

export default function AdminDashboard() {
  const recentOrders = [
    { id: "FF1005", customer: "Eve Davis", restaurant: "The Green Plate", amount: "NPR 320", status: "pending" },
    { id: "FF1004", customer: "Diana Miller", restaurant: "Sushi Delight", amount: "NPR 332", status: "canceled" },
    { id: "FF1003", customer: "Charlie Brown", restaurant: "Burger Haven", amount: "NPR 223", status: "delivered" },
    { id: "FF1002", customer: "Bob Johnson", restaurant: "Spice Route", amount: "NPR 290", status: "pending" },
    { id: "FF1001", customer: "Alice Smith", restaurant: "Pizzeria Bella", amount: "NPR 300", status: "delivered" },
    { id: "FF1001", customer: "Alice Smith", restaurant: "Pizzeria Bella", amount: "NPR 300", status: "delivered" },
    { id: "FF1001", customer: "Alice Smith", restaurant: "Pizzeria Bella", amount: "NPR 300", status: "delivered" },
    { id: "FF1001", customer: "Alice Smith", restaurant: "Pizzeria Bella", amount: "NPR 300", status: "delivered" },
    { id: "FF1001", customer: "Alice Smith", restaurant: "Pizzeria Bella", amount: "NPR 300", status: "delivered" },
    { id: "FF1001", customer: "Alice Smith", restaurant: "Pizzeria Bella", amount: "NPR 300", status: "delivered" },

  ];
  const router = useRouter();
  return (

    <div className="min-h-screen bg-gray-50 flex">
      <AdminSidebar />




      {/* Main Content */}
      <div className="flex-1 overflow-auto">
        {/* Header */}
        <header className="bg-white shadow-sm border-b border-gray-200 px-8 py-5 flex items-center justify-between">
          <h2 className="text-3xl font-bold text-gray-900">Dashboard Overview</h2>
          <div className="w-12 h-12 rounded-full overflow-hidden ring-4 ring-orange-100">
            <Image src="/admin-avatar.jpg" alt="Admin" width={48} height={48} className="object-cover" />
          </div>
        </header>
        <div className="p-8">
          {/* Key Metrics */}
          <div className="mb-10">
            <h3 className="text-xl font-semibold text-gray-800 mb-6">Key Metrics</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <div className="bg-white rounded-2xl  p-6 border border-gray-200">
                <p className="text-gray-600 mb-2">Total Orders</p>
                <p className="text-4xl font-bold text-gray-900">1,245</p>
                <p className="text-green-600 text-sm mt-2 flex items-center gap-1">
                  <span>↑</span> +12.5% ↑ from previous period
                </p>
              </div>

              <div className="bg-white rounded-2xl  p-6 border border-gray-200">
                <p className="text-gray-600 mb-2">Total Revenue</p>
                <p className="text-4xl font-bold text-gray-900">NPR 52,100</p>
                <p className="text-green-600 text-sm mt-2 flex items-center gap-1">
                  <span>↑</span> +8.2% ↑ from previous period
                </p>
              </div>

              <div className="bg-white rounded-2xl  p-6 border border-gray-200">
                <p className="text-gray-600 mb-2">Active Restaurants</p>
                <p className="text-4xl font-bold text-gray-900">78</p>
                <p className="text-green-600 text-sm mt-2 flex items-center gap-1">
                  <span>↑</span> +0.5% ↑ from previous period
                </p>
              </div>

              <div className="bg-white rounded-2xl  p-6 border border-gray-200">
                <p className="text-gray-600 mb-2">Active Delivery Staff</p>
                <p className="text-4xl font-bold text-gray-900">45</p>
                <p className="text-red-600 text-sm mt-2 flex items-center gap-1">
                  <span>↓</span> -1.2% ↓ from previous period
                </p>
              </div>
            </div>
          </div>

          {/* Recent Orders */}
          <div className="mb-10">
            <h3 className="text-xl font-semibold text-gray-800 mb-6">Recent Orders</h3>
            <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50 border-b border-gray-200">
                    <tr>
                      <th className="text-left px-6 py-4 text-sm font-medium text-gray-600">ORDER ID</th>
                      <th className="text-left px-6 py-4 text-sm font-medium text-gray-600">CUSTOMER</th>
                      <th className="text-left px-6 py-4 text-sm font-medium text-gray-600">RESTAURANT</th>
                      <th className="text-left px-6 py-4 text-sm font-medium text-gray-600">AMOUNT</th>
                      <th className="text-left px-6 py-4 text-sm font-medium text-gray-600">STATUS</th>
                      <th className="text-left px-6 py-4 text-sm font-medium text-gray-600">ACTIONS</th>
                    </tr>
                  </thead>
                  <tbody>
                    {recentOrders.map((order) => (
                      <tr key={order.id} className="border-b border-gray-100 hover:bg-gray-50">
                        <td className="px-6 py-5 font-medium text-blue-600">#{order.id}</td>
                        <td className="px-6 py-5 text-gray-900">{order.customer}</td>
                        <td className="px-6 py-5 text-gray-900">{order.restaurant}</td>
                        <td className="px-6 py-5 font-semibold text-gray-900">{order.amount}</td>

                        <td className="px-6 py-5">
                          <span
                            className={`px-4 py-2 rounded-full text-sm font-medium ${order.status === "pending"
                              ? "bg-yellow-100 text-yellow-700"
                              : order.status === "canceled"
                                ? "bg-red-100 text-red-700"
                                : "bg-green-100 text-green-700"
                              }`}
                          >
                            {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
                          </span>
                        </td>
                        <td className="px-6 py-5">
                          <div className="flex items-center gap-3">
                            <button className="text-gray-600 hover:text-blue-600">
                              <Eye className="w-5 h-5" />
                            </button>
                            <button className="text-gray-600 hover:text-orange-600">
                              <Edit className="w-5 h-5" />
                            </button>
                            <button className="text-gray-600 hover:text-red-600">
                              <Trash2 className="w-5 h-5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="flex gap-6">
            <button onClick={() => router.push("/add-restaurants")}
              className="bg-red-500 hover:bg-red-600 text-white px-6 py-3 rounded-full font-medium shadow-md transition"
            >
              Add Restaurant
            </button>

            <button className="cursor-pointer bg-red-500 hover:bg-red-600 text-white px-8 py-4 rounded-full font-bold text-lg shadow-lg transition transform hover:scale-105">
              Add Staff
            </button>
          </div>


        </div>

        {/* Footer */}
        <footer className="text-center text-gray-500 text-sm py-8 border-t border-gray-200 mt-16">
          © 2025 KhanaSathi. All rights reserved.
        </footer>
      </div>

    </div>
  );
}