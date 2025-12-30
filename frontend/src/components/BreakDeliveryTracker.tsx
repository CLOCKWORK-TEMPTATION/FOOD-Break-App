/**
 * مكون تتبع توصيل البريك
 * Break Delivery Tracker Component with Real-time GPS
 */

import React, { useState, useEffect, useRef } from 'react';
import { useTranslation } from '../config/localization';
import { 
  MapPinIcon,
  TruckIcon,
  ClockIcon,
  CheckCircleIcon,
  PhoneIcon,
  FilmIcon,
  NavigationIcon,
  CameraIcon
} from '@heroicons/react/24/outline';

interface DeliveryLocation {
  latitude: number;
  longitude: number;
}

interface DeliveryTracking {
  id: string;
  orderId: string;
  status: 'PREPARING' | 'DRIVER_ASSIGNED' | 'PICKED_UP' | 'ON_THE_WAY' | 'NEARBY' | 'DELIVERED' | 'FAILED';
  driverName?: string;
  driverPhone?: string;
  vehicleInfo?: string;
  currentLocation?: DeliveryLocation;
  estimatedArrival?: string;
  remainingDistance?: number;
  order: {
    orderNumber: string;
    project: {
      name: string;
      location: string;
    };
    restaurant: {
      nameArabic: string;
    };
  };
  statusHistory: Array<{
    status: string;
    timestamp: string;
    notes?: string;
  }>;
}

interface BreakDeliveryTrackerProps {
  orderId: string;
  onDeliveryComplete?: () => void;
}

