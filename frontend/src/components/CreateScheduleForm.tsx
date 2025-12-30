/**
 * نموذج إنشاء جدول تصوير جديد
 * Create Schedule Form Component
 */

import React, { useState } from 'react';
import { Calendar, Clock, MapPin, Plus, Trash2, Save, X } from 'lucide-react';

interface BreakScheduleInput {
  breakType: 'BREAKFAST' | 'LUNCH' | 'DINNER' | 'SNACK' | 'TEA_BREAK' | 'MEAL_BREAK';
  breakName: string;
  scheduledStart: string;
  scheduledEnd: string;
  orderWindowStart?: string;
  orderWindowEnd?: string;
}

interface CreateScheduleFormProps {
  projectId: string;
  onClose: () => void;
  onSuccess: (schedule: any) => void;
}

const CreateScheduleForm: React.FC<CreateScheduleFormProps> = ({
  projectId,
  onClose,
  onSuccess
}) => {
  const [formData, setFormData] = useState({
    scheduleName: '',
    scheduleDate: '',
    callTime: '',
    wrapTime: '',
    location: '',
    notes: '',
    weatherConditions: ''
  });

  const [breakSchedules, setBreakSchedules] = useState<BreakScheduleInput[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // خيارات أنواع البريك
  const breakTypeOptions = [
    { value: 'BREAKFAST', label: 'إفطار' },
    { value: 'LUNCH', label: 'غداء' },
    { value: 'DINNER', label: 'عشاء' },
    { value: 'SNACK', label: 'وجبة خفيفة' },
    { value: 'TEA_BREAK', label: 'استراحة شاي' },
    { value: 'MEAL_BREAK', label: 'استراحة وجبة' }
  ];

  // تحديث بيانات النموذج
  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  // إضافة بريك جديد
  const addBreakSchedule = () => {
    setBreakSchedules(prev => [
      ...prev,
      {
        breakType: 'LUNCH',
        breakName: '',
        scheduledStart: '',
        scheduledEnd: '',
        orderWindowStart: '',
        orderWindowEnd: ''
      }
    ]);
  };

  // حذف بريك
  const removeBreakSchedule = (index: number) => {
    setBreakSchedules(prev => prev.filter((_, i) => i !== index));
  };

  // تحديث بيانات البريك
  const updateBreakSchedule = (index: number, field: string, value: string) => {
    setBreakSchedules(prev => prev.map((item, i) => 
      i === index ? { ...item, [field]: value } : item
    ));
  };

  // حساب نافذة الطلب التلقائية
  const calculateOrderWindow = (breakStart: string) => {
    if (!breakStart) return { start: '', end: '' };
    
    const [hours, minutes] = breakStart.split(':').map(Number);
    const startMinutes = hours * 60 + minutes;
    
    // نافذة الطلب تبدأ قبل ساعتين من البريك وتنتهي قبل 30 دقيقة
    const orderStartMinutes = startMinutes - 120; // قبل ساعتين
    const orderEndMinutes = startMinutes - 30;    // قبل 30 دقيقة
    
    const formatTime = (totalMinutes: number) => {
      const h = Math.floor(totalMinutes / 60) % 24;
      const m = totalMinutes % 60;
      return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}`;
    };
    
    return {
      start: formatTime(Math.max(0, orderStartMinutes)),
      end: formatTime(Math.max(0, orderEndMinutes))
    };
  };

  // التحقق من صحة البيانات
  const validateForm = () => {
    if (!formData.scheduleName.trim()) {
      setError('اسم الجدول مطلوب');
      return false;
    }
    
    if (!formData.scheduleDate) {
      setError('تاريخ التصوير مطلوب');
      return false;
    }
    
    if (!formData.callTime) {
      setError('وقت الحضور مطلوب');
      return false;
    }

    // التحقق من البريكات
    for (let i = 0; i < breakSchedules.length; i++) {
      const breakItem = breakSchedules[i];
      
      if (!breakItem.breakName.trim()) {
        setError(`اسم البريك رقم ${i + 1} مطلوب`);
        return false;
      }
      
      if (!breakItem.scheduledStart || !breakItem.scheduledEnd) {
        setError(`أوقات البريك رقم ${i + 1} مطلوبة`);
        return false;
      }
      
      // التحقق من أن وقت النهاية بعد وقت البداية
      const startTime = breakItem.scheduledStart.split(':').map(Number);
      const endTime = breakItem.scheduledEnd.split(':').map(Number);
      const startMinutes = startTime[0] * 60 + startTime[1];
      const endMinutes = endTime[0] * 60 + endTime[1];
      
      if (endMinutes <= startMinutes) {
        setError(`وقت انتهاء البريك رقم ${i + 1} يجب أن يكون بعد وقت البداية`);
        return false;
      }
    }

    return true;
  };

  // إرسال النموذج
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) return;
    
    setLoading(true);
    setError(null);
    
    try {
      const scheduleData = {
        ...formData,
        breakSchedules: breakSchedules.map(breakItem => {
          const orderWindow = calculateOrderWindow(breakItem.scheduledStart);
          return {
            ...breakItem,
            orderWindowStart: breakItem.orderWindowStart || orderWindow.start,
            orderWindowEnd: breakItem.orderWindowEnd || orderWindow.end
          };
        })
      };

      const response = await fetch(`/api/schedules/projects/${projectId}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify(scheduleData)
      });

      if (response.ok) {
        const result = await response.json();
        onSuccess(result.data);
        onClose();
      } else {
        const errorData = await response.json();
        setError(errorData.error?.message || 'فشل في إنشاء الجدول');
      }
    } catch (err) {
      setError('خطأ في الاتصال بالخادم');
      console.error('خطأ في إنشاء الجدول:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50" dir="rtl">
      <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full mx-4 max-h-[90vh] overflow-y-auto">
        {/* رأس النموذج */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-gray-900 flex items-center gap-2">
            <Calendar className="w-5 h-5 text-blue-600" />
            إنشاء جدول تصوير جديد
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {error && (
            <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
              {error}
            </div>
          )}

          {/* معلومات الجدول الأساسية */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                اسم الجدول *
              </label>
              <input
                type="text"
                value={formData.scheduleName}
                onChange={(e) => handleInputChange('scheduleName', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="مثال: تصوير المشهد الأول"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                تاريخ التصوير *
              </label>
              <input
                type="date"
                value={formData.scheduleDate}
                onChange={(e) => handleInputChange('scheduleDate', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                وقت الحضور *
              </label>
              <input
                type="time"
                value={formData.callTime}
                onChange={(e) => handleInputChange('callTime', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                وقت الانتهاء المتوقع
              </label>
              <input
                type="time"
                value={formData.wrapTime}
                onChange={(e) => handleInputChange('wrapTime', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                موقع التصوير
              </label>
              <input
                type="text"
                value={formData.location}
                onChange={(e) => handleInputChange('location', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="مثال: استوديو مصر، المعادي"
              />
            </div>
          </div>

          {/* فترات البريك */}
          <div>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-medium text-gray-900">فترات البريك</h3>
              <button
                type="button"
                onClick={addBreakSchedule}
                className="bg-green-600 text-white px-3 py-2 rounded-md hover:bg-green-700 flex items-center gap-2"
              >
                <Plus className="w-4 h-4" />
                إضافة بريك
              </button>
            </div>

            <div className="space-y-4">
              {breakSchedules.map((breakItem, index) => (
                <div key={index} className="border border-gray-200 rounded-lg p-4">
                  <div className="flex items-center justify-between mb-4">
                    <h4 className="font-medium text-gray-900">البريك رقم {index + 1}</h4>
                    <button
                      type="button"
                      onClick={() => removeBreakSchedule(index)}
                      className="text-red-600 hover:text-red-800"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        نوع البريك
                      </label>
                      <select
                        value={breakItem.breakType}
                        onChange={(e) => updateBreakSchedule(index, 'breakType', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      >
                        {breakTypeOptions.map(option => (
                          <option key={option.value} value={option.value}>
                            {option.label}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        اسم البريك
                      </label>
                      <input
                        type="text"
                        value={breakItem.breakName}
                        onChange={(e) => updateBreakSchedule(index, 'breakName', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="مثال: غداء الطاقم"
                      />
                    </div>

                    <div></div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        وقت البداية
                      </label>
                      <input
                        type="time"
                        value={breakItem.scheduledStart}
                        onChange={(e) => updateBreakSchedule(index, 'scheduledStart', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        وقت النهاية
                      </label>
                      <input
                        type="time"
                        value={breakItem.scheduledEnd}
                        onChange={(e) => updateBreakSchedule(index, 'scheduledEnd', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>

                    <div></div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        بداية نافذة الطلب
                      </label>
                      <input
                        type="time"
                        value={breakItem.orderWindowStart}
                        onChange={(e) => updateBreakSchedule(index, 'orderWindowStart', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="تلقائي: قبل ساعتين"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        نهاية نافذة الطلب
                      </label>
                      <input
                        type="time"
                        value={breakItem.orderWindowEnd}
                        onChange={(e) => updateBreakSchedule(index, 'orderWindowEnd', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="تلقائي: قبل 30 دقيقة"
                      />
                    </div>
                  </div>
                </div>
              ))}

              {breakSchedules.length === 0 && (
                <div className="text-center py-8 text-gray-500">
                  لا توجد فترات بريك مضافة
                  <br />
                  <button
                    type="button"
                    onClick={addBreakSchedule}
                    className="text-blue-600 hover:text-blue-800 mt-2"
                  >
                    إضافة أول بريك
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* معلومات إضافية */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                الأحوال الجوية المتوقعة
              </label>
              <input
                type="text"
                value={formData.weatherConditions}
                onChange={(e) => handleInputChange('weatherConditions', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="مثال: مشمس، 25 درجة"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                ملاحظات
              </label>
              <textarea
                value={formData.notes}
                onChange={(e) => handleInputChange('notes', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                rows={3}
                placeholder="ملاحظات إضافية حول الجدول..."
              />
            </div>
          </div>

          {/* أزرار الإجراءات */}
          <div className="flex justify-end gap-3 pt-6 border-t border-gray-200">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200"
              disabled={loading}
            >
              إلغاء
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 flex items-center gap-2 disabled:opacity-50"
              disabled={loading}
            >
              {loading ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  جاري الإنشاء...
                </>
              ) : (
                <>
                  <Save className="w-4 h-4" />
                  إنشاء الجدول
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CreateScheduleForm;