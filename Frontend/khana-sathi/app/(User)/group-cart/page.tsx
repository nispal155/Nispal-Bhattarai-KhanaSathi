"use client";

import React, { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Users,
  Plus,
  ArrowRight,
  Loader2,
  Copy,
  Check,
  UserPlus,
  ShoppingBag,
  Crown,
  Clock,
} from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { useSocket } from "@/context/SocketContext";
import UserHeader from "@/components/layout/UserHeader";
import toast from "react-hot-toast";
import {
  getMyGroupCarts,
  joinGroupCart as joinGroupCartAPI,
  createGroupCart as createGroupCartAPI,
} from "@/lib/groupCartService";
import type { GroupCart } from "@/lib/groupCartService";

export default function GroupCartListPage() {
  const { user } = useAuth();
  const { socket } = useSocket();
  const router = useRouter();
  const [groupCarts, setGroupCarts] = useState<GroupCart[]>([]);
  const [loading, setLoading] = useState(true);
  const [joinCode, setJoinCode] = useState("");
  const [joining, setJoining] = useState(false);
  const [showCreate, setShowCreate] = useState(false);
  const [createName, setCreateName] = useState("");
  const [creating, setCreating] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  // After creation: show the invite code so user can share
  const [createdCart, setCreatedCart] = useState<GroupCart | null>(null);

  /* ── Fetch group carts from API ── */
  const fetchGroupCarts = useCallback(async () => {
    try {
      const response = await getMyGroupCarts();
      const data =
        (response?.data as any)?.data ||
        (response?.data as any) ||
        [];
      setGroupCarts(Array.isArray(data) ? data : []);
    } catch {
      console.error("Error fetching group carts");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchGroupCarts();
  }, [fetchGroupCarts]);

  /* ── Real-time socket listeners ── */
  useEffect(() => {
    if (!socket) return;
    const refresh = () => fetchGroupCarts();
    socket.on("groupCartUpdated", refresh);
    socket.on("memberJoined", refresh);
    socket.on("memberLeft", refresh);
    socket.on("groupCartCancelled", refresh);
    socket.on("groupOrderPlaced", refresh);
    return () => {
      socket.off("groupCartUpdated", refresh);
      socket.off("memberJoined", refresh);
      socket.off("memberLeft", refresh);
      socket.off("groupCartCancelled", refresh);
      socket.off("groupOrderPlaced", refresh);
    };
  }, [socket, fetchGroupCarts]);

  /* ── Join a group cart by invite code ── */
  const handleJoin = async () => {
    if (!joinCode.trim()) {
      toast.error("Enter an invite code");
      return;
    }
    setJoining(true);
    try {
      const response = await joinGroupCartAPI(joinCode.trim());
      if (response?.error) {
        toast.error(response.error);
      } else {
        const gcData =
          (response?.data as any)?.data || (response?.data as any);
        toast.success("Joined group cart!");
        setJoinCode("");
        socket?.emit("join", `group-cart:${gcData?._id}`);
        if (gcData?._id) {
          router.push(`/group-cart/${gcData._id}`);
        } else {
          fetchGroupCarts();
        }
      }
    } catch {
      toast.error("Failed to join group cart");
    } finally {
      setJoining(false);
    }
  };

  /* ── Create a new group cart ── */
  const handleCreate = async () => {
    if (!createName.trim()) {
      toast.error("Enter a group name");
      return;
    }
    setCreating(true);
    try {
      const response = await createGroupCartAPI(createName.trim());
      if (response?.error) {
        toast.error(response.error);
      } else {
        const gcData =
          (response?.data as any)?.data || (response?.data as any);
        toast.success("Group cart created!");
        setShowCreate(false);
        setCreateName("");
        socket?.emit("join", `group-cart:${gcData?._id}`);
        // Show the invite code modal
        setCreatedCart(gcData);
        fetchGroupCarts();
      }
    } catch {
      toast.error("Failed to create group cart");
    } finally {
      setCreating(false);
    }
  };

  const copyCode = (code: string) => {
    navigator.clipboard.writeText(code);
    setCopiedId(code);
    toast.success("Invite code copied!");
    setTimeout(() => setCopiedId(null), 2000);
  };

  const getTimeLeft = (expiresAt: string) => {
    const diff = new Date(expiresAt).getTime() - Date.now();
    if (diff <= 0) return "Expired";
    const h = Math.floor(diff / 3600000);
    const m = Math.floor((diff % 3600000) / 60000);
    if (h > 0) return `${h}h ${m}m left`;
    return `${m}m left`;
  };

  const statusColors: Record<string, string> = {
    open: "bg-green-100 text-green-700",
    locked: "bg-yellow-100 text-yellow-700",
    payment_pending: "bg-blue-100 text-blue-700",
    ordered: "bg-blue-100 text-blue-700",
    cancelled: "bg-red-100 text-red-700",
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <UserHeader />

      <div className="max-w-4xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
              <Users className="w-7 h-7 text-red-500" />
              Group Carts
            </h1>
            <p className="text-gray-500 mt-1">Order together with friends</p>
          </div>
          <button
            onClick={() => setShowCreate(true)}
            className="flex items-center gap-2 bg-red-500 text-white px-4 py-2 rounded-lg hover:bg-red-600 transition"
          >
            <Plus className="w-4 h-4" />
            New Group Cart
          </button>
        </div>

        {/* Join Section */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 mb-6">
          <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3">
            Join a Group Cart
          </h2>
          <div className="flex gap-3">
            <input
              type="text"
              placeholder="Enter invite code (e.g. ABCD1234)"
              value={joinCode}
              onChange={(e) => setJoinCode(e.target.value.toUpperCase())}
              className="flex-1 border border-gray-200 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent uppercase tracking-widest font-mono"
              maxLength={8}
              onKeyDown={(e) => e.key === "Enter" && handleJoin()}
            />
            <button
              onClick={handleJoin}
              disabled={joining || !joinCode.trim()}
              className="bg-red-500 text-white px-5 py-2.5 rounded-lg hover:bg-red-600 transition disabled:opacity-50 flex items-center gap-2"
            >
              {joining ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <UserPlus className="w-4 h-4" />
              )}
              Join
            </button>
          </div>
        </div>

        {/* Create Modal */}
        {showCreate && (
          <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl shadow-xl max-w-md w-full p-6">
              <h2 className="text-lg font-bold text-gray-900 mb-4">
                Create Group Cart
              </h2>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Group Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Friday Lunch Gang"
                    value={createName}
                    onChange={(e) => setCreateName(e.target.value)}
                    className="w-full border border-gray-200 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-red-500"
                    onKeyDown={(e) => e.key === "Enter" && handleCreate()}
                  />
                </div>
                <p className="text-xs text-gray-400">
                  Members can add items from any restaurant after joining.
                </p>
              </div>
              <div className="flex justify-end gap-3 mt-6">
                <button
                  onClick={() => {
                    setShowCreate(false);
                    setCreateName("");
                  }}
                  className="px-4 py-2 text-sm text-gray-600 hover:text-gray-900"
                >
                  Cancel
                </button>
                <button
                  onClick={handleCreate}
                  disabled={creating || !createName.trim()}
                  className="bg-red-500 text-white px-5 py-2 rounded-lg hover:bg-red-600 transition disabled:opacity-50 flex items-center gap-2"
                >
                  {creating && <Loader2 className="w-4 h-4 animate-spin" />}
                  Create
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Invite Code Share Modal — shown after creating a group cart */}
        {createdCart && (
          <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl shadow-xl max-w-md w-full p-6 text-center">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Users className="w-8 h-8 text-green-600" />
              </div>
              <h2 className="text-lg font-bold text-gray-900 mb-1">
                Group Cart Created!
              </h2>
              <p className="text-sm text-gray-500 mb-5">
                Share this invite code with your friends so they can join:
              </p>
              <div className="bg-gray-50 border-2 border-dashed border-gray-200 rounded-xl p-4 mb-4">
                <p className="font-mono text-3xl font-bold tracking-[0.3em] text-gray-900">
                  {createdCart.inviteCode}
                </p>
              </div>
              <button
                onClick={() => {
                  navigator.clipboard.writeText(createdCart.inviteCode);
                  toast.success("Invite code copied!");
                }}
                className="flex items-center justify-center gap-2 mx-auto bg-red-500 text-white px-6 py-2.5 rounded-lg hover:bg-red-600 transition mb-4"
              >
                <Copy className="w-4 h-4" />
                Copy Invite Code
              </button>
              <button
                onClick={() => {
                  const id = createdCart._id;
                  setCreatedCart(null);
                  router.push(`/group-cart/${id}`);
                }}
                className="text-sm text-red-500 hover:text-red-600 font-medium"
              >
                Go to Group Cart →
              </button>
            </div>
          </div>
        )}

        {/* Active Group Carts */}
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="w-8 h-8 animate-spin text-red-500" />
          </div>
        ) : groupCarts.length === 0 ? (
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-12 text-center">
            <Users className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-700 mb-2">
              No Active Group Carts
            </h3>
            <p className="text-gray-400 mb-6">
              Create a new group cart or join one with an invite code.
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {groupCarts.map((gc) => {
              const isHost = gc.host?._id === user?._id;
              const gcTotal = gc.total || 0;
              return (
                <Link
                  key={gc._id}
                  href={`/group-cart/${gc._id}`}
                  className="block bg-white rounded-xl shadow-sm border border-gray-100 hover:shadow-md transition p-5"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="text-base font-semibold text-gray-900">
                          {gc.name}
                        </h3>
                        {isHost && (
                          <span className="flex items-center gap-1 text-xs bg-amber-100 text-amber-700 px-2 py-0.5 rounded-full">
                            <Crown className="w-3 h-3" /> Host
                          </span>
                        )}
                        <span
                          className={`text-xs px-2 py-0.5 rounded-full font-medium ${statusColors[gc.status] || "bg-gray-100 text-gray-500"}`}
                        >
                          {gc.status === 'payment_pending' ? 'Payment Pending' : gc.status.charAt(0).toUpperCase() +
                            gc.status.slice(1)}
                        </span>
                      </div>
                      <p className="text-sm text-gray-500 flex items-center gap-1.5">
                        <ShoppingBag className="w-3.5 h-3.5" />
                        {gc.itemCount || 0} items • {gc.members?.length || 0} members
                      </p>
                      {gc.status !== 'ordered' && gc.expiresAt && (
                        <p className={`text-xs flex items-center gap-1 mt-0.5 ${
                          getTimeLeft(gc.expiresAt) === 'Expired' ? 'text-red-500' : 'text-gray-400'
                        }`}>
                          <Clock className="w-3 h-3" />
                          {getTimeLeft(gc.expiresAt)}
                        </p>
                      )}
                    </div>
                    <ArrowRight className="w-5 h-5 text-gray-400" />
                  </div>

                  {/* Members strip */}
                  <div className="mt-3 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="flex -space-x-2">
                        {gc.members?.slice(0, 5).map((m, i) => (
                          <div
                            key={i}
                            className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold text-white border-2 border-white ${
                              m.isReady ? "bg-green-500" : "bg-gray-400"
                            }`}
                            title={m.user?.username}
                          >
                            {(m.user?.username || "?")
                              .charAt(0)
                              .toUpperCase()}
                          </div>
                        ))}
                        {(gc.members?.length || 0) > 5 && (
                          <div className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center text-xs font-medium text-gray-600 border-2 border-white">
                            +{gc.members.length - 5}
                          </div>
                        )}
                      </div>
                      <span className="text-xs text-gray-400">
                        {gc.members?.length || 0}/{gc.maxMembers} members
                      </span>
                    </div>

                    <div className="flex items-center gap-3">
                      <button
                        onClick={(e) => {
                          e.preventDefault();
                          copyCode(gc.inviteCode);
                        }}
                        className="flex items-center gap-1 text-xs text-gray-500 hover:text-red-500 transition font-mono bg-gray-50 px-2 py-1 rounded"
                      >
                        {gc.inviteCode}
                        {copiedId === gc.inviteCode ? (
                          <Check className="w-3 h-3 text-green-500" />
                        ) : (
                          <Copy className="w-3 h-3" />
                        )}
                      </button>

                      <span className="text-sm font-semibold text-gray-900">
                        Rs. {gcTotal.toLocaleString()}
                      </span>
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
