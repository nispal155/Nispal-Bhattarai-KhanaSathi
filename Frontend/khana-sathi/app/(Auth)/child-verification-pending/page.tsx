"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Clock3, Loader2, CheckCircle } from "lucide-react";
import toast from "react-hot-toast";
import { useAuth } from "@/context/AuthContext";
import { getProfile } from "@/lib/userService";

export default function ChildVerificationPendingPage() {
  const router = useRouter();
  const { user, isAuthenticated, isLoading, updateUser, logout } = useAuth();
  const [checking, setChecking] = useState(false);

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push("/login");
      return;
    }

    if (user?.role && user.role !== "child") {
      router.push("/browse-restaurants");
      return;
    }

    if (user?.role === "child") {
      if (!user.isProfileComplete) {
        router.push("/child-onboarding");
        return;
      }
      if (user.isApproved) {
        router.push("/browse-restaurants");
      }
    }
  }, [isLoading, isAuthenticated, user, router]);

  const checkApprovalStatus = async () => {
    if (!user) return;

    try {
      setChecking(true);
      const res = await getProfile();
      if (res.error || !res.data?.data) {
        toast.error(res.error || "Failed to check approval status");
        return;
      }

      const profile = res.data.data;
      updateUser({
        ...user,
        isProfileComplete: profile.isProfileComplete,
        isApproved: profile.isApproved,
        profilePicture: profile.profilePicture,
        childProfile: profile.childProfile
      });

      if (profile.isApproved) {
        toast.success("Your account has been approved");
        router.push("/browse-restaurants");
      } else {
        toast("Still pending admin review");
      }
    } catch (error) {
      console.error("Approval status check failed:", error);
      toast.error("Failed to check approval status");
    } finally {
      setChecking(false);
    }
  };

  if (isLoading || !user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <Loader2 className="w-8 h-8 animate-spin text-red-500" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
      <div className="w-full max-w-xl bg-white border border-gray-200 rounded-2xl p-8 text-center shadow-sm">
        <div className="w-16 h-16 mx-auto rounded-full bg-yellow-100 flex items-center justify-center mb-4">
          <Clock3 className="w-8 h-8 text-yellow-600" />
        </div>
        <h1 className="text-2xl font-bold text-gray-900 mb-2">Verification Pending</h1>
        <p className="text-gray-600 mb-6">
          Your onboarding has been submitted successfully. Please wait for admin approval before accessing all features.
        </p>

        <button
          onClick={checkApprovalStatus}
          disabled={checking}
          className="w-full bg-red-500 text-white py-3 rounded-lg font-medium hover:bg-red-600 disabled:opacity-60 mb-3"
        >
          {checking ? "Checking..." : "Check Approval Status"}
        </button>

        <button
          onClick={logout}
          className="w-full border border-gray-300 text-gray-700 py-3 rounded-lg font-medium hover:bg-gray-50 inline-flex items-center justify-center gap-2"
        >
          <CheckCircle className="w-4 h-4" />
          Logout
        </button>
      </div>
    </div>
  );
}
