"use client";

import Image from "next/image";
import Link from "next/link";
import { Minus, Plus, Trash2, ArrowLeft, Loader2, Users, Copy, ChevronRight } from "lucide-react";
import { useState, useEffect, useCallback } from "react";
import {
  getCart,
  updateCartItem,
  removeFromCart,
  applyPromoCode,
  removePromoCode,
  requestParentApproval,
  getChildCartRequests,
  approveChildCartRequest,
  rejectChildCartRequest,
  updateChildCartRequestItem,
  ChildCartRequest,
  Cart as CartData,
} from "@/lib/cartService";
import { getMyGroupCarts, GroupCart } from "@/lib/groupCartService";
import { ChildSpendingSnapshot, getChildSummary, getMyChildAccounts } from "@/lib/userService";
import { useAuth } from "@/context/AuthContext";
import UserHeader from "@/components/layout/UserHeader";
import toast from "react-hot-toast";

interface CartItem {
  _id?: string;
  menuItem: string | {
    _id: string;
    name?: string;
    price?: number;
    image?: string;
    isAvailable?: boolean;
  };
  name: string;
  price: number;
  image?: string;
  quantity: number;
  specialInstructions?: string;
}

interface RestaurantGroup {
  restaurant: {
    _id: string;
    name: string;
    logoUrl?: string;
  };
  items: CartItem[];
}

const PERIOD_LABELS = {
  daily: "Daily",
  weekly: "Weekly",
  monthly: "Monthly"
} as const;

const formatCurrency = (value?: number | null) =>
  value === null || value === undefined ? "Not set" : `Rs. ${value}`;

