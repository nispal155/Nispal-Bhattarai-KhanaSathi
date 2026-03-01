"use client";

import React, { useState, useEffect, useCallback, useMemo } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import {
  ArrowLeft,
  Crown,
  Copy,
  Check,
  Loader2,
  Plus,
  Minus,
  Trash2,
  Lock,
  Unlock,
  LogOut,
  XCircle,
  CheckCircle,
  Circle,
  ShoppingBag,
  DollarSign,
  UserMinus,
  Clock,
  ChevronDown,
  ChevronUp,
  CreditCard,
  Wallet,
  Banknote,
  Share2,
} from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { useSocket } from "@/context/SocketContext";
import UserHeader from "@/components/layout/UserHeader";
import toast from "react-hot-toast";
import {
  getGroupCart as fetchGroupCartAPI,
  getGroupCartSummary,
  toggleReady,
  lockGroupCart,
  unlockGroupCart,
  leaveGroupCart,
  cancelGroupCart,
  removeMemberFromGroupCart,
  updateSplitMode,
  updateGroupCartItem,
  removeGroupCartItem,
  initiateGroupOrder,
  payGroupShareCOD,
  payGroupShareEsewa,
  payGroupShareKhalti,
} from "@/lib/groupCartService";
import { redirectToEsewa } from "@/lib/paymentService";
import type { GroupCart, GroupCartSummary, InitiateGroupOrderResponse } from "@/lib/groupCartService";

function extractPayload<T>(response: { data?: unknown } | undefined): T | undefined {
  const payload = response?.data;
  if (!payload || typeof payload !== "object") return payload as T | undefined;
  if ("data" in payload) {
    const nested = (payload as { data?: T }).data;
    return nested ?? (payload as T);
  }
  return payload as T;
}

