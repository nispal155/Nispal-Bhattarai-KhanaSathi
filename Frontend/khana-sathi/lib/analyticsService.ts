import axios from 'axios';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5003/api';

const getAuthHeaders = () => {
    const token = localStorage.getItem('token');
    return {
        headers: {
            Authorization: `Bearer ${token}`
        }
    };
};

export const getOverviewStats = async (days: number = 7) => {
    try {
        const response = await axios.get(`${API_URL}/analytics/overview?days=${days}`, getAuthHeaders());
        return response.data;
    } catch (error: any) {
        console.error('Error fetching overview stats:', error);
        return { success: false, error: error.response?.data?.message || error.message };
    }
};

export const getTopRestaurants = async (days: number = 7, limit: number = 5) => {
    try {
        const response = await axios.get(`${API_URL}/analytics/top-restaurants?days=${days}&limit=${limit}`, getAuthHeaders());
        return response.data;
    } catch (error: any) {
        console.error('Error fetching top restaurants:', error);
        return { success: false, error: error.response?.data?.message || error.message };
    }
};
