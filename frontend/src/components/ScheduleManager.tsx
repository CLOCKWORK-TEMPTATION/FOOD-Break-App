/**
 * مدير جداول التصوير
 * Schedule Manager Component
 */

import React, { useState, useEffect } from 'react';
import { Calendar, Clock, MapPin, Users, AlertTriangle, CheckCircle, XCircle, Play, Square } from 'lucide-react';

interface BreakSchedule {
  id: string;
  breakType: 'BREAKFAST' | 'LUNCH' | 'DINNER' | 'SNACK' | 'TEA_BREAK' | 'MEAL_BREAK';
  breakName: string;
  scheduledStart: string;
  scheduledEnd: string;
  actualStart?: string;
  actualEnd?: string;
  orderWindowStart?: string;
  orderWindowEnd?: string;
  isOrderWindowOpen: boolean;
  status: 'SCHEDULED' | 'ACTIVE' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED' | 'DELAYED';
}

interface ShootingSchedule {
  id: string;
  scheduleName: string;
  scheduleDate: string;
  callTime: string;
  wrapTime?: string;
  actualWrapTime?: string;
  status: 'SCHEDULED' | 'IN_PROGRESS' | 'ON_BREAK' | 'DELAYED' | 'COMPLETED' | 'CANCELLED' | 'POSTPONED';
  delayMinutes?: number;
  delayReason?: string;
  location?: string;
  coordinates?: {
    latitude: number;
    longitude: number;
  };
  notes?: string;
  weatherConditions?: string;
  breakSchedules: BreakSchedule[];
  project: {
    id: string;
    name: string;
    nameArabic?: string;
    location?: string;
  };
}

interface ScheduleManagerProps {
  projectId: string;
  userRole: string;
  onScheduleUpdate?: (schedule: ShootingSchedule) => void;
}

