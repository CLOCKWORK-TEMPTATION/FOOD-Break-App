import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api/v1';

export const productionService = {
    // Schedule
    getSchedule: async (projectId: string) => {
        const response = await axios.get(`${API_URL}/production/project/${projectId}/schedule`);
        return response.data.data;
    },

    syncSchedule: async (projectId: string, scheduleData: any) => {
        const response = await axios.post(`${API_URL}/production/project/${projectId}/sync`, scheduleData);
        return response.data.data;
    },

    // Attendance
    getDayAttendance: async (dayId: string) => {
        const response = await axios.get(`${API_URL}/production/day/${dayId}/attendance`);
        return response.data.data;
    },

    updateAttendance: async (shootingDayId: string, userId: string, status: string, location?: any) => {
        const response = await axios.post(`${API_URL}/production/attendance/update`, {
            shootingDayId,
            userId,
            status,
            location
        });
        return response.data.data;
    },

    // Financials
    getBudgetStats: async (projectId: string) => {
        const response = await axios.get(`${API_URL}/production/project/${projectId}/budget`);
        return response.data.data;
    }
};
