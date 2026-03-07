"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Upload, LogOut } from "lucide-react";
import toast from "react-hot-toast";
import { useAuth } from "@/context/AuthContext";
import { submitChildOnboarding } from "@/lib/userService";

async function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result || ""));
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

export default function ChildOnboardingPage() {
  const router = useRouter();
  const { user, isAuthenticated, isLoading, updateUser, logout } = useAuth();
  const [displayName, setDisplayName] = useState("");
  const [dateOfBirth, setDateOfBirth] = useState("");
  const [birthCertificate, setBirthCertificate] = useState("");
  const [childPhoto, setChildPhoto] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (user?.username && !displayName) {
      setDisplayName(user.username);
    }
  }, [user?.username, displayName]);

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push("/login");
      return;
    }

    if (user?.role && user.role !== "child") {
      router.push("/browse-restaurants");
      return;
    }

    if (user?.role === "child" && user.isProfileComplete) {
      if (user.isApproved) {
        router.push("/browse-restaurants");
      } else {
        router.push("/child-verification-pending");
      }
    }
  }, [isLoading, isAuthenticated, user, router]);

  const handleBirthCertificateUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const isPdf = file.type === "application/pdf" || file.name.toLowerCase().endsWith(".pdf");
    if (!isPdf) {
      toast.error("Birth certificate must be a PDF file");
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      toast.error("Birth certificate file must be less than 5MB");
      return;
    }
    const base64 = await fileToBase64(file);
    setBirthCertificate(base64);
  };

  const handleChildPhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      toast.error("Child photo must be an image");
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      toast.error("Child photo must be less than 5MB");
      return;
    }
    const base64 = await fileToBase64(file);
    setChildPhoto(base64);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!birthCertificate || !childPhoto) {
      toast.error("Birth certificate and child photo are required");
      return;
    }

    try {
      setSubmitting(true);
      const res = await submitChildOnboarding({
        displayName: displayName.trim() || undefined,
        dateOfBirth: dateOfBirth || undefined,
        birthCertificate,
        childPhoto
      });

      if (res.error) {
        toast.error(res.error);
        return;
      }

      updateUser({
        ...user!,
        isProfileComplete: true,
        isApproved: false,
        profilePicture: childPhoto,
        childProfile: {
          ...(user?.childProfile || {}),
          displayName: displayName.trim() || user?.username,
          onboardingSubmittedAt: res.data?.data?.onboardingSubmittedAt
        }
      });

      toast.success("Onboarding submitted. Waiting for admin approval.");
      router.push("/child-verification-pending");
    } catch (error) {
      console.error("Child onboarding submission failed:", error);
      toast.error("Failed to submit onboarding");
    } finally {
      setSubmitting(false);
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
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4 py-8">
      <div className="w-full max-w-2xl bg-white border border-gray-200 rounded-2xl p-8 shadow-sm">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900">Child Onboarding</h1>
          <p className="text-gray-600 mt-2">
            Complete onboarding to submit your account for admin verification.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Child Display Name</label>
            <input
              type="text"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500"
              placeholder="Enter display name"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Date of Birth</label>
            <input
              type="date"
              value={dateOfBirth}
              onChange={(e) => setDateOfBirth(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Birth Certificate</label>
            <label className="w-full flex items-center justify-center gap-2 border border-dashed border-gray-300 rounded-lg p-4 cursor-pointer hover:bg-gray-50">
              <Upload className="w-4 h-4 text-gray-500" />
              <span className="text-sm text-gray-600">
                {birthCertificate ? "Birth certificate uploaded (PDF)" : "Upload birth certificate (PDF only)"}
              </span>
              <input
                type="file"
                accept="application/pdf,.pdf"
                className="hidden"
                onChange={handleBirthCertificateUpload}
              />
            </label>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Child Photo</label>
            <label className="w-full flex items-center justify-center gap-2 border border-dashed border-gray-300 rounded-lg p-4 cursor-pointer hover:bg-gray-50">
              <Upload className="w-4 h-4 text-gray-500" />
              <span className="text-sm text-gray-600">
                {childPhoto ? "Child photo uploaded" : "Upload child photo"}
              </span>
              <input
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleChildPhotoUpload}
              />
            </label>
          </div>

          <button
            type="submit"
            disabled={submitting}
            className="w-full bg-red-500 text-white py-3 rounded-lg font-medium hover:bg-red-600 disabled:opacity-60"
          >
            {submitting ? "Submitting..." : "Submit for Verification"}
          </button>
        </form>

        <button
          onClick={logout}
          className="mt-4 w-full inline-flex items-center justify-center gap-2 border border-gray-300 text-gray-700 py-2 rounded-lg hover:bg-gray-50"
        >
          <LogOut className="w-4 h-4" />
          Logout
        </button>
      </div>
    </div>
  );
}
