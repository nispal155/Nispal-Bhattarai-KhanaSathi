import { get, post, put, del } from './api';

// Types
export interface UserProfile {
  _id: string;
  username: string;
  email: string;
  role: string;
  phone?: string;
  dateOfBirth?: string;
  profilePicture?: string;
  isVerified: boolean;
  isProfileComplete: boolean;
  isApproved: boolean;
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

// Admin: Get all users
export async function getAllUsers(options?: {
  role?: string;
  search?: string;
  limit?: number;
  page?: number;
}) {
  const params = new URLSearchParams();
  if (options?.role) params.append('role', options.role);
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
