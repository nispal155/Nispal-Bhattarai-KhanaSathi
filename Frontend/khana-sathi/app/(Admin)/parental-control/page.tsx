import AdminSidebar from "@/components/admin/AdminSidebar";
import { Search } from "lucide-react";

export default function ParentalControl() {
  const requests = [
    {
      parent: "Saphal Koirala",
      child: "Saffy Koirala",
      date: "2023-10-26",
      status: "pending",
      documents: true,
    },
    {
      parent: "Bob Williams",
      child: "Chloe Williams",
      date: "2023-10-25",
      status: "approved",
      documents: true,
    },
    {
      parent: "Charlie Brown",
      child: "Daisy Brown",
      date: "2023-10-24",
      status: "rejected",
      documents: true,
    },
    {
      parent: "Diana Miller",
      child: "Ethan Miller",
      date: "2023-10-23",
      status: "pending",
      documents: true,
    },
    {
      parent: "Eve Davis",
      child: "Fiona Davis",
      date: "2023-10-22",
      status: "approved",
      documents: true,
    },
  ];

  return (
    <div className="min-h-screen bg-gray-50 flex">

      {/* Main Content */}
      <div className="flex-1 overflow-auto">
        {/* Header */}
        <header className="bg-white shadow-sm border-b border-gray-200 px-8 py-6 flex items-center justify-between">
          <h2 className="text-3xl font-bold text-gray-900">Parental Control</h2>
          <div className="w-12 h-12 rounded-full overflow-hidden ring-4 ring-orange-100">
            <Image src="/admin-avatar.jpg" alt="Admin" width={48} height={48} className="object-cover" />
          </div>
        </header>

        <div className="p-8">
          {/* Filters */}
          <div className="flex flex-col md:flex-row gap-4 mb-8">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                placeholder="Search by parent or child name..."
                className="w-full pl-12 pr-4 text-black py-3.5 bg-white border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-red-500 transition"
              />
            </div>
            <select className="px-5 py-3.5 bg-white border text-black border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-red-500">
              <option>All Statuses</option>
            </select>
            <button className="bg-red-500 hover:bg-red-600  text-white px-6 py-3.5 rounded-xl font-medium shadow-md transition">
              Apply Filters
            </button>
            <button className="px-6 py-3.5 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl font-medium transition">
              Reset
            </button>
          </div>

          {/* Bulk Actions */}
          <div className="flex justify-end gap-4 mb-6">
            <button className="bg-green-500 hover:bg-green-600 text-white px-6 py-3 rounded-lg font-medium shadow-md transition">
              Approve Selected (0)
            </button>
            <button className="bg-red-100 hover:bg-red-200 text-red-700 px-6 py-3 rounded-lg font-medium transition">
              Reject Selected (0)
            </button>
          </div>

          {/* Table */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="text-left px-6 py-4">

                    </th>
                    <th className="text-left px-6 py-4 text-sm font-medium text-gray-600">Parent Name</th>
                    <th className="text-left px-6 py-4 text-sm font-medium text-gray-600">Child Name</th>
                    <th className="text-left px-6 py-4 text-sm font-medium text-gray-600">Request Date</th>
                    <th className="text-left px-6 py-4 text-sm font-medium text-gray-600">Status</th>
                    <th className="text-left px-6 py-4 text-sm font-medium text-gray-600">Submitted Documents</th>
                    <th className="text-left px-6 py-4 text-sm font-medium text-gray-600">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {requests.map((req, index) => (
                    <tr key={index} className="border-b border-gray-100 hover:bg-gray-50 transition">
                      <td className="px-6 py-5">
                        <input type="checkbox" className="rounded" />
                      </td>
                      <td className="px-6 py-5 font-medium text-gray-900">{req.parent}</td>
                      <td className="px-6 py-5 text-gray-900">{req.child}</td>
                      <td className="px-6 py-5 text-gray-700">{req.date}</td>
                      <td className="px-6 py-5">
                        <span className={`px-4 py-2 rounded-full text-sm font-medium ${req.status === "pending"
                          ? "bg-yellow-100 text-yellow-700"
                          : req.status === "approved"
                            ? "bg-green-100 text-green-700"
                            : "bg-red-100 text-red-700"
                          }`}>
                          {req.status.charAt(0).toUpperCase() + req.status.slice(1)}
                        </span>
                      </td>
                      <td className="px-6 py-5 text-center">
                        {req.documents && (
                          <svg className="w-6 h-6 text-blue-600 mx-auto" fill="currentColor" viewBox="0 0 20 20">
                            <path d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                          </svg>
                        )}
                      </td>
                      <td className="px-6 py-5">
                        <div className="flex items-center gap-3">
                          <button className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg font-medium transition">
                            View
                          </button>
                          <button className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg font-medium transition">
                            Notify Parent
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            <div className="px-6 py-5 border-t border-gray-200 flex items-center justify-center gap-4">
              <button className="text-gray-600 hover:text-gray-900">&lt; Previous</button>
              <div className="flex items-center gap-2">
                <span className="px-3 py-1 bg-red-500 text-white rounded">1</span>
                <span className="px-3 py-1 hover:bg-gray-100 rounded cursor-pointer">2</span>
              </div>
              <button className="text-gray-600 hover:text-gray-900">Next &gt;</button>
            </div>
          </div>
        </div>

        {/* Footer */}
        <footer className="text-center text-gray-500 text-sm py-6 border-t border-gray-200">
          © 2025 Khana Sathi Admin. All rights reserved.
        </footer>
      </div>
    </div>
  );
}