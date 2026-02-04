import { get, post, put } from './api';

export interface Complaint {
    _id: string;
    user: {
        _id: string;
        username: string;
        email: string;
        profilePicture?: string;
    };
    order?: {
        _id: string;
        orderNumber: string;
    };
    type: 'order_issue' | 'delivery_issue' | 'food_quality' | 'payment_issue' | 'app_bug' | 'other';
    subject: string;
    description: string;
    status: 'open' | 'in_progress' | 'resolved' | 'closed';
    priority: 'low' | 'medium' | 'high' | 'urgent';
    assignedTo?: {
        _id: string;
        username: string;
    };
    resolution?: string;
    statusHistory: Array<{
        status: string;
        changedBy?: { username: string };
        note: string;
        timestamp: string;
    }>;
    createdAt: string;
    updatedAt: string;
}

export interface ComplaintsResponse {
    success: boolean;
    count: number;
    total: number;
    pages: number;
    data: Complaint[];
}

export interface ComplaintStatsResponse {
    success: boolean;
    data: {
        total: number;
        open: number;
        inProgress: number;
        resolved: number;
        closed: number;
        byType: Array<{ _id: string; count: number }>;
    };
}

// Create complaint
export async function createComplaint(data: {
    order?: string;
    type: string;
    subject: string;
    description: string;
}) {
    return post<{ success: boolean; data: Complaint }>('/complaints', data);
}

// Get user's complaints
export async function getMyComplaints() {
    return get<ComplaintsResponse>('/complaints/my');
}

// Admin: Get all complaints
export async function getAllComplaints(options?: {
    status?: string;
    type?: string;
    priority?: string;
    page?: number;
    limit?: number;
}) {
    const params = new URLSearchParams();
    if (options?.status) params.append('status', options.status);
    if (options?.type) params.append('type', options.type);
    if (options?.priority) params.append('priority', options.priority);
    if (options?.page) params.append('page', options.page.toString());
    if (options?.limit) params.append('limit', options.limit.toString());

    const query = params.toString() ? `?${params.toString()}` : '';
    return get<ComplaintsResponse>(`/complaints${query}`);
}

// Get complaint by ID
export async function getComplaintById(id: string) {
    return get<{ success: boolean; data: Complaint }>(`/complaints/${id}`);
}

// Admin: Update complaint status
export async function updateComplaintStatus(id: string, data: {
    status?: string;
    note?: string;
    resolution?: string;
    priority?: string;
}) {
    return put<{ success: boolean; data: Complaint }>(`/complaints/${id}/status`, data);
}

// Admin: Get complaint stats
export async function getComplaintStats() {
    return get<ComplaintStatsResponse>('/complaints/stats');
}
