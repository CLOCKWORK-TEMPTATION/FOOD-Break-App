/**
 * Production Service
 * خدمة الإنتاج للـ Frontend
 */

import apiClient from './apiClient';

interface ShootingDay {
  id: string;
  date: string;
  dayNumber: number;
  startTime: string;
  endTime: string;
  location: string;
  status: 'SCHEDULED' | 'SHOOTING' | 'COMPLETED' | 'CANCELLED' | 'OFF_DAY' | 'MOVED';
  scenes: string[];
}

interface CrewMember {
  id: string;
  name: string;
  role: string;
  avatar: string;
  status: 'PRESENT' | 'LATE' | 'ABSENT' | 'EXCUSED';
  checkInTime?: string;
}

interface BudgetCategory {
  name: string;
  allocated: number;
  spent: number;
  projected: number;
}

export const productionService = {
  async getSchedule(): Promise<ShootingDay[]> {
    try {
      const response = await apiClient.get('/production/schedule');
      return response.data.data || [];
    } catch (error) {
      console.error('Failed to fetch schedule:', error);
      return [];
    }
  },

  async getCrew(): Promise<CrewMember[]> {
    try {
      const response = await apiClient.get('/production/crew');
      return response.data.data || [];
    } catch (error) {
      console.error('Failed to fetch crew:', error);
      return [];
    }
  },

  async getBudget(): Promise<BudgetCategory[]> {
    try {
      const response = await apiClient.get('/production/budget');
      return response.data.data || [];
    } catch (error) {
      console.error('Failed to fetch budget:', error);
      return [];
    }
  }
};
