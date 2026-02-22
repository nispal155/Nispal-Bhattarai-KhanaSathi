import { get, post, put, del } from './api';

// Types
export interface GroupCartItem {
  _id?: string;
  menuItem: {
    _id: string;
    name: string;
    price: number;
    image?: string;
    isAvailable?: boolean;
  } | string;
  restaurant?: {
    _id: string;
    name: string;
    logoUrl?: string;
    address?: string;
  } | string;
  restaurantName?: string;
  name: string;
  price: number;
  image?: string;
  quantity: number;
  specialInstructions?: string;
}

export interface GroupCartMember {
  _id?: string;
  user: {
    _id: string;
    username: string;
    profilePicture?: string;
  };
  role: 'host' | 'member';
  items: GroupCartItem[];
  isReady: boolean;
  paymentStatus: 'none' | 'pending' | 'paid';
  paymentAmount: number;
  paymentMethod: 'cod' | 'esewa' | 'khalti' | '';
  paymentRef?: string;
  joinedAt: string;
  subtotal: number;
}

export interface GroupCart {
  _id: string;
  name: string;
  host: {
    _id: string;
    username: string;
    profilePicture?: string;
  };
  inviteCode: string;
  members: GroupCartMember[];
  status: 'open' | 'locked' | 'payment_pending' | 'ordered' | 'cancelled';
  maxMembers: number;
  splitMode: 'individual' | 'equal' | 'host_pays';
  paymentMethod?: 'cod' | 'esewa' | 'khalti' | '';
  allPaid?: boolean;
  promoCode?: string;
  promoDiscount: number;
  total: number;
  itemCount: number;
  allReady: boolean;
  expiresAt: string;
  createdAt: string;
  updatedAt: string;
}

export interface MemberBreakdown {
  user: {
    _id: string;
    username: string;
    profilePicture?: string;
  };
  role: 'host' | 'member';
  isReady: boolean;
  items: GroupCartItem[];
  subtotal: number;
  itemCount: number;
}

export interface GroupCartSummary {
  groupCartId: string;
  name: string;
  restaurants: {
    _id: string;
    name: string;
    logoUrl?: string;
  }[];
  status: string;
  splitMode: string;
  allReady: boolean;
  memberBreakdown: MemberBreakdown[];
  pricing: {
    subtotal: number;
    deliveryFee: number;
    serviceFee: number;
    discount: number;
    total: number;
  };
  perMemberShare: Record<string, number>;
  promoCode?: string;
}

interface GroupCartResponse {
  success: boolean;
  data: GroupCart;
  message?: string;
}

interface GroupCartListResponse {
  success: boolean;
  data: GroupCart[];
}

interface GroupCartSummaryResponse {
  success: boolean;
  data: GroupCartSummary;
}

// API calls

// Create a group cart
export async function createGroupCart(
  name: string,
  maxMembers?: number,
  splitMode?: 'individual' | 'equal' | 'host_pays'
) {
  return post<GroupCartResponse>('/group-cart', {
    name,
    maxMembers,
    splitMode
  });
}

// Join a group cart
export async function joinGroupCart(inviteCode: string) {
  return post<GroupCartResponse>('/group-cart/join', { inviteCode });
}

// Get a specific group cart
export async function getGroupCart(id: string) {
  return get<GroupCartResponse>(`/group-cart/${id}`);
}

// Get all my active group carts
export async function getMyGroupCarts() {
  return get<GroupCartListResponse>('/group-cart/my');
}

// Get group cart summary
export async function getGroupCartSummary(id: string) {
  return get<GroupCartSummaryResponse>(`/group-cart/${id}/summary`);
}

// Add item to group cart
export async function addItemToGroupCart(
  groupCartId: string,
  menuItemId: string,
  quantity: number = 1,
  specialInstructions?: string
) {
  return post<GroupCartResponse>(`/group-cart/${groupCartId}/items`, {
    menuItemId,
    quantity,
    specialInstructions
  });
}

// Update item in group cart
export async function updateGroupCartItem(
  groupCartId: string,
  menuItemId: string,
  quantity: number,
  specialInstructions?: string
) {
  return put<GroupCartResponse>(`/group-cart/${groupCartId}/items`, {
    menuItemId,
    quantity,
    specialInstructions
  });
}

