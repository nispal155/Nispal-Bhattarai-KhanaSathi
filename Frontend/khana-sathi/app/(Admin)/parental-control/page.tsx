"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import {
  Loader2,
  ShieldCheck,
  Plus,
  Save,
  Trash2,
  Lock,
  Unlock,
  Search,
  RefreshCcw,
  FileText,
  Image as ImageIcon,
  Download,
  Eye,
  X
} from "lucide-react";
import toast from "react-hot-toast";
import UserHeader from "@/components/layout/UserHeader";
import AdminSidebar from "@/components/admin/AdminSidebar";
import { useAuth } from "@/context/AuthContext";
import {
  ChildAccount,
  UserProfile,
  adminUpdateUser,
  createChildAccount,
  deleteChildAccount,
  getAllUsers,
  getMyChildAccounts,
  updateChildAccount
} from "@/lib/userService";

type EditableChild = {
  email: string;
  displayName: string;
  password: string;
  isActive: boolean;
};

const CHILD_EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const formatDisplayDate = (dateValue?: string) =>
  dateValue ? new Date(dateValue).toLocaleDateString() : "N/A";
const isImageDocument = (value: string) => value.startsWith("data:image/");
const isPdfDataUrl = (value: string) => value.toLowerCase().startsWith("data:application/pdf");

