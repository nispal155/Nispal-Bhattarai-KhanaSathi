import { get, post, put, del } from './api';

// Types
export interface ChildSpendingLimits {
  daily: number | null;
  weekly: number | null;
  monthly: number | null;
}

export interface ChildFoodRestrictions {
  blockJunkFood: boolean;
  blockCaffeine: boolean;
  blockedAllergens: string[];
}

export interface UserProfile {
  _id: string;
  username: string;
  email: string;
  role: string;
  parentAccount?: string | null | {
    _id: string;
    username?: string;
    email?: string;
    phone?: string;
  };
  phone?: string;
  dateOfBirth?: string;
  profilePicture?: string;
  isVerified: boolean;
  isProfileComplete: boolean;
  isApproved: boolean;
  childProfile?: {
    displayName?: string;
    isActive?: boolean;
    spendingLimits?: ChildSpendingLimits;
    foodRestrictions?: ChildFoodRestrictions;
    birthCertificate?: string;
    childPhoto?: string;
    onboardingSubmittedAt?: string;
  };
  loyaltyPoints: number;
  notifications: {
    push: boolean;
    email: boolean;
    sms: boolean;
  };
  stats?: {
    totalOrders: number;
    totalSpent: number;
  };
  createdAt: string;
}

export interface Address {
  _id: string;
  user: string;
  label: 'Home' | 'Office' | 'Other';
  customLabel?: string;
  addressLine1: string;
  addressLine2?: string;
  city: string;
  state?: string;
  zipCode?: string;
  landmark?: string;
  coordinates?: {
    lat: number;
    lng: number;
  };
  contactPhone?: string;
  isDefault: boolean;
}

export interface ProfileResponse {
  success: boolean;
  data: UserProfile;
  message?: string;
}

export interface AddressResponse {
  success: boolean;
  data: Address;
  message?: string;
}

export interface AddressesResponse {
  success: boolean;
  count: number;
  data: Address[];
}

export interface ChildAccount {
  _id: string;
  username: string;
  email: string;
  role: 'child';
  parentAccount: string;
  displayName: string;
  isActive: boolean;
  isProfileComplete: boolean;
  isApproved: boolean;
  onboardingSubmittedAt?: string;
  spendingLimits: ChildSpendingLimits;
  foodRestrictions: ChildFoodRestrictions;
  createdAt: string;
  updatedAt: string;
}

export interface ChildAccountsResponse {
  success: boolean;
  count?: number;
  message?: string;
  data: ChildAccount[];
}

export interface ChildAccountResponse {
  success: boolean;
  message?: string;
  data: ChildAccount;
}

export interface ChildOnboardingResponse {
  success: boolean;
  message?: string;
  data: {
    isProfileComplete: boolean;
    isApproved: boolean;
    onboardingSubmittedAt?: string;
  };
}

export interface SpendingWindowSummary {
  limit: number | null;
  used: number;
  remaining: number | null;
}

export interface ChildSpendingSnapshot {
  daily: SpendingWindowSummary;
  weekly: SpendingWindowSummary;
  monthly: SpendingWindowSummary;
}

export interface ChildRecentOrder {
  _id: string;
  orderNumber: string;
  status: string;
  paymentStatus: string;
  total: number;
  createdAt: string;
  restaurant: {
    _id: string;
    name: string;
    logoUrl?: string;
  } | null;
  items: Array<{
    name: string;
    quantity: number;
    price: number;
    calories?: number | null;
    category?: string | null;
  }>;
}

export interface ChildNutritionInsights {
  trackedOrderCount: number;
  totalItems: number;
  trackedCalories: number;
  averageCaloriesPerOrder: number;
  healthyChoiceRate: number;
  healthyChoiceCount: number;
  junkFoodItemCount: number;
  caffeinatedItemCount: number;
  categoryBreakdown: Array<{
    name: string;
    count: number;
  }>;
  allergenExposure: Array<{
    name: string;
    count: number;
  }>;
  highlights: string[];
}

export interface ChildAccountInsights {
  child: ChildAccount;
  spending: ChildSpendingSnapshot;
  orderHistory: {
    totalOrders: number;
    totalSpent: number;
    averageOrderValue: number;
    activeOrders: number;
    lastOrderAt?: string | null;
    statusBreakdown: Record<string, number>;
    recentOrders: ChildRecentOrder[];
  };
  nutritionInsights: ChildNutritionInsights;
}