// Remove item from group cart
export async function removeGroupCartItem(groupCartId: string, menuItemId: string) {
  return del<GroupCartResponse>(`/group-cart/${groupCartId}/items/${menuItemId}`);
}

// Toggle ready status
export async function toggleReady(groupCartId: string) {
  return post<GroupCartResponse>(`/group-cart/${groupCartId}/ready`, {});
}

// Lock group cart (host only)
export async function lockGroupCart(groupCartId: string) {
  return put<GroupCartResponse>(`/group-cart/${groupCartId}/lock`, {});
}

// Unlock group cart (host only)
export async function unlockGroupCart(groupCartId: string) {
  return put<GroupCartResponse>(`/group-cart/${groupCartId}/unlock`, {});
}

// Update split mode (host only)
export async function updateSplitMode(
  groupCartId: string,
  splitMode: 'individual' | 'equal' | 'host_pays'
) {
  return put<GroupCartResponse>(`/group-cart/${groupCartId}/split-mode`, { splitMode });
}

// Remove member (host only)
export async function removeMemberFromGroupCart(groupCartId: string, userId: string) {
  return del<GroupCartResponse>(`/group-cart/${groupCartId}/members/${userId}`);
}

// Leave group cart
export async function leaveGroupCart(groupCartId: string) {
  return post<{ success: boolean; message: string }>(`/group-cart/${groupCartId}/leave`, {});
}

// Cancel group cart (host only)
export async function cancelGroupCart(groupCartId: string) {
  return del<{ success: boolean; message: string }>(`/group-cart/${groupCartId}`);
}

// Place group order (host only, COD)
export async function placeGroupOrder(
  groupCartId: string,
  deliveryAddress: {
    addressLine1: string;
    city: string;
    state: string;
    zipCode: string;
  },
  specialInstructions?: string
) {
  return post<{
    success: boolean;
    message: string;
    data: {
      orderId: string;
      orderNumber: string;
      total: number;
      splitMode: string;
      perMemberShare: Record<string, number>;
    };
  }>(`/group-cart/${groupCartId}/place-order`, {
    deliveryAddress,
    specialInstructions
  });
}

// ── Payment-aware group order endpoints ──

export interface InitiateGroupOrderResponse {
  success: boolean;
  message: string;
  data: {
    requiresPayment?: boolean;
    paymentGateway?: 'esewa' | 'khalti' | 'member_split';
    paymentUrl?: string;
    pidx?: string;
    formData?: Record<string, string>;
    grandTotal: number;
    combinedShares: Record<string, number>;
    splitMode: string;
    orders?: Array<{ orderId: string; orderNumber: string }>;
    groupCart?: GroupCart;
    orderPlaced?: boolean;
  };
}

// Initiate group order (host only) – selects payment method
export async function initiateGroupOrder(
  groupCartId: string,
  paymentMethod: 'cod' | 'esewa' | 'khalti',
  deliveryAddress?: {
    addressLine1: string;
    city: string;
    state: string;
    zipCode: string;
  }
) {
  return post<InitiateGroupOrderResponse>(`/group-cart/${groupCartId}/initiate-order`, {
    paymentMethod,
    deliveryAddress
  });
}

// Pay group share – COD (member confirms)
export async function payGroupShareCOD(groupCartId: string) {
  return post<InitiateGroupOrderResponse>(`/group-cart/${groupCartId}/pay-share/cod`, {});
}

// Pay group share – eSewa
export async function payGroupShareEsewa(groupCartId: string) {
  return post<{ success: boolean; data: { paymentUrl: string; formData: Record<string, string> } }>(
    `/group-cart/${groupCartId}/pay-share/esewa`, {}
  );
}

// Pay group share – Khalti
export async function payGroupShareKhalti(groupCartId: string) {
  return post<{ success: boolean; data: { paymentUrl: string; pidx: string } }>(
    `/group-cart/${groupCartId}/pay-share/khalti`, {}
  );
}

// Verify group eSewa payment
export async function verifyGroupEsewa(data: string, groupCartId: string) {
  return post<InitiateGroupOrderResponse>(`/group-cart/payment/esewa/verify`, { data, groupCartId });
}

// Verify group Khalti payment
export async function verifyGroupKhalti(pidx: string, pendingId: string, groupCartId: string) {
  return post<InitiateGroupOrderResponse>(`/group-cart/payment/khalti/verify`, { pidx, pendingId, groupCartId });
}
