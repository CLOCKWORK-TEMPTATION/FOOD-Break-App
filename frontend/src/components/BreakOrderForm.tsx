/**
 * نموذج طلب البريك المبسط
 * Simplified Break Order Form for Film Crews
 */

import React, { useState, useEffect } from 'react';
import { useTranslation } from '../config/localization';
import { 
  ClockIcon,
  MapPinIcon,
  CurrencyDollarIcon,
  CheckCircleIcon,
  XCircleIcon,
  FilmIcon
} from '@heroicons/react/24/outline';

interface MenuItem {
  id: string;
  nameAr: string;
  descriptionAr: string;
  price: number;
  image?: string;
  isHalal: boolean;
  isVegetarian: boolean;
  category: string;
  restaurant: {
    name: string;
    nameAr: string;
  };
}

interface Project {
  id: string;
  name: string;
  location: string;
  isOrderWindowOpen: boolean;
  orderWindowEnd: string;
  timeRemainingMinutes: number;
}

interface BreakOrderFormProps {
  projectId?: string;
  onOrderSuccess?: (orderId: string) => void;
  onOrderError?: (error: string) => void;
}

const BreakOrderForm: React.FC<BreakOrderFormProps> = ({
  projectId,
  onOrderSuccess,
  onOrderError
}) => {
  const { t } = useTranslation();
  const [project, setProject] = useState<Project | null>(null);
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [selectedItem, setSelectedItem] = useState<MenuItem | null>(null);
  const [quantity, setQuantity] = useState(1);
  const [specialNotes, setSpecialNotes] = useState('');
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [timeRemaining, setTimeRemaining] = useState(0);

  // تحديث العداد التنازلي
  useEffect(() => {
    if (project && project.isOrderWindowOpen) {
      const timer = setInterval(() => {
        const now = new Date();
        const endTime = new Date(project.orderWindowEnd);
        const remaining = Math.max(0, Math.floor((endTime.getTime() - now.getTime()) / 1000 / 60));
        setTimeRemaining(remaining);
        
        if (remaining === 0) {
          setProject({ ...project, isOrderWindowOpen: false });
        }
      }, 60000); // تحديث كل دقيقة

      return () => clearInterval(timer);
    }
  }, [project]);

  // جلب معلومات المشروع
  useEffect(() => {
    if (projectId) {
      fetchProject();
      fetchMenuItems();
    }
  }, [projectId]);

  const fetchProject = async () => {
    try {
      const response = await fetch(`/api/projects/${projectId}/order-window`, {
        headers: {
          'Accept-Language': 'ar',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });

      const data = await response.json();
      if (data.success) {
        setProject(data.data);
        setTimeRemaining(data.data.timeRemainingMinutes);
      }
    } catch (error) {
      console.error('خطأ في جلب معلومات المشروع:', error);
    }
  };

  const fetchMenuItems = async () => {
    try {
      const response = await fetch(`/api/menu/items?projectId=${projectId}&available=true`, {
        headers: {
          'Accept-Language': 'ar',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });

      const data = await response.json();
      if (data.success) {
        setMenuItems(data.data.items || []);
      }
    } catch (error) {
      console.error('خطأ في جلب قائمة البريك:', error);
    } finally {
      setLoading(false);
    }
  };

  const submitOrder = async () => {
    if (!selectedItem || !project) {
      onOrderError?.('يرجى اختيار وجبة البريك');
      return;
    }

    setSubmitting(true);

    try {
      const orderData = {
        projectId: project.id,
        restaurantId: selectedItem.restaurant.id,
        items: [{
          menuItemId: selectedItem.id,
          quantity: quantity,
          specialInstructions: specialNotes
        }],
        orderType: 'REGULAR',
        deliveryAddress: project.location,
        notes: specialNotes
      };

      const response = await fetch('/api/orders', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept-Language': 'ar',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify(orderData)
      });

      const data = await response.json();
      
      if (data.success) {
        onOrderSuccess?.(data.data.id);
      } else {
        onOrderError?.(data.message || 'فشل في طلب البريك');
      }
    } catch (error) {
      console.error('خطأ في طلب البريك:', error);
      onOrderError?.('حدث خطأ في طلب البريك');
    } finally {
      setSubmitting(false);
    }
  };

  const formatTimeRemaining = (minutes: number) => {
    if (minutes <= 0) return 'انتهت فترة الطلب';
    
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    
    if (hours > 0) {
      return `${hours} ساعة و ${mins} دقيقة متبقية`;
    }
    return `${mins} دقيقة متبقية`;
  };

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow p-6">
        <div className="animate-pulse">
          <div className="h-4 bg-gray-200 rounded w-3/4 mb-4"></div>
          <div className="h-4 bg-gray-200 rounded w-1/2 mb-4"></div>
          <div className="h-32 bg-gray-200 rounded mb-4"></div>
        </div>
      </div>
    );
  }

  if (!project) {
    return (
      <div className="bg-white rounded-lg shadow p-6 text-center">
        <XCircleIcon className="h-12 w-12 text-red-500 mx-auto mb-4" />
        <h3 className="text-lg font-medium text-gray-900 mb-2">خطأ في تحميل المشروع</h3>
        <p className="text-gray-600">لم يتم العثور على معلومات مشروع التصوير</p>
      </div>
    );
  }

  if (!project.isOrderWindowOpen) {
    return (
      <div className="bg-white rounded-lg shadow p-6 text-center">
        <ClockIcon className="h-12 w-12 text-orange-500 mx-auto mb-4" />
        <h3 className="text-lg font-medium text-gray-900 mb-2">انتهت فترة طلب البريك</h3>
        <p className="text-gray-600">لقد انتهت فترة طلب وجبات البريك لهذا اليوم</p>
        <p className="text-sm text-gray-500 mt-2">يمكنك طلب البريك في بداية يوم التصوير القادم</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow" dir="rtl">
      {/* Header */}
      <div className="px-6 py-4 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3 space-x-reverse">
            <FilmIcon className="h-6 w-6 text-blue-600" />
            <div>
              <h3 className="text-lg font-medium text-gray-900">طلب بريك جديد</h3>
              <p className="text-sm text-gray-600">{project.name}</p>
            </div>
          </div>
          <div className="text-left">
            <div className={`text-sm font-medium ${timeRemaining <= 30 ? 'text-red-600' : 'text-green-600'}`}>
              {formatTimeRemaining(timeRemaining)}
            </div>
            <div className="flex items-center text-xs text-gray-500 mt-1">
              <MapPinIcon className="h-3 w-3 ml-1" />
              {project.location}
            </div>
          </div>
        </div>
      </div>

      {/* Menu Items */}
      <div className="p-6">
        <h4 className="text-md font-medium text-gray-900 mb-4">اختر وجبة البريك</h4>
        
        {menuItems.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-gray-600">لا توجد وجبات متاحة للبريك حالياً</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
            {menuItems.map((item) => (
              <div
                key={item.id}
                className={`border rounded-lg p-4 cursor-pointer transition-all ${
                  selectedItem?.id === item.id
                    ? 'border-blue-500 bg-blue-50'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
                onClick={() => setSelectedItem(item)}
              >
                <div className="flex items-start space-x-3 space-x-reverse">
                  {item.image && (
                    <img
                      src={item.image}
                      alt={item.nameAr}
                      className="w-16 h-16 rounded-lg object-cover flex-shrink-0"
                    />
                  )}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <h5 className="text-sm font-medium text-gray-900 truncate">
                        {item.nameAr}
                      </h5>
                      {selectedItem?.id === item.id && (
                        <CheckCircleIcon className="h-5 w-5 text-blue-600 flex-shrink-0" />
                      )}
                    </div>
                    <p className="text-xs text-gray-600 mt-1 line-clamp-2">
                      {item.descriptionAr}
                    </p>
                    <div className="flex items-center justify-between mt-2">
                      <span className="text-sm font-semibold text-gray-900">
                        {item.price} ج.م
                      </span>
                      <div className="flex items-center space-x-2 space-x-reverse">
                        {item.isHalal && (
                          <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded">
                            حلال
                          </span>
                        )}
                        {item.isVegetarian && (
                          <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded">
                            نباتي
                          </span>
                        )}
                      </div>
                    </div>
                    <p className="text-xs text-gray-500 mt-1">
                      {item.restaurant.nameAr}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Order Details */}
        {selectedItem && (
          <div className="border-t pt-6">
            <h4 className="text-md font-medium text-gray-900 mb-4">تفاصيل الطلب</h4>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  الكمية
                </label>
                <select
                  value={quantity}
                  onChange={(e) => setQuantity(parseInt(e.target.value))}
                  className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  {[1, 2, 3, 4, 5].map(num => (
                    <option key={num} value={num}>{num}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  إجمالي السعر
                </label>
                <div className="flex items-center space-x-2 space-x-reverse">
                  <CurrencyDollarIcon className="h-5 w-5 text-gray-400" />
                  <span className="text-lg font-semibold text-gray-900">
                    {selectedItem.price * quantity} ج.م
                  </span>
                </div>
              </div>
            </div>

            <div className="mt-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                ملاحظات خاصة (اختياري)
              </label>
              <textarea
                value={specialNotes}
                onChange={(e) => setSpecialNotes(e.target.value)}
                placeholder="أي طلبات خاصة أو ملاحظات للمطعم..."
                rows={3}
                className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>
        )}

        {/* Submit Button */}
        <div className="mt-6 flex justify-end">
          <button
            onClick={submitOrder}
            disabled={!selectedItem || submitting || !project.isOrderWindowOpen}
            className={`px-6 py-3 rounded-md font-medium transition-colors ${
              !selectedItem || submitting || !project.isOrderWindowOpen
                ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                : 'bg-blue-600 text-white hover:bg-blue-700'
            }`}
          >
            {submitting ? (
              <div className="flex items-center space-x-2 space-x-reverse">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                <span>جاري طلب البريك...</span>
              </div>
            ) : (
              'تأكيد طلب البريك'
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default BreakOrderForm;