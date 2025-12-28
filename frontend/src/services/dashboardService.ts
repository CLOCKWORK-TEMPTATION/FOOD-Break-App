import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api/v1';

const apiClient = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json'
  }
});

apiClient.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export interface ShootingDay {
  id: string;
  date: string;
  dayNumber: number;
  startTime: string;
  endTime: string;
  location: string;
  status: 'SCHEDULED' | 'SHOOTING' | 'COMPLETED' | 'CANCELLED' | 'OFF_DAY' | 'MOVED';
  scenes: string[];
}

export interface CrewMember {
  id: string;
  name: string;
  role: string;
  avatar: string;
  status: 'PRESENT' | 'LATE' | 'ABSENT' | 'EXCUSED';
  checkInTime?: string;
}

export interface BudgetCategory {
  name: string;
  allocated: number;
  spent: number;
  projected: number;
}

export interface DashboardStats {
  totalSpent: number;
  scheduleAdherence: number;
  pendingOrders: number;
  absences: number;
}

export const dashboardService = {
  async getStats(projectId?: string): Promise<DashboardStats> {
    const response = await apiClient.get('/admin/dashboard/stats', {
      params: { projectId }
    });
    return response.data.data;
  },

  async getSchedule(projectId: string): Promise<ShootingDay[]> {
    const response = await apiClient.get(`/projects/${projectId}/schedule`);
    return response.data.data;
  },

  async getCrew(projectId: string): Promise<CrewMember[]> {
    const response = await apiClient.get(`/projects/${projectId}/members`);
    return response.data.data;
  },

  async getBudget(projectId: string): Promise<BudgetCategory[]> {
    const response = await apiClient.get(`/budgets`, {
      params: { projectId }
    });
    return response.data.data;
  }
};