const BreakDeliveryTracker: React.FC<BreakDeliveryTrackerProps> = ({
  orderId,
  onDeliveryComplete
}) => {
  const { t } = useTranslation();
  const [tracking, setTracking] = useState<DeliveryTracking | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [mapLoaded, setMapLoaded] = useState(false);
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<any>(null);
  const markerRef = useRef<any>(null);

  // تحديث البيانات كل 30 ثانية
  useEffect(() => {
    fetchTrackingData();
    
    const interval = setInterval(() => {
      if (tracking && !['DELIVERED', 'FAILED', 'RETURNED'].includes(tracking.status)) {
        fetchTrackingData();
      }
    }, 30000);

    return () => clearInterval(interval);
  }, [orderId]);

  // تحديث الخريطة عند تغيير الموقع
  useEffect(() => {
    if (tracking && tracking.currentLocation && mapLoaded) {
      updateMapLocation(tracking.currentLocation);
    }
  }, [tracking?.currentLocation, mapLoaded]);

  const fetchTrackingData = async () => {
    try {
      const response = await fetch(`/api/tracking/order/${orderId}`, {
        headers: {
          'Accept-Language': 'ar',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });

      const data = await response.json();
      
      if (data.success) {
        setTracking(data.data);
        
        // إشعار عند اكتمال التوصيل
        if (data.data.status === 'DELIVERED' && tracking?.status !== 'DELIVERED') {
          onDeliveryComplete?.();
        }
      } else {
        setError(data.error || 'فشل في جلب معلومات التتبع');
      }
    } catch (err) {
      console.error('خطأ في جلب معلومات التتبع:', err);
      setError('حدث خطأ في الاتصال بالخادم');
    } finally {
      setLoading(false);
    }
  };

  const initializeMap = () => {
    if (!mapRef.current || !tracking) return;

    // هنا يمكن تكامل مع Google Maps أو أي مكتبة خرائط أخرى
    // const map = new google.maps.Map(mapRef.current, {
    //   zoom: 13,
    //   center: tracking.currentLocation || { lat: 30.0444, lng: 31.2357 }, // القاهرة كافتراضي
    //   mapTypeId: 'roadmap'
    // });

    // mapInstanceRef.current = map;
    setMapLoaded(true);
  };

  const updateMapLocation = (location: DeliveryLocation) => {
    if (!mapInstanceRef.current) return;

    // تحديث موقع العلامة على الخريطة
    // if (markerRef.current) {
    //   markerRef.current.setPosition(location);
    // } else {
    //   markerRef.current = new google.maps.Marker({
    //     position: location,
    //     map: mapInstanceRef.current,
    //     title: 'موقع سائق البريك',
    //     icon: '/truck-icon.png'
    //   });
    // }

    // mapInstanceRef.current.setCenter(location);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'PREPARING': return 'text-yellow-600 bg-yellow-100';
      case 'DRIVER_ASSIGNED': return 'text-blue-600 bg-blue-100';
      case 'PICKED_UP': return 'text-purple-600 bg-purple-100';
      case 'ON_THE_WAY': return 'text-orange-600 bg-orange-100';
      case 'NEARBY': return 'text-green-600 bg-green-100';
      case 'DELIVERED': return 'text-green-700 bg-green-200';
      case 'FAILED': return 'text-red-600 bg-red-100';
      default: return 'text-gray-600 bg-gray-100';
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
      'FAILED': 'فشل التسليم',
      'RETURNED': 'تم الإرجاع'
    };
    return statusMap[status] || status;
  };

  const formatTime = (dateString: string) => {
    return new Date(dateString).toLocaleTimeString('ar-EG', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: true
    });
  };

  const formatEstimatedArrival = (dateString: string) => {
    const now = new Date();
    const arrival = new Date(dateString);
    const diffMinutes = Math.ceil((arrival.getTime() - now.getTime()) / (1000 * 60));
    
    if (diffMinutes <= 0) return 'وصل الآن';
    if (diffMinutes < 60) return `خلال ${diffMinutes} دقيقة`;
    
    const hours = Math.floor(diffMinutes / 60);
    const minutes = diffMinutes % 60;
    return `خلال ${hours} ساعة و ${minutes} دقيقة`;
  };

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow p-6" dir="rtl">
        <div className="animate-pulse">
          <div className="h-4 bg-gray-200 rounded w-3/4 mb-4"></div>
          <div className="h-4 bg-gray-200 rounded w-1/2 mb-4"></div>
          <div className="h-32 bg-gray-200 rounded mb-4"></div>
        </div>
      </div>
    );
  }

  if (error || !tracking) {
    return (
      <div className="bg-white rounded-lg shadow p-6 text-center" dir="rtl">
        <TruckIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
        <h3 className="text-lg font-medium text-gray-900 mb-2">
          {error || 'لا يوجد تتبع متاح'}
        </h3>
        <p className="text-gray-600">
          لم يتم العثور على معلومات تتبع لهذا الطلب
        </p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow" dir="rtl">
      {/* Header */}
      <div className="px-6 py-4 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3 space-x-reverse">
            <TruckIcon className="h-6 w-6 text-blue-600" />
            <div>
              <h3 className="text-lg font-medium text-gray-900">تتبع توصيل البريك</h3>
              <p className="text-sm text-gray-600">طلب رقم: {tracking.order.orderNumber}</p>
            </div>
          </div>
          <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(tracking.status)}`}>
            {getStatusText(tracking.status)}
          </span>
        </div>
      </div>

      {/* Order Info */}
      <div className="px-6 py-4 bg-gray-50 border-b">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="flex items-center space-x-2 space-x-reverse">
            <FilmIcon className="h-4 w-4 text-gray-500" />
            <span className="text-sm text-gray-700">{tracking.order.project.name}</span>
          </div>
          <div className="flex items-center space-x-2 space-x-reverse">
            <MapPinIcon className="h-4 w-4 text-gray-500" />
            <span className="text-sm text-gray-700">{tracking.order.project.location}</span>
          </div>
        </div>
      </div>

      {/* Driver Info */}
      {tracking.driverName && (
        <div className="px-6 py-4 border-b">
          <h4 className="text-md font-medium text-gray-900 mb-3">معلومات السائق</h4>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <span className="text-sm text-gray-500">اسم السائق</span>
              <p className="font-medium">{tracking.driverName}</p>
            </div>
            {tracking.driverPhone && (
              <div>
                <span className="text-sm text-gray-500">رقم الهاتف</span>
                <div className="flex items-center space-x-2 space-x-reverse">
                  <p className="font-medium">{tracking.driverPhone}</p>
                  <a
                    href={`tel:${tracking.driverPhone}`}
                    className="text-blue-600 hover:text-blue-800"
                  >
                    <PhoneIcon className="h-4 w-4" />
                  </a>
                </div>
              </div>
            )}
            {tracking.vehicleInfo && (
              <div>
                <span className="text-sm text-gray-500">معلومات المركبة</span>
                <p className="font-medium">{tracking.vehicleInfo}</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Delivery Status */}
      <div className="px-6 py-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Status Timeline */}
          <div>
            <h4 className="text-md font-medium text-gray-900 mb-3">حالة التوصيل</h4>
            <div className="space-y-3">
              {tracking.statusHistory.slice(0, 4).map((status, index) => (
                <div key={index} className="flex items-start space-x-3 space-x-reverse">
                  <div className={`flex-shrink-0 w-2 h-2 rounded-full mt-2 ${
                    index === 0 ? 'bg-blue-600' : 'bg-gray-300'
                  }`}></div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900">
                      {getStatusText(status.status)}
                    </p>
                    <p className="text-xs text-gray-500">
                      {formatTime(status.timestamp)}
                    </p>
                    {status.notes && (
                      <p className="text-xs text-gray-600 mt-1">{status.notes}</p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Delivery Info */}
          <div>
            <h4 className="text-md font-medium text-gray-900 mb-3">معلومات التوصيل</h4>
            <div className="space-y-3">
              {tracking.estimatedArrival && (
                <div className="flex items-center space-x-2 space-x-reverse">
                  <ClockIcon className="h-4 w-4 text-gray-500" />
                  <span className="text-sm text-gray-700">
                    الوصول المتوقع: {formatEstimatedArrival(tracking.estimatedArrival)}
                  </span>
                </div>
              )}
              
              {tracking.remainingDistance && (
                <div className="flex items-center space-x-2 space-x-reverse">
                  <NavigationIcon className="h-4 w-4 text-gray-500" />
                  <span className="text-sm text-gray-700">
                    المسافة المتبقية: {tracking.remainingDistance.toFixed(1)} كم
                  </span>
                </div>
              )}

              <div className="flex items-center space-x-2 space-x-reverse">
                <TruckIcon className="h-4 w-4 text-gray-500" />
                <span className="text-sm text-gray-700">
                  من: {tracking.order.restaurant.nameArabic}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Map Placeholder */}
      <div className="px-6 py-4 border-t">
        <h4 className="text-md font-medium text-gray-900 mb-3">موقع السائق على الخريطة</h4>
        <div 
          ref={mapRef}
          className="w-full h-64 bg-gray-100 rounded-lg flex items-center justify-center"
        >
          {tracking.currentLocation ? (
            <div className="text-center">
              <MapPinIcon className="h-12 w-12 text-blue-600 mx-auto mb-2" />
              <p className="text-gray-600">خريطة تتبع الموقع</p>
              <p className="text-xs text-gray-500 mt-1">
                آخر تحديث: {tracking.currentLocation ? 'الآن' : 'غير متاح'}
              </p>
            </div>
          ) : (
            <div className="text-center">
              <MapPinIcon className="h-12 w-12 text-gray-400 mx-auto mb-2" />
              <p className="text-gray-500">لا يوجد موقع متاح حالياً</p>
            </div>
          )}
        </div>
      </div>

      {/* Action Buttons */}
      {tracking.status === 'DELIVERED' && (
        <div className="px-6 py-4 border-t bg-green-50">
          <div className="flex items-center justify-center space-x-2 space-x-reverse">
            <CheckCircleIcon className="h-5 w-5 text-green-600" />
            <span className="text-green-800 font-medium">تم توصيل البريك بنجاح!</span>
          </div>
        </div>
      )}

      {tracking.status === 'NEARBY' && (
        <div className="px-6 py-4 border-t bg-yellow-50">
          <div className="flex items-center justify-center space-x-2 space-x-reverse">
            <TruckIcon className="h-5 w-5 text-yellow-600" />
            <span className="text-yellow-800 font-medium">السائق قريب من موقع التصوير</span>
          </div>
        </div>
      )}
    </div>
  );
};

export default BreakDeliveryTracker;