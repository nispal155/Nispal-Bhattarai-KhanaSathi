import { get, post, put } from './api';

export type SupportTicketStatus = 'open' | 'in_progress' | 'resolved' | 'closed';
export type SupportTicketPriority = 'low' | 'medium' | 'high' | 'urgent';
export type SupportTicketCategory =
  | 'order_issue'
  | 'payment_issue'
  | 'delivery_issue'
  | 'restaurant_issue'
  | 'account_issue'
  | 'technical_issue'
  | 'other';

export interface SupportTicket {
  _id: string;
  subject: string;
  message: string;
  category: SupportTicketCategory;
  status: SupportTicketStatus;
  priority: SupportTicketPriority;
  submittedByRole: string;
  submittedBy?: {
    _id: string;
    username?: string;
    email?: string;
    role?: string;
  };
  assignedAdmin?: {
    _id: string;
    username?: string;
    email?: string;
  } | null;
  relatedOrder?: {
    _id: string;
    orderNumber?: string;
    status?: string;
  } | null;
  resolution?: string;
  resolvedAt?: string | null;
  createdAt: string;
  updatedAt: string;
}

export async function createSupportTicket(payload: {
  subject: string;
  message: string;
  category: SupportTicketCategory;
  priority: SupportTicketPriority;
  relatedOrder?: string;
}) {
  return post<{ success: boolean; message?: string; data: SupportTicket }>('/support', payload);
}

export async function getMySupportTickets() {
  return get<{ success: boolean; count: number; data: SupportTicket[] }>('/support/my-tickets');
}

export async function getAdminSupportTickets() {
  return get<{
    success: boolean;
    count: number;
    data: SupportTicket[];
    summary?: Record<string, number>;
  }>('/support/admin/tickets');
}

export async function updateSupportTicket(ticketId: string, payload: {
  status?: SupportTicketStatus;
  priority?: SupportTicketPriority;
  resolution?: string;
  assignedAdmin?: string | null;
}) {
  return put<{ success: boolean; message?: string; data: SupportTicket }>(`/support/admin/tickets/${ticketId}`, payload);
}
