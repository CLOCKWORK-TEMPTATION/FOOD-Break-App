/**
 * صفحة قوائم البريك العربية
 * Arabic Break Menu Page with RTL support for Film Crews
 */

import React, { useState, useEffect } from 'react';
import { useTranslation } from '../config/localization';
import ArabicLayout from '../components/layout/ArabicLayout';
import ArabicButton from '../components/forms/ArabicButton';
import ArabicInput from '../components/forms/ArabicInput';
import ArabicSelect from '../components/forms/ArabicSelect';
import ArabicNavigation from '../components/ArabicNavigation';
import { 
  PlusIcon,
  PencilIcon,
  TrashIcon,
  PhotoIcon,
  MagnifyingGlassIcon,
  FunnelIcon,
  TagIcon,
  CurrencyDollarIcon,
  FilmIcon,
  ClockIcon
} from '@heroicons/react/24/outline';

interface MenuItem {
  id: string;
  name: string;
  nameAr: string;
  description: string;
  descriptionAr: string;
  price: number;
  category: string;
  categoryAr: string;
  image?: string;
  isAvailable: boolean;
  isHalal: boolean;
  isVegetarian: boolean;
  allergens: string[];
  nutritionInfo?: {
    calories: number;
    protein: number;
    carbs: number;
    fat: number;
  };
  restaurant: {
    id: string;
    name: string;
  };
  createdAt: string;
  updatedAt: string;
}

interface Category {
  id: string;
  name: string;
  nameAr: string;
  description?: string;
  descriptionAr?: string;
  isActive: boolean;
}

