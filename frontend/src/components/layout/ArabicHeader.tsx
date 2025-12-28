/**
 * مكون الترويسة العربية
 * Arabic Header Component with RTL navigation
 */

import React, { useState } from 'react';
import { useTranslation } from '../../config/localization';
import { 
  Bars3Icon, 
  BellIcon, 
  UserCircleIcon,
  ChevronDownIcon,
  Cog6ToothIcon,
  ArrowRightOnRectangleIcon
} from '@heroicons/react/24/outline';

interface ArabicHeaderProps {
  onSidebarToggle?: () => void;
  showSidebarToggle?: boolean;
}

const ArabicHeader: React.FC<ArabicHeaderProps> = ({
  onSidebarToggle,
  showSidebarToggle = true
}) => {
  const { t, lang, direction } = useTranslation();
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);

  // بيانات المستخدم (يجب جلبها من context أو store)
  const user = {
    name: 'أحمد محمد',
    email: 'ahmed@example.com',
    avatar: null,
    role: 'مطور'
  };

  const notifications = [
    { id: 1, title: 'طلب جديد', message: 'تم استلام طلب جديد من المطعم', time: 'منذ 5 دقائق' },
    { id: 2, title: 'تحديث الحالة', message: 'تم تحديث حالة الطلب إلى جاري التحضير', time: 'منذ 10 دقائق' },
    { id: 3, title: 'تذكير', message: 'لا تنس تقديم طلبك اليوم', time: 'منذ ساعة' }
  ];

  return (
    <header className="bg-white shadow-sm border-b border-gray-200 sticky top-0 z-50">
      <div className="px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          
          {/* الجانب الأيمن - القائمة والشعار */}
          <div className="flex items-center space-x-4 space-x-reverse">
            {/* زر القائمة الجانبية */}
            {showSidebarToggle && (
              <button
                onClick={onSidebarToggle}
                className="p-2 rounded-md text-gray-600 hover:text-gray-900 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
                aria-label={t('common.toggleSidebar')}
              >
                <Bars3Icon className="h-6 w-6" />
              </button>
            )}

            {/* الشعار */}
            <div className="flex items-center">
              <h1 className="text-xl font-bold text-gray-900">
                {t('common.appName', {}, 'BreakApp')}
              </h1>
            </div>
          </div>

          {/* الجانب الأيسر - الإشعارات وقائمة المستخدم */}
          <div className="flex items-center space-x-4 space-x-reverse">
            
            {/* الإشعارات */}
            <div className="relative">
              <button
                onClick={() => setShowNotifications(!showNotifications)}
                className="p-2 rounded-md text-gray-600 hover:text-gray-900 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500 relative"
                aria-label={t('navigation.notifications')}
              >
                <BellIcon className="h-6 w-6" />
                {notifications.length > 0 && (
                  <span className="absolute -top-1 -right-1 h-4 w-4 bg-red-500 text-white text-xs rounded-full flex items-center justify-center">
                    {notifications.length}
                  </span>
                )}
              </button>

              {/* قائمة الإشعارات */}
              {showNotifications && (
                <div className="absolute left-0 mt-2 w-80 bg-white rounded-md shadow-lg ring-1 ring-black ring-opacity-5 z-50">
                  <div className="p-4">
                    <h3 className="text-lg font-medium text-gray-900 mb-3">
                      {t('navigation.notifications')}
                    </h3>
                    <div className="space-y-3">
                      {notifications.map((notification) => (
                        <div key={notification.id} className="p-3 bg-gray-50 rounded-md">
                          <h4 className="font-medium text-gray-900">{notification.title}</h4>
                          <p className="text-sm text-gray-600 mt-1">{notification.message}</p>
                          <p className="text-xs text-gray-500 mt-2">{notification.time}</p>
                        </div>
                      ))}
                    </div>
                    <div className="mt-4 pt-3 border-t border-gray-200">
                      <button className="text-sm text-blue-600 hover:text-blue-800">
                        {t('navigation.viewAllNotifications')}
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* قائمة المستخدم */}
            <div className="relative">
              <button
                onClick={() => setShowUserMenu(!showUserMenu)}
                className="flex items-center space-x-2 space-x-reverse p-2 rounded-md text-gray-600 hover:text-gray-900 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                {user.avatar ? (
                  <img 
                    src={user.avatar} 
                    alt={user.name}
                    className="h-8 w-8 rounded-full"
                  />
                ) : (
                  <UserCircleIcon className="h-8 w-8" />
                )}
                <div className="hidden md:block text-right">
                  <p className="text-sm font-medium text-gray-900">{user.name}</p>
                  <p className="text-xs text-gray-500">{user.role}</p>
                </div>
                <ChevronDownIcon className="h-4 w-4" />
              </button>

              {/* قائمة المستخدم المنسدلة */}
              {showUserMenu && (
                <div className="absolute left-0 mt-2 w-48 bg-white rounded-md shadow-lg ring-1 ring-black ring-opacity-5 z-50">
                  <div className="py-1">
                    <div className="px-4 py-2 border-b border-gray-200">
                      <p className="text-sm font-medium text-gray-900">{user.name}</p>
                      <p className="text-xs text-gray-500">{user.email}</p>
                    </div>
                    
                    <button className="flex items-center w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 space-x-2 space-x-reverse">
                      <UserCircleIcon className="h-4 w-4" />
                      <span>{t('navigation.profile')}</span>
                    </button>
                    
                    <button className="flex items-center w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 space-x-2 space-x-reverse">
                      <Cog6ToothIcon className="h-4 w-4" />
                      <span>{t('navigation.settings')}</span>
                    </button>
                    
                    <div className="border-t border-gray-200">
                      <button className="flex items-center w-full px-4 py-2 text-sm text-red-700 hover:bg-red-50 space-x-2 space-x-reverse">
                        <ArrowRightOnRectangleIcon className="h-4 w-4" />
                        <span>{t('auth.logout')}</span>
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </header>
  );
};

export default ArabicHeader;