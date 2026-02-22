"use client";

import React, { useState, useEffect, useCallback } from "react";
import { useParams, useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft,
  CheckCircle,
  Clock,
  Users,
  DollarSign,
  Crown,
  ShoppingBag,
  Loader2,
  CreditCard,
  Banknote,
  Wallet,
  AlertCircle,
  Store,
} from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { useSocket } from "@/context/SocketContext";
import UserHeader from "@/components/layout/UserHeader";
import toast from "react-hot-toast";
import { getGroupCart, getGroupCartSummary } from "@/lib/groupCartService";
import type { GroupCart, GroupCartSummary } from "@/lib/groupCartService";

export default function GroupCheckoutPage() {
  const params = useParams();
  const searchParams = useSearchParams();
  const router = useRouter();
  const { user } = useAuth();
  const { socket } = useSocket();
  const groupCartId = params?.id as string;
  const orderId = searchParams?.get("orderId") || "";

  const [groupCart, setGroupCart] = useState<GroupCart | null>(null);
  const [summary, setSummary] = useState<GroupCartSummary | null>(null);
  const [loading, setLoading] = useState(true);

  /* ── Fetch data ── */
  const fetchData = useCallback(async () => {
    if (!groupCartId) return;
    try {
      const [gcRes, sumRes] = await Promise.all([
        getGroupCart(groupCartId),
        getGroupCartSummary(groupCartId),
      ]);
      const gcData = (gcRes?.data as any)?.data || (gcRes?.data as any);
      const sumData = (sumRes?.data as any)?.data || (sumRes?.data as any);
      if (gcData) setGroupCart(gcData);
      if (sumData) setSummary(sumData);
    } catch {
      console.error("Error loading checkout data");
    } finally {
      setLoading(false);
    }
  }, [groupCartId]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  /* ── Socket ── */
  useEffect(() => {
    if (!socket || !groupCartId) return;
    socket.emit("join", `group-cart:${groupCartId}`);
    return () => {
      socket.emit("leave", `group-cart:${groupCartId}`);
    };
  }, [socket, groupCartId]);

  const isHost = user?._id === groupCart?.host?._id;
  const splitMode = groupCart?.splitMode || "individual";
  const members = groupCart?.members || [];
  const memberCount = members.length || 1;

  /* ── Calculate totals ── */
  const subtotal = members.reduce((s, m) => s + (m.subtotal || 0), 0);
  const deliveryFee = summary?.pricing?.deliveryFee || 50;
  const serviceFee = summary?.pricing?.serviceFee || 20;
  const promoDiscount = groupCart?.promoDiscount || 0;
  const grandTotal = subtotal + deliveryFee + serviceFee - promoDiscount;

  /* ── Per-member share calculation ── */
  const getMemberShare = (memberSubtotal: number) => {
    const feeShare = Math.round((deliveryFee + serviceFee) / memberCount);
    const discountShare = Math.round(promoDiscount / memberCount);
    if (splitMode === "equal") {
      return Math.round(grandTotal / memberCount);
    }
    if (splitMode === "host_pays") {
      return 0; // host pays all
    }
    // individual
    return memberSubtotal + feeShare - discountShare;
  };

  const hostShare = () => {
    if (splitMode === "host_pays") return grandTotal;
    return getMemberShare(
      members.find((m) => m.user?._id === groupCart?.host?._id)?.subtotal || 0,
    );
  };

  const paymentMethodLabels: Record<string, { label: string; icon: React.ReactNode }> = {
    COD: { label: "Cash on Delivery", icon: <Banknote className="w-5 h-5" /> },
    esewa: { label: "eSewa", icon: <Wallet className="w-5 h-5 text-green-600" /> },
    khalti: { label: "Khalti", icon: <CreditCard className="w-5 h-5 text-purple-600" /> },
  };

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
        <div className="max-w-3xl mx-auto px-4 py-20 text-center">
          <AlertCircle className="w-12 h-12 text-gray-300 mx-auto mb-3" />
          <h2 className="text-lg font-semibold text-gray-700 mb-2">
            Group Cart Not Found
          </h2>
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

      <div className="max-w-3xl mx-auto px-4 py-8">
        {/* Back */}
        <Link
          href={`/group-cart/${groupCartId}`}
          className="inline-flex items-center gap-1 text-sm text-gray-500 hover:text-gray-800 mb-6"
        >
          <ArrowLeft className="w-4 h-4" /> Back to Group Cart
        </Link>

        {/* Success Banner */}
        {groupCart.status === "ordered" && (
          <div className="bg-green-50 border border-green-200 rounded-xl p-6 mb-6 text-center">
            <CheckCircle className="w-12 h-12 text-green-500 mx-auto mb-3" />
            <h2 className="text-xl font-bold text-green-800 mb-1">
              Group Order Placed!
            </h2>
            <p className="text-sm text-green-600">
              Your group order has been placed successfully!
            </p>
            {orderId && (
              <p className="text-xs text-green-500 mt-2 font-mono">
                Order ID: {orderId}
              </p>
            )}
          </div>
        )}

        {/* Group Info */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5 mb-6">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-bold text-gray-900">{groupCart.name}</h3>
              <p className="text-sm text-gray-500 flex items-center gap-1.5 mt-0.5">
                <ShoppingBag className="w-3.5 h-3.5" />
                {groupCart.itemCount || 0} items
              </p>
            </div>
            <div className="flex items-center gap-2 text-sm text-gray-500">
              <Users className="w-4 h-4" />
              {memberCount} members
            </div>
          </div>
          {/* Restaurants involved */}
          {summary?.restaurants && summary.restaurants.length > 0 && (
            <div className="mt-3 pt-3 border-t border-gray-100">
              <p className="text-xs text-gray-400 mb-2 flex items-center gap-1">
                <Store className="w-3 h-3" />
                Ordering from {summary.restaurants.length} restaurant{summary.restaurants.length > 1 ? 's' : ''}
              </p>
              <div className="flex flex-wrap gap-2">
                {summary.restaurants.map(r => (
                  <span key={r._id} className="text-xs bg-gray-50 border border-gray-100 rounded-full px-3 py-1 text-gray-600">
                    {r.name}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Split Payment Breakdown */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5 mb-6">
          <h3 className="text-sm font-semibold text-gray-700 mb-4 flex items-center gap-2">
            <DollarSign className="w-4 h-4 text-gray-400" />
            Payment Breakdown
            <span className="ml-auto text-xs bg-gray-100 text-gray-500 px-2 py-0.5 rounded-full">
              {splitMode === "individual"
                ? "Pay your own"
                : splitMode === "equal"
                  ? "Split equally"
                  : "Host pays all"}
            </span>
          </h3>

          <div className="space-y-3">
            {members.map((member) => {
              const isSelf = member.user?._id === user?._id;
              const isHostMember = member.user?._id === groupCart.host?._id;
              const share =
                splitMode === "host_pays"
                  ? isHostMember
                    ? grandTotal
                    : 0
                  : getMemberShare(member.subtotal || 0);
              const isPaid =
                groupCart.status === "ordered" && splitMode === "host_pays"
                  ? isHostMember
                  : groupCart.status === "ordered";

              return (
                <div
                  key={member.user?._id}
                  className={`flex items-center justify-between p-3 rounded-lg ${
                    isSelf
                      ? "bg-red-50 border border-red-100"
                      : "bg-gray-50"
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div
                      className={`w-9 h-9 rounded-full flex items-center justify-center text-sm font-bold text-white ${
                        isPaid ? "bg-green-500" : "bg-gray-400"
                      }`}
                    >
                      {(member.user?.username || "?").charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <div className="flex items-center gap-1.5">
                        <span className="text-sm font-medium text-gray-800">
                          {member.user?.username}
                          {isSelf && " (You)"}
                        </span>
                        {isHostMember && (
                          <Crown className="w-3 h-3 text-amber-500" />
                        )}
                      </div>
                      <p className="text-xs text-gray-400">
                        {member.items?.length || 0} items •{" "}
                        {splitMode === "individual"
                          ? `Food: Rs. ${(member.subtotal || 0).toLocaleString()}`
                          : `${member.items?.length || 0} items`}
                      </p>
                    </div>
                  </div>

                  <div className="text-right">
                    <p className="text-sm font-bold text-gray-900">
                      Rs. {share.toLocaleString()}
                    </p>
                    <div className="flex items-center gap-1 justify-end">
                      {isPaid ? (
                        <span className="text-xs text-green-600 flex items-center gap-0.5">
                          <CheckCircle className="w-3 h-3" /> Paid
                        </span>
                      ) : (
                        <span className="text-xs text-yellow-600 flex items-center gap-0.5">
                          <Clock className="w-3 h-3" /> Pending
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Total */}
          <div className="border-t border-gray-100 mt-4 pt-4">
            <div className="space-y-1.5 text-sm">
              <div className="flex justify-between text-gray-500">
                <span>Subtotal</span>
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
              <div className="border-t border-gray-100 pt-2 flex justify-between font-bold text-gray-900 text-base">
                <span>Grand Total</span>
                <span>Rs. {grandTotal.toLocaleString()}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Payment Method Info */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5 mb-6">
          <h3 className="text-sm font-semibold text-gray-700 mb-3">
            Payment Method
          </h3>
          <div className="flex items-center gap-3 bg-gray-50 rounded-lg p-3">
            <Banknote className="w-5 h-5 text-gray-500" />
            <div>
              <p className="text-sm font-medium text-gray-800">
                Cash on Delivery
              </p>
              <p className="text-xs text-gray-400">
                Payment will be collected at delivery
              </p>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="flex gap-3">
          {orderId && (
            <Link
              href={`/orders/${orderId}`}
              className="flex-1 flex items-center justify-center gap-2 bg-red-500 text-white py-3 rounded-xl font-medium hover:bg-red-600 transition"
            >
              <ShoppingBag className="w-4 h-4" />
              Track Order
            </Link>
          )}
          <Link
            href="/group-cart"
            className="flex-1 flex items-center justify-center gap-2 bg-gray-100 text-gray-700 py-3 rounded-xl font-medium hover:bg-gray-200 transition"
          >
            Back to Group Carts
          </Link>
        </div>
      </div>
    </div>
  );
}
