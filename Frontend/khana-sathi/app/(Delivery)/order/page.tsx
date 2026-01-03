"use client";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { MapPin, Clock, Package, Euro, MessageCircle, Navigation, CheckCircle } from "lucide-react";

export default function ActiveDeliveries() {
    const router = useRouter();
  const deliveries = [
    {
      id: "SR98765",
      pickup: "123 Main St, Anytown",
      drop: "456 Oak Ave, Anytown",
      eta: "15 min",
      distance: "3.2 Km",
      items: "Large Pepperoni Pizza, Diet Cola",
      tip: "NPR 100",
      priority: "high",
    },
    {
      id: "SR98765",
      pickup: "123 Main St, Anytown",
      drop: "456 Oak Ave, Anytown",
      eta: "15 min",
      distance: "3.2 Km",
      items: "Large Pepperoni Pizza, Diet Cola",
      tip: "NPR 110",
      priority: "medium",
    },
    {
      id: "SR98765",
      pickup: "123 Main St, Anytown",
      drop: "456 Oak Ave, Anytown",
      eta: "15 min",
      distance: "3.2 Km",
      items: "Large Pepperoni Pizza, Diet Cola",
      tip: "NPR 100",
      priority: "low",
    },
    {
      id: "SR98765",
      pickup: "123 Main St, Anytown",
      drop: "456 Oak Ave, Anytown",
      eta: "15 min",
      distance: "3.2 Km",
      items: "Large Pepperoni Pizza, Diet Cola",
      tip: "NPR 100",
      priority: "very-low",
    },
  ];

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "high": return "bg-red-100 text-red-700 border-red-300";
      case "medium": return "bg-orange-100 text-orange-700 border-orange-300";
      case "low": return "bg-yellow-100 text-yellow-700 border-yellow-300";
      case "very-low": return "bg-gray-100 text-gray-700 border-gray-300";
      default: return "bg-gray-100 text-gray-700";
    }
  };

  const getPriorityText = (priority: string) => {
    switch (priority) {
      case "high": return "High Priority";
      case "medium": return "Medium Priority";
      case "low": return "Low Priority";
      case "very-low": return "Very Low Priority";
      default: return "Normal";
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="relative w-10 h-10">
              <Image src="/logo.png" alt="KhanaSathi" fill className="object-contain" />
            </div>
            <nav className="hidden md:flex items-center gap-10 text-lg font-medium">
              <a href="/rider-dashboard" className="text-gray-600 hover:text-gray-900">Home</a>
              <a href="/order" className="text-orange-600 font-bold">Orders</a>
              <a href="/profile" className="text-gray-600 hover:text-gray-900">Profiles</a>
            </nav>
          </div>
          <div className="w-12 h-12 rounded-full overflow-hidden ring-4 ring-orange-200">
            <Image src="/rider-avatar.jpg" alt="Rider" width={48} height={48} className="object-cover" />
          </div>
        </div>
      </header>

      {/* Page Title + Optimize Route */}
      <div className="px-6 py-8">
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-4xl font-bold text-gray-900">Active Deliveries</h1>
          <button className="bg-red-500 hover:bg-red-600 text-white px-8 py-4 rounded-full font-bold text-lg shadow-lg transition">
            Optimize Route
          </button>
        </div>

        {/* Delivery Cards */}
        <div className="space-y-8">
          {deliveries.map((delivery, index) => (
            <div key={index} className="bg-white rounded-3xl shadow-lg border border-gray-200 overflow-hidden">
              <div className="p-8">
                <div className="flex items-start justify-between mb-6">
                  <h3 className="text-2xl font-bold text-gray-900">Order #{delivery.id}</h3>
                  <span className={`px-5 py-2 rounded-full border text-sm font-medium ${getPriorityColor(delivery.priority)}`}>
                    {getPriorityText(delivery.priority)}
                  </span>
                </div>

                <div className="grid md:grid-cols-2 gap-8">
                  {/* Left Column */}
                  <div className="space-y-5">
                    <div className="flex items-start gap-4">
                      <MapPin className="w-6 h-6 text-gray-500 mt-1" />
                      <div>
                        <p className="text-sm text-gray-600">Pickup :</p>
                        <p className="font-medium text-gray-900">{delivery.pickup}</p>
                      </div>
                    </div>
                    <div className="flex items-start gap-4">
                      <Clock className="w-6 h-6 text-gray-500 mt-1" />
                      <div>
                        <p className="text-sm text-gray-600">ETA :</p>
                        <p className="font-medium text-gray-900">{delivery.eta}</p>
                      </div>
                    </div>
                    <div className="flex items-start gap-4">
                      <Package className="w-6 h-6 text-gray-500 mt-1" />
                      <div>
                        <p className="text-sm text-gray-600">Items :</p>
                        <p className="font-medium text-gray-900">{delivery.items}</p>
                      </div>
                    </div>
                    <div className="flex items-start gap-4">
                      <Euro className="w-6 h-6 text-gray-500 mt-1" />
                      <div>
                        <p className="text-sm text-gray-600">Payment :</p>
                        <p className="font-medium text-green-600">Paid</p>
                      </div>
                    </div>
                  </div>

                  {/* Right Column */}
                  <div className="space-y-5">
                    <div className="flex items-start gap-4">
                      <MapPin className="w-6 h-6 text-gray-500 mt-1" />
                      <div>
                        <p className="text-sm text-gray-600">Drop :</p>
                        <p className="font-medium text-gray-900">{delivery.drop}</p>
                      </div>
                    </div>
                    <div className="flex items-start gap-4">
                      <Navigation className="w-6 h-6 text-gray-500 mt-1" />
                      <div>
                        <p className="text-sm text-gray-600">Distance :</p>
                        <p className="font-medium text-gray-900">{delivery.distance}</p>
                      </div>
                    </div>
                    <div className="flex items-start gap-4">
                      <Euro className="w-6 h-6 text-green-500 mt-1" />
                      <div>
                        <p className="text-sm text-gray-600">Tip :</p>
                        <p className="font-medium text-green-600">{delivery.tip}</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="bg-gray-50 px-8 py-6 border-t border-gray-200">
                <div className="flex items-center justify-between">
                  <div className="flex gap-4">
                    <button onClick={() => router.push("/delivery-chat")} className="flex items-center gap-3 px-6 py-4 text-black bg-white border border-gray-300 rounded-xl hover:bg-gray-50 transition font-medium">
                      <MessageCircle className="w-6 h-6" />
                      Chat
                    </button>
                    <button className="flex items-center gap-3 px-6 py-4 text-black bg-white border border-gray-300 rounded-xl hover:bg-gray-50 transition font-medium">
                      <Navigation className="w-6 h-6" />
                      Navigate
                    </button>
                  </div>
                  <button className="flex items-center gap-3 px-8 py-4 bg-red-500 hover:bg-red-600 text-white rounded-xl transition font-bold shadow-lg">
                    <CheckCircle className="w-6 h-6" />
                    Mark Delivered
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Footer */}
      <footer className="text-center text-gray-500 text-sm py-8 border-t border-gray-200 mt-20">
        © 2025 KhanaSathi. All rights reserved.
      </footer>
    </div>
  );
}