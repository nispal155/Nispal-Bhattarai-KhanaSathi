import { get, put } from './api';

export interface SystemSettings {
  maintenanceMode: boolean;
  guestCheckout: boolean;
  notifications: {
    email: boolean;
    push: boolean;
    sms: boolean;
  };
  currency: string;
  region: string;
  paymentGateways: {
    esewa: boolean;
    khalti: boolean;
    cod: boolean;
  };
  updatedBy?: string | null;
  updatedAt?: string | null;
}

export async function getSystemSettings() {
  return get<{ success: boolean; data: SystemSettings }>('/settings');
}

export async function updateSystemSettings(payload: Partial<SystemSettings>) {
  return put<{ success: boolean; message?: string; data: SystemSettings }>('/settings', payload);
}
