/**
 * الصفحة الرئيسية لتطبيق البريك
 * BreakApp Home Page - Arabic Food Ordering for Film Crews
 */

import React, { useState, useEffect } from 'react';
import { useTranslation } from '../config/localization';
import { 
  FilmIcon,
  ClockIcon,
  MapPinIcon,
  UserGroupIcon,
  CameraIcon,
  TruckIcon,
  StarIcon,
  QrCodeIcon
} from '@heroicons/react/24/outline';

interface ProjectStats {
  activeProjects: number;
  todayOrders: number;
  crewMembers: number;
  partneredRestaurants: number;
}

interface TodayBreakOrder {
  id: string;
  projectName: string;
  orderTime: string;
  status: 'pending' | 'confirmed' | 'preparing' | 'delivered';
  itemsCount: number;
  totalAmount: number;
}

const BreakAppHome: React.FC = () => {
  const { t } = useTranslation();
  const [stats, setStats] = useState<ProjectStats>({
    activeProjects: 0,
    todayOrders: 0,
    crewMembers: 0,
    partneredRestaurants: 0
  });
  const [todayOrders, setTodayOrders] = useState<TodayBreakOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentTime, setCurrentTime] = useState(new Date());

  // تحديث الوقت كل ثانية
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  // جلب الإحصائيات
  useEffect(() => {
    fetchStats();
    fetchTodayOrders();
  }, []);

  const fetchStats = async () => {
    try {
      const response = await fetch('/api/dashboard/stats', {
        headers: {
          'Accept-Language': 'ar',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });

      const data = await response.json();
      if (data.success) {
        setStats(data.data);
      }
    } catch (error) {
      console.error('خطأ في جلب الإحصائيات:', error);
    }
  };

  const fetchTodayOrders = async () => {
    try {
      const response = await fetch('/api/orders/today', {
        headers: {
          'Accept-Language': 'ar',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });

      const data = await response.json();
      if (data.success) {
        setTodayOrders(data.data.orders || []);
      }
    } catch (error) {
      console.error('خطأ في جلب طلبات اليوم:', error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'text-yellow-600 bg-yellow-100';
      case 'confirmed': return 'text-blue-600 bg-blue-100';
      case 'preparing': return 'text-orange-600 bg-orange-100';
      case 'delivered': return 'text-green-600 bg-green-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'pending': return 'في الانتظار';
      case 'confirmed': return 'مؤكد';
      case 'preparing': return 'قيد التحضير';
      case 'delivered': return 'تم التوصيل';
      default: return status;
    }
  };

  const formatTime = (time: Date) => {
    return time.toLocaleTimeString('ar-EG', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: true
    });
  };

  const formatDate = (time: Date) => {
    return time.toLocaleDateString('ar-EG', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">جاري تحميل لوحة تحكم البريك...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50" dir="rtl">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center space-x-4 space-x-reverse">
              <div className="flex items-center space-x-2 space-x-reverse">
                <FilmIcon className="h-8 w-8 text-blue-600" />
                <div>
                  <h1 className="text-2xl font-bold text-gray-900">BreakApp</h1>
                  <p className="text-sm text-gray-600">تطبيق طلب البريك في التصوير</p>
                </div>
              </div>
            </div>
            
            <div className="text-left">
              <div className="text-lg font-semibold text-gray-900">
                {formatTime(currentTime)}
              </div>
              <div className="text-sm text-gray-600">
                {formatDate(currentTime)}
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Welcome Section */}
        <div className="bg-gradient-to-l from-blue-600 to-blue-800 rounded-lg shadow-lg p-8 text-white mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-3xl font-bold mb-2">مرحباً بك في BreakApp</h2>
              <p className="text-blue-100 text-lg">
                تطبيق طلب وجبات البريك المخصص لطاقم التصوير المصري
              </p>
              <p className="text-blue-200 mt-2">
                اطلب وجبتك المفضلة بسهولة وسرعة أثناء فترات الراحة في التصوير
              </p>
            </div>
            <div className="hidden md:block">
              <CameraIcon className="h-24 w-24 text-blue-200" />
            </div>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <FilmIcon className="h-8 w-8 text-blue-600" />
              </div>
              <div className="mr-4">
                <p className="text-sm font-medium text-gray-600">مشاريع التصوير النشطة</p>
                <p className="text-2xl font-semibold text-gray-900">{stats.activeProjects}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <ClockIcon className="h-8 w-8 text-green-600" />
              </div>
              <div className="mr-4">
                <p className="text-sm font-medium text-gray-600">طلبات البريك اليوم</p>
                <p className="text-2xl font-semibold text-gray-900">{stats.todayOrders}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <UserGroupIcon className="h-8 w-8 text-purple-600" />
              </div>
              <div className="mr-4">
                <p className="text-sm font-medium text-gray-600">أعضاء الطاقم</p>
                <p className="text-2xl font-semibold text-gray-900">{stats.crewMembers}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <TruckIcon className="h-8 w-8 text-orange-600" />
              </div>
              <div className="mr-4">
                <p className="text-sm font-medium text-gray-600">المطاعم الشريكة</p>
                <p className="text-2xl font-semibold text-gray-900">{stats.partneredRestaurants}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Today's Orders */}
        <div className="bg-white rounded-lg shadow">
          <div className="px-6 py-4 border-b border-gray-200">
            <h3 className="text-lg font-medium text-gray-900">طلبات البريك اليوم</h3>
          </div>
          <div className="p-6">
            {todayOrders.length === 0 ? (
              <div className="text-center py-8">
                <ClockIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-600">لا توجد طلبات بريك اليوم</p>
                <p className="text-sm text-gray-500 mt-2">
                  ابدأ يومك بطلب وجبة بريك لذيذة!
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {todayOrders.map((order) => (
                  <div key={order.id} className="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:bg-gray-50">
                    <div className="flex items-center space-x-4 space-x-reverse">
                      <div className="flex-shrink-0">
                        <FilmIcon className="h-6 w-6 text-gray-400" />
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-900">{order.projectName}</p>
                        <p className="text-sm text-gray-600">{order.itemsCount} وجبة - {order.totalAmount} ج.م</p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-4 space-x-reverse">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(order.status)}`}>
                        {getStatusText(order.status)}
                      </span>
                      <span className="text-sm text-gray-500">{order.orderTime}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Quick Actions */}
        <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white rounded-lg shadow p-6 text-center hover:shadow-lg transition-shadow cursor-pointer">
            <QrCodeIcon className="h-12 w-12 text-blue-600 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">مسح QR Code</h3>
            <p className="text-gray-600">امسح رمز QR للوصول لموقع التصوير وطلب البريك</p>
          </div>

          <div className="bg-white rounded-lg shadow p-6 text-center hover:shadow-lg transition-shadow cursor-pointer">
            <ClockIcon className="h-12 w-12 text-green-600 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">طلب سريع</h3>
            <p className="text-gray-600">اطلب وجبتك المعتادة بنقرة واحدة</p>
          </div>

          <div className="bg-white rounded-lg shadow p-6 text-center hover:shadow-lg transition-shadow cursor-pointer">
            <MapPinIcon className="h-12 w-12 text-purple-600 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">تتبع الطلب</h3>
            <p className="text-gray-600">تابع وصول طلبك لموقع التصوير</p>
          </div>
        </div>

        {/* Footer */}
        <footer className="mt-12 text-center text-gray-600">
          <p className="text-sm">
            BreakApp - تطبيق طلب البريك المخصص لطاقم التصوير المصري
          </p>
          <p className="text-xs mt-2">
            جميع الحقوق محفوظة © 2024
          </p>
        </footer>
      </main>
    </div>
  );
};

export default BreakAppHome;