export interface ChildSummaryResponse {
  success: boolean;
  data: {
    spending: ChildSpendingSnapshot;
    activeOrders: number;
    recentOrders: ChildRecentOrder[];
  };
}

// Get current user profile
export async function getProfile() {
  return get<ProfileResponse>('/users/profile');
}

// Update profile
export async function updateProfile(updates: {
  username?: string;
  phone?: string;
  dateOfBirth?: string;
  profilePicture?: string;
}) {
  return put<ProfileResponse>('/users/profile', updates);
}

// Get addresses
export async function getAddresses() {
  return get<AddressesResponse>('/users/addresses');
}

// Add new address
export async function addAddress(address: Omit<Address, '_id' | 'user'>) {
  return post<AddressResponse>('/users/addresses', address);
}

// Update address
export async function updateAddress(addressId: string, updates: Partial<Address>) {
  return put<AddressResponse>(`/users/addresses/${addressId}`, updates);
}

// Delete address
export async function deleteAddress(addressId: string) {
  return del<{ success: boolean; message: string }>(`/users/addresses/${addressId}`);
}

// Set default address
export async function setDefaultAddress(addressId: string) {
  return put<AddressResponse>(`/users/addresses/${addressId}/set-default`, {});
}

// Parent: Get linked child accounts
export async function getMyChildAccounts() {
  return get<ChildAccountsResponse>('/users/children');
}

// Parent: Create a child account
export async function createChildAccount(payload: {
  email: string;
  password: string;
  displayName?: string;
  spendingLimits?: Partial<ChildSpendingLimits>;
  foodRestrictions?: Partial<ChildFoodRestrictions>;
}) {
  return post<ChildAccountResponse>('/users/children', payload);
}

// Parent: Update child account
export async function updateChildAccount(
  childId: string,
  payload: {
    email?: string;
    password?: string;
    displayName?: string;
    isActive?: boolean;
    spendingLimits?: Partial<ChildSpendingLimits>;
    foodRestrictions?: Partial<ChildFoodRestrictions>;
  }
) {
  return put<ChildAccountResponse>(`/users/children/${childId}`, payload);
}

// Parent: Delete child account
export async function deleteChildAccount(childId: string) {
  return del<{ success: boolean; message: string }>(`/users/children/${childId}`);
}

export async function getChildAccountInsights(childId: string) {
  return get<{ success: boolean; data: ChildAccountInsights }>(`/users/children/${childId}/insights`);
}

export async function getChildSummary() {
  return get<ChildSummaryResponse>('/users/child-summary');
}

// Child: Submit onboarding documents/details
export async function submitChildOnboarding(payload: {
  birthCertificate: string;
  childPhoto: string;
  dateOfBirth?: string;
  displayName?: string;
}) {
  return post<ChildOnboardingResponse>('/users/child-onboarding', payload);
}

// Admin: Get all users
export async function getAllUsers(options?: {
  role?: string;
  excludeRole?: string;
  search?: string;
  limit?: number;
  page?: number;
}) {
  const params = new URLSearchParams();
  if (options?.role) params.append('role', options.role);
  if (options?.excludeRole) params.append('excludeRole', options.excludeRole);
  if (options?.search) params.append('search', options.search);
  if (options?.limit) params.append('limit', options.limit.toString());
  if (options?.page) params.append('page', options.page.toString());
  
  const query = params.toString() ? `?${params.toString()}` : '';
  return get<{
    success: boolean;
    count: number;
    total: number;
    pages: number;
    data: UserProfile[];
  }>(`/users${query}`);
}

// Admin: Get user statistics
export async function getUserStats() {
  return get<{
    success: boolean;
    data: {
      totalUsers: number;
      customers: number;
      restaurants: number;
      deliveryStaff: number;
      verifiedUsers: number;
      approvedManagers: number;
    };
  }>('/users/stats');
}

// Admin: Update user
export async function adminUpdateUser(userId: string, updates: {
  role?: string;
  isVerified?: boolean;
  isApproved?: boolean;
}) {
  return put<ProfileResponse>(`/users/${userId}`, updates);
}

// Admin: Delete user
export async function adminDeleteUser(userId: string) {
  return del<{ success: boolean; message: string }>(`/users/${userId}`);
}