export default function CartPage() {
  const [cart, setCart] = useState<CartData | null>(null);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState<string | null>(null);
  const [promoCode, setPromoCode] = useState("");
  const [promoError, setPromoError] = useState("");
  const [activeGroupCarts, setActiveGroupCarts] = useState<GroupCart[]>([]);
  const [childCartRequests, setChildCartRequests] = useState<ChildCartRequest[]>([]);
  const [hasChildAccounts, setHasChildAccounts] = useState(false);
  const [loadingChildRequests, setLoadingChildRequests] = useState(false);
  const [submittingApproval, setSubmittingApproval] = useState(false);
  const [reviewingRequestId, setReviewingRequestId] = useState<string | null>(null);
  const [updatingChildItemKey, setUpdatingChildItemKey] = useState<string | null>(null);
  const [childSpending, setChildSpending] = useState<ChildSpendingSnapshot | null>(null);
  const [loadingChildSummary, setLoadingChildSummary] = useState(false);
  const { user: authUser } = useAuth();

  const fetchActiveGroupCarts = useCallback(async () => {
    if (authUser?.role === 'child') {
      setActiveGroupCarts([]);
      return;
    }

    try {
      const res = await getMyGroupCarts();
      const carts = res.data?.data || [];
      const active = (Array.isArray(carts) ? carts : []).filter(
        (gc: GroupCart) => gc.status === 'open' || gc.status === 'locked' || gc.status === 'payment_pending'
      );
      setActiveGroupCarts(active);
    } catch {
      // silent
    }
  }, [authUser?.role]);

  const fetchChildCartRequests = useCallback(async () => {
    if (authUser?.role !== 'customer') {
      setChildCartRequests([]);
      return;
    }

    try {
      setLoadingChildRequests(true);
      const response = await getChildCartRequests();
      const requests = (response?.data as { data?: ChildCartRequest[] } | undefined)?.data || [];
      setChildCartRequests(Array.isArray(requests) ? requests : []);
    } catch {
      setChildCartRequests([]);
    } finally {
      setLoadingChildRequests(false);
    }
  }, [authUser?.role]);

  const fetchChildAccounts = useCallback(async () => {
    if (authUser?.role !== 'customer') {
      setHasChildAccounts(false);
      return;
    }

    try {
      const response = await getMyChildAccounts();
      const accounts = response.data?.data || [];
      setHasChildAccounts(Array.isArray(accounts) && accounts.length > 0);
    } catch {
      setHasChildAccounts(false);
    }
  }, [authUser?.role]);

  const fetchChildSummary = useCallback(async () => {
    if (authUser?.role !== "child") {
      setChildSpending(null);
      return;
    }

    try {
      setLoadingChildSummary(true);
      const response = await getChildSummary();
      if (response.error) {
        return;
      }

      setChildSpending(response.data?.data?.spending || null);
    } catch {
      setChildSpending(null);
    } finally {
      setLoadingChildSummary(false);
    }
  }, [authUser?.role]);

  const copyCode = (code: string) => {
    navigator.clipboard.writeText(code);
    toast.success('Invite code copied!');
  };

  const fetchCart = useCallback(async () => {
    try {
      setLoading(true);
      const response = await getCart();
      const cartData = response.data?.data || null;

      if (authUser?.role === 'child' && cartData && (cartData.promoCode || cartData.promoDiscount)) {
        const removeResponse = await removePromoCode();
        if (!removeResponse.error) {
          toast.error("Promo codes are not available for child accounts.");
          setCart({
            ...cartData,
            promoCode: undefined,
            promoDiscount: 0,
            parentApproval: {
              ...cartData.parentApproval,
              status: 'not_required',
              note: ''
            }
          });
          return;
        }
      }

      setCart(cartData);
    } catch (err) {
      console.error("Error fetching cart:", err);
    } finally {
      setLoading(false);
    }
  }, [authUser?.role]);

  useEffect(() => {
    fetchCart();
    fetchActiveGroupCarts();
    fetchChildAccounts();
    fetchChildCartRequests();
    fetchChildSummary();
  }, [fetchActiveGroupCarts, fetchCart, fetchChildAccounts, fetchChildCartRequests, fetchChildSummary]);

  const handleSendToParentApproval = async () => {
    if (hasExhaustedChildLimit) {
      toast.error("Spending limit exceeded");
      return;
    }

    try {
      setSubmittingApproval(true);
      const response = await requestParentApproval();
      if (response.error) {
        toast.error(response.error);
        return;
      }

      toast.success("Your cart has been sent to your parent for approval.");
      await fetchCart();
    } catch {
      toast.error("Failed to send cart approval request");
    } finally {
      setSubmittingApproval(false);
    }
  };

  const handleParentReview = async (cartId: string, action: 'approve' | 'reject') => {
    try {
      setReviewingRequestId(cartId);
      const response = action === 'approve'
        ? await approveChildCartRequest(cartId)
        : await rejectChildCartRequest(cartId);

      if (response.error) {
        toast.error(response.error);
        return;
      }

      toast.success(action === 'approve' ? 'Child cart approved' : 'Child cart rejected');
      await fetchChildCartRequests();
    } catch {
      toast.error('Failed to update request');
    } finally {
      setReviewingRequestId(null);
    }
  };

  const getChildRequestMenuItemId = (menuItem: ChildCartRequest["restaurantGroups"][number]["items"][number]["menuItem"]) => {
    if (typeof menuItem === "string") {
      return menuItem;
    }

    return menuItem?._id || "";
  };

  const getMenuItemId = (menuItem: CartItem["menuItem"]): string => {
    if (typeof menuItem === "string") {
      return menuItem;
    }
    return menuItem?._id || "";
  };

  const handleParentChildCartUpdate = async (cartId: string, menuItemId: string, quantity: number) => {
    if (!menuItemId) {
      toast.error("Unable to update this item right now.");
      return;
    }

    try {
      setUpdatingChildItemKey(`${cartId}:${menuItemId}`);
      const response = await updateChildCartRequestItem(cartId, menuItemId, quantity);

      if (response.error) {
        toast.error(response.error);
        return;
      }

      await fetchChildCartRequests();
    } catch {
      toast.error("Failed to update child cart");
    } finally {
      setUpdatingChildItemKey(null);
    }
  };

  const updateQuantity = async (menuItemId: string, quantity: number) => {
    if (quantity < 1) return;
    try {
      setUpdating(menuItemId);
      await updateCartItem(menuItemId, quantity);
      await fetchCart();
    } catch (err) {
      console.error("Error updating quantity:", err);
    } finally {
      setUpdating(null);
    }
  };

  const removeItem = async (menuItemId: string) => {
    try {
      setUpdating(menuItemId);
      await removeFromCart(menuItemId);
      await fetchCart();
    } catch (err) {
      console.error("Error removing item:", err);
    } finally {
      setUpdating(null);
    }
  };

  const handleApplyPromo = async () => {
    if (!promoCode.trim()) return;
    try {
      setPromoError("");
      await applyPromoCode(promoCode);
      await fetchCart();
    } catch (err: unknown) {
      const error = err as { response?: { data?: { message?: string } } };
      setPromoError(error.response?.data?.message || "Invalid promo code");
    }
  };

  const handleRemovePromo = async () => {
    try {
      await removePromoCode();
      setPromoCode("");
      await fetchCart();
    } catch (err) {
      console.error("Error removing promo:", err);
    }
  };

  // Calculate subtotal across all groups
  const subtotal = cart?.restaurantGroups.reduce((acc, group) => {
    return acc + group.items.reduce((sum, item) => sum + item.price * item.quantity, 0);
  }, 0) || 0;

  const deliveryFee = (cart?.restaurantGroups.length || 0) * 50;
  const serviceFee = 20;
  const discount = cart?.promoDiscount || 0;
  const total = subtotal + deliveryFee + serviceFee - discount;
  const childApprovalStatus = cart?.parentApproval?.status || 'not_required';
  const childApprovalNote = cart?.parentApproval?.note?.trim();
  const hasExhaustedChildLimit = Boolean(
    childSpending &&
    (["daily", "weekly", "monthly"] as const).some((period) => {
      const snapshot = childSpending[period];
      return snapshot.limit !== null && snapshot.remaining !== null && snapshot.remaining <= 0;
    })
  );
  const projectedRemaining = childSpending ? {
    daily: childSpending.daily.limit === null ? null : Math.max(childSpending.daily.limit - (childSpending.daily.used + total), 0),
    weekly: childSpending.weekly.limit === null ? null : Math.max(childSpending.weekly.limit - (childSpending.weekly.used + total), 0),
    monthly: childSpending.monthly.limit === null ? null : Math.max(childSpending.monthly.limit - (childSpending.monthly.used + total), 0)
  } : null;

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-red-500" />
      </div>
    );
  }

  const hasItems = cart && cart.restaurantGroups.length > 0;

  return (
    <div className="min-h-screen bg-gray-50">
      <UserHeader />

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Link
          href="/browse-restaurants"
          className="inline-flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-6"
        >
          <ArrowLeft className="w-5 h-5" />
          <span>Continue Shopping</span>
        </Link>

        <h1 className="text-2xl font-bold text-gray-900 mb-6">Your Cart</h1>

        {/* Parent Cart Approval */}
        {authUser?.role === 'customer' && hasChildAccounts && (
          <div className="mb-6 rounded-xl border border-blue-100 bg-blue-50 p-4">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-sm font-semibold text-blue-900">Child Cart Requests</h2>
                <p className="text-xs text-blue-700 mt-1">
                  Approve first, then adjust the approved cart here and pay from your account.
                </p>
              </div>
              <button
                onClick={fetchChildCartRequests}
                className="text-xs font-medium text-blue-700 hover:text-blue-800"
              >
                Refresh
              </button>
            </div>

            {loadingChildRequests ? (
              <p className="text-xs text-blue-700 mt-2">Loading requests...</p>
            ) : childCartRequests.length === 0 ? (
              <p className="text-xs text-blue-700 mt-2">No child carts are waiting for approval or parent payment.</p>
            ) : (
              <div className="mt-3 space-y-3">
                {childCartRequests.map((request) => (
                  <div key={request._id} className="rounded-lg border border-blue-200 bg-white p-3">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="text-sm font-semibold text-gray-900">
                          {request.child.displayName || request.child.username}
                        </p>
                        <p className="text-xs text-gray-600 mt-1">
                          {request.itemCount} item(s) • Subtotal Rs. {request.subtotal - (request.promoDiscount || 0)}
                        </p>
                      </div>
                      <span className={`shrink-0 rounded-full px-2.5 py-1 text-[11px] font-semibold ${
                        request.parentApproval.status === 'approved'
                          ? 'bg-green-100 text-green-700'
                          : 'bg-amber-100 text-amber-700'
                      }`}>
                        {request.parentApproval.status === 'approved' ? 'Approved' : 'Pending Approval'}
                      </span>
                    </div>

                    <div className="mt-3 space-y-3">
                      {request.restaurantGroups.map((group) => (
                        <div key={group.restaurant._id} className="rounded-md border border-gray-100 bg-gray-50 p-3">
                          <p className="text-xs font-semibold text-gray-700">{group.restaurant.name}</p>
                          <div className="mt-2 space-y-2">
                            {group.items.map((item) => {
                              const menuItemId = getChildRequestMenuItemId(item.menuItem);
                              const itemKey = `${request._id}:${menuItemId}`;
                              const isUpdating = updatingChildItemKey === itemKey;

                              return (
                                <div key={itemKey} className="flex items-center justify-between gap-3">
                                  <div className="min-w-0">
                                    <p className="text-sm text-gray-900">{item.name}</p>
                                    <p className="text-xs text-gray-500">Rs. {item.price} each</p>
                                  </div>

                                  {request.parentApproval.status === 'approved' ? (
                                    <div className="flex items-center gap-2">
                                      <button
                                        onClick={() => handleParentChildCartUpdate(request._id, menuItemId, item.quantity - 1)}
                                        disabled={isUpdating}
                                        className="w-7 h-7 rounded-full border border-gray-300 flex items-center justify-center text-gray-700 hover:bg-white disabled:opacity-50"
                                      >
                                        <Minus className="w-3 h-3" />
                                      </button>
                                      <span className="w-6 text-center text-sm font-medium text-gray-900">
                                        {isUpdating ? <Loader2 className="w-3 h-3 animate-spin mx-auto" /> : item.quantity}
                                      </span>
                                      <button
                                        onClick={() => handleParentChildCartUpdate(request._id, menuItemId, item.quantity + 1)}
                                        disabled={isUpdating}
                                        className="w-7 h-7 rounded-full border border-gray-300 flex items-center justify-center text-gray-700 hover:bg-white disabled:opacity-50"
                                      >
                                        <Plus className="w-3 h-3" />
                                      </button>
                                      <button
                                        onClick={() => handleParentChildCartUpdate(request._id, menuItemId, 0)}
                                        disabled={isUpdating}
                                        className="px-2 py-1 rounded-md border border-red-200 text-red-600 text-[11px] font-medium hover:bg-red-50 disabled:opacity-50"
                                      >
                                        Remove
                                      </button>
                                    </div>
                                  ) : (
                                    <span className="text-xs font-medium text-gray-600">x{item.quantity}</span>
                                  )}
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      ))}
                    </div>

                    {request.parentApproval.note?.trim() && (
                      <p className="mt-2 text-xs text-gray-600">
                        Note: {request.parentApproval.note.trim()}
                      </p>
                    )}

                    <div className="mt-3 flex gap-2">
                      {request.parentApproval.status === 'pending_parent_approval' ? (
                        <>
                          <button
                            onClick={() => handleParentReview(request._id, 'approve')}
                            disabled={reviewingRequestId === request._id}
                            className="px-3 py-1.5 rounded-md bg-green-600 text-white text-xs font-medium hover:bg-green-700 disabled:opacity-60"
                          >
                            Approve
                          </button>
                          <button
                            onClick={() => handleParentReview(request._id, 'reject')}
                            disabled={reviewingRequestId === request._id}
                            className="px-3 py-1.5 rounded-md bg-red-600 text-white text-xs font-medium hover:bg-red-700 disabled:opacity-60"
                          >
                            Reject
                          </button>
                        </>
                      ) : (
                        <>
                          {request.restaurantGroups[0]?.restaurant?._id && (
                            <Link
                              href={`/view-restaurant/${request.restaurantGroups[0].restaurant._id}?childCartId=${request._id}`}
                              className="inline-flex items-center justify-center px-3 py-1.5 rounded-md text-xs font-medium border border-blue-200 text-blue-700 hover:bg-blue-50"
                            >
                              Add Items
                            </Link>
                          )}
                          <Link
                            href={`/user-payment?childCartId=${request._id}`}
                            className={`inline-flex items-center justify-center px-3 py-1.5 rounded-md text-xs font-medium ${
                              request.itemCount > 0
                                ? 'bg-blue-600 text-white hover:bg-blue-700'
                                : 'bg-gray-200 text-gray-500 pointer-events-none'
                            }`}
                          >
                            {request.itemCount > 0 ? 'Pay for Child' : 'Child Cart Is Empty'}
                          </Link>
                        </>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Active Group Carts */}
        {authUser?.role !== 'child' && activeGroupCarts.length > 0 ? (
          <div className="mb-6 space-y-3">
            {activeGroupCarts.map((gc) => (
              <div
                key={gc._id}
                className="flex items-center justify-between bg-linear-to-r from-red-50 to-orange-50 border border-red-100 rounded-xl p-4"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-10 h-10 bg-red-100 rounded-full flex items-center justify-center shrink-0">
                    <Users className="w-5 h-5 text-red-500" />
                  </div>
                  <div className="min-w-0">
                    <p className="font-semibold text-gray-900 text-sm truncate">
                      {gc.name}
                    </p>
                    <div className="flex items-center gap-2 mt-0.5">
                      <span className="text-xs font-mono bg-white border border-red-200 text-red-600 px-2 py-0.5 rounded-md tracking-wider">
                        {gc.inviteCode}
                      </span>
                      <button
                        onClick={() => copyCode(gc.inviteCode)}
                        className="text-gray-400 hover:text-red-500 transition"
                        title="Copy code"
                      >
                        <Copy className="w-3.5 h-3.5" />
                      </button>
                      <span className="text-xs text-gray-400">
                        {gc.members?.length || 1} member{(gc.members?.length || 1) > 1 ? 's' : ''}
                        {' · '}{gc.itemCount || 0} items
                      </span>
                    </div>
                  </div>
                </div>
                <Link
                  href={`/group-cart/${gc._id}`}
                  className="flex items-center gap-1 text-red-500 text-sm font-medium hover:text-red-600 transition shrink-0 ml-3"
                >
                  Open <ChevronRight className="w-4 h-4" />
                </Link>
              </div>
            ))}
            <Link
              href="/group-cart"
              className="block text-center text-xs text-gray-400 hover:text-red-500 transition py-1"
            >
              View all group carts →
            </Link>
          </div>
        ) : authUser?.role !== 'child' ? (
          <Link
            href="/group-cart"
            className="mb-6 flex items-center justify-between bg-linear-to-r from-red-50 to-orange-50 border border-red-100 rounded-xl p-4 hover:shadow-md transition group"
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-red-100 rounded-full flex items-center justify-center">
                <Users className="w-5 h-5 text-red-500" />
              </div>
              <div>
                <p className="font-semibold text-gray-900 text-sm">Order with Friends</p>
                <p className="text-xs text-gray-500">Create or join a group cart and split the bill</p>
              </div>
            </div>
            <span className="text-red-500 text-sm font-medium group-hover:translate-x-1 transition-transform">→</span>
          </Link>
        ) : null}

        {!hasItems ? (
          <div className="text-center py-16">
            <div className="text-6xl mb-4">🛒</div>
            <h2 className="text-xl font-semibold text-gray-900 mb-2">Your cart is empty</h2>
            <p className="text-gray-600 mb-6">Add some delicious food to get started!</p>
            <Link
              href="/browse-restaurants"
              className="inline-block bg-red-500 hover:bg-red-600 text-white px-6 py-3 rounded-lg font-medium transition-colors"
            >
              Browse Restaurants
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2 space-y-6">
              {cart.restaurantGroups.map((group) => (
                <div key={group.restaurant._id} className="bg-white rounded-xl border border-gray-200 overflow-hidden">
                  <div className="p-4 border-b border-gray-200 bg-gray-50 flex items-center justify-between">
                    <h2 className="font-semibold text-gray-900">
                      {group.restaurant.name}
                    </h2>
                    <span className="text-xs text-gray-500">{group.items.length} items</span>
                  </div>

                  <div className="divide-y divide-gray-200">
                    {group.items.map((item) => (
                      <div key={item._id} className="p-4">
                        <div className="flex gap-4">
                          <div className="w-16 h-16 rounded-lg bg-gray-100 overflow-hidden shrink-0">
                            <Image
                              src={item.image || "/food-placeholder.jpg"}
                              alt={item.name}
                              width={64}
                              height={64}
                              className="w-full h-full object-cover"
                            />
                          </div>

                          <div className="flex-1">
                            <div className="flex items-start justify-between">
                              <div>
                                <h3 className="font-medium text-gray-900">{item.name}</h3>
                                {item.specialInstructions && (
                                  <p className="text-xs text-orange-600 mt-1">Note: {item.specialInstructions}</p>
                                )}
                              </div>
                              <button
                                onClick={() => removeItem(getMenuItemId(item.menuItem))}
                                className="text-gray-400 hover:text-red-500 transition-colors"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>

                            <div className="flex items-center justify-between mt-2">
                              <div className="flex items-center gap-3">
                                <button
                                  onClick={() => updateQuantity(getMenuItemId(item.menuItem), item.quantity - 1)}
                                  disabled={updating === getMenuItemId(item.menuItem) || item.quantity <= 1}
                                  className="w-6 h-6 rounded-full border border-gray-300 flex items-center justify-center hover:bg-gray-50 disabled:opacity-50"
                                >
                                  <Minus className="w-3 h-3" />
                                </button>
                                <span className="text-sm font-medium w-4 text-center">
                                  {updating === getMenuItemId(item.menuItem) ? <Loader2 className="w-3 h-3 animate-spin mx-auto" /> : item.quantity}
                                </span>
                                <button
                                  onClick={() => updateQuantity(getMenuItemId(item.menuItem), item.quantity + 1)}
                                  disabled={updating === getMenuItemId(item.menuItem)}
                                  className="w-6 h-6 rounded-full border border-gray-300 flex items-center justify-center hover:bg-gray-50 disabled:opacity-50"
                                >
                                  <Plus className="w-3 h-3" />
                                </button>
                              </div>
                              <span className="text-sm font-bold text-gray-900">
                                Rs. {item.price * item.quantity}
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>

            <div className="lg:col-span-1">
              <div className="bg-white rounded-xl border border-gray-200 p-6 sticky top-24">
                <h2 className="font-semibold text-gray-900 mb-4">Order Summary</h2>

                <div className="space-y-3 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Subtotal</span>
                    <span className="text-gray-900">Rs. {subtotal}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Delivery Fee ({cart.restaurantGroups.length} rest.)</span>
                    <span className="text-gray-900">Rs. {deliveryFee}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Service Fee</span>
                    <span className="text-gray-900">Rs. {serviceFee}</span>
                  </div>
                  {discount > 0 && (
                    <div className="flex justify-between text-green-600">
                      <span>Discount</span>
                      <span>-Rs. {discount}</span>
                    </div>
                  )}

                  <div className="border-t border-gray-200 pt-3 mt-3">
                    <div className="flex justify-between font-semibold">
                      <span className="text-gray-900">Total</span>
                      <span className="text-gray-900 text-lg">Rs. {total}</span>
                    </div>
                  </div>
                </div>

                {authUser?.role !== 'child' && (
                  <div className="mt-6">
                    {cart.promoCode ? (
                      <div className="flex items-center justify-between bg-green-50 p-3 rounded-lg">
                        <div>
                          <span className="text-green-700 font-medium">{cart.promoCode}</span>
                          <span className="text-green-600 text-xs ml-2">Applied!</span>
                        </div>
                        <button
                          onClick={handleRemovePromo}
                          className="text-red-500 text-xs hover:text-red-600"
                        >
                          Remove
                        </button>
                      </div>
                    ) : (
                      <>
                        <div className="flex gap-2">
                          <input
                            type="text"
                            placeholder="Enter promo code"
                            value={promoCode}
                            onChange={(e) => setPromoCode(e.target.value)}
                            className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-red-500"
                          />
                          <button
                            onClick={handleApplyPromo}
                            className="px-4 py-2 bg-gray-900 text-white rounded-lg text-sm hover:bg-gray-800 transition-colors"
                          >
                            Apply
                          </button>
                        </div>
                        {promoError && <p className="text-red-500 text-xs mt-2">{promoError}</p>}
                      </>
                    )}
                  </div>
                )}

                {authUser?.role === 'child' ? (
                  childApprovalStatus === 'approved' ? (
                    <button
                      disabled
                      className="w-full mt-6 bg-green-100 text-green-700 py-3 rounded-lg font-medium cursor-not-allowed"
                    >
                      Parent Will Review and Pay
                    </button>
                  ) : hasExhaustedChildLimit && childApprovalStatus !== 'pending_parent_approval' ? (
                    <button
                      disabled
                      className="w-full mt-6 bg-red-100 text-red-700 py-3 rounded-lg font-medium cursor-not-allowed"
                    >
                      Limit Exceeded
                    </button>
                  ) : (
                    <button
                      onClick={handleSendToParentApproval}
                      disabled={submittingApproval || childApprovalStatus === 'pending_parent_approval'}
                      className="w-full mt-6 bg-blue-600 hover:bg-blue-700 text-white py-3 rounded-lg font-medium transition-colors disabled:opacity-60"
                    >
                      {submittingApproval
                        ? 'Sending...'
                        : childApprovalStatus === 'pending_parent_approval'
                          ? 'Awaiting Parent Approval'
                          : childApprovalStatus === 'rejected'
                            ? 'Request Approval Again'
                            : 'Request Parent Approval'}
                    </button>
                  )
                ) : (
                  <Link
                    href="/user-payment"
                    className="w-full mt-6 bg-red-500 hover:bg-red-600 text-white py-3 rounded-lg font-medium transition-colors flex items-center justify-center"
                  >
                    Proceed to Checkout
                  </Link>
                )}

                {authUser?.role === 'child' && (
                  <div className="mt-6 rounded-xl border border-blue-100 bg-blue-50 p-4">
                    <div className="flex items-center justify-between gap-3">
                      <div>
                        <p className="text-sm font-semibold text-blue-900">Spending Summary</p>
                        <p className="text-xs text-blue-700 mt-1">
                          Check the balance your parent still allows before sending this cart.
                        </p>
                      </div>
                      {loadingChildSummary && <Loader2 className="w-4 h-4 animate-spin text-blue-700" />}
                    </div>

                    {childSpending ? (
                      <div className="mt-4 space-y-3">
                        {(["daily", "weekly", "monthly"] as const).map((period) => {
                          const snapshot = childSpending[period];
                          const usagePercent = snapshot.limit && snapshot.limit > 0
                            ? Math.min(100, Math.round((snapshot.used / snapshot.limit) * 100))
                            : 0;

                          return (
                            <div key={period} className="rounded-lg bg-white border border-blue-100 p-3">
                              <div className="flex items-center justify-between gap-3">
                                <p className="text-sm font-medium text-gray-900">{PERIOD_LABELS[period]}</p>
                                <p className="text-xs text-gray-500">
                                  Used {formatCurrency(snapshot.used)}
                                </p>
                              </div>
                              <p className="text-xs text-gray-600 mt-1">
                                Limit: {formatCurrency(snapshot.limit)}
                              </p>
                              <p className="text-sm text-blue-800 font-medium mt-1">
                                Remaining now: {snapshot.remaining === null ? "Flexible" : `Rs. ${snapshot.remaining}`}
                              </p>
                              {projectedRemaining && (
                                <p className="text-xs text-gray-500 mt-1">
                                  After this cart: {projectedRemaining[period] === null ? "Flexible" : `Rs. ${projectedRemaining[period]}`}
                                </p>
                              )}
                              {snapshot.limit !== null && (
                                <div className="mt-3 h-2 rounded-full bg-blue-100 overflow-hidden">
                                  <div
                                    className={`h-full rounded-full ${usagePercent >= 90 ? "bg-red-500" : usagePercent >= 70 ? "bg-amber-500" : "bg-blue-600"}`}
                                    style={{ width: `${usagePercent}%` }}
                                  />
                                </div>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    ) : (
                      <p className="text-xs text-blue-700 mt-3">
                        Spending limits will appear here once your child summary is available.
                      </p>
                    )}
                  </div>
                )}

                {authUser?.role === 'child' && (
                  <>
                    <p className={`text-xs mt-2 ${
                      childApprovalStatus === 'approved'
                        ? 'text-green-700'
                        : childApprovalStatus === 'rejected'
                          ? 'text-red-700'
                          : 'text-blue-700'
                    }`}>
                      {childApprovalStatus === 'approved'
                        ? 'Your parent approved this cart. They can now review it, customize it, and complete payment from their account.'
                        : childApprovalStatus === 'pending_parent_approval'
                          ? 'Your cart is waiting for your parent approval.'
                          : hasExhaustedChildLimit
                            ? 'Your spending limit has been reached. Update the cart or wait until your balance resets.'
                          : childApprovalStatus === 'rejected'
                            ? `Your parent rejected this cart.${childApprovalNote ? ` Note: ${childApprovalNote}` : ' Update it and request approval again.'}`
                            : 'Your cart will be sent to your parent for approval before checkout.'}
                    </p>

                    <div className="mt-3 grid grid-cols-3 gap-2">
                      <div className={`rounded-lg border px-3 py-2 text-center text-xs font-medium ${
                        childApprovalStatus === "pending_parent_approval" || childApprovalStatus === "approved"
                          ? "border-blue-200 bg-blue-50 text-blue-700"
                          : "border-gray-200 bg-gray-50 text-gray-500"
                      }`}>
                        Pending Approval
                      </div>
                      <div className={`rounded-lg border px-3 py-2 text-center text-xs font-medium ${
                        childApprovalStatus === "approved"
                          ? "border-green-200 bg-green-50 text-green-700"
                          : "border-gray-200 bg-gray-50 text-gray-500"
                      }`}>
                        Approved
                      </div>
                      <div className="rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-center text-xs font-medium text-gray-500">
                        Preparing
                      </div>
                    </div>
                    <p className="text-[11px] text-gray-500 mt-2">
                      Preparing status becomes visible in order tracking after your parent completes payment.
                    </p>
                  </>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
