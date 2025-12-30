/**
 * صفحة جداول التصوير
 * Schedule Management Page
 */

import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import ScheduleManager from '../components/ScheduleManager';
import CreateScheduleForm from '../components/CreateScheduleForm';
import { Calendar, Settings, BarChart3, Clock, Users } from 'lucide-react';

interface SchedulePageProps {
  userRole?: string;
}

const SchedulePage: React.FC<SchedulePageProps> = ({ userRole = 'REGULAR' }) => {
  const { projectId } = useParams<{ projectId: string }>();
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [activeTab, setActiveTab] = useState<'schedules' | 'analytics' | 'settings'>('schedules');
  const [scheduleStats, setScheduleStats] = useState<any>(null);

  // تحميل إحصائيات الجداول
  useEffect(() => {
    if (projectId && activeTab === 'analytics') {
      loadScheduleStats();
    }
  }, [projectId, activeTab]);

  const loadScheduleStats = async () => {
    try {
      const response = await fetch(`/api/schedules/projects/${projectId}/report`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        setScheduleStats(data.data.statistics);
      }
    } catch (error) {
      console.error('خطأ في تحميل إحصائيات الجداول:', error);
    }
  };

  const handleScheduleCreated = (newSchedule: any) => {
    setShowCreateForm(false);
    // يمكن إضافة تحديث للقائمة هنا
  };

  if (!projectId) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center" dir="rtl">
        <div className="text-center">
          <Calendar className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-900 mb-2">لم يتم تحديد المشروع</h2>
          <p className="text-gray-600">يرجى اختيار مشروع لعرض جداول التصوير</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50" dir="rtl">
      {/* رأس الصفحة */}
      <div className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-3">
              <Calendar className="w-8 h-8 text-blue-600" />
              <div>
                <h1 className="text-xl font-semibold text-gray-900">جداول التصوير</h1>
                <p className="text-sm text-gray-600">إدارة ومتابعة جداول التصوير وفترات البريك</p>
              </div>
            </div>

            {/* تبويبات التنقل */}
            <div className="flex items-center gap-1">
              <button
                onClick={() => setActiveTab('schedules')}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  activeTab === 'schedules'
                    ? 'bg-blue-100 text-blue-700'
                    : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                }`}
              >
                <Calendar className="w-4 h-4 inline-block ml-2" />
                الجداول
              </button>

              {['ADMIN', 'PRODUCER', 'MANAGER'].includes(userRole) && (
                <>
                  <button
                    onClick={() => setActiveTab('analytics')}
                    className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                      activeTab === 'analytics'
                        ? 'bg-blue-100 text-blue-700'
                        : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                    }`}
                  >
                    <BarChart3 className="w-4 h-4 inline-block ml-2" />
                    الإحصائيات
                  </button>

                  <button
                    onClick={() => setActiveTab('settings')}
                    className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                      activeTab === 'settings'
                        ? 'bg-blue-100 text-blue-700'
                        : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                    }`}
                  >
                    <Settings className="w-4 h-4 inline-block ml-2" />
                    الإعدادات
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* محتوى الصفحة */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {activeTab === 'schedules' && (
          <ScheduleManager
            projectId={projectId}
            userRole={userRole}
            onScheduleUpdate={(schedule) => {
              console.log('تم تحديث الجدول:', schedule);
            }}
          />
        )}

        {activeTab === 'analytics' && (
          <div className="space-y-6">
            <div className="bg-white rounded-lg shadow-md p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-6">إحصائيات الجداول</h2>
              
              {scheduleStats ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                  <div className="bg-blue-50 rounded-lg p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-blue-600 font-medium">إجمالي الجداول</p>
                        <p className="text-2xl font-bold text-blue-900">{scheduleStats.totalSchedules}</p>
                      </div>
                      <Calendar className="w-8 h-8 text-blue-600" />
                    </div>
                  </div>

                  <div className="bg-green-50 rounded-lg p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-green-600 font-medium">الجداول المكتملة</p>
                        <p className="text-2xl font-bold text-green-900">{scheduleStats.completedSchedules}</p>
                      </div>
                      <Clock className="w-8 h-8 text-green-600" />
                    </div>
                  </div>

                  <div className="bg-yellow-50 rounded-lg p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-yellow-600 font-medium">الجداول المتأخرة</p>
                        <p className="text-2xl font-bold text-yellow-900">{scheduleStats.delayedSchedules}</p>
                      </div>
                      <Clock className="w-8 h-8 text-yellow-600" />
                    </div>
                  </div>

                  <div className="bg-purple-50 rounded-lg p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-purple-600 font-medium">إجمالي البريكات</p>
                        <p className="text-2xl font-bold text-purple-900">{scheduleStats.totalBreaks}</p>
                      </div>
                      <Users className="w-8 h-8 text-purple-600" />
                    </div>
                  </div>
                </div>
              ) : (
                <div className="flex justify-center items-center h-32">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                  <span className="mr-3 text-gray-600">جاري تحميل الإحصائيات...</span>
                </div>
              )}

              {scheduleStats && (
                <div className="mt-6 pt-6 border-t border-gray-200">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <h3 className="text-sm font-medium text-gray-900 mb-2">متوسط التأخير</h3>
                      <p className="text-lg font-semibold text-gray-700">
                        {Math.round(scheduleStats.averageDelayMinutes)} دقيقة
                      </p>
                    </div>
                    <div>
                      <h3 className="text-sm font-medium text-gray-900 mb-2">إجمالي التغييرات</h3>
                      <p className="text-lg font-semibold text-gray-700">
                        {scheduleStats.totalChanges} تغيير
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {activeTab === 'settings' && (
          <div className="space-y-6">
            <div className="bg-white rounded-lg shadow-md p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-6">إعدادات تكامل الجداول</h2>
              
              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-sm font-medium text-gray-900">التحديث التلقائي للطلبات</h3>
                    <p className="text-sm text-gray-600">تحديث أوقات الطلبات تلقائياً عند تغيير الجدول</p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input type="checkbox" className="sr-only peer" defaultChecked />
                    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                  </label>
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-sm font-medium text-gray-900">الإشعارات التلقائية</h3>
                    <p className="text-sm text-gray-600">إرسال إشعارات تلقائية عند تغيير الجداول</p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input type="checkbox" className="sr-only peer" defaultChecked />
                    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                  </label>
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-sm font-medium text-gray-900">تعديل أوقات التوصيل</h3>
                    <p className="text-sm text-gray-600">تعديل أوقات التوصيل تلقائياً عند التأخير</p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input type="checkbox" className="sr-only peer" defaultChecked />
                    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                  </label>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-900 mb-2">
                    مدة نافذة الطلب (دقيقة)
                  </label>
                  <input
                    type="number"
                    defaultValue={60}
                    min={30}
                    max={180}
                    className="w-32 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-900 mb-2">
                    فترات التذكير (دقائق قبل الإغلاق)
                  </label>
                  <div className="flex gap-2">
                    <input
                      type="number"
                      defaultValue={30}
                      className="w-20 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                    <input
                      type="number"
                      defaultValue={15}
                      className="w-20 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                    <input
                      type="number"
                      defaultValue={5}
                      className="w-20 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <p className="text-xs text-gray-500 mt-1">
                    سيتم إرسال تذكيرات في هذه الأوقات قبل إغلاق نافذة الطلب
                  </p>
                </div>

                <div className="pt-4 border-t border-gray-200">
                  <button className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700">
                    حفظ الإعدادات
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* نموذج إنشاء جدول جديد */}
      {showCreateForm && (
        <CreateScheduleForm
          projectId={projectId}
          onClose={() => setShowCreateForm(false)}
          onSuccess={handleScheduleCreated}
        />
      )}
    </div>
  );
};

export default SchedulePage;