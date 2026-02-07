import { get } from './api';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type AnalyticsResponse = { success: boolean; data?: any; error?: string };

export const getOverviewStats = async (days: number = 7): Promise<AnalyticsResponse> => {
    try {
        const response = await get<AnalyticsResponse>(`/analytics/overview?days=${days}`);
        if (response.data) {
            return response.data;
        }
        return { success: false, error: response.error || 'No data' };
    } catch (error: any) {
        console.error('Error fetching overview stats:', error);
        return { success: false, error: error.message || 'Failed to fetch stats' };
    }
};

export const getTopRestaurants = async (days: number = 7, limit: number = 5): Promise<AnalyticsResponse> => {
    try {
        const response = await get<AnalyticsResponse>(`/analytics/top-restaurants?days=${days}&limit=${limit}`);
        if (response.data) {
            return response.data;
        }
        return { success: false, error: response.error || 'No data' };
    } catch (error: any) {
        console.error('Error fetching top restaurants:', error);
        return { success: false, error: error.message || 'Failed' };
    }
};

export const getForecasting = async (): Promise<AnalyticsResponse> => {
    try {
        const response = await get<AnalyticsResponse>('/analytics/forecasting');
        if (response.data) {
            return response.data;
        }
        return { success: false, error: response.error || 'No data' };
    } catch (error: any) {
        console.error('Error fetching forecasting:', error);
        return { success: false, error: error.message || 'Failed' };
    }
};

export const getSettlements = async (): Promise<AnalyticsResponse> => {
    try {
        const response = await get<AnalyticsResponse>('/analytics/settlements');
        if (response.data) {
            return response.data;
        }
        return { success: false, error: response.error || 'No data' };
    } catch (error: any) {
        console.error('Error fetching settlements:', error);
        return { success: false, error: error.message || 'Failed' };
    }
};