const ScheduleManager: React.FC<ScheduleManagerProps> = ({ 
  projectId, 
  userRole, 
  onScheduleUpdate 
}) => {
  const [schedules, setSchedules] = useState<ShootingSchedule[]>([]);
  const [todaySchedule, setTodaySchedule] = useState<ShootingSchedule | null>(null);
  const [activeBreaks, setActiveBreaks] = useState<BreakSchedule[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedSchedule, setSelectedSchedule] = useState<ShootingSchedule | null>(null);
  const [showCreateForm, setShowCreateForm] = useState(false);

  // تحميل البيانات
  useEffect(() => {
    loadScheduleData();
    // تحديث البيانات كل دقيقة
    const interval = setInterval(loadScheduleData, 60000);
    return () => clearInterval(interval);
  }, [projectId]);

  const loadScheduleData = async () => {
    try {
      setLoading(true);
      
      // تحميل جميع الجداول
      const schedulesResponse = await fetch(`/api/schedules/projects/${projectId}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      
      if (schedulesResponse.ok) {
        const schedulesData = await schedulesResponse.json();
        setSchedules(schedulesData.data);
      }

      // تحميل جدول اليوم
      const todayResponse = await fetch(`/api/schedules/projects/${projectId}/today`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      
      if (todayResponse.ok) {
        const todayData = await todayResponse.json();
        setTodaySchedule(todayData.data);
      }

      // تحميل البريكات النشطة
      const breaksResponse = await fetch(`/api/schedules/projects/${projectId}/active-breaks`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      
      if (breaksResponse.ok) {
        const breaksData = await breaksResponse.json();
        setActiveBreaks(breaksData.data);
      }

      setError(null);
    } catch (err) {
      setError('فشل في تحميل بيانات الجداول');
      console.error('خطأ في تحميل الجداول:', err);
    } finally {
      setLoading(false);
    }
  };

  // بدء بريك
  const startBreak = async (breakId: string) => {
    try {
      const response = await fetch(`/api/schedules/breaks/${breakId}/start`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });

      if (response.ok) {
        await loadScheduleData();
        // إشعار نجاح
        alert('تم بدء فترة البريك بنجاح - يمكن للطاقم الآن طلب الوجبات');
      } else {
        const errorData = await response.json();
        alert(errorData.error?.message || 'فشل في بدء البريك');
      }
    } catch (err) {
      alert('خطأ في بدء البريك');
      console.error('خطأ في بدء البريك:', err);
    }
  };

  // إنهاء بريك
  const endBreak = async (breakId: string) => {
    try {
      const response = await fetch(`/api/schedules/breaks/${breakId}/end`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });

      if (response.ok) {
        await loadScheduleData();
        alert('تم إنهاء فترة البريك - لا يمكن طلب المزيد من الوجبات');
      } else {
        const errorData = await response.json();
        alert(errorData.error?.message || 'فشل في إنهاء البريك');
      }
    } catch (err) {
      alert('خطأ في إنهاء البريك');
      console.error('خطأ في إنهاء البريك:', err);
    }
  };

  // ترجمة حالة الجدول
  const getStatusText = (status: string) => {
    const statusMap: { [key: string]: string } = {
      'SCHEDULED': 'مجدول',
      'IN_PROGRESS': 'قيد التنفيذ',
      'ON_BREAK': 'في فترة راحة',
      'DELAYED': 'متأخر',
      'COMPLETED': 'مكتمل',
      'CANCELLED': 'ملغي',
      'POSTPONED': 'مؤجل'
    };
    return statusMap[status] || status;
  };

  // ترجمة نوع البريك
  const getBreakTypeText = (breakType: string) => {
    const breakTypeMap: { [key: string]: string } = {
      'BREAKFAST': 'إفطار',
      'LUNCH': 'غداء',
      'DINNER': 'عشاء',
      'SNACK': 'وجبة خفيفة',
      'TEA_BREAK': 'استراحة شاي',
      'MEAL_BREAK': 'استراحة وجبة'
    };
    return breakTypeMap[breakType] || breakType;
  };

  // لون حالة الجدول
  const getStatusColor = (status: string) => {
    const colorMap: { [key: string]: string } = {
      'SCHEDULED': 'text-blue-600 bg-blue-100',
      'IN_PROGRESS': 'text-green-600 bg-green-100',
      'ON_BREAK': 'text-yellow-600 bg-yellow-100',
      'DELAYED': 'text-red-600 bg-red-100',
      'COMPLETED': 'text-gray-600 bg-gray-100',
      'CANCELLED': 'text-red-600 bg-red-100',
      'POSTPONED': 'text-orange-600 bg-orange-100'
    };
    return colorMap[status] || 'text-gray-600 bg-gray-100';
  };

  // التحقق من صلاحيات الإدارة
  const canManageSchedules = ['ADMIN', 'PRODUCER', 'MANAGER'].includes(userRole);
  const canControlBreaks = ['ADMIN', 'PRODUCER', 'MANAGER', 'LEAD'].includes(userRole);

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        <span className="mr-3 text-gray-600">جاري تحميل الجداول...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6" dir="rtl">
      {/* رأس الصفحة */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">جداول التصوير</h2>
          <p className="text-gray-600">إدارة ومتابعة جداول التصوير وفترات البريك</p>
        </div>
        {canManageSchedules && (
          <button
            onClick={() => setShowCreateForm(true)}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 flex items-center gap-2"
          >
            <Calendar className="w-4 h-4" />
            إنشاء جدول جديد
          </button>
        )}
      </div>

      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
          {error}
        </div>
      )}

      {/* جدول اليوم */}
      {todaySchedule && (
        <div className="bg-white rounded-lg shadow-md p-6 border-r-4 border-blue-500">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-xl font-semibold text-gray-900 flex items-center gap-2">
              <Calendar className="w-5 h-5 text-blue-600" />
              جدول اليوم - {todaySchedule.scheduleName}
            </h3>
            <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(todaySchedule.status)}`}>
              {getStatusText(todaySchedule.status)}
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4 text-gray-500" />
              <span className="text-sm text-gray-600">وقت الحضور:</span>
              <span className="font-medium">{todaySchedule.callTime}</span>
            </div>
            {todaySchedule.wrapTime && (
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4 text-gray-500" />
                <span className="text-sm text-gray-600">وقت الانتهاء:</span>
                <span className="font-medium">{todaySchedule.wrapTime}</span>
              </div>
            )}
            {todaySchedule.location && (
              <div className="flex items-center gap-2">
                <MapPin className="w-4 h-4 text-gray-500" />
                <span className="text-sm text-gray-600">الموقع:</span>
                <span className="font-medium">{todaySchedule.location}</span>
              </div>
            )}
          </div>

          {todaySchedule.delayMinutes && todaySchedule.delayMinutes > 0 && (
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-4">
              <div className="flex items-center gap-2">
                <AlertTriangle className="w-5 h-5 text-yellow-600" />
                <span className="font-medium text-yellow-800">
                  تأخير في الجدول: {todaySchedule.delayMinutes} دقيقة
                </span>
              </div>
              {todaySchedule.delayReason && (
                <p className="text-yellow-700 mt-2">{todaySchedule.delayReason}</p>
              )}
            </div>
          )}

          {/* فترات البريك */}
          <div>
            <h4 className="font-semibold text-gray-900 mb-3">فترات البريك</h4>
            <div className="space-y-3">
              {todaySchedule.breakSchedules.map((breakItem) => (
                <div
                  key={breakItem.id}
                  className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                >
                  <div className="flex items-center gap-3">
                    <div className={`w-3 h-3 rounded-full ${
                      breakItem.status === 'ACTIVE' ? 'bg-green-500' :
                      breakItem.status === 'COMPLETED' ? 'bg-gray-500' :
                      breakItem.status === 'DELAYED' ? 'bg-red-500' :
                      'bg-blue-500'
                    }`}></div>
                    <div>
                      <div className="font-medium">{breakItem.breakName}</div>
                      <div className="text-sm text-gray-600">
                        {getBreakTypeText(breakItem.breakType)} • 
                        {breakItem.scheduledStart} - {breakItem.scheduledEnd}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    {breakItem.isOrderWindowOpen && (
                      <span className="bg-green-100 text-green-800 px-2 py-1 rounded text-xs font-medium">
                        نافذة الطلب مفتوحة
                      </span>
                    )}
                    
                    {canControlBreaks && (
                      <div className="flex gap-1">
                        {breakItem.status === 'SCHEDULED' && (
                          <button
                            onClick={() => startBreak(breakItem.id)}
                            className="bg-green-600 text-white p-1 rounded hover:bg-green-700"
                            title="بدء البريك"
                          >
                            <Play className="w-4 h-4" />
                          </button>
                        )}
                        {breakItem.status === 'ACTIVE' && (
                          <button
                            onClick={() => endBreak(breakItem.id)}
                            className="bg-red-600 text-white p-1 rounded hover:bg-red-700"
                            title="إنهاء البريك"
                          >
                            <Square className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* البريكات النشطة */}
      {activeBreaks.length > 0 && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-4">
          <h3 className="font-semibold text-green-800 mb-3 flex items-center gap-2">
            <CheckCircle className="w-5 h-5" />
            البريكات النشطة ({activeBreaks.length})
          </h3>
          <div className="space-y-2">
            {activeBreaks.map((breakItem) => (
              <div key={breakItem.id} className="flex items-center justify-between">
                <span className="text-green-700">
                  {breakItem.breakName} - {breakItem.schedule?.project?.name}
                </span>
                <span className="bg-green-100 text-green-800 px-2 py-1 rounded text-sm">
                  يمكن الطلب الآن
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* قائمة الجداول */}
      <div className="bg-white rounded-lg shadow-md">
        <div className="p-6 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900">جميع الجداول</h3>
        </div>
        <div className="divide-y divide-gray-200">
          {schedules.length === 0 ? (
            <div className="p-6 text-center text-gray-500">
              لا توجد جداول تصوير
            </div>
          ) : (
            schedules.map((schedule) => (
              <div
                key={schedule.id}
                className="p-6 hover:bg-gray-50 cursor-pointer"
                onClick={() => setSelectedSchedule(schedule)}
              >
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="font-medium text-gray-900">{schedule.scheduleName}</h4>
                    <div className="flex items-center gap-4 mt-1 text-sm text-gray-600">
                      <span>{new Date(schedule.scheduleDate).toLocaleDateString('ar-EG')}</span>
                      <span>{schedule.callTime}</span>
                      {schedule.location && <span>{schedule.location}</span>}
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(schedule.status)}`}>
                      {getStatusText(schedule.status)}
                    </span>
                    <span className="text-sm text-gray-500">
                      {schedule.breakSchedules.length} بريك
                    </span>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};

export default ScheduleManager;