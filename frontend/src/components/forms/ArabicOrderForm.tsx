/**
 * نموذج الطلب العربي
 * Arabic Order Form with RTL support
 */

import React, { useState, useEffect } from 'react';
import { useTranslation } from '../../config/localization';
import { apiService, MenuItem, Restaurant } from '../../services/apiService';
import ArabicInput from './ArabicInput';
import ArabicSelect from './ArabicSelect';
import ArabicButton from './ArabicButton';
import { formatArabicDate, formatArabicTime, toArabicNumbers } from '../../utils/arabicDateTime';
import { 
  ShoppingCartIcon,
  PlusIcon,
  MinusIcon,
  TrashIcon,
  MapPinIcon,
  ClockIcon,
  CreditCardIcon,
  DocumentTextIcon
} from '@heroicons/react/24/outline';

interface OrderItem {
  itemId: string;
  name: string;
  nameAr: string;
  price: number;
  quantity: number;
  notes?: string;
  image?: string;
}

interface ArabicOrderFormProps {
  restaurantId?: string;
  onOrderCreated?: (order: any) => void;
  onCancel?: () => void;
}

const ArabicOrderForm: React.FC<ArabicOrderFormProps> = ({
  restaurantId,
  onOrderCreated,
  onCancel
}) => {
  const { t } = useTranslation();
  const [restaurants, setRestaurants] = useState<Restaurant[]>([]);
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [selectedRestaurant, setSelectedRestaurant] = useState<string>(restaurantId || '');
  const [orderItems, setOrderItems] = useState<OrderItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // بيانات النموذج
  const [orderForm, setOrderForm] = useState({
    deliveryAddress: '',
    deliveryTime: '',
    paymentMethod: 'CASH',
    notes: ''
  });

  // خيارات الدفع
  const paymentMethods = [
    { value: 'CASH', label: 'نقداً عند التوصيل' },
    { value: 'CARD', label: 'بطاقة ائتمان' },
    { value: 'WALLET', label: 'محفظة إلكترونية' },
    { value: 'BANK_TRANSFER', label: 'تحويل بنكي' }
  ];

  // جلب المطاعم
  useEffect(() => {
    fetchRestaurants();
  }, []);

  // جلب عناصر القائمة عند تغيير المطعم
  useEffect(() => {
    if (selectedRestaurant) {
      fetchMenuItems(selectedRestaurant);
    }
  }, [selectedRestaurant]);

  const fetchRestaurants = async () => {
    try {
      const response = await apiService.getRestaurants({ isActive: true });
      if (response.success && response.data) {
        setRestaurants(response.data.restaurants || []);
      }
    } catch (error) {
      console.error('خطأ في جلب المطاعم:', error);
    }
  };

  const fetchMenuItems = async (restaurantId: string) => {
    try {
      setLoading(true);
      const response = await apiService.getMenuItems({ 
        restaurantId, 
        available: 'true' 
      });
      
      if (response.success && response.data) {
        setMenuItems(response.data.items || []);
      }
    } catch (error) {
      console.error('خطأ في جلب عناصر القائمة:', error);
    } finally {
      setLoading(false);
    }
  };

  // إضافة عنصر للطلب
  const addItemToOrder = (item: MenuItem) => {
    const existingItem = orderItems.find(orderItem => orderItem.itemId === item.id);
    
    if (existingItem) {
      setOrderItems(orderItems.map(orderItem =>
        orderItem.itemId === item.id
          ? { ...orderItem, quantity: orderItem.quantity + 1 }
          : orderItem
      ));
    } else {
      const newOrderItem: OrderItem = {
        itemId: item.id,
        name: item.name,
        nameAr: item.nameAr,
        price: item.price,
        quantity: 1,
        image: item.image
      };
      setOrderItems([...orderItems, newOrderItem]);
    }
  };

  // تحديث كمية العنصر
  const updateItemQuantity = (itemId: string, quantity: number) => {
    if (quantity <= 0) {
      removeItemFromOrder(itemId);
      return;
    }

    setOrderItems(orderItems.map(item =>
      item.itemId === itemId
        ? { ...item, quantity }
        : item
    ));
  };

  // إزالة عنصر من الطلب
  const removeItemFromOrder = (itemId: string) => {
    setOrderItems(orderItems.filter(item => item.itemId !== itemId));
  };

  // تحديث ملاحظات العنصر
  const updateItemNotes = (itemId: string, notes: string) => {
    setOrderItems(orderItems.map(item =>
      item.itemId === itemId
        ? { ...item, notes }
        : item
    ));
  };

  // حساب إجمالي الطلب
  const calculateTotal = () => {
    return orderItems.reduce((total, item) => total + (item.price * item.quantity), 0);
  };

  // إرسال الطلب
  const submitOrder = async () => {
    if (!selectedRestaurant) {
      alert('يرجى اختيار مطعم');
      return;
    }

    if (orderItems.length === 0) {
      alert('يرجى إضافة عناصر للطلب');
      return;
    }

    if (!orderForm.deliveryAddress.trim()) {
      alert('يرجى إدخال عنوان التوصيل');
      return;
    }

    if (!orderForm.deliveryTime) {
      alert('يرجى تحديد وقت التوصيل');
      return;
    }

    try {
      setSubmitting(true);

      const orderData = {
        restaurantId: selectedRestaurant,
        items: orderItems.map(item => ({
          itemId: item.itemId,
          quantity: item.quantity,
          notes: item.notes
        })),
        deliveryAddress: orderForm.deliveryAddress,
        deliveryTime: orderForm.deliveryTime,
        paymentMethod: orderForm.paymentMethod,
        notes: orderForm.notes
      };

      const response = await apiService.createOrder(orderData);

      if (response.success) {
        alert(t('orders.orderCreated'));
        if (onOrderCreated) {
          onOrderCreated(response.data);
        }
        // إعادة تعيين النموذج
        setOrderItems([]);
        setOrderForm({
          deliveryAddress: '',
          deliveryTime: '',
          paymentMethod: 'CASH',
          notes: ''
        });
      } else {
        alert(response.message || 'فشل في إنشاء الطلب');
      }
    } catch (error) {
      console.error('خطأ في إرسال الطلب:', error);
      alert('حدث خطأ في إرسال الطلب');
    } finally {
      setSubmitting(false);
    }
  };

  // تنسيق الوقت للإدخال
  const formatTimeForInput = () => {
    const now = new Date();
    now.setMinutes(now.getMinutes() + 30); // إضافة 30 دقيقة كحد أدنى
    return now.toISOString().slice(0, 16);
  };

  return (
    <div className="max-w-4xl mx-auto p-6 bg-white rounded-lg shadow-lg">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold text-gray-900 flex items-center">
          <ShoppingCartIcon className="h-8 w-8 ml-3 text-blue-600" />
          طلب جديد
        </h2>
        {onCancel && (
          <ArabicButton variant="outline" onClick={onCancel}>
            {t('common.cancel')}
          </ArabicButton>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* قسم اختيار المطعم والقائمة */}
        <div className="lg:col-span-2 space-y-6">
          {/* اختيار المطعم */}
          <div className="bg-gray-50 p-4 rounded-lg">
            <h3 className="text-lg font-semibold text-gray-900 mb-3">اختيار المطعم</h3>
            <ArabicSelect
              label="المطعم"
              value={selectedRestaurant}
              onChange={(e) => setSelectedRestaurant(e.target.value)}
              options={restaurants.map(restaurant => ({
                value: restaurant.id,
                label: restaurant.nameAr
              }))}
              required
            />
          </div>

          {/* عناصر القائمة */}
          {selectedRestaurant && (
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-3">القائمة</h3>
              {loading ? (
                <div className="flex items-center justify-center h-32">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                  <span className="mr-3 text-gray-600">جاري تحميل القائمة...</span>
                </div>
              ) : menuItems.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  لا توجد عناصر متاحة في هذا المطعم
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {menuItems.map((item) => (
                    <div key={item.id} className="border rounded-lg p-4 hover:shadow-md transition-shadow">
                      {/* صورة العنصر */}
                      {item.image && (
                        <img
                          src={item.image}
                          alt={item.nameAr}
                          className="w-full h-32 object-cover rounded-md mb-3"
                        />
                      )}
                      
                      <div className="flex justify-between items-start mb-2">
                        <h4 className="font-semibold text-gray-900">{item.nameAr}</h4>
                        <span className="text-lg font-bold text-green-600">
                          {toArabicNumbers(item.price.toString())} ج.م
                        </span>
                      </div>
                      
                      <p className="text-sm text-gray-600 mb-3 line-clamp-2">
                        {item.descriptionAr}
                      </p>
                      
                      {/* شارات */}
                      <div className="flex flex-wrap gap-1 mb-3">
                        {item.isHalal && (
                          <span className="bg-green-100 text-green-800 text-xs px-2 py-1 rounded">
                            حلال
                          </span>
                        )}
                        {item.isVegetarian && (
                          <span className="bg-yellow-100 text-yellow-800 text-xs px-2 py-1 rounded">
                            نباتي
                          </span>
                        )}
                        {item.allergens.length > 0 && (
                          <span className="bg-red-100 text-red-800 text-xs px-2 py-1 rounded">
                            يحتوي على مسببات حساسية
                          </span>
                        )}
                      </div>
                      
                      <ArabicButton
                        variant="primary"
                        size="sm"
                        icon={PlusIcon}
                        onClick={() => addItemToOrder(item)}
                        className="w-full"
                      >
                        إضافة للطلب
                      </ArabicButton>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        {/* قسم الطلب الحالي */}
        <div className="space-y-6">
          {/* عناصر الطلب */}
          <div className="bg-gray-50 p-4 rounded-lg">
            <h3 className="text-lg font-semibold text-gray-900 mb-3">
              طلبك الحالي ({toArabicNumbers(orderItems.length.toString())} عنصر)
            </h3>
            
            {orderItems.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <ShoppingCartIcon className="h-12 w-12 mx-auto text-gray-300 mb-2" />
                <p>لم تضف أي عناصر بعد</p>
              </div>
            ) : (
              <div className="space-y-3">
                {orderItems.map((item) => (
                  <div key={item.itemId} className="bg-white p-3 rounded border">
                    <div className="flex justify-between items-start mb-2">
                      <h4 className="font-medium text-gray-900">{item.nameAr}</h4>
                      <button
                        onClick={() => removeItemFromOrder(item.itemId)}
                        className="text-red-600 hover:text-red-800"
                      >
                        <TrashIcon className="h-4 w-4" />
                      </button>
                    </div>
                    
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center space-x-2 space-x-reverse">
                        <button
                          onClick={() => updateItemQuantity(item.itemId, item.quantity - 1)}
                          className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center hover:bg-gray-300"
                        >
                          <MinusIcon className="h-4 w-4" />
                        </button>
                        <span className="w-8 text-center font-medium">
                          {toArabicNumbers(item.quantity.toString())}
                        </span>
                        <button
                          onClick={() => updateItemQuantity(item.itemId, item.quantity + 1)}
                          className="w-8 h-8 rounded-full bg-blue-600 text-white flex items-center justify-center hover:bg-blue-700"
                        >
                          <PlusIcon className="h-4 w-4" />
                        </button>
                      </div>
                      <span className="font-bold text-green-600">
                        {toArabicNumbers((item.price * item.quantity).toString())} ج.م
                      </span>
                    </div>
                    
                    {/* ملاحظات العنصر */}
                    <input
                      type="text"
                      placeholder="ملاحظات خاصة..."
                      value={item.notes || ''}
                      onChange={(e) => updateItemNotes(item.itemId, e.target.value)}
                      className="w-full text-sm border border-gray-300 rounded px-2 py-1 focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                ))}
                
                {/* الإجمالي */}
                <div className="border-t pt-3">
                  <div className="flex justify-between items-center text-lg font-bold">
                    <span>الإجمالي:</span>
                    <span className="text-green-600">
                      {toArabicNumbers(calculateTotal().toString())} ج.م
                    </span>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* معلومات التوصيل */}
          {orderItems.length > 0 && (
            <div className="bg-gray-50 p-4 rounded-lg space-y-4">
              <h3 className="text-lg font-semibold text-gray-900 flex items-center">
                <MapPinIcon className="h-5 w-5 ml-2" />
                معلومات التوصيل
              </h3>
              
              <ArabicInput
                label="عنوان التوصيل"
                value={orderForm.deliveryAddress}
                onChange={(e) => setOrderForm({...orderForm, deliveryAddress: e.target.value})}
                placeholder="أدخل عنوان التوصيل الكامل"
                required
                multiline
                rows={2}
              />
              
              <ArabicInput
                label="وقت التوصيل المطلوب"
                type="datetime-local"
                value={orderForm.deliveryTime}
                onChange={(e) => setOrderForm({...orderForm, deliveryTime: e.target.value})}
                min={formatTimeForInput()}
                required
              />
              
              <ArabicSelect
                label="طريقة الدفع"
                value={orderForm.paymentMethod}
                onChange={(e) => setOrderForm({...orderForm, paymentMethod: e.target.value})}
                options={paymentMethods}
                required
              />
              
              <ArabicInput
                label="ملاحظات إضافية"
                value={orderForm.notes}
                onChange={(e) => setOrderForm({...orderForm, notes: e.target.value})}
                placeholder="أي ملاحظات خاصة للطلب..."
                multiline
                rows={3}
              />
              
              <ArabicButton
                variant="primary"
                onClick={submitOrder}
                disabled={submitting || orderItems.length === 0}
                className="w-full"
                icon={submitting ? undefined : ShoppingCartIcon}
              >
                {submitting ? 'جاري إرسال الطلب...' : 'تأكيد الطلب'}
              </ArabicButton>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ArabicOrderForm;