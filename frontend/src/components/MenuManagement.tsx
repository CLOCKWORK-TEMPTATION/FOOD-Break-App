/**
 * إدارة قائمة المطعم
 * Restaurant Menu Management Component
 */

import { useState, useEffect } from 'react';
import { menuService, MenuItem } from '../services/dashboardService';
import styles from './MenuManagement.module.css';

interface MenuManagementProps {
  restaurantId: string;
  restaurantName: string;
  onClose: () => void;
}

export default function MenuManagement({ restaurantId, restaurantName, onClose }: MenuManagementProps) {
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingItem, setEditingItem] = useState<MenuItem | null>(null);
  const [isAddingNew, setIsAddingNew] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');

  // نموذج العنصر الجديد
  const [formData, setFormData] = useState<Partial<MenuItem>>({
    name: '',
    description: '',
    price: 0,
    category: '',
    isAvailable: true,
    preparationTime: 15,
  });

  useEffect(() => {
    loadMenuItems();
  }, [restaurantId]);

  const loadMenuItems = async () => {
    try {
      setLoading(true);
      const items = await menuService.getMenuItems(restaurantId);
      setMenuItems(items);
    } catch (error) {
      console.error('فشل تحميل القائمة:', error);
      // بيانات تجريبية في حالة الفشل
      setMenuItems([
        {
          id: '1',
          restaurantId,
          name: 'شاورما لحم',
          description: 'شاورما لحم طازجة مع الخضار',
          price: 25,
          category: 'الأطباق الرئيسية',
          isAvailable: true,
          preparationTime: 15,
        },
        {
          id: '2',
          restaurantId,
          name: 'فتوش',
          description: 'سلطة فتوش بالخبز المحمص',
          price: 15,
          category: 'المقبلات',
          isAvailable: true,
          preparationTime: 10,
        },
        {
          id: '3',
          restaurantId,
          name: 'عصير برتقال',
          description: 'عصير برتقال طبيعي طازج',
          price: 10,
          category: 'المشروبات',
          isAvailable: false,
          preparationTime: 5,
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  // الحصول على الفئات الفريدة
  const categories = ['all', ...new Set(menuItems.map(item => item.category))];

  // تصفية العناصر
  const filteredItems = menuItems.filter(item => {
    const matchesCategory = selectedCategory === 'all' || item.category === selectedCategory;
    const matchesSearch = item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.description?.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  const handleSaveItem = async () => {
    try {
      if (editingItem) {
        await menuService.updateMenuItem(editingItem.id, formData);
      } else {
        await menuService.createMenuItem(restaurantId, formData);
      }
      await loadMenuItems();
      setEditingItem(null);
      setIsAddingNew(false);
      resetForm();
    } catch (error) {
      console.error('فشل حفظ العنصر:', error);
      alert('فشل حفظ العنصر');
    }
  };

  const handleDeleteItem = async (itemId: string) => {
    if (!confirm('هل أنت متأكد من حذف هذا العنصر؟')) return;
    try {
      await menuService.deleteMenuItem(itemId);
      await loadMenuItems();
    } catch (error) {
      console.error('فشل حذف العنصر:', error);
      alert('فشل حذف العنصر');
    }
  };

  const handleToggleAvailability = async (item: MenuItem) => {
    try {
      await menuService.toggleAvailability(item.id);
      setMenuItems(prev =>
        prev.map(i => (i.id === item.id ? { ...i, isAvailable: !i.isAvailable } : i))
      );
    } catch (error) {
      console.error('فشل تحديث التوفر:', error);
    }
  };

  const resetForm = () => {
    setFormData({
      name: '',
      description: '',
      price: 0,
      category: '',
      isAvailable: true,
      preparationTime: 15,
    });
  };

  const startEditing = (item: MenuItem) => {
    setEditingItem(item);
    setFormData({
      name: item.name,
      description: item.description,
      price: item.price,
      category: item.category,
      isAvailable: item.isAvailable,
      preparationTime: item.preparationTime,
    });
    setIsAddingNew(false);
  };

  const startAddingNew = () => {
    setIsAddingNew(true);
    setEditingItem(null);
    resetForm();
  };

  return (
    <div className={styles.overlay}>
      <div className={styles.modal}>
        {/* Header */}
        <div className={styles.header}>
          <div>
            <h2>إدارة قائمة الطعام</h2>
            <p className={styles.restaurantName}>{restaurantName}</p>
          </div>
          <button className={styles.closeBtn} onClick={onClose}>✕</button>
        </div>

        {/* Controls */}
        <div className={styles.controls}>
          <div className={styles.searchBar}>
            <input
              type="text"
              placeholder="ابحث في القائمة..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className={styles.searchInput}
            />
          </div>
          <div className={styles.categoryFilter}>
            {categories.map(cat => (
              <button
                key={cat}
                className={`${styles.categoryBtn} ${selectedCategory === cat ? styles.active : ''}`}
                onClick={() => setSelectedCategory(cat)}
              >
                {cat === 'all' ? 'الكل' : cat}
              </button>
            ))}
          </div>
          <button className={styles.addBtn} onClick={startAddingNew}>
            + إضافة عنصر جديد
          </button>
        </div>

        {/* Content */}
        <div className={styles.content}>
          {/* Form */}
          {(isAddingNew || editingItem) && (
            <div className={styles.form}>
              <h3>{editingItem ? 'تعديل العنصر' : 'إضافة عنصر جديد'}</h3>
              <div className={styles.formGrid}>
                <div className={styles.formGroup}>
                  <label>اسم العنصر *</label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="مثال: شاورما دجاج"
                  />
                </div>
                <div className={styles.formGroup}>
                  <label>السعر (ريال) *</label>
                  <input
                    type="number"
                    value={formData.price}
                    onChange={(e) => setFormData({ ...formData, price: parseFloat(e.target.value) })}
                    min="0"
                    step="0.5"
                  />
                </div>
                <div className={styles.formGroup}>
                  <label>الفئة *</label>
                  <input
                    type="text"
                    value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                    placeholder="مثال: الأطباق الرئيسية"
                    list="categories"
                  />
                  <datalist id="categories">
                    {categories.filter(c => c !== 'all').map(cat => (
                      <option key={cat} value={cat} />
                    ))}
                  </datalist>
                </div>
                <div className={styles.formGroup}>
                  <label>وقت التحضير (دقيقة)</label>
                  <input
                    type="number"
                    value={formData.preparationTime}
                    onChange={(e) => setFormData({ ...formData, preparationTime: parseInt(e.target.value) })}
                    min="1"
                  />
                </div>
                <div className={styles.formGroupFull}>
                  <label>الوصف</label>
                  <textarea
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    placeholder="وصف مختصر للعنصر..."
                    rows={3}
                  />
                </div>
                <div className={styles.formGroup}>
                  <label className={styles.checkbox}>
                    <input
                      type="checkbox"
                      checked={formData.isAvailable}
                      onChange={(e) => setFormData({ ...formData, isAvailable: e.target.checked })}
                    />
                    متوفر
                  </label>
                </div>
              </div>
              <div className={styles.formActions}>
                <button
                  className={styles.cancelBtn}
                  onClick={() => {
                    setIsAddingNew(false);
                    setEditingItem(null);
                    resetForm();
                  }}
                >
                  إلغاء
                </button>
                <button className={styles.saveBtn} onClick={handleSaveItem}>
                  {editingItem ? 'حفظ التعديلات' : 'إضافة العنصر'}
                </button>
              </div>
            </div>
          )}

          {/* Menu Items List */}
          {loading ? (
            <div className={styles.loading}>جاري التحميل...</div>
          ) : (
            <div className={styles.menuList}>
              {filteredItems.length === 0 ? (
                <div className={styles.empty}>
                  <p>لا توجد عناصر</p>
                </div>
              ) : (
                filteredItems.map(item => (
                  <div key={item.id} className={`${styles.menuItem} ${!item.isAvailable ? styles.unavailable : ''}`}>
                    <div className={styles.itemInfo}>
                      <div className={styles.itemHeader}>
                        <h4>{item.name}</h4>
                        <span className={styles.category}>{item.category}</span>
                      </div>
                      {item.description && (
                        <p className={styles.itemDescription}>{item.description}</p>
                      )}
                      <div className={styles.itemMeta}>
                        <span className={styles.price}>{item.price} ريال</span>
                        <span className={styles.prepTime}>⏱ {item.preparationTime} دقيقة</span>
                        <span className={`${styles.availability} ${item.isAvailable ? styles.available : styles.notAvailable}`}>
                          {item.isAvailable ? '✓ متوفر' : '✗ غير متوفر'}
                        </span>
                      </div>
                    </div>
                    <div className={styles.itemActions}>
                      <button
                        className={styles.toggleBtn}
                        onClick={() => handleToggleAvailability(item)}
                        title={item.isAvailable ? 'تعطيل' : 'تفعيل'}
                      >
                        {item.isAvailable ? '🔴' : '🟢'}
                      </button>
                      <button
                        className={styles.editBtn}
                        onClick={() => startEditing(item)}
                      >
                        ✏️
                      </button>
                      <button
                        className={styles.deleteBtn}
                        onClick={() => handleDeleteItem(item.id)}
                      >
                        🗑️
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
