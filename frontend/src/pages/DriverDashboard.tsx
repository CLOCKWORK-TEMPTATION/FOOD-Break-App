/**
 * لوحة تحكم السائقين
 * Driver Dashboard for Break Delivery Management
 */

import React, { useState, useEffect } from 'react';
import { useTranslation } from '../config/localization';
import { 
  TruckIcon,
  MapPinIcon,
  ClockIcon,
  PhoneIcon,
  CameraIcon,
  CheckCircleIcon,
  XCircleIcon,
  NavigationIcon,
  FilmIcon
} from '@heroicons/react/24/outline';

interface ActiveDelivery {
  id: string;
  orderId: string;
  status: string;
  driverName: string;
  currentLocation?: {
    latitude: number;
    longitude: number;
  };
  estimatedArrival?: string;
  order: {
    orderNumber: string;
    project: {
      name: string;
      location: string;
    };
    restaurant: {
      nameArabic: string;
    };
    user: {
      firstName: string;
      lastName: string;
      phoneNumber?: string;
    };
  };
}

const DriverDashboard: React.FC = () => {
  const { t } = useTranslation();
  const [activeDeliveries, setActiveDeliveries] = useState<ActiveDelivery[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedDelivery, setSelectedDelivery] = useState<ActiveDelivery | null>(null);
  const [locationSharing, setLocationSharing] = useState(false);
  const [watchId, setWatchId] = useState<number | null>(null);

  useEffect(() => {
    fetchActiveDeliveries();
    
    // تحديث البيانات كل دقيقة
    const interval = setInterval(fetchActiveDeliveries, 60000);
    
    return () => {
      clearInterval(interval);
      stopLocationSharing();
    };
  }, []);

  const fetchActiveDeliveries = async () => {
    try {
      const response = await fetch('/api/tracking/active', {
        headers: {
          'Accept-Language': 'ar',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });

      const data = await response.json();
      
      if (data.success) {
        setActiveDeliveries(data.data);
      }
    } catch (error) {
      console.error('خطأ في جلب التوصيلات النشطة:', error);
    } finally {
      setLoading(false);
    }
  };

  const startLocationSharing = (deliveryId: string) => {
    if (!navigator.geolocation) {
      alert('المتصفح لا يدعم تحديد الموقع');
      return;
    }

    const options = {
      enableHighAccuracy: true,
      timeout: 10000,
      maximumAge: 30000
    };

    const id = navigator.geolocation.watchPosition(
      (position) => {
        updateDriverLocation(deliveryId, {
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
          accuracy: position.coords.accuracy,
          speed: position.coords.speed,
          heading: position.coords.heading
        });
      },
      (error) => {
        console.error('خطأ في تحديد الموقع:', error);
      },
      options
    );

    setWatchId(id);
    setLocationSharing(true);
  };

  const stopLocationSharing = () => {
    if (watchId !== null) {
      navigator.geolocation.clearWatch(watchId);
      setWatchId(null);
    }
    setLocationSharing(false);
  };

  const updateDriverLocation = async (deliveryId: string, locationData: any) => {
    try {
      await fetch(`/api/tracking/${deliveryId}/location`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Accept-Language': 'ar',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify(locationData)
      });
    } catch (error) {
      console.error('خطأ في تحديث الموقع:', error);
    }
  };

  const updateDeliveryStatus = async (deliveryId: string, newStatus: string, notes?: string) => {
    try {
      const response = await fetch(`/api/tracking/${deliveryId}/status`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Accept-Language': 'ar',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({
          status: newStatus,
          notes
        })
      });

      const data = await response.json();
      
      if (data.success) {
        await fetchActiveDeliveries();
        alert(`تم تحديث حالة التوصيل إلى: ${getStatusText(newStatus)}`);
      }
    } catch (error) {
      console.error('خطأ في تحديث حالة التوصيل:', error);
      alert('فشل في تحديث حالة التوصيل');
    }
  };

  const confirmDelivery = async (deliveryId: string, recipientName: string, notes: string) => {
    try {
      const response = await fetch(`/api/tracking/${deliveryId}/delivery-confirmation`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept-Language': 'ar',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({
          recipientName,
          notes
        })
      });

      const data = await response.json();
      
      if (data.success) {
        await fetchActiveDeliveries();
        alert('تم تأكيد التسليم بنجاح');
        setSelectedDelivery(null);
      }
    } catch (error) {
      console.error('خطأ في تأكيد التسليم:', error);
      alert('فشل في تأكيد التسليم');
    }
  };

  const getStatusText = (status: string) => {
    const statusMap: Record<string, string> = {
      'PREPARING': 'قيد التحضير',
      'DRIVER_ASSIGNED': 'تم تعيين السائق',
      'PICKED_UP': 'تم الاستلام من المطعم',
      'ON_THE_WAY': 'في الطريق لموقع التصوير',
      'NEARBY': 'قريب من موقع التصوير',
      'DELIVERED': 'تم التسليم',
      'FAILED': 'فشل التسليم'
    };
    return statusMap[status] || status;
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'DRIVER_ASSIGNED': return 'text-blue-600 bg-blue-100';
      case 'PICKED_UP': return 'text-purple-600 bg-purple-100';
      case 'ON_THE_WAY': return 'text-orange-600 bg-orange-100';
      case 'NEARBY': return 'text-green-600 bg-green-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const getNextStatusOptions = (currentStatus: string) => {
    switch (currentStatus) {
      case 'DRIVER_ASSIGNED':
        return [{ value: 'PICKED_UP', label: 'تم الاستلام من المطعم' }];
      case 'PICKED_UP':
        return [{ value: 'ON_THE_WAY', label: 'في الطريق لموقع التصوير' }];
      case 'ON_THE_WAY':
        return [
          { value: 'NEARBY', label: 'قريب من موقع التصوير' },
          { value: 'DELIVERED', label: 'تم التسليم' }
        ];
      case 'NEARBY':
        return [{ value: 'DELIVERED', label: 'تم التسليم' }];
      default:
        return [];
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">جاري تحميل لوحة تحكم السائقين...</p>
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
              <TruckIcon className="h-8 w-8 text-blue-600" />
              <div>
                <h1 className="text-2xl font-bold text-gray-900">لوحة تحكم السائقين</h1>
                <p className="text-sm text-gray-600">إدارة توصيل وجبات البريك</p>
              </div>
            </div>
            
            <div className="flex items-center space-x-3 space-x-reverse">
              <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${
                locationSharing ? 'text-green-700 bg-green-100' : 'text-gray-700 bg-gray-100'
              }`}>
                <NavigationIcon className="h-4 w-4 ml-1" />
                {locationSharing ? 'مشاركة الموقع نشطة' : 'مشاركة الموقع متوقفة'}
              </span>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {activeDeliveries.length === 0 ? (
          <div className="bg-white rounded-lg shadow p-8 text-center">
            <TruckIcon className="h-16 w-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">لا توجد توصيلات نشطة</h3>
            <p className="text-gray-600">لا توجد طلبات بريك تحتاج للتوصيل حالياً</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
            {activeDeliveries.map((delivery) => (
              <div key={delivery.id} className="bg-white rounded-lg shadow hover:shadow-lg transition-shadow">
                {/* Card Header */}
                <div className="px-6 py-4 border-b border-gray-200">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2 space-x-reverse">
                      <FilmIcon className="h-5 w-5 text-blue-600" />
                      <span className="font-medium text-gray-900">
                        {delivery.order.project.name}
                      </span>
                    </div>
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(delivery.status)}`}>
                      {getStatusText(delivery.status)}
                    </span>
                  </div>
                  <p className="text-sm text-gray-600 mt-1">
                    طلب رقم: {delivery.order.orderNumber}
                  </p>
                </div>

                {/* Card Content */}
                <div className="px-6 py-4">
                  <div className="space-y-3">
                    <div className="flex items-center space-x-2 space-x-reverse">
                      <MapPinIcon className="h-4 w-4 text-gray-500" />
                      <span className="text-sm text-gray-700">
                        {delivery.order.project.location}
                      </span>
                    </div>
                    
                    <div className="flex items-center space-x-2 space-x-reverse">
                      <TruckIcon className="h-4 w-4 text-gray-500" />
                      <span className="text-sm text-gray-700">
                        من: {delivery.order.restaurant.nameArabic}
                      </span>
                    </div>

                    <div className="flex items-center space-x-2 space-x-reverse">
                      <PhoneIcon className="h-4 w-4 text-gray-500" />
                      <span className="text-sm text-gray-700">
                        {delivery.order.user.firstName} {delivery.order.user.lastName}
                      </span>
                      {delivery.order.user.phoneNumber && (
                        <a
                          href={`tel:${delivery.order.user.phoneNumber}`}
                          className="text-blue-600 hover:text-blue-800 text-xs"
                        >
                          اتصال
                        </a>
                      )}
                    </div>

                    {delivery.estimatedArrival && (
                      <div className="flex items-center space-x-2 space-x-reverse">
                        <ClockIcon className="h-4 w-4 text-gray-500" />
                        <span className="text-sm text-gray-700">
                          الوصول المتوقع: {new Date(delivery.estimatedArrival).toLocaleTimeString('ar-EG')}
                        </span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Card Actions */}
                <div className="px-6 py-4 border-t border-gray-200">
                  <div className="flex flex-col space-y-2">
                    {/* Location Sharing */}
                    {!locationSharing ? (
                      <button
                        onClick={() => startLocationSharing(delivery.id)}
                        className="w-full bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition-colors text-sm"
                      >
                        بدء مشاركة الموقع
                      </button>
                    ) : (
                      <button
                        onClick={stopLocationSharing}
                        className="w-full bg-red-600 text-white px-4 py-2 rounded-md hover:bg-red-700 transition-colors text-sm"
                      >
                        إيقاف مشاركة الموقع
                      </button>
                    )}

                    {/* Status Update */}
                    <div className="flex space-x-2 space-x-reverse">
                      {getNextStatusOptions(delivery.status).map((option) => (
                        <button
                          key={option.value}
                          onClick={() => updateDeliveryStatus(delivery.id, option.value)}
                          className="flex-1 bg-green-600 text-white px-3 py-2 rounded-md hover:bg-green-700 transition-colors text-sm"
                        >
                          {option.label}
                        </button>
                      ))}
                    </div>

                    {/* Delivery Confirmation */}
                    {delivery.status === 'NEARBY' && (
                      <button
                        onClick={() => setSelectedDelivery(delivery)}
                        className="w-full bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700 transition-colors text-sm flex items-center justify-center space-x-2 space-x-reverse"
                      >
                        <CheckCircleIcon className="h-4 w-4" />
                        <span>تأكيد التسليم</span>
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Delivery Confirmation Modal */}
        {selectedDelivery && (
          <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
            <div className="relative top-20 mx-auto p-5 border w-11/12 md:w-1/2 shadow-lg rounded-md bg-white">
              <div className="mt-3">
                <h3 className="text-lg font-medium text-gray-900 mb-4">
                  تأكيد تسليم البريك
                </h3>
                
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      اسم المستلم
                    </label>
                    <input
                      type="text"
                      id="recipientName"
                      className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="اسم الشخص الذي استلم الطلب"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      ملاحظات التسليم
                    </label>
                    <textarea
                      id="deliveryNotes"
                      rows={3}
                      className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="أي ملاحظات حول التسليم..."
                    />
                  </div>
                </div>

                <div className="flex justify-end space-x-3 space-x-reverse mt-6">
                  <button
                    onClick={() => setSelectedDelivery(null)}
                    className="bg-gray-300 text-gray-700 px-4 py-2 rounded-md hover:bg-gray-400 transition-colors"
                  >
                    إلغاء
                  </button>
                  <button
                    onClick={() => {
                      const recipientName = (document.getElementById('recipientName') as HTMLInputElement)?.value || '';
                      const notes = (document.getElementById('deliveryNotes') as HTMLTextAreaElement)?.value || '';
                      confirmDelivery(selectedDelivery.id, recipientName, notes);
                    }}
                    className="bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700 transition-colors"
                  >
                    تأكيد التسليم
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
};

export default DriverDashboard;