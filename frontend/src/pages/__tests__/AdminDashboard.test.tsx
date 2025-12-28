import { render, screen, waitFor } from '@testing-library/react';
import { vi } from 'vitest';
import AdminDashboard from '../AdminDashboard';
import { statsService, ordersService, restaurantsService, notificationsService } from '../../services/dashboardService';

// Mock services
vi.mock('../../services/dashboardService', () => ({
  statsService: {
    getDashboardStats: vi.fn(),
  },
  ordersService: {
    getOrders: vi.fn(),
  },
  restaurantsService: {
    getRestaurants: vi.fn(),
  },
  notificationsService: {
    sendNotification: vi.fn(),
  },
}));

describe('AdminDashboard', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders dashboard title', async () => {
    // Mock successful API responses
    (statsService.getDashboardStats as any).mockResolvedValue({
      totalUsers: 100,
      totalOrders: 50,
      activeRestaurants: 10,
      totalRevenue: 5000
    });
    (ordersService.getOrders as any).mockResolvedValue({ orders: [], total: 0 });
    (restaurantsService.getRestaurants as any).mockResolvedValue({ restaurants: [], total: 0 });

    render(<AdminDashboard />);

    expect(screen.getByText(/BreakApp Admin/i)).toBeInTheDocument();
    
    // Wait for stats to load
    await waitFor(() => {
      expect(screen.getByText(/5000/)).toBeInTheDocument(); // Revenue
    });
  });
});