const ArabicMenu: React.FC = () => {
  const { t } = useTranslation();
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [showItemModal, setShowItemModal] = useState(false);
  const [showCategoryModal, setShowCategoryModal] = useState(false);
  const [selectedItem, setSelectedItem] = useState<MenuItem | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('ALL');
  const [availabilityFilter, setAvailabilityFilter] = useState('ALL');
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  // بيانات النموذج
  const [itemForm, setItemForm] = useState({
    name: '',
    nameAr: '',
    description: '',
    descriptionAr: '',
    price: 0,
    category: '',
    categoryAr: '',
    isAvailable: true,
    isHalal: true,
    isVegetarian: false,
    allergens: [] as string[],
    image: ''
  });

  const [categoryForm, setCategoryForm] = useState({
    name: '',
    nameAr: '',
    description: '',
    descriptionAr: '',
    isActive: true
  });

  // جلب البيانات
  useEffect(() => {
    fetchMenuItems();
    fetchCategories();
  }, [categoryFilter, availabilityFilter]);

  const fetchMenuItems = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      
      if (categoryFilter !== 'ALL') {
        params.append('category', categoryFilter);
      }
      
      if (availabilityFilter !== 'ALL') {
        params.append('available', availabilityFilter);
      }

      const response = await fetch(`/api/menu/items?${params.toString()}`, {
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
      console.error('خطأ في جلب عناصر القائمة:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchCategories = async () => {
    try {
      const response = await fetch('/api/menu/categories', {
        headers: {
          'Accept-Language': 'ar',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });

      const data = await response.json();
      
      if (data.success) {
        setCategories(data.data.categories || []);
      }
    } catch (error) {
      console.error('خطأ في جلب الفئات:', error);
    }
  };

  // حفظ عنصر القائمة
  const saveMenuItem = async () => {
    try {
      const url = selectedItem 
        ? `/api/menu/items/${selectedItem.id}`
        : '/api/menu/items';
      
      const method = selectedItem ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          'Accept-Language': 'ar',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify(itemForm)
      });

      const data = await response.json();
      
      if (data.success) {
        await fetchMenuItems();
        setShowItemModal(false);
        resetItemForm();
        alert(selectedItem ? t('menu.itemUpdated') : t('menu.itemAdded'));
      } else {
        alert(data.message || 'فشل في حفظ العنصر');
      }
    } catch (error) {
      console.error('خطأ في حفظ عنصر القائمة:', error);
      alert('حدث خطأ في حفظ العنصر');
    }
  };

  // حذف عنصر القائمة
  const deleteMenuItem = async (itemId: string) => {
    if (!confirm('هل أنت متأكد من حذف هذا العنصر؟')) {
      return;
    }

    try {
      const response = await fetch(`/api/menu/items/${itemId}`, {
        method: 'DELETE',
        headers: {
          'Accept-Language': 'ar',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });

      const data = await response.json();
      
      if (data.success) {
        await fetchMenuItems();
        alert(t('menu.itemDeleted'));
      } else {
        alert(data.message || 'فشل في حذف العنصر');
      }
    } catch (error) {
      console.error('خطأ في حذف عنصر القائمة:', error);
      alert('حدث خطأ في حذف العنصر');
    }
  };

  // حفظ الفئة
  const saveCategory = async () => {
    try {
      const response = await fetch('/api/menu/categories', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept-Language': 'ar',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify(categoryForm)
      });

      const data = await response.json();
      
      if (data.success) {
        await fetchCategories();
        setShowCategoryModal(false);
        resetCategoryForm();
        alert('تم إضافة الفئة بنجاح');
      } else {
        alert(data.message || 'فشل في حفظ الفئة');
      }
    } catch (error) {
      console.error('خطأ في حفظ الفئة:', error);
      alert('حدث خطأ في حفظ الفئة');
    }
  };

  // إعادة تعيين النماذج
  const resetItemForm = () => {
    setItemForm({
      name: '',
      nameAr: '',
      description: '',
      descriptionAr: '',
      price: 0,
      category: '',
      categoryAr: '',
      isAvailable: true,
      isHalal: true,
      isVegetarian: false,
      allergens: [],
      image: ''
    });
    setSelectedItem(null);
  };

  const resetCategoryForm = () => {
    setCategoryForm({
      name: '',
      nameAr: '',
      description: '',
      descriptionAr: '',
      isActive: true
    });
  };

  // فتح نموذج التعديل
  const openEditModal = (item: MenuItem) => {
    setSelectedItem(item);
    setItemForm({
      name: item.name,
      nameAr: item.nameAr,
      description: item.description,
      descriptionAr: item.descriptionAr,
      price: item.price,
      category: item.category,
      categoryAr: item.categoryAr,
      isAvailable: item.isAvailable,
      isHalal: item.isHalal,
      isVegetarian: item.isVegetarian,
      allergens: item.allergens,
      image: item.image || ''
    });
    setShowItemModal(true);
  };

  // تصفية العناصر
  const filteredItems = menuItems.filter(item => {
    const matchesSearch = item.nameAr.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         item.descriptionAr.toLowerCase().includes(searchTerm.toLowerCase());
    
    return matchesSearch;
  });

  // قائمة المواد المسببة للحساسية
  const allergenOptions = [
    { value: 'gluten', label: 'الجلوتين' },
    { value: 'dairy', label: 'منتجات الألبان' },
    { value: 'nuts', label: 'المكسرات' },
    { value: 'eggs', label: 'البيض' },
    { value: 'seafood', label: 'المأكولات البحرية' },
    { value: 'soy', label: 'الصويا' },
    { value: 'sesame', label: 'السمسم' }
  ];

  return (
    <ArabicLayout 
      sidebarCollapsed={sidebarCollapsed}
      onSidebarToggle={() => setSidebarCollapsed(!sidebarCollapsed)}
    >
      <div className="space-y-6">
        {/* التنقل العربي */}
        <ArabicNavigation currentPage="menu" />
        
        {/* العنوان والإجراءات */}
        <div className="flex justify-between items-center">
          <div className="flex items-center space-x-3 space-x-reverse">
            <FilmIcon className="h-8 w-8 text-blue-600" />
            <div>
              <h1 className="text-2xl font-bold text-gray-900">
                {t('menu.title')}
              </h1>
              <p className="text-sm text-gray-600">إدارة وجبات البريك المتاحة لطاقم التصوير</p>
            </div>
          </div>
          <div className="flex items-center space-x-3 space-x-reverse">
            <ArabicButton
              variant="outline"
              onClick={() => setShowCategoryModal(true)}
              icon={<TagIcon className="h-4 w-4" />}
            >
              إضافة نوع وجبة
            </ArabicButton>
            <ArabicButton
              variant="primary"
              onClick={() => {
                resetItemForm();
                setShowItemModal(true);
              }}
              icon={<PlusIcon className="h-4 w-4" />}
            >
              إضافة وجبة بريك
            </ArabicButton>
          </div>
        </div>

        {/* البحث والتصفية */}
        <div className="bg-white rounded-lg shadow p-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="md:col-span-2">
              <ArabicInput
                label="البحث في وجبات البريك"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="ابحث عن وجبة أو مطعم..."
                icon={<MagnifyingGlassIcon className="h-4 w-4" />}
              />
            </div>
            <ArabicSelect
              label="نوع الوجبة"
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              options={[
                { value: 'ALL', label: 'جميع الأنواع' },
                ...categories.map(cat => ({ value: cat.name, label: cat.nameAr }))
              ]}
            />
            <ArabicSelect
              label="التوفر"
              value={availabilityFilter}
              onChange={(e) => setAvailabilityFilter(e.target.value)}
              options={[
                { value: 'ALL', label: 'الكل' },
                { value: 'true', label: 'متوفر للبريك' },
                { value: 'false', label: 'غير متوفر' }
              ]}
            />
          </div>
        </div>
        {loading ? (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900 mx-auto"></div>
            <p className="mt-4 text-gray-600">{t('common.loading')}</p>
          </div>
        ) : error ? (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
            {error}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredItems.map((item) => (
              <div key={item.id} className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow">
                {/* صورة العنصر */}
                <div className="h-48 bg-gray-200 relative">
                  {item.image ? (
                    <img
                      src={item.image}
                      alt={item.nameAr}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-gray-400">
                      لا توجد صورة
                    </div>
                  )}
                </div>
                {/* معلومات العنصر */}
                <div className="p-4">
                  <h3 className="text-lg font-semibold text-gray-900">{item.nameAr}</h3>
                  <p className="text-sm text-gray-600">{item.name}</p>
                  <p className="text-gray-700 mt-2">{item.descriptionAr}</p>
                  <div className="mt-2 flex justify-between items-center">
                    <span className="text-lg font-bold text-gray-900">{item.price} ر.س</span>
                    <div className="space-x-2 space-x-reverse">
                      <button
                        onClick={() => handleEditItem(item)}
                        className="text-blue-600 hover:text-blue-800"
                      >
                        تعديل
                      </button>
                      <button
                        onClick={() => handleDeleteItem(item.id)}
                        className="text-red-600 hover:text-red-800"
                      >
                        حذف
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* نافذة إضافة/تعديل عنصر */}
        {showItemModal && (
          <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
            <div className="relative top-10 mx-auto p-5 border w-11/12 md:w-3/4 lg:w-1/2 shadow-lg rounded-md bg-white">
              <div className="mt-3">
                <h3 className="text-lg font-medium text-gray-900 mb-4">
                  {selectedItem ? t('menu.editItem') : t('menu.addItem')}
                </h3>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <ArabicInput
                    label="اسم الوجبة بالعربية"
                    value={itemForm.nameAr}
                    onChange={(e) => setItemForm({...itemForm, nameAr: e.target.value})}
                    placeholder="مثال: كباب مشوي، فراخ بانيه، كشري..."
                    required
                  />
                  <ArabicInput
                    label="اسم الوجبة بالإنجليزية"
                    value={itemForm.name}
                    onChange={(e) => setItemForm({...itemForm, name: e.target.value})}
                    placeholder="English name for the dish"
                    required
                  />
                  <div className="md:col-span-2">
                    <ArabicInput
                      label="وصف الوجبة بالعربية"
                      value={itemForm.descriptionAr}
                      onChange={(e) => setItemForm({...itemForm, descriptionAr: e.target.value})}
                      placeholder="وصف مفصل للوجبة ومكوناتها..."
                      multiline
                      rows={3}
                    />
                  </div>
                  <div className="md:col-span-2">
                    <ArabicInput
                      label="وصف الوجبة بالإنجليزية"
                      value={itemForm.description}
                      onChange={(e) => setItemForm({...itemForm, description: e.target.value})}
                      placeholder="Detailed description of the dish..."
                      multiline
                      rows={3}
                    />
                  </div>
                  <ArabicInput
                    label="سعر الوجبة (ج.م)"
                    type="number"
                    value={itemForm.price}
                    onChange={(e) => setItemForm({...itemForm, price: parseFloat(e.target.value) || 0})}
                    placeholder="0.00"
                    required
                  />
                  <ArabicSelect
                    label="نوع الوجبة"
                    value={itemForm.category}
                    onChange={(e) => {
                      const selectedCategory = categories.find(cat => cat.name === e.target.value);
                      setItemForm({
                        ...itemForm, 
                        category: e.target.value,
                        categoryAr: selectedCategory?.nameAr || ''
                      });
                    }}
                    options={categories.map(cat => ({ value: cat.name, label: cat.nameAr }))}
                    required
                  />
                  <ArabicInput
                    label="رابط صورة الوجبة"
                    value={itemForm.image}
                    onChange={(e) => setItemForm({...itemForm, image: e.target.value})}
                    placeholder="https://example.com/image.jpg"
                  />
                  
                  {/* خيارات إضافية */}
                  <div className="md:col-span-2 space-y-3">
                    <div className="flex items-center space-x-3 space-x-reverse">
                      <input
                        type="checkbox"
                        id="isAvailable"
                        checked={itemForm.isAvailable}
                        onChange={(e) => setItemForm({...itemForm, isAvailable: e.target.checked})}
                        className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                      />
                      <label htmlFor="isAvailable" className="text-sm text-gray-700">
                        {t('menu.available')} للبريك
                      </label>
                    </div>
                    <div className="flex items-center space-x-3 space-x-reverse">
                      <input
                        type="checkbox"
                        id="isHalal"
                        checked={itemForm.isHalal}
                        onChange={(e) => setItemForm({...itemForm, isHalal: e.target.checked})}
                        className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                      />
                      <label htmlFor="isHalal" className="text-sm text-gray-700">
                        حلال (مناسب للمسلمين)
                      </label>
                    </div>
                    <div className="flex items-center space-x-3 space-x-reverse">
                      <input
                        type="checkbox"
                        id="isVegetarian"
                        checked={itemForm.isVegetarian}
                        onChange={(e) => setItemForm({...itemForm, isVegetarian: e.target.checked})}
                        className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                      />
                      <label htmlFor="isVegetarian" className="text-sm text-gray-700">
                        نباتي (بدون لحوم)
                      </label>
                    </div>
                  </div>

                  {/* المواد المسببة للحسا��ية */}
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      المواد المسببة للحساسية
                    </label>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                      {allergenOptions.map(allergen => (
                        <div key={allergen.value} className="flex items-center space-x-2 space-x-reverse">
                          <input
                            type="checkbox"
                            id={allergen.value}
                            checked={itemForm.allergens.includes(allergen.value)}
                            onChange={(e) => {
                              if (e.target.checked) {
                                setItemForm({
                                  ...itemForm,
                                  allergens: [...itemForm.allergens, allergen.value]
                                });
                              } else {
                                setItemForm({
                                  ...itemForm,
                                  allergens: itemForm.allergens.filter(a => a !== allergen.value)
                                });
                              }
                            }}
                            className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                          />
                          <label htmlFor={allergen.value} className="text-sm text-gray-700">
                            {allergen.label}
                          </label>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="flex justify-end space-x-3 space-x-reverse mt-6">
                  <ArabicButton
                    variant="outline"
                    onClick={() => {
                      setShowItemModal(false);
                      resetItemForm();
                    }}
                  >
                    {t('common.cancel')}
                  </ArabicButton>
                  <ArabicButton
                    variant="primary"
                    onClick={saveMenuItem}
                  >
                    {t('common.save')}
                  </ArabicButton>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* نافذة إضافة فئة */}
        {showCategoryModal && (
          <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
            <div className="relative top-20 mx-auto p-5 border w-11/12 md:w-1/2 shadow-lg rounded-md bg-white">
              <div className="mt-3">
                <h3 className="text-lg font-medium text-gray-900 mb-4">
                  {t('menu.addCategory')}
                </h3>

                <div className="space-y-4">
                  <ArabicInput
                    label="اسم الفئة بالعربية"
                    value={categoryForm.nameAr}
                    onChange={(e) => setCategoryForm({...categoryForm, nameAr: e.target.value})}
                    required
                  />
                  <ArabicInput
                    label="اسم الفئة بالإنجليزية"
                    value={categoryForm.name}
                    onChange={(e) => setCategoryForm({...categoryForm, name: e.target.value})}
                    required
                  />
                  <ArabicInput
                    label="الوصف بالعربية"
                    value={categoryForm.descriptionAr}
                    onChange={(e) => setCategoryForm({...categoryForm, descriptionAr: e.target.value})}
                    multiline
                    rows={3}
                  />
                  <div className="flex items-center space-x-3 space-x-reverse">
                    <input
                      type="checkbox"
                      id="categoryActive"
                      checked={categoryForm.isActive}
                      onChange={(e) => setCategoryForm({...categoryForm, isActive: e.target.checked})}
                      className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                    <label htmlFor="categoryActive" className="text-sm text-gray-700">
                      فئة نشطة
                    </label>
                  </div>
                </div>

                <div className="flex justify-end space-x-3 space-x-reverse mt-6">
                  <ArabicButton
                    variant="outline"
                    onClick={() => {
                      setShowCategoryModal(false);
                      resetCategoryForm();
                    }}
                  >
                    {t('common.cancel')}
                  </ArabicButton>
                  <ArabicButton
                    variant="primary"
                    onClick={saveCategory}
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

export default ArabicMenu;