export default function ParentalControlPage() {
  const { user, isAuthenticated, isLoading: authLoading } = useAuth();
  const [children, setChildren] = useState<ChildAccount[]>([]);
  const [adminChildren, setAdminChildren] = useState<UserProfile[]>([]);
  const [adminSearch, setAdminSearch] = useState("");
  const [adminSubmittingId, setAdminSubmittingId] = useState<string | null>(null);
  const [photoPreview, setPhotoPreview] = useState<{ src: string; label: string } | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [editState, setEditState] = useState<Record<string, EditableChild>>({});
  const [newChild, setNewChild] = useState({
    email: "",
    displayName: "",
    password: ""
  });

  const loadChildren = async () => {
    try {
      setLoading(true);
      const res = await getMyChildAccounts();
      if (res.error) {
        toast.error(res.error);
        return;
      }
      const list = res.data?.data || [];
      setChildren(Array.isArray(list) ? list : []);
    } catch (error) {
      console.error("Failed to fetch child accounts:", error);
      toast.error("Failed to load child accounts");
    } finally {
      setLoading(false);
    }
  };

  const loadAdminChildren = async (searchTerm = "") => {
    try {
      setLoading(true);
      const res = await getAllUsers({
        role: "child",
        search: searchTerm || undefined,
        limit: 200,
        page: 1
      });

      if (res.error) {
        toast.error(res.error);
        return;
      }

      const list = res.data?.data || [];
      setAdminChildren(Array.isArray(list) ? list : []);
    } catch (error) {
      console.error("Failed to fetch child accounts for admin:", error);
      toast.error("Failed to load child details");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      window.location.href = "/login";
      return;
    }

    if (isAuthenticated && user?.role === "customer") {
      loadChildren();
    } else if (isAuthenticated && user?.role === "admin") {
      loadAdminChildren();
    } else if (!authLoading) {
      setLoading(false);
    }
  }, [isAuthenticated, authLoading, user?.role]);

  const handleCreateChild = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!newChild.email || !newChild.password) {
      toast.error("Child email and password are required");
      return;
    }

    if (!CHILD_EMAIL_REGEX.test(newChild.email.trim())) {
      toast.error("Please enter a valid child email address");
      return;
    }

    if (newChild.password.length < 6) {
      toast.error("Password must be at least 6 characters");
      return;
    }

    try {
      setSubmitting(true);
      const res = await createChildAccount({
        email: newChild.email.trim().toLowerCase(),
        displayName: newChild.displayName.trim() || undefined,
        password: newChild.password
      });

      if (res.error) {
        toast.error(res.error);
        return;
      }

      toast.success("Child account created");
      setNewChild({ email: "", displayName: "", password: "" });
      await loadChildren();
    } catch (error) {
      console.error("Failed to create child account:", error);
      toast.error("Failed to create child account");
    } finally {
      setSubmitting(false);
    }
  };

  const beginEdit = (child: ChildAccount) => {
    setEditState((prev) => ({
      ...prev,
      [child._id]: {
        email: child.email,
        displayName: child.displayName || child.username,
        password: "",
        isActive: child.isActive
      }
    }));
  };

  const cancelEdit = (childId: string) => {
    setEditState((prev) => {
      const next = { ...prev };
      delete next[childId];
      return next;
    });
  };

  const handleSaveChild = async (childId: string) => {
    const draft = editState[childId];
    if (!draft) return;

    if (!draft.email.trim()) {
      toast.error("Child email is required");
      return;
    }

    if (!CHILD_EMAIL_REGEX.test(draft.email.trim())) {
      toast.error("Please enter a valid child email address");
      return;
    }

    if (draft.password && draft.password.length < 6) {
      toast.error("New password must be at least 6 characters");
      return;
    }

    try {
      const res = await updateChildAccount(childId, {
        email: draft.email.trim().toLowerCase(),
        displayName: draft.displayName.trim(),
        isActive: draft.isActive,
        password: draft.password || undefined
      });

      if (res.error) {
        toast.error(res.error);
        return;
      }

      toast.success("Child account updated");
      cancelEdit(childId);
      await loadChildren();
    } catch (error) {
      console.error("Failed to update child account:", error);
      toast.error("Failed to update child account");
    }
  };

  const handleDeleteChild = async (childId: string) => {
    if (!confirm("Delete this child account permanently?")) return;

    try {
      const res = await deleteChildAccount(childId);
      if (res.error) {
        toast.error(res.error);
        return;
      }
      toast.success("Child account deleted");
      await loadChildren();
    } catch (error) {
      console.error("Failed to delete child account:", error);
      toast.error("Failed to delete child account");
    }
  };

  const handleAdminSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    await loadAdminChildren(adminSearch.trim());
  };

  const handleAdminReset = async () => {
    setAdminSearch("");
    await loadAdminChildren("");
  };

  const handleAdminApproval = async (childId: string, currentStatus: boolean) => {
    try {
      setAdminSubmittingId(childId);
      const res = await adminUpdateUser(childId, { isApproved: !currentStatus });
      if (res.error) {
        toast.error(res.error);
        return;
      }

      toast.success(currentStatus ? "Child access revoked" : "Child approved successfully");
      await loadAdminChildren(adminSearch.trim());
    } catch (error) {
      console.error("Failed to update child approval:", error);
      toast.error("Failed to update child approval");
    } finally {
      setAdminSubmittingId(null);
    }
  };

  const createPdfAccessUrl = (doc: string) => {
    if (!isPdfDataUrl(doc)) {
      return { url: doc, revoke: null as null | (() => void) };
    }

    const commaIndex = doc.indexOf(",");
    if (commaIndex === -1) {
      throw new Error("Invalid PDF format");
    }

    const base64 = doc.slice(commaIndex + 1);
    const binaryString = atob(base64);
    const bytes = new Uint8Array(binaryString.length);
    for (let i = 0; i < binaryString.length; i += 1) {
      bytes[i] = binaryString.charCodeAt(i);
    }

    const blob = new Blob([bytes], { type: "application/pdf" });
    const objectUrl = URL.createObjectURL(blob);
    return {
      url: objectUrl,
      revoke: () => URL.revokeObjectURL(objectUrl)
    };
  };

  const handleViewBirthCertificate = (doc: string) => {
    try {
      const { url, revoke } = createPdfAccessUrl(doc);
      const openedWindow = window.open(url, "_blank", "noopener,noreferrer");
      if (!openedWindow) {
        if (revoke) revoke();
        toast.error("Could not open PDF. Please allow popups for this site.");
        return;
      }

      if (revoke) {
        setTimeout(revoke, 60_000);
      }
    } catch (error) {
      console.error("Failed to open PDF:", error);
      toast.error("Failed to open birth certificate PDF");
    }
  };

  const handleDownloadBirthCertificate = (doc: string, childId: string) => {
    try {
      const { url, revoke } = createPdfAccessUrl(doc);
      const link = document.createElement("a");
      link.href = url;
      link.download = `birth_certificate_${childId}.pdf`;
      document.body.appendChild(link);
      link.click();
      link.remove();

      if (revoke) {
        setTimeout(revoke, 5_000);
      }
    } catch (error) {
      console.error("Failed to download PDF:", error);
      toast.error("Failed to download birth certificate PDF");
    }
  };

  const renderBirthCertificatePreview = (doc: string | undefined, childId: string) => {
    if (!doc) {
      return <p className="text-sm text-gray-500">Not submitted</p>;
    }

    return (
      <div className="space-y-2">
        <div className="h-44 rounded-lg border border-dashed border-gray-300 bg-gray-50 flex flex-col items-center justify-center text-gray-500 gap-2">
          <FileText className="w-6 h-6" />
          <span className="text-sm">PDF uploaded</span>
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => handleViewBirthCertificate(doc)}
            className="inline-flex items-center gap-2 text-sm font-medium text-red-500 hover:text-red-600"
          >
            <Eye className="w-4 h-4" />
            View PDF
          </button>
          <button
            type="button"
            onClick={() => handleDownloadBirthCertificate(doc, childId)}
            className="inline-flex items-center gap-2 text-sm font-medium text-blue-600 hover:text-blue-700"
          >
            <Download className="w-4 h-4" />
            Download PDF
          </button>
        </div>
      </div>
    );
  };

  const renderChildPhotoPreview = (doc: string | undefined) => {
    if (!doc) {
      return <p className="text-sm text-gray-500">Not submitted</p>;
    }

    return (
      <div className="space-y-2">
        {isImageDocument(doc) ? (
          <Image
            src={doc}
            alt="Child Photo"
            width={640}
            height={320}
            unoptimized
            className="w-full h-44 object-cover rounded-lg border border-gray-200"
          />
        ) : (
          <div className="h-44 rounded-lg border border-dashed border-gray-300 bg-gray-50 flex flex-col items-center justify-center text-gray-500 gap-2">
            <ImageIcon className="w-6 h-6" />
            <span className="text-sm">Photo available</span>
          </div>
        )}
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => setPhotoPreview({ src: doc, label: "Child Photo" })}
            className="inline-flex items-center gap-2 text-sm font-medium text-red-500 hover:text-red-600"
          >
            <Eye className="w-4 h-4" />
            View Photo
          </button>
          <a
            href={doc}
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-2 text-sm font-medium text-blue-600 hover:text-blue-700"
          >
            <ImageIcon className="w-4 h-4" />
            Open in new tab
          </a>
        </div>
      </div>
    );
  };

  if (authLoading || loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-red-500" />
      </div>
    );
  }

  if (!isAuthenticated) return null;

  if (user?.role === "admin") {
    return (
      <div className="min-h-screen bg-gray-50 flex">
        <AdminSidebar />
        <main className="flex-1 overflow-auto p-8">
          <header className="mb-6">
            <h2 className="text-3xl font-bold text-gray-900">Parental Control</h2>
            <p className="text-gray-600 mt-2">
              Review child onboarding details and submitted documents before approval.
            </p>
          </header>

          <div className="bg-white border border-gray-200 rounded-xl p-5 mb-6">
            <form onSubmit={handleAdminSearch} className="flex flex-col md:flex-row gap-3">
              <div className="relative flex-1">
                <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={adminSearch}
                  onChange={(e) => setAdminSearch(e.target.value)}
                  placeholder="Search child by name or email"
                  className="w-full pl-9 pr-3 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500"
                />
              </div>
              <button
                type="submit"
                className="px-4 py-2.5 bg-red-500 text-white rounded-lg hover:bg-red-600"
              >
                Search
              </button>
              <button
                type="button"
                onClick={handleAdminReset}
                className="inline-flex items-center justify-center gap-2 px-4 py-2.5 border border-gray-300 rounded-lg hover:bg-gray-50"
              >
                <RefreshCcw className="w-4 h-4" />
                Reset
              </button>
            </form>
          </div>

          <div className="bg-white border border-gray-200 rounded-xl p-6">
            <h3 className="text-xl font-semibold text-gray-900 mb-4">
              Child Accounts ({adminChildren.length})
            </h3>

            {adminChildren.length === 0 ? (
              <p className="text-gray-500 text-center py-10">No child accounts found.</p>
            ) : (
              <div className="space-y-5">
                {adminChildren.map((child) => {
                  const parentInfo =
                    typeof child.parentAccount === "object" && child.parentAccount
                      ? `${child.parentAccount.username || "Parent"}${child.parentAccount.email ? ` (${child.parentAccount.email})` : ""}`
                      : typeof child.parentAccount === "string"
                        ? child.parentAccount
                        : "Not linked";
                  const isChildActive = child.childProfile?.isActive !== false;

                  return (
                    <div key={child._id} className="border border-gray-200 rounded-lg p-5">
                      <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4">
                        <div>
                          <p className="text-lg font-semibold text-gray-900">
                            {child.childProfile?.displayName || child.username}
                          </p>
                          <p className="text-sm text-gray-600">{child.email}</p>
                          <p className="text-sm text-gray-600 mt-1">Parent: {parentInfo}</p>
                          <p className="text-xs text-gray-500 mt-1">
                            Created: {formatDisplayDate(child.createdAt)} | DOB: {formatDisplayDate(child.dateOfBirth)}
                          </p>
                          {child.childProfile?.onboardingSubmittedAt && (
                            <p className="text-xs text-gray-500 mt-1">
                              Onboarding submitted: {formatDisplayDate(child.childProfile.onboardingSubmittedAt)}
                            </p>
                          )}
                        </div>

                        <div className="flex flex-wrap gap-2 lg:justify-end">
                          <span className={`px-3 py-1 rounded-full text-xs font-medium ${isChildActive ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"}`}>
                            {isChildActive ? "Active" : "Disabled by parent"}
                          </span>
                          <span className={`px-3 py-1 rounded-full text-xs font-medium ${child.isProfileComplete ? "bg-blue-100 text-blue-700" : "bg-yellow-100 text-yellow-700"}`}>
                            {child.isProfileComplete ? "Onboarding complete" : "Onboarding pending"}
                          </span>
                          <span className={`px-3 py-1 rounded-full text-xs font-medium ${child.isApproved ? "bg-teal-100 text-teal-700" : "bg-orange-100 text-orange-700"}`}>
                            {child.isApproved ? "Approved" : "Pending review"}
                          </span>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-5">
                        <div className="border border-gray-200 rounded-lg p-3">
                          <p className="font-medium text-gray-800 mb-2">Birth Certificate</p>
                          {renderBirthCertificatePreview(child.childProfile?.birthCertificate, child._id)}
                        </div>
                        <div className="border border-gray-200 rounded-lg p-3">
                          <p className="font-medium text-gray-800 mb-2">Child Photo</p>
                          {renderChildPhotoPreview(child.childProfile?.childPhoto || child.profilePicture)}
                        </div>
                      </div>

                      <div className="mt-5 flex justify-end">
                        <button
                          onClick={() => handleAdminApproval(child._id, child.isApproved)}
                          disabled={!child.isProfileComplete || adminSubmittingId === child._id}
                          className={`px-4 py-2 rounded-lg text-sm font-medium disabled:opacity-50 ${child.isApproved
                            ? "bg-red-500 text-white hover:bg-red-600"
                            : "bg-teal-600 text-white hover:bg-teal-700"
                            }`}
                        >
                          {adminSubmittingId === child._id
                            ? "Updating..."
                            : child.isApproved
                              ? "Revoke Approval"
                              : child.isProfileComplete
                                ? "Approve Child"
                                : "Waiting Onboarding"}
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {photoPreview && (
            <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4">
              <div className="relative w-full max-w-3xl bg-white rounded-xl p-4">
                <button
                  type="button"
                  onClick={() => setPhotoPreview(null)}
                  className="absolute top-3 right-3 p-1 rounded-md hover:bg-gray-100"
                >
                  <X className="w-5 h-5 text-gray-600" />
                </button>
                <p className="text-sm font-medium text-gray-700 mb-3">{photoPreview.label}</p>
                <Image
                  src={photoPreview.src}
                  alt={photoPreview.label}
                  width={1200}
                  height={900}
                  unoptimized
                  className="w-full h-auto max-h-[75vh] object-contain rounded-lg border border-gray-200"
                />
              </div>
            </div>
          )}
        </main>
      </div>
    );
  }

  if (user?.role !== "customer") {
    return (
      <div className="min-h-screen bg-gray-50">
        <UserHeader />
        <div className="max-w-4xl mx-auto p-8">
          <div className="bg-white border border-gray-200 rounded-xl p-8 text-center">
            <ShieldCheck className="w-12 h-12 text-red-500 mx-auto mb-3" />
            <h1 className="text-2xl font-bold text-gray-900 mb-2">Parental control is unavailable</h1>
            <p className="text-gray-600 mb-6">Only customer parent accounts can manage linked child accounts.</p>
            <Link href="/browse-restaurants" className="text-red-500 font-medium hover:underline">
              Back to home
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <UserHeader />

      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
        <div className="bg-white border border-gray-200 rounded-xl p-6">
          <div className="flex items-center gap-3 mb-4">
            <ShieldCheck className="w-6 h-6 text-red-500" />
            <h1 className="text-2xl font-bold text-gray-900">Parental Control</h1>
          </div>
          <p className="text-gray-600">
            Create and manage child accounts. Children can sign in with their email and password on their own device.
          </p>
        </div>

        <div className="bg-white border border-gray-200 rounded-xl p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Create Child Account</h2>
          <form onSubmit={handleCreateChild} className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <input
              type="email"
              placeholder="Child email"
              value={newChild.email}
              onChange={(e) => setNewChild((prev) => ({ ...prev, email: e.target.value }))}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500"
            />
            <input
              type="text"
              placeholder="Display name (optional)"
              value={newChild.displayName}
              onChange={(e) => setNewChild((prev) => ({ ...prev, displayName: e.target.value }))}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500"
            />
            <input
              type="password"
              placeholder="Password"
              value={newChild.password}
              onChange={(e) => setNewChild((prev) => ({ ...prev, password: e.target.value }))}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500"
            />
            <button
              type="submit"
              disabled={submitting}
              className="inline-flex items-center justify-center gap-2 px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 disabled:opacity-60"
            >
              {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
              Add Child
            </button>
          </form>
        </div>

        <div className="bg-white border border-gray-200 rounded-xl p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Linked Child Accounts</h2>

          {children.length === 0 ? (
            <p className="text-gray-500 py-6 text-center">No child accounts yet.</p>
          ) : (
            <div className="space-y-4">
              {children.map((child) => {
                const draft = editState[child._id];
                const isEditing = Boolean(draft);

                return (
                  <div key={child._id} className="border border-gray-200 rounded-lg p-4">
                    {!isEditing ? (
                      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
                        <div>
                          <p className="font-semibold text-gray-900">{child.displayName || child.username}</p>
                          <p className="text-sm text-gray-600">{child.email}</p>
                          <p className="text-xs text-gray-500 mt-1">
                            {child.isProfileComplete
                              ? (child.isApproved ? "Approved for full access" : "Onboarding done, pending admin review")
                              : "Onboarding incomplete"}
                          </p>
                          <p className={`text-xs mt-1 ${child.isActive ? "text-green-600" : "text-red-500"}`}>
                            {child.isActive ? "Active (can login)" : "Disabled"}
                          </p>
                        </div>
                        <div className="flex flex-wrap gap-2">
                          <button
                            onClick={() => beginEdit(child)}
                            className="px-3 py-1.5 text-sm border border-gray-300 rounded-md hover:bg-gray-50"
                          >
                            Edit
                          </button>
                          <button
                            onClick={() => handleDeleteChild(child._id)}
                            className="inline-flex items-center gap-1 px-3 py-1.5 text-sm border border-red-200 text-red-500 rounded-md hover:bg-red-50"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                            Delete
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div className="space-y-3">
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                          <input
                            type="email"
                            value={draft.email}
                            onChange={(e) =>
                              setEditState((prev) => ({
                                ...prev,
                                [child._id]: { ...prev[child._id], email: e.target.value }
                              }))
                            }
                            placeholder="Child email"
                            className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500"
                          />
                          <input
                            type="text"
                            value={draft.displayName}
                            onChange={(e) =>
                              setEditState((prev) => ({
                                ...prev,
                                [child._id]: { ...prev[child._id], displayName: e.target.value }
                              }))
                            }
                            placeholder="Display name"
                            className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500"
                          />
                          <input
                            type="password"
                            value={draft.password}
                            onChange={(e) =>
                              setEditState((prev) => ({
                                ...prev,
                                [child._id]: { ...prev[child._id], password: e.target.value }
                              }))
                            }
                            placeholder="New password (optional)"
                            className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500"
                          />
                        </div>

                        <div className="flex flex-wrap items-center gap-3">
                          <button
                            onClick={() =>
                              setEditState((prev) => ({
                                ...prev,
                                [child._id]: {
                                  ...prev[child._id],
                                  isActive: !prev[child._id].isActive
                                }
                              }))
                            }
                            className="inline-flex items-center gap-1 px-3 py-1.5 text-sm border border-gray-300 rounded-md hover:bg-gray-50"
                          >
                            {draft.isActive ? <Unlock className="w-4 h-4" /> : <Lock className="w-4 h-4" />}
                            {draft.isActive ? "Set Disabled" : "Set Active"}
                          </button>
                          <button
                            onClick={() => handleSaveChild(child._id)}
                            className="inline-flex items-center gap-1 px-3 py-1.5 text-sm bg-red-500 text-white rounded-md hover:bg-red-600"
                          >
                            <Save className="w-4 h-4" />
                            Save
                          </button>
                          <button
                            onClick={() => cancelEdit(child._id)}
                            className="px-3 py-1.5 text-sm border border-gray-300 rounded-md hover:bg-gray-50"
                          >
                            Cancel
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
