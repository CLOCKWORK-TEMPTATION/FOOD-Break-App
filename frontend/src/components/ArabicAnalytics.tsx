import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { DatePickerWithRange } from './ui/date-range-picker';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend, 
  ResponsiveContainer,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  AreaChart,
  Area
} from 'recharts';
import { 
  TrendingUp, 
  TrendingDown, 
  Users, 
  ShoppingCart, 
  DollarSign, 
  Clock,
  Star,
  MapPin,
  Calendar,
  Download,
  Filter,
  RefreshCw,
  Eye,
  Target,
  Zap
} from 'lucide-react';
import { formatArabicNumber, formatArabicCurrency, formatArabicDate } from '../utils/arabicFormatters';
import styles from './ArabicAnalytics.module.css';

interface AnalyticsData {
  overview: {
    totalOrders: number;
    totalRevenue: number;
    totalUsers: number;
    averageOrderValue: number;
    orderGrowth: number;
    revenueGrowth: number;
    userGrowth: number;
    conversionRate: number;
  };
  charts: {
    ordersOverTime: Array<{ date: string; orders: number; revenue: number }>;
    topRestaurants: Array<{ name: string; orders: number; revenue: number }>;
    ordersByCategory: Array<{ category: string; count: number; percentage: number }>;
    userActivity: Array<{ hour: number; activeUsers: number }>;
    deliveryTimes: Array<{ area: string; averageTime: number; orders: number }>;
    customerSatisfaction: Array<{ rating: number; count: number; percentage: number }>;
  };
  insights: Array<{
    id: string;
    type: 'positive' | 'negative' | 'neutral';
    title: string;
    description: string;
    impact: 'high' | 'medium' | 'low';
    recommendation?: string;
  }>;
}

const ArabicAnalytics: React.FC = () => {
  const [data, setData] = useSt