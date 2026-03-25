import { get } from './api';

type AnalyticsResponse<T = unknown> = { success: boolean; data?: T; error?: string };

const getErrorMessage = (error: unknown) => {
    if (error instanceof Error) {
        return error.message;
    }
    return 'Failed';
};

export const getOverviewStats = async (days: number = 7): Promise<AnalyticsResponse> => {
    try {
        const response = await get<AnalyticsResponse>(`/analytics/overview?days=${days}`);
        if (response.data) {
            return response.data;
        }
        return { success: false, error: response.error || 'No data' };
    } catch (error: unknown) {
        console.error('Error fetching overview stats:', error);
        return { success: false, error: getErrorMessage(error) || 'Failed to fetch stats' };
    }
};

export const getTopRestaurants = async (days: number = 7, limit: number = 5): Promise<AnalyticsResponse> => {
    try {
        const response = await get<AnalyticsResponse>(`/analytics/top-restaurants?days=${days}&limit=${limit}`);
        if (response.data) {
            return response.data;
        }
        return { success: false, error: response.error || 'No data' };
    } catch (error: unknown) {
        console.error('Error fetching top restaurants:', error);
        return { success: false, error: getErrorMessage(error) };
    }
};

export const getForecasting = async (): Promise<AnalyticsResponse> => {
    try {
        const response = await get<AnalyticsResponse>('/analytics/forecasting');
        if (response.data) {
            return response.data;
        }
        return { success: false, error: response.error || 'No data' };
    } catch (error: unknown) {
        console.error('Error fetching forecasting:', error);
        return { success: false, error: getErrorMessage(error) };
    }
};

export const getSettlements = async (): Promise<AnalyticsResponse> => {
    try {
        const response = await get<AnalyticsResponse>('/analytics/settlements');
        if (response.data) {
            return response.data;
        }
        return { success: false, error: response.error || 'No data' };
    } catch (error: unknown) {
        console.error('Error fetching settlements:', error);
        return { success: false, error: getErrorMessage(error) };
    }
};

export const getTransactionLogs = async (): Promise<AnalyticsResponse> => {
    try {
        const response = await get<AnalyticsResponse>('/analytics/transactions');
        if (response.data) {
            return response.data;
        }
        return { success: false, error: response.error || 'No data' };
    } catch (error: unknown) {
        console.error('Error fetching transaction logs:', error);
        return { success: false, error: getErrorMessage(error) };
    }
};

export const getRoutePerformance = async (): Promise<AnalyticsResponse> => {
    try {
        const response = await get<AnalyticsResponse>('/analytics/route-performance');
        if (response.data) {
            return response.data;
        }
        return { success: false, error: response.error || 'No data' };
    } catch (error: unknown) {
        console.error('Error fetching route performance:', error);
        return { success: false, error: getErrorMessage(error) };
    }
};