export default function GroupCartDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { user } = useAuth();
  const { socket } = useSocket();
  const groupCartId = params?.id as string;

  const [groupCart, setGroupCart] = useState<GroupCart | null>(null);
  const [summary, setSummary] = useState<GroupCartSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [copiedCode, setCopiedCode] = useState(false);
  const [expandedMember, setExpandedMember] = useState<string | null>(null);
  const [showConfirmCancel, setShowConfirmCancel] = useState(false);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [timeLeft, setTimeLeft] = useState<string>("");
  const [showPaymentModal, setShowPaymentModal] = useState(false);

  /* ── Expiry countdown ── */
  useEffect(() => {
    if (!groupCart?.expiresAt) return;
    const tick = () => {
      const diff = new Date(groupCart.expiresAt).getTime() - Date.now();
      if (diff <= 0) { setTimeLeft("Expired"); return; }
      const h = Math.floor(diff / 3600000);
      const m = Math.floor((diff % 3600000) / 60000);
      const s = Math.floor((diff % 60000) / 1000);
      setTimeLeft(`${h > 0 ? `${h}h ` : ""}${m}m ${s}s`);
    };
    tick();
    const interval = setInterval(tick, 1000);
    return () => clearInterval(interval);
  }, [groupCart?.expiresAt]);

  /* ── Fetch group cart ── */
  const fetchData = useCallback(async () => {
    if (!groupCartId) return;
    try {
      const [gcRes, sumRes] = await Promise.all([
        fetchGroupCartAPI(groupCartId),
        getGroupCartSummary(groupCartId),
      ]);
      const gcData = extractPayload<GroupCart>(gcRes as { data?: unknown } | undefined);
      const sumData = extractPayload<GroupCartSummary>(sumRes as { data?: unknown } | undefined);
      if (gcData) setGroupCart(gcData);
      if (sumData) setSummary(sumData);
    } catch {
      toast.error("Failed to load group cart");
    } finally {
      setLoading(false);
    }
  }, [groupCartId]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  /* ── Socket real-time ── */
  useEffect(() => {
    if (!socket || !groupCartId) return;
    socket.emit("join", `group-cart:${groupCartId}`);
    const refresh = () => fetchData();
    socket.on("groupCartUpdated", refresh);
    socket.on("memberJoined", refresh);
    socket.on("memberLeft", refresh);
    socket.on("groupCartLocked", refresh);
    socket.on("groupCartCancelled", () => {
      toast.error("Group cart was cancelled");
      router.push("/group-cart");
    });
    socket.on("groupOrderPlaced", (data: { orderId?: string }) => {
      toast.success("Group order placed!");
      router.push(`/group-cart/${groupCartId}/checkout?orderId=${data?.orderId || ""}`);
    });
    return () => {
      socket.emit("leave", `group-cart:${groupCartId}`);
      socket.off("groupCartUpdated", refresh);
      socket.off("memberJoined", refresh);
      socket.off("memberLeft", refresh);
      socket.off("groupCartLocked", refresh);
      socket.off("groupCartCancelled");
      socket.off("groupOrderPlaced");
    };
  }, [socket, groupCartId, fetchData, router]);

  /* ── Derived state ── */
  const isHost = user?._id === groupCart?.host?._id;
  const currentMember = groupCart?.members?.find((m) => m.user?._id === user?._id);
  const isOpen = groupCart?.status === "open";
  const isLocked = groupCart?.status === "locked";
  const isPaymentPending = groupCart?.status === "payment_pending";
  const readyCount = groupCart?.members?.filter((m) => m.isReady).length || 0;
  const memberCount = groupCart?.members?.length || 1;
  const paidCount = groupCart?.members?.filter((m) => m.paymentStatus === 'paid').length || 0;

  const subtotal = useMemo(
    () => (groupCart?.members || []).reduce((s, m) => s + (m.subtotal || 0), 0),
    [groupCart?.members],
  );
  const deliveryFee = 50;
  const serviceFee = 20;
  const promoDiscount = groupCart?.promoDiscount || 0;
  const total = subtotal + deliveryFee + serviceFee - promoDiscount;
  const splitMode = groupCart?.splitMode || "individual";
  const selectedGroupPaymentMethod = groupCart?.paymentMethod || "";
  const perMemberShare = summary?.perMemberShare || {};
  const allNonHostPaid = useMemo(
    () =>
      (groupCart?.members || [])
        .filter((m) => m.role !== "host")
        .every((m) => m.paymentStatus === "paid" || (m.paymentAmount || 0) <= 0),
    [groupCart?.members],
  );
  const isEqualHostLocked =
    isPaymentPending &&
    splitMode === "equal" &&
    isHost &&
    currentMember?.paymentStatus !== "paid" &&
    !allNonHostPaid;

  const splitModeLabels = {
    individual: "Pay for your own",
    equal: "Split equally",
    host_pays: "Host pays all"
  };

  const getDisplayShare = (member: GroupCart["members"][number]) => {
    if (isPaymentPending) return member.paymentAmount || 0;
    return perMemberShare[member.user?._id] ?? 0;
  };

  /* ── Helpers ── */
  const withAction = async (key: string, fn: () => Promise<void>) => {
    setActionLoading(key);
    try {
      await fn();
    } finally {
      setActionLoading(null);
    }
  };

  const copyInviteCode = () => {
    if (!groupCart) return;
    navigator.clipboard.writeText(groupCart.inviteCode);
    setCopiedCode(true);
    toast.success("Invite code copied!");
    setTimeout(() => setCopiedCode(false), 2000);
  };

  /* ── Actions ── */
  const handleToggleReady = () =>
    withAction("ready", async () => {
      const res = await toggleReady(groupCartId);
      if (res?.error) toast.error(res.error);
      else {
        toast.success(currentMember?.isReady ? "Marked as not ready" : "Marked as ready!");
        fetchData();
      }
    });

  const handleLock = () =>
    withAction("lock", async () => {
      const res = await lockGroupCart(groupCartId);
      if (res?.error) toast.error(res.error);
      else {
        toast.success("Group cart locked");
        fetchData();
      }
    });

  const handleUnlock = () =>
    withAction("unlock", async () => {
      const res = await unlockGroupCart(groupCartId);
      if (res?.error) toast.error(res.error);
      else {
        toast.success("Group cart unlocked");
        fetchData();
      }
    });

  const handleLeave = () =>
    withAction("leave", async () => {
      const res = await leaveGroupCart(groupCartId);
      if (res?.error) toast.error(res.error);
      else {
        toast.success("Left group cart");
        router.push("/group-cart");
      }
    });

  const handleCancel = () =>
    withAction("cancel", async () => {
      const res = await cancelGroupCart(groupCartId);
      if (res?.error) toast.error(res.error);
      else {
        toast.success("Group cart cancelled");
        router.push("/group-cart");
      }
    });

  const handleRemoveMember = (userId: string, username: string) =>
    withAction(`remove-${userId}`, async () => {
      const res = await removeMemberFromGroupCart(groupCartId, userId);
      if (res?.error) toast.error(res.error);
      else {
        toast.success(`Removed ${username}`);
        fetchData();
      }
    });

  const handleSplitModeChange = (mode: "individual" | "equal" | "host_pays") =>
    withAction("split", async () => {
      const res = await updateSplitMode(groupCartId, mode);
      if (res?.error) toast.error(res.error);
      else {
        toast.success(`Split mode: ${mode.replace("_", " ")}`);
        fetchData();
      }
    });

  const handleIncrement = (menuItemId: string, currentQty: number) =>
    withAction(`inc-${menuItemId}`, async () => {
      const res = await updateGroupCartItem(groupCartId, menuItemId, currentQty + 1);
      if (res?.error) toast.error(res.error);
      else fetchData();
    });

  const handleDecrement = (menuItemId: string, currentQty: number) => {
    if (currentQty <= 1) return;
    withAction(`dec-${menuItemId}`, async () => {
      const res = await updateGroupCartItem(groupCartId, menuItemId, currentQty - 1);
      if (res?.error) toast.error(res.error);
      else fetchData();
    });
  };

  const handleRemoveItem = (menuItemId: string) =>
    withAction(`del-${menuItemId}`, async () => {
      const res = await removeGroupCartItem(groupCartId, menuItemId);
      if (res?.error) toast.error(res.error);
      else {
        toast.success("Item removed");
        fetchData();
      }
    });

  const handlePlaceOrder = () => setShowPaymentModal(true);

  const handleConfirmPayment = (method: 'cod' | 'esewa' | 'khalti') =>
    withAction("place", async () => {
      setShowPaymentModal(false);
      const res = await initiateGroupOrder(groupCartId, method);
      if (res?.error) {
        toast.error(res.error);
        return;
      }
      const data = extractPayload<InitiateGroupOrderResponse["data"]>(res as { data?: unknown } | undefined);

      // If order was placed directly (host_pays + COD)
      if (data?.orders && !data?.requiresPayment) {
        const orders = data.orders;
        toast.success(`Group order placed! ${orders.length} restaurant${orders.length > 1 ? 's' : ''}`);
        router.push(`/group-cart/${groupCartId}/checkout?orderId=${orders[0]?.orderId || ""}`);
        return;
      }

      // Requires payment via gateway
      if (data?.requiresPayment) {
        if (data.paymentGateway === 'esewa' && data.formData) {
          toast.success("Redirecting to eSewa...");
          redirectToEsewa({ paymentUrl: data.paymentUrl || '', formData: data.formData });
          return;
        }
        if (data.paymentGateway === 'khalti' && data.paymentUrl) {
          toast.success("Redirecting to Khalti...");
          window.location.href = data.paymentUrl;
          return;
        }
        if (data.paymentGateway === 'member_split') {
          toast.success("Payment pending – each member must pay their share");
          fetchData();
          return;
        }
      }

      toast.success("Order initiated");
      fetchData();
    });

  const handlePayMyShare = (method: 'cod' | 'esewa' | 'khalti') =>
    withAction("pay-share", async () => {
      if (method === 'cod') {
        const res = await payGroupShareCOD(groupCartId);
        if (res?.error) { toast.error(res.error); return; }
        const data = extractPayload<InitiateGroupOrderResponse["data"]>(res as { data?: unknown } | undefined);
        if (data?.orderPlaced) {
          toast.success("All paid! Order placed.");
          const orders = data.orders || [];
          router.push(`/group-cart/${groupCartId}/checkout?orderId=${orders[0]?.orderId || ""}`);
        } else {
          toast.success("Payment confirmed (COD). Waiting for others.");
          fetchData();
        }
        return;
      }
      if (method === 'esewa') {
        const res = await payGroupShareEsewa(groupCartId);
        if (res?.error) { toast.error(res.error); return; }
        const data = extractPayload<{ paymentUrl: string; formData: Record<string, string> }>(res as { data?: unknown } | undefined);
        if (data?.formData) {
          toast.success("Redirecting to eSewa...");
          redirectToEsewa({ paymentUrl: data.paymentUrl || '', formData: data.formData });
        }
        return;
      }
      if (method === 'khalti') {
        const res = await payGroupShareKhalti(groupCartId);
        if (res?.error) { toast.error(res.error); return; }
        const data = extractPayload<{ paymentUrl: string; pidx: string }>(res as { data?: unknown } | undefined);
        if (data?.paymentUrl) {
          toast.success("Redirecting to Khalti...");
          window.location.href = data.paymentUrl;
        }
        return;
      }
    });

  /* ── Loading / Not found ── */
  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-red-500" />
      </div>
    );
  }

  if (!groupCart) {
    return (
      <div className="min-h-screen bg-gray-50">
        <UserHeader />
        <div className="max-w-4xl mx-auto px-4 py-20 text-center">
          <h2 className="text-lg font-semibold text-gray-700 mb-2">Group Cart Not Found</h2>
          <Link href="/group-cart" className="text-red-500 hover:underline text-sm">
            ← Back to Group Carts
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <UserHeader />

      <div className="max-w-4xl mx-auto px-4 py-6">
        {/* Back */}
        <Link
          href="/group-cart"
          className="inline-flex items-center gap-1 text-sm text-gray-500 hover:text-gray-800 mb-4"
        >
          <ArrowLeft className="w-4 h-4" /> Back to Group Carts
        </Link>

        {/* Header Card */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 mb-6">
          <div className="flex items-start justify-between">
            <div>
              <h1 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                {groupCart.name}
                <span
                  className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                    isOpen
                      ? "bg-green-100 text-green-700"
                      : isLocked
                        ? "bg-yellow-100 text-yellow-700"
                        : isPaymentPending
                          ? "bg-blue-100 text-blue-700"
                          : "bg-gray-100 text-gray-500"
                  }`}
                >
                  {groupCart.status === 'payment_pending' ? 'Payment Pending' : groupCart.status.charAt(0).toUpperCase() + groupCart.status.slice(1)}
                </span>
              </h1>
              <p className="text-sm text-gray-500 mt-1 flex items-center gap-1.5">
                <ShoppingBag className="w-3.5 h-3.5" />
                {groupCart.itemCount || 0} items from {(() => {
                  const restNames = new Set<string>();
                  groupCart.members?.forEach(m => m.items?.forEach(item => {
                    const rName = typeof item.restaurant === 'object' ? item.restaurant?.name : item.restaurantName;
                    if (rName) restNames.add(rName);
                  }));
                  return restNames.size > 0 ? `${restNames.size} restaurant${restNames.size > 1 ? 's' : ''}` : 'no restaurants yet';
                })()}
              </p>
              <p className={`text-xs mt-1 flex items-center gap-1 ${
                timeLeft === 'Expired' ? 'text-red-500 font-medium' : 'text-gray-400'
              }`}>
                <Clock className="w-3 h-3" />
                {timeLeft === 'Expired' ? 'Cart expired' : `Expires in ${timeLeft}`}
              </p>
            </div>

            {/* Invite Code */}
            <button
              onClick={copyInviteCode}
              className="flex items-center gap-2 bg-gray-50 border border-gray-200 rounded-lg px-4 py-2 hover:bg-gray-100 transition"
            >
              <span className="font-mono font-bold text-sm tracking-widest text-gray-700">
                {groupCart.inviteCode}
              </span>
              {copiedCode ? (
                <Check className="w-4 h-4 text-green-500" />
              ) : (
                <Copy className="w-4 h-4 text-gray-400" />
              )}
            </button>
          </div>

          {/* Ready progress */}
          <div className="mt-4">
            <div className="flex items-center justify-between text-xs text-gray-500 mb-1">
              <span>
                {readyCount}/{memberCount} members ready
              </span>
              {groupCart.allReady && (
                <span className="text-green-600 font-medium flex items-center gap-1">
                  <CheckCircle className="w-3.5 h-3.5" /> All ready!
                </span>
              )}
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div
                className={`h-2 rounded-full transition-all ${
                  groupCart.allReady ? "bg-green-500" : "bg-red-500"
                }`}
                style={{
                  width: `${(readyCount / memberCount) * 100}%`,
                }}
              />
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left: Members & Items */}
          <div className="lg:col-span-2 space-y-4">
            {groupCart.members?.map((member) => {
              const isSelf = member.user?._id === user?._id;
              const isExpanded = expandedMember === member.user?._id || isSelf;

              return (
                <div
                  key={member.user?._id}
                  className={`bg-white rounded-xl shadow-sm border transition ${
                    isSelf ? "border-red-200 ring-1 ring-red-100" : "border-gray-100"
                  }`}
                >
                  {/* Member header */}
                  <button
                    onClick={() =>
                      setExpandedMember(isExpanded && !isSelf ? null : member.user?._id)
                    }
                    className="w-full flex items-center justify-between p-4"
                  >
                    <div className="flex items-center gap-3">
                      <div
                        className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold text-white ${
                          member.isReady ? "bg-green-500" : "bg-gray-400"
                        }`}
                      >
                        {(member.user?.username || "?").charAt(0).toUpperCase()}
                      </div>
                      <div className="text-left">
                        <div className="flex items-center gap-2">
                          <span className="font-semibold text-gray-900 text-sm">
                            {member.user?.username || "Unknown"}
                            {isSelf && " (You)"}
                          </span>
                          {member.role === "host" && (
                            <Crown className="w-3.5 h-3.5 text-amber-500" />
                          )}
                          {member.isReady ? (
                            <CheckCircle className="w-4 h-4 text-green-500" />
                          ) : (
                            <Circle className="w-4 h-4 text-gray-300" />
                          )}
                        </div>
                        <p className="text-xs text-gray-400">
                          {member.items?.length || 0} items • Rs.{" "}
                          {(member.subtotal || 0).toLocaleString()}
                          {isPaymentPending && member.paymentStatus === 'paid' && (
                            <span className="ml-1.5 text-green-600 font-medium">• Paid ✓</span>
                          )}
                          {isPaymentPending && member.paymentStatus === 'pending' && (
                            <span className="ml-1.5 text-amber-600 font-medium">• Unpaid (Rs. {(member.paymentAmount || 0).toLocaleString()})</span>
                          )}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {isHost && !isSelf && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleRemoveMember(
                              member.user?._id,
                              member.user?.username || "member",
                            );
                          }}
                          className="p-1.5 text-gray-400 hover:text-red-500 transition"
                          title="Remove member"
                        >
                          <UserMinus className="w-4 h-4" />
                        </button>
                      )}
                      {isExpanded ? (
                        <ChevronUp className="w-4 h-4 text-gray-400" />
                      ) : (
                        <ChevronDown className="w-4 h-4 text-gray-400" />
                      )}
                    </div>
                  </button>

                  {/* Items list */}
                  {isExpanded && (
                    <div className="border-t border-gray-50 px-4 pb-4">
                      {(member.items?.length || 0) === 0 ? (
                        <div className="py-5 text-center">
                          <ShoppingBag className="w-8 h-8 text-gray-200 mx-auto mb-2" />
                          <p className="text-sm text-gray-400">
                            {isSelf ? 'You haven\'t added any items yet' : 'No items added yet'}
                          </p>
                          {isSelf && isOpen && (
                            <Link
                              href="/browse-restaurants"
                              className="inline-flex items-center gap-1.5 mt-3 text-sm text-red-500 hover:text-red-600 font-medium"
                            >
                              <Plus className="w-3.5 h-3.5" />
                              Browse restaurants & add items
                            </Link>
                          )}
                        </div>
                      ) : (
                        <div className="space-y-3 mt-3">
                          {member.items?.map((item, idx) => {
                            const itemId =
                              typeof item.menuItem === "string"
                                ? item.menuItem
                                : item.menuItem?._id || "";
                            return (
                              <div
                                key={idx}
                                className="flex items-center justify-between"
                              >
                                <div className="flex items-center gap-3 flex-1">
                                  <div className="w-12 h-12 bg-gray-100 rounded-lg flex items-center justify-center overflow-hidden">
                                    {item.image ? (
                                      <Image
                                        src={item.image}
                                        alt={item.name}
                                        width={48}
                                        height={48}
                                        className="object-cover w-full h-full"
                                      />
                                    ) : (
                                      <ShoppingBag className="w-5 h-5 text-gray-400" />
                                    )}
                                  </div>
                                  <div>
                                    <p className="text-sm font-medium text-gray-800">
                                      {item.name}
                                    </p>
                                    <p className="text-xs text-gray-400">
                                      {typeof item.restaurant === 'object' ? item.restaurant?.name : item.restaurantName || ''}
                                      {' • '}Rs. {item.price} × {item.quantity}
                                    </p>
                                    {item.specialInstructions && (
                                      <p className="text-xs text-gray-400 italic mt-0.5">
                                        &quot;{item.specialInstructions}&quot;
                                      </p>
                                    )}
                                  </div>
                                </div>
                                <div className="flex items-center gap-2">
                                  <span className="text-sm font-semibold text-gray-700 w-16 text-right">
                                    Rs.{" "}
                                    {(item.price * item.quantity).toLocaleString()}
                                  </span>
                                  {isSelf && isOpen && (
                                    <div className="flex items-center gap-1 ml-2">
                                      <button
                                        onClick={() =>
                                          handleDecrement(itemId, item.quantity)
                                        }
                                        className="w-7 h-7 rounded-full bg-gray-100 flex items-center justify-center hover:bg-gray-200 transition disabled:opacity-40"
                                        disabled={
                                          item.quantity <= 1 ||
                                          actionLoading === `dec-${itemId}`
                                        }
                                      >
                                        <Minus className="w-3 h-3" />
                                      </button>
                                      <span className="text-xs font-medium w-5 text-center">
                                        {item.quantity}
                                      </span>
                                      <button
                                        onClick={() =>
                                          handleIncrement(itemId, item.quantity)
                                        }
                                        disabled={
                                          actionLoading === `inc-${itemId}`
                                        }
                                        className="w-7 h-7 rounded-full bg-gray-100 flex items-center justify-center hover:bg-gray-200 transition disabled:opacity-40"
                                      >
                                        <Plus className="w-3 h-3" />
                                      </button>
                                      <button
                                        onClick={() => handleRemoveItem(itemId)}
                                        disabled={
                                          actionLoading === `del-${itemId}`
                                        }
                                        className="w-7 h-7 rounded-full bg-red-50 flex items-center justify-center hover:bg-red-100 transition ml-1 disabled:opacity-40"
                                      >
                                        <Trash2 className="w-3 h-3 text-red-500" />
                                      </button>
                                    </div>
                                  )}
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {/* Right: Summary & Actions */}
          <div className="space-y-4">
            {/* Share Invite Code (when open) */}
            {isOpen && (
              <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
                <h3 className="text-sm font-semibold text-gray-700 mb-2">Invite Friends</h3>
                <p className="text-xs text-gray-400 mb-3">Share this code so friends can join:</p>
                <div className="bg-gray-50 border border-dashed border-gray-200 rounded-lg p-3 text-center">
                  <p className="font-mono text-xl font-bold tracking-[0.2em] text-gray-900">{groupCart.inviteCode}</p>
                </div>
                <div className="mt-3 flex gap-2">
                  <button
                    onClick={copyInviteCode}
                    className="flex-1 flex items-center justify-center gap-2 text-sm text-red-500 hover:text-red-600 bg-red-50 rounded-lg py-2 transition font-medium"
                  >
                    {copiedCode ? <Check className="w-4 h-4 text-green-500" /> : <Copy className="w-4 h-4" />}
                    {copiedCode ? 'Copied!' : 'Copy Invite Code'}
                  </button>
                  <button
                    onClick={() => {
                      const shareText = `Join my group cart on Khana Sathi!\n\nInvite Code: ${groupCart.inviteCode}\n\nGo to ${window.location.origin}/group-cart and enter this code to join.`;
                      if (navigator.share) {
                        navigator.share({
                          text: shareText
                        }).catch(() => {
                          navigator.clipboard.writeText(shareText);
                          toast.success("Invite message copied!");
                        });
                      } else {
                        navigator.clipboard.writeText(shareText);
                        toast.success("Invite message copied!");
                      }
                    }}
                    className="flex-1 flex items-center justify-center gap-2 text-sm text-green-500 hover:text-green-600 bg-green-50 rounded-lg py-2 transition font-medium"
                  >
                    <Share2 className="w-4 h-4" />
                    Share Code
                  </button>
                </div>
              </div>
            )}
            {/* Split Mode (host only) */}
            {isHost && (isOpen || isLocked) && (
              <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
                <h3 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-1.5">
                  <DollarSign className="w-4 h-4 text-gray-400" />
                  Bill Split Mode
                </h3>
                <div className="space-y-2">
                  {(["individual", "equal", "host_pays"] as const).map((mode) => (
                    <button
                      key={mode}
                      onClick={() => handleSplitModeChange(mode)}
                      disabled={actionLoading === "split"}
                      className={`w-full text-left px-3 py-2 rounded-lg text-sm transition ${
                        splitMode === mode
                          ? "bg-red-50 text-red-600 border border-red-200"
                          : "bg-gray-50 text-gray-600 hover:bg-gray-100 border border-transparent"
                      }`}
                    >
                      {splitModeLabels[mode]}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Pricing */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
              <h3 className="text-sm font-semibold text-gray-700 mb-3 flex items-center justify-between">
                Order Summary
                <span className="text-xs bg-blue-50 text-blue-600 px-2 py-1 rounded-full font-medium">
                  {splitModeLabels[splitMode]}
                </span>
              </h3>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between text-gray-500">
                  <span>Subtotal ({groupCart.itemCount || 0} items)</span>
                  <span>Rs. {subtotal.toLocaleString()}</span>
                </div>
                <div className="flex justify-between text-gray-500">
                  <span>Delivery Fee</span>
                  <span>Rs. {deliveryFee}</span>
                </div>
                <div className="flex justify-between text-gray-500">
                  <span>Service Fee</span>
                  <span>Rs. {serviceFee}</span>
                </div>
                {promoDiscount > 0 && (
                  <div className="flex justify-between text-green-600">
                    <span>Discount</span>
                    <span>-Rs. {promoDiscount}</span>
                  </div>
                )}
                <div className="border-t border-gray-100 pt-2 flex justify-between font-bold text-gray-900">
                  <span>Total</span>
                  <span>Rs. {total.toLocaleString()}</span>
                </div>
              </div>

              {splitMode === "equal" && memberCount > 0 && (
                <div className="mt-3 bg-blue-50 rounded-lg p-2.5 text-center">
                  <p className="text-xs text-blue-600 font-medium mb-1">Each person pays:</p>
                  <p className="text-lg font-bold text-blue-700">
                    Rs. {Math.round((summary?.pricing?.total || total) / memberCount).toLocaleString()}
                  </p>
                </div>
              )}

              {splitMode === "individual" && (
                <div className="mt-3 bg-gray-50 rounded-lg p-2.5">
                  <p className="text-xs text-gray-600 font-medium mb-2">Individual breakdown:</p>
                  <div className="space-y-1.5">
                    {groupCart.members?.map((m) => {
                      const isSelf = m.user?._id === user?._id;
                      const memberShare = getDisplayShare(m);
                      return (
                        <div
                          key={m.user?._id}
                          className={`flex justify-between text-xs ${isSelf ? 'font-semibold text-red-600' : 'text-gray-600'}`}
                        >
                          <span>{m.user?.username}{isSelf ? ' (You)' : ''}</span>
                          <span>Rs. {memberShare.toLocaleString()}</span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {splitMode === "host_pays" && (
                <div className="mt-3 bg-amber-50 rounded-lg p-2.5 text-center">
                  <p className="text-xs text-amber-600 font-medium mb-1">
                    <Crown className="w-3 h-3 inline mr-1" />
                    Host pays everything
                  </p>
                  <p className="text-lg font-bold text-amber-700">
                    {groupCart.host?.username}: Rs. {total.toLocaleString()}
                  </p>
                  <p className="text-xs text-amber-600 mt-1">Others pay Rs. 0</p>
                </div>
              )}
            </div>

            {/* Actions */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 space-y-3">
              {/* Ready toggle */}
              {(isOpen || isLocked) && currentMember && (
                <button
                  onClick={handleToggleReady}
                  disabled={actionLoading === "ready"}
                  className={`w-full flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-medium transition disabled:opacity-50 ${
                    currentMember.isReady
                      ? "bg-green-100 text-green-700 hover:bg-green-200"
                      : "bg-red-500 text-white hover:bg-red-600"
                  }`}
                >
                  {actionLoading === "ready" ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : currentMember.isReady ? (
                    <>
                      <CheckCircle className="w-4 h-4" /> Ready ✓
                    </>
                  ) : (
                    <>
                      <Circle className="w-4 h-4" /> Mark as Ready
                    </>
                  )}
                </button>
              )}

              {/* Host controls */}
              {isHost && isOpen && (
                <button
                  onClick={handleLock}
                  disabled={actionLoading === "lock"}
                  className="w-full flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-medium bg-yellow-100 text-yellow-700 hover:bg-yellow-200 transition disabled:opacity-50"
                >
                  {actionLoading === "lock" ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Lock className="w-4 h-4" />
                  )}
                  Lock Cart
                </button>
              )}

              {isHost && isLocked && (
                <>
                  <button
                    onClick={handleUnlock}
                    disabled={actionLoading === "unlock"}
                    className="w-full flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-medium bg-gray-100 text-gray-600 hover:bg-gray-200 transition disabled:opacity-50"
                  >
                    {actionLoading === "unlock" ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <Unlock className="w-4 h-4" />
                    )}
                    Unlock Cart
                  </button>
                  <button
                    onClick={handlePlaceOrder}
                    disabled={!groupCart.allReady || actionLoading === "place"}
                    className="w-full flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-medium bg-green-500 text-white hover:bg-green-600 disabled:opacity-50 disabled:cursor-not-allowed transition"
                  >
                    {actionLoading === "place" ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <CreditCard className="w-4 h-4" />
                    )}
                    Proceed to Payment
                  </button>
                  {!groupCart.allReady && (
                    <p className="text-xs text-center text-amber-600 bg-amber-50 rounded-lg py-2 px-3">
                      Waiting for {memberCount - readyCount} member{memberCount - readyCount > 1 ? 's' : ''} to mark as ready
                    </p>
                  )}
                </>
              )}

              {/* ── Payment Pending: Split Payment UI ── */}
              {isPaymentPending && (
                <div className="space-y-3">
                  {/* Payment progress */}
                  <div className="bg-blue-50 rounded-lg p-3">
                    <div className="flex items-center justify-between text-xs mb-1.5">
                      <span className="text-blue-700 font-medium">Payment Progress</span>
                      <span className="text-blue-600">{paidCount}/{memberCount} paid</span>
                    </div>
                    <div className="w-full bg-blue-200 rounded-full h-2">
                      <div
                        className="h-2 rounded-full bg-blue-500 transition-all"
                        style={{ width: `${(paidCount / memberCount) * 100}%` }}
                      />
                    </div>
                  </div>

                  {/* Per-member payment status list */}
                  <div className="space-y-2">
                    {groupCart.members?.map((m) => {
                      const isSelf = m.user?._id === user?._id;
                      const isPaid = m.paymentStatus === 'paid';
                      const shareAmount = m.paymentAmount || 0;
                      const isHostWaitingLast =
                        splitMode === "equal" &&
                        isPaymentPending &&
                        m.role === "host" &&
                        m.paymentStatus !== "paid" &&
                        !allNonHostPaid;
                      const isHostCanPayNow =
                        splitMode === "equal" &&
                        isPaymentPending &&
                        m.role === "host" &&
                        m.paymentStatus !== "paid" &&
                        allNonHostPaid;
                      return (
                        <div key={m.user?._id} className={`flex items-center justify-between p-2.5 rounded-lg border ${
                          isPaid ? 'bg-green-50 border-green-200' : isSelf ? 'bg-amber-50 border-amber-200' : 'bg-gray-50 border-gray-200'
                        }`}>
                          <div className="flex items-center gap-2">
                            {isPaid ? (
                              <CheckCircle className="w-4 h-4 text-green-500" />
                            ) : (
                              <Clock className="w-4 h-4 text-amber-500" />
                            )}
                            <span className="text-sm font-medium text-gray-800">
                              {m.user?.username}{isSelf ? ' (You)' : ''}{m.role === 'host' ? ' 👑' : ''}
                            </span>
                          </div>
                          <div className="text-right">
                            <span className={`text-sm font-bold ${isPaid ? 'text-green-600' : 'text-gray-700'}`}>
                              Rs. {shareAmount.toLocaleString()}
                            </span>
                            <p className="text-[10px] text-gray-400">
                              {isPaid ? 'Paid ✓' : m.paymentMethod ? `via ${m.paymentMethod}` : 'Pending'}
                            </p>
                            {isHostWaitingLast && (
                              <p className="text-[10px] text-amber-600 font-medium">Waiting to pay last</p>
                            )}
                            {isHostCanPayNow && (
                              <p className="text-[10px] text-green-600 font-medium">You can pay now</p>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  {/* Pay Your Share (for current member if unpaid) */}
                  {currentMember && currentMember.paymentStatus !== 'paid' && (currentMember.paymentAmount || 0) > 0 && (
                    <div className="bg-white border border-amber-200 rounded-xl p-4">
                      <h4 className="text-sm font-semibold text-gray-800 mb-1">Pay Your Share</h4>
                      <p className="text-lg font-bold text-red-600 mb-3">
                        Rs. {(currentMember.paymentAmount || 0).toLocaleString()}
                      </p>
                      {isEqualHostLocked ? (
                        <p className="text-xs text-amber-700 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2">
                          You can pay after all members complete payment.
                        </p>
                      ) : (
                        <div className="space-y-2">
                          {selectedGroupPaymentMethod === 'cod' && (
                            <button
                              onClick={() => handlePayMyShare('cod')}
                              disabled={actionLoading === "pay-share"}
                              className="w-full flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-medium bg-gray-100 text-gray-700 hover:bg-gray-200 transition disabled:opacity-50"
                            >
                              {actionLoading === "pay-share" ? <Loader2 className="w-4 h-4 animate-spin" /> : <Banknote className="w-4 h-4" />}
                              Confirm COD Share
                            </button>
                          )}
                          {selectedGroupPaymentMethod === 'esewa' && (
                            <button
                              onClick={() => handlePayMyShare('esewa')}
                              disabled={actionLoading === "pay-share"}
                              className="w-full flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-medium bg-green-100 text-green-700 hover:bg-green-200 transition disabled:opacity-50"
                            >
                              {actionLoading === "pay-share" ? <Loader2 className="w-4 h-4 animate-spin" /> : <Wallet className="w-4 h-4" />}
                              Pay with eSewa
                            </button>
                          )}
                          {selectedGroupPaymentMethod === 'khalti' && (
                            <button
                              onClick={() => handlePayMyShare('khalti')}
                              disabled={actionLoading === "pay-share"}
                              className="w-full flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-medium bg-purple-100 text-purple-700 hover:bg-purple-200 transition disabled:opacity-50"
                            >
                              {actionLoading === "pay-share" ? <Loader2 className="w-4 h-4 animate-spin" /> : <CreditCard className="w-4 h-4" />}
                              Pay with Khalti
                            </button>
                          )}
                          {!selectedGroupPaymentMethod && (
                            <p className="text-xs text-amber-700 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2">
                              Waiting for host to select payment method.
                            </p>
                          )}
                        </div>
                      )}
                    </div>
                  )}

                  {currentMember?.paymentStatus === 'paid' && (
                    <div className="bg-green-50 border border-green-200 rounded-lg p-3 text-center">
                      <CheckCircle className="w-6 h-6 text-green-500 mx-auto mb-1" />
                      <p className="text-sm font-medium text-green-700">You&apos;ve paid your share!</p>
                      <p className="text-xs text-green-600 mt-0.5">
                        {paidCount < memberCount ? `Waiting for ${memberCount - paidCount} more member${memberCount - paidCount > 1 ? 's' : ''}...` : 'All paid! Order being placed...'}
                      </p>
                    </div>
                  )}
                </div>
              )}

              {/* Leave / Cancel */}
              {!isHost && (
                <button
                  onClick={handleLeave}
                  disabled={actionLoading === "leave"}
                  className="w-full flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-medium text-gray-500 hover:text-red-600 hover:bg-red-50 transition disabled:opacity-50"
                >
                  {actionLoading === "leave" ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <LogOut className="w-4 h-4" />
                  )}
                  Leave Group Cart
                </button>
              )}

              {isHost && (
                <>
                  {!showConfirmCancel ? (
                    <button
                      onClick={() => setShowConfirmCancel(true)}
                      className="w-full flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-medium text-red-500 hover:bg-red-50 transition"
                    >
                      <XCircle className="w-4 h-4" /> Cancel Group Cart
                    </button>
                  ) : (
                    <div className="bg-red-50 rounded-lg p-3 text-center">
                      <p className="text-xs text-red-600 mb-2">
                        This will cancel the cart for everyone. Are you sure?
                      </p>
                      <div className="flex gap-2 justify-center">
                        <button
                          onClick={() => setShowConfirmCancel(false)}
                          className="px-3 py-1.5 text-xs rounded bg-white text-gray-600 hover:bg-gray-100"
                        >
                          No, keep it
                        </button>
                        <button
                          onClick={handleCancel}
                          disabled={actionLoading === "cancel"}
                          className="px-3 py-1.5 text-xs rounded bg-red-500 text-white hover:bg-red-600 disabled:opacity-50"
                        >
                          {actionLoading === "cancel" ? "Cancelling…" : "Yes, cancel"}
                        </button>
                      </div>
                    </div>
                  )}
                </>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Payment Method Selection Modal */}
      {showPaymentModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-sm w-full p-6 relative">
            <button
              onClick={() => setShowPaymentModal(false)}
              className="absolute top-4 right-4 text-gray-400 hover:text-gray-600"
            >
              <XCircle className="w-5 h-5" />
            </button>

            <h3 className="text-lg font-bold text-gray-900 mb-1">Select Payment Method</h3>
            <p className="text-sm text-gray-500 mb-1">
              {splitMode === 'host_pays'
                ? `Only host pays the full total.`
                : `This selected method will be used by all members.`}
            </p>
            <p className="text-lg font-bold text-red-600 mb-4">
              Total: Rs. {total.toLocaleString()}
            </p>

            <div className="space-y-2.5">
              <button
                onClick={() => handleConfirmPayment('cod')}
                disabled={actionLoading === "place"}
                className="w-full flex items-center gap-3 p-3.5 rounded-xl border-2 border-gray-200 hover:border-gray-400 transition text-left disabled:opacity-50"
              >
                <div className="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center">
                  <Banknote className="w-5 h-5 text-gray-600" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-gray-800">Cash on Delivery</p>
                  <p className="text-xs text-gray-400">Pay when you receive your order</p>
                </div>
              </button>

              <button
                onClick={() => handleConfirmPayment('esewa')}
                disabled={actionLoading === "place"}
                className="w-full flex items-center gap-3 p-3.5 rounded-xl border-2 border-green-200 hover:border-green-400 transition text-left disabled:opacity-50"
              >
                <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
                  <Wallet className="w-5 h-5 text-green-600" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-gray-800">eSewa</p>
                  <p className="text-xs text-gray-400">Pay with your eSewa wallet</p>
                </div>
              </button>

              <button
                onClick={() => handleConfirmPayment('khalti')}
                disabled={actionLoading === "place"}
                className="w-full flex items-center gap-3 p-3.5 rounded-xl border-2 border-purple-200 hover:border-purple-400 transition text-left disabled:opacity-50"
              >
                <div className="w-10 h-10 bg-purple-100 rounded-full flex items-center justify-center">
                  <CreditCard className="w-5 h-5 text-purple-600" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-gray-800">Khalti</p>
                  <p className="text-xs text-gray-400">Pay with Khalti digital wallet</p>
                </div>
              </button>
            </div>

            {actionLoading === "place" && (
              <div className="mt-4 flex items-center justify-center gap-2 text-sm text-gray-500">
                <Loader2 className="w-4 h-4 animate-spin" /> Processing...
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
