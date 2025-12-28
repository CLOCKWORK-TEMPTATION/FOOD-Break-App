/**
 * صفحة المطاعم العربية
 * Arabic Restaurants Page with RTL support
 */

import React, { useState, useEffect } from 'react';
import { useTranslation } from '../config/localization';
import ArabicLayout from '../components/layout/ArabicLayout';
import ArabicButton from '../components/forms/ArabicButton';
import ArabicInput from '../components/forms/ArabicInput';
import ArabicSelect from '../components/forms/ArabicSelect';
import ArabicNavigation from '../components/ArabicNavigation';
import { apiService, Restaurant } from '../services/apiService';
import { 
  PlusIcon,
  PencilIcon,
  TrashIcon,
  BuildingStorefrontIcon,
  PhoneIcon,
  EnvelopeIcon,
  MapPinIcon,
  StarIcon,
  ClockIcon,
  CurrencyDollarIcon,
  MagnifyingGlassIcon,
  FunnelIcon,
  EyeIcon,
  CheckCircleIcon,
  XCircleIcon
} from '@heroicons/react/24/outline';

const ArabicRestaurants: React.FC = () => {
  const { t } = useTranslation();
  const [restaurants, setRestaurants] = useState<Restaurant[]>([]);
  const [loading, setLoading] = useState(true);
  const [showRestaurantModal, setShowRestaurantModal] = useState(false);
  const [selectedRestaurant, setSelectedRestaurant] = useState<Restaurant | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [cuisineFilter, setCuisineFilter] = useState('ALL');
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  // بيانات النموذج
  const [restaurantForm, setRestaurantForm] = useState({
    name: '',
    nameAr: '',
    address: '',
    addressAr: '',
    phone: '',
    email: '',
    cuisineType: '',
    cuisineTypeAr: '',
    deliveryTime: 30,
    minimumOrder: 50,
    deliveryFee: 15,
    workingHours: {
      open: '09:00',
      close: '23:00'
    },
    isActive: true,
    isPartner: false,
    image: ''
  });

  // أنواع المطابخ
  const cuisineTypes = [
    { value: 'arabic', label: 'عربي', labelAr: 'عربي' },
    { value: 'italian', label: 'إيطالي', labelAr: 'إيطالي' },
    { value: 'chinese', label: 'صيني', labelAr: 'صيني' },
    { value: 'indian', label: 'هندي', labelAr: 'هندي' },
    { value: 'mexican', label: 'مكسيكي', labelAr: 'مكسيكي' },
    { value: 'japanese', label: 'ياباني', labelAr: 'ياباني' },
    { value: 'american', label: 'أمريكي', labelAr: 'أمريكي' },
    { value: 'french', label: 'فرنسي', labelAr: 'فرنسي' },
    { value: 'turkish', label: 'تركي', labelAr: 'تركي' },
    { value: 'lebanese', label: 'لبناني', labelAr: 'لبناني' }
  ];

  // جلب المطاعم
  useEffect(() => {
    fetchRestaurants();
  }, [statusFilter, cuisineFilter]);

  const fetchRestaurants = async () => {
    try {
      setLoading(true);
      const params: any = {};
      
      if (statusFilter === 'ACTIVE') {
        params.isActive = true;
      } else if (statusFilter === 'INACTIVE') {
        params.isActive = false;
      }

      const response = await apiService.getRestaurants(params);
      
      if (response.success && response.data) {
        setRestaurants(response.data.restaurants || []);
      }
    } catch (error) {
      console.error('خطأ في جلب المطاعم:', error);
    } finally {
      setLoading(false);
    }
  };

  // حفظ المطعم
  const saveRestaurant = async () => {
    try {
      const response = selectedRestaurant 
        ? await apiService.updateRestaurant(selectedRestaurant.id, restaurantForm)
        : await apiService.createRestaurant(restaurantForm);
      
      if (response.success) {
        await fetchRestaurants();
        setShowRestaurantModal(false);
        resetForm();
        alert(selectedRestaurant ? t('restaurants.restaurantUpdated') : t('restaurants.restaurantAdded'));
      } else {
        alert(response.message || 'فشل في حفظ المطعم');
      }
    } catch (error) {
      console.error('خطأ في حفظ المطعم:', error);
      alert('حدث خطأ في حفظ المطعم');
    }
  };

  // حذف المطعم
  const deleteRestaurant = async (restaurantId: string) => {
    if (!confirm('هل أنت متأكد من حذف هذا المطعم؟')) {
      return;
    }

    try {
      const response = await apiService.deleteRestaurant(restaurantId);
      
      if (response.success) {
        await fetchRestaurants();
        alert(t('restaurants.restaurantDeleted'));
      } else {
        alert(response.message || 'فشل في حذف المطعم');
      }
    } catch (error) {
      console.error('خطأ في حذف المطعم:', error);
      alert('حدث خطأ في حذف المطعم');
    }
  };

  // تبديل حالة المطعم
  const toggleRestaurantStatus = async (restaurantId: string, currentStatus: boolean) => {
    try {
      const response = await apiService.updateRestaurant(restaurantId, {
        isActive: !currentStatus
      });
      
      if (response.success) {
        await fetchRestaurants();
      } else {
        alert(response.message || 'فشل في تحديث حالة المطعم');
      }
    } catch (error) {
      console.error('خطأ في تحديث حالة المطعم:', error);
      alert('حدث خطأ في تحديث حالة المطعم');
    }
  };

  // إعادة تعيين النموذج
  const resetForm = () => {
    setRestaurantForm({
      name: '',
      nameAr: '',
      address: '',
      addressAr: '',
      phone: '',
      email: '',
      cuisineType: '',
      cuisineTypeAr: '',
      deliveryTime: 30,
      minimumOrder: 50,
      deliveryFee: 15,
      workingHours: {
        open: '09:00',
        close: '23:00'
      },
      isActive: true,
      isPartner: false,
      image: ''
    });
    setSelectedRestaurant(null);
  };

  // فتح نموذج التعديل
  const openEditModal = (restaurant: Restaurant) => {
    setSelectedRestaurant(restaurant);
    setRestaurantForm({
      name: restaurant.name,
      nameAr: restaurant.nameAr,
      address: restaurant.address,
      addressAr: restaurant.addressAr,
      phone: restaurant.phone,
      email: restaurant.email,
      cuisineType: restaurant.cuisineType,
      cuisineTypeAr: restaurant.cuisineTypeAr,
      deliveryTime: restaurant.deliveryTime,
      minimumOrder: restaurant.minimumOrder,
      deliveryFee: restaurant.deliveryFee,
      workingHours: restaurant.workingHours,
      isActive: restaurant.isActive,
      isPartner: restaurant.isPartner,
      image: restaurant.image || ''
    });
    setShowRestaurantModal(true);
  };

  // تصفية المطاعم
  const filteredRestaurants = restaurants.filter(restaurant => {
    const matchesSearch = restaurant.nameAr.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         restaurant.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         restaurant.addressAr.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesCuisine = cuisineFilter === 'ALL' || restaurant.cuisineType === cuisineFilter;
    
    return matchesSearch && matchesCuisine;
  });

  // تنسيق ساعات العمل
  const formatWorkingHours = (workingHours: { open: string; close: string }) => {
    return `${workingHours.open} - ${workingHours.close}`;
  };

  // تنسيق التقييم
  const renderRating = (rating: number) => {
    const stars = [];
    for (let i = 1; i <= 5; i++) {
      stars.push(
        <StarIcon
          key={i}
          className={`h-4 w-4 ${i <= rating ? 'text-yellow-400 fill-current' : 'text-gray-300'}`}
        />
      );
    }
    return <div className="flex">{stars}</div>;
  };

  return (
    <ArabicLayout 
      sidebarCollapsed={sidebarCollapsed}
      onSidebarToggle={() => setSidebarCollapsed(!sidebarCollapsed)}
    >
      <div className="space-y-6">
        {/* التنقل العربي */}
        <ArabicNavigation currentPage="restaurants" />
        
        {/* العنوان والإجراءات */}
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              {t('restaurants.title')}
            </h1>
            <p className="mt-1 text-sm text-gray-600">
              إدارة المطاعم الشريكة وقوائمها
            </p>
          </div>
          <ArabicButton
            variant="primary"
            icon={PlusIcon}
            onClick={() => {
              resetForm();
              setShowRestaurantModal(true);
            }}
          >
            {t('restaurants.addRestaurant')}
          </ArabicButton>
        </div>

        {/* شريط البحث والتصفية */}
        <div className="bg-white shadow rounded-lg p-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {/* البحث */}
            <div className="relative">
              <MagnifyingGlassIcon className="absolute right-3 top-3 h-4 w-4 text-gray-400" />
              <input
                type="text"
                placeholder="البحث في المطاعم..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pr-10 pl-4 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
              />
            </div>

            {/* تصفية الحالة */}
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="ALL">جميع المطاعم</option>
              <option value="ACTIVE">نشط</option>
              <option value="INACTIVE">غير نشط</option>
            </select>

            {/* تصفية نوع المطبخ */}
            <select
              value={cuisineFilter}
              onChange={(e) => setCuisineFilter(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="ALL">جميع أنواع المطابخ</option>
              {cuisineTypes.map(cuisine => (
                <option key={cuisine.value} value={cuisine.value}>
                  {cuisine.labelAr}
                </option>
              ))}
            </select>

            {/* زر التصفية المتقدمة */}
            <ArabicButton
              variant="outline"
              icon={FunnelIcon}
              onClick={() => {/* فتح التصفية المتقدمة */}}
            >
              تصفية متقدمة
            </ArabicButton>
          </div>
        </div>

        {/* شبكة المطاعم */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {loading ? (
            <div className="col-span-full flex items-center justify-center h-64">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
              <span className="mr-3 text-gray-600">{t('common.loading')}</span>
            </div>
          ) : filteredRestaurants.length === 0 ? (
            <div className="col-span-full text-center py-12">
              <BuildingStorefrontIcon className="mx-auto h-12 w-12 text-gray-400" />
              <h3 className="mt-2 text-sm font-medium text-gray-900">
                {t('restaurants.noRestaurants')}
              </h3>
              <p className="mt-1 text-sm text-gray-500">
                لا توجد مطاعم تطابق معايير البحث
              </p>
            </div>
          ) : (
            filteredRestaurants.map((restaurant) => (
              <div key={restaurant.id} className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow">
                {/* صورة المطعم */}
                <div className="h-48 bg-gray-200 relative">
                  {restaurant.image ? (
                    <img
                      src={restaurant.image}
                      alt={restaurant.nameAr}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="flex items-center justify-center h-full">
                      <BuildingStorefrontIcon className="h-12 w-12 text-gray-400" />
                    </div>
                  )}
                  
                  {/* شارات الحالة */}
                  <div className="absolute top-2 right-2 flex flex-col space-y-1">
                    <span className={`
                      text-xs font-medium px-2 py-1 rounded
                      ${restaurant.isActive 
                        ? 'bg-green-100 text-green-800' 
                        : 'bg-red-100 text-red-800'
                      }
                    `}>
                      {restaurant.isActive ? 'نشط' : 'غير نشط'}
                    </span>
                    {restaurant.isPartner && (
                      <span className="bg-blue-100 text-blue-800 text-xs font-medium px-2 py-1 rounded">
                        شريك
                      </span>
                    )}
                  </div>
                </div>

                {/* محتوى البطاقة */}
                <div className="p-4">
                  <div className="flex justify-between items-start mb-2">
                    <h3 className="text-lg font-semibold text-gray-900 truncate">
                      {restaurant.nameAr}
                    </h3>
                    {renderRating(restaurant.rating)}
                  </div>
                  
                  <div className="space-y-2 mb-4">
                    <div className="flex items-center text-sm text-gray-600">
                      <MapPinIcon className="h-4 w-4 ml-1" />
                      <span className="truncate">{restaurant.addressAr}</span>
                    </div>
                    <div className="flex items-center text-sm text-gray-600">
                      <PhoneIcon className="h-4 w-4 ml-1" />
                      <span>{restaurant.phone}</span>
                    </div>
                    <div className="flex items-center text-sm text-gray-600">
                      <EnvelopeIcon className="h-4 w-4 ml-1" />
                      <span className="truncate">{restaurant.email}</span>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4 mb-4 text-sm">
                    <div className="flex items-center text-gray-600">
                      <ClockIcon className="h-4 w-4 ml-1" />
                      <span>{restaurant.deliveryTime} دقيقة</span>
                    </div>
                    <div className="flex items-center text-gray-600">
                      <CurrencyDollarIcon className="h-4 w-4 ml-1" />
                      <span>{restaurant.deliveryFee} ج.م</span>
                    </div>
                  </div>

                  <div className="flex justify-between items-center mb-4">
                    <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded">
                      {restaurant.cuisineTypeAr}
                    </span>
                    <span className="text-xs text-gray-500">
                      الحد الأدنى: {restaurant.minimumOrder} ج.م
                    </span>
                  </div>

                  <div className="text-xs text-gray-500 mb-4">
                    ساعات العمل: {formatWorkingHours(restaurant.workingHours)}
                  </div>

                  {/* أزرار الإجراءات */}
                  <div className="flex justify-between space-x-2 space-x-reverse">
                    <div className="flex space-x-2 space-x-reverse">
                      <ArabicButton
                        variant="outline"
                        size="sm"
                        icon={EyeIcon}
                        onClick={() => {/* عرض تفاصيل المطعم */}}
                      >
                        عرض
                      </ArabicButton>
                      <ArabicButton
                        variant="outline"
                        size="sm"
                        icon={PencilIcon}
                        onClick={() => openEditModal(restaurant)}
                      >
                        {t('common.edit')}
                      </ArabicButton>
                    </div>
                    <div className="flex space-x-2 space-x-reverse">
                      <button
                        onClick={() => toggleRestaurantStatus(restaurant.id, restaurant.isActive)}
                        className={`
                          p-1 rounded text-white text-xs
                          ${restaurant.isActive 
                            ? 'bg-red-600 hover:bg-red-700' 
                            : 'bg-green-600 hover:bg-green-700'
                          }
                        `}
                      >
                        {restaurant.isActive ? (
                          <XCircleIcon className="h-4 w-4" />
                        ) : (
                          <CheckCircleIcon className="h-4 w-4" />
                        )}
                      </button>
                      <ArabicButton
                        variant="danger"
                        size="sm"
                        icon={TrashIcon}
                        onClick={() => deleteRestaurant(restaurant.id)}
                      >
                        {t('common.delete')}
                      </ArabicButton>
                    </div>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        {/* نافذة إضافة/تعديل مطعم */}
        {showRestaurantModal && (
          <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
            <div className="relative top-10 mx-auto p-5 border w-11/12 md:w-3/4 lg:w-1/2 shadow-lg rounded-md bg-white">
              <div className="mt-3">
                <h3 className="text-lg font-medium text-gray-900 mb-4">
                  {selectedRestaurant ? t('restaurants.editRestaurant') : t('restaurants.addRestaurant')}
                </h3>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-h-96 overflow-y-auto">
                  <ArabicInput
                    label="اسم المطعم بالعربية"
                    value={restaurantForm.nameAr}
                    onChange={(e) => setRestaurantForm({...restaurantForm, nameAr: e.target.value})}
                    required
                  />
                  <ArabicInput
                    label="اسم المطعم بالإنجليزية"
                    value={restaurantForm.name}
                    onChange={(e) => setRestaurantForm({...restaurantForm, name: e.target.value})}
                    required
                  />
                  <ArabicInput
                    label="العنوان بالعربية"
                    value={restaurantForm.addressAr}
                    onChange={(e) => setRestaurantForm({...restaurantForm, addressAr: e.target.value})}
                    required
                  />
                  <ArabicInput
                    label="العنوان بالإنجليزية"
                    value={restaurantForm.address}
                    onChange={(e) => setRestaurantForm({...restaurantForm, address: e.target.value})}
                    required
                  />
                  <ArabicInput
                    label="رقم الهاتف"
                    value={restaurantForm.phone}
                    onChange={(e) => setRestaurantForm({...restaurantForm, phone: e.target.value})}
                    required
                  />
                  <ArabicInput
                    label="البريد الإلكتروني"
                    type="email"
                    value={restaurantForm.email}
                    onChange={(e) => setRestaurantForm({...restaurantForm, email: e.target.value})}
                    required
                  />
                  <ArabicSelect
                    label="نوع المطبخ"
                    value={restaurantForm.cuisineType}
                    onChange={(e) => {
                      const selectedCuisine = cuisineTypes.find(c => c.value === e.target.value);
                      setRestaurantForm({
                        ...restaurantForm, 
                        cuisineType: e.target.value,
                        cuisineTypeAr: selectedCuisine?.labelAr || ''
                      });
                    }}
                    options={cuisineTypes.map(c => ({ value: c.value, label: c.labelAr }))}
                    required
                  />
                  <ArabicInput
                    label="وقت التوصيل (دقيقة)"
                    type="number"
                    value={restaurantForm.deliveryTime}
                    onChange={(e) => setRestaurantForm({...restaurantForm, deliveryTime: parseInt(e.target.value) || 0})}
                    required
                  />
                  <ArabicInput
                    label="الحد الأدنى للطلب (ج.م)"
                    type="number"
                    value={restaurantForm.minimumOrder}
                    onChange={(e) => setRestaurantForm({...restaurantForm, minimumOrder: parseFloat(e.target.value) || 0})}
                    required
                  />
                  <ArabicInput
                    label="رسوم التوصيل (ج.م)"
                    type="number"
                    value={restaurantForm.deliveryFee}
                    onChange={(e) => setRestaurantForm({...restaurantForm, deliveryFee: parseFloat(e.target.value) || 0})}
                    required
                  />
                  <ArabicInput
                    label="وقت الفتح"
                    type="time"
                    value={restaurantForm.workingHours.open}
                    onChange={(e) => setRestaurantForm({
                      ...restaurantForm, 
                      workingHours: { ...restaurantForm.workingHours, open: e.target.value }
                    })}
                    required
                  />
                  <ArabicInput
                    label="وقت الإغلاق"
                    type="time"
                    value={restaurantForm.workingHours.close}
                    onChange={(e) => setRestaurantForm({
                      ...restaurantForm, 
                      workingHours: { ...restaurantForm.workingHours, close: e.target.value }
                    })}
                    required
                  />
                  <div className="md:col-span-2">
                    <ArabicInput
                      label="رابط الصورة"
                      value={restaurantForm.image}
                      onChange={(e) => setRestaurantForm({...restaurantForm, image: e.target.value})}
                    />
                  </div>
                  
                  {/* خيارات إضافية */}
                  <div className="md:col-span-2 space-y-3">
                    <div className="flex items-center space-x-3 space-x-reverse">
                      <input
                        type="checkbox"
                        id="isActive"
                        checked={restaurantForm.isActive}
                        onChange={(e) => setRestaurantForm({...restaurantForm, isActive: e.target.checked})}
                        className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                      />
                      <label htmlFor="isActive" className="text-sm text-gray-700">
                        مطعم نشط
                      </label>
                    </div>
                    <div className="flex items-center space-x-3 space-x-reverse">
                      <input
                        type="checkbox"
                        id="isPartner"
                        checked={restaurantForm.isPartner}
                        onChange={(e) => setRestaurantForm({...restaurantForm, isPartner: e.target.checked})}
                        className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                      />
                      <label htmlFor="isPartner" className="text-sm text-gray-700">
                        مطعم شريك
                      </label>
                    </div>
                  </div>
                </div>

                <div className="flex justify-end space-x-3 space-x-reverse mt-6">
                  <ArabicButton
                    variant="outline"
                    onClick={() => {
                      setShowRestaurantModal(false);
                      resetForm();
                    }}
                  >
                    {t('common.cancel')}
                  </ArabicButton>
                  <ArabicButton
                    variant="primary"
                    onClick={saveRestaurant}
                  >
                    {t('common.save')}
                  </ArabicButton>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </ArabicLayout>
  );
};

export default ArabicRestaurants;