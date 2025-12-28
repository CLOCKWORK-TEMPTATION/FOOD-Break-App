import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api/v1';

export const emotionService = {
    logMood: async (data: { mood: string; intensity: number; notes?: string; context?: string }) => {
        // For demo purposes, we might need to mock userId if no auth
        const response = await axios.post(`${API_URL}/emotion/log`, { ...data, userId: 'demo-user-id' });
        return response.data.data;
    },

    getRecommendations: async (mood: string) => {
        const response = await axios.get(`${API_URL}/emotion/recommendations`, { params: { mood, userId: 'demo-user-id' } });
        return response.data.data;
    },

    updateConsent: async (type: string, status: string) => {
        const response = await axios.post(`${API_URL}/emotion/consent`, { type, status, userId: 'demo-user-id', version: '1.0' });
        return response.data.data;
    }
};
