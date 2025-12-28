/**
 * مكون الشريط الجانبي العربي
 * Arabic Sidebar Component with RTL navigation
 */

import React from 'react';
import { useTranslation } from '../../config/localization';
import { 
  HomeIcon,
  ShoppingBagIcon,
  BuildingStorefrontIcon,
  UsersIcon,
  ChartBarIcon,
  Cog6ToothIcon,
  DocumentTextIcon,
  BellIcon,
  CurrencyDollarIcon,
  HeartIcon,
  ClipboardDocumentListIcon,
  ChevronLeftIcon,
  ChevronRightIcon
} from '@heroicons/react/24/outline';

interface ArabicSidebarProps {
  collapsed?: boolean;
  onToggle?: () => void;
}

const ArabicSidebar: React.FC<ArabicSidebarProps> = ({
  collapsed = false,
  onToggle
}) => {
  const { t, direction } = useTranslation();

  const navigationItems = [
    {
      name: t('navigation.dashboard'),
      href: '/dashboard',
      icon: HomeIcon,
      current: true
    },
    {
      name: t('navigation.orders'),
      href: '/orders',
      icon: ShoppingBagIcon,
      current: false,
      badge: 3
    },
    {
      name: t('navigation.restaurants'),
      href: '/restaurants',
      icon: BuildingStorefrontIcon,
      current: false
    },
    {
      name: t('navigation.menu'),
      href: '/menu',
      icon: ClipboardDocumentListIcon,
      current: false
    },
    {
      name: t('navigation.users'),
      href: '/users',
      icon: UsersIcon,
      current: false
    },
    {
      name: t('navigation.reports'),
      href: '/reports',
      icon: ChartBarIcon,
      current: false
    },
    {
      name: t('budget.title'),
      href: '/budget',
      icon: CurrencyDollarIcon,
      current: false
    },
    {
      name: t('nutrition.title'),
      href: '/nutrition',
      icon: HeartIcon,
      current: false
    },
    {
      name: t('navigation.notifications'),
      href: '/notifications',
      icon: BellIcon,
      current: false
    },
    {
      name: t('navigation.settings'),
      href: '/settings',
      icon: Cog6ToothIcon,
      current: false
    }
  ];

  return (
    <div 
      className={`
        fixed right-0 top-16 h-[calc(100vh-4rem)] bg-white shadow-lg border-l border-gray-200 
        transition-all duration-300 z-40
        ${collapsed ? 'w-16' : 'w-64'}
      `}
    >
      {/* زر الطي/التوسيع */}
      <div className="flex justify-start p-4">
        <button
          onClick={onToggle}
          className="p-2 rounded-md text-gray-600 hover:text-gray-900 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
          aria-label={collapsed ? t('common.expandSidebar') : t('common.collapseSidebar')}
        >
          {direction === 'rtl' ? (
            collapsed ? <ChevronLeftIcon className="h-5 w-5" /> : <ChevronRightIcon className="h-5 w-5" />
          ) : (
            collapsed ? <ChevronRightIcon className="h-5 w-5" /> : <ChevronLeftIcon className="h-5 w-5" />
          )}
        </button>
      </div>

      {/* قائمة التنقل */}
      <nav className="px-3 pb-4">
        <ul className="space-y-1">
          {navigationItems.map((item) => {
            const Icon = item.icon;
            return (
              <li key={item.name}>
                <a
                  href={item.href}
                  className={`
                    group flex items-center px-3 py-2 text-sm font-medium rounded-md transition-colors
                    ${item.current 
                      ? 'bg-blue-50 text-blue-700 border-l-4 border-blue-700' 
                      : 'text-gray-700 hover:text-gray-900 hover:bg-gray-50'
                    }
                    ${collapsed ? 'justify-center' : 'justify-start'}
                  `}
                  title={collapsed ? item.name : undefined}
                >
                  <Icon 
                    className={`
                      h-5 w-5 flex-shrink-0
                      ${item.current ? 'text-blue-700' : 'text-gray-400 group-hover:text-gray-500'}
                      ${collapsed ? '' : 'ml-3'}
                    `} 
                  />
                  
                  {!collapsed && (
                    <>
                      <span className="flex-1">{item.name}</span>
                      {item.badge && (
                        <span className="bg-red-500 text-white text-xs rounded-full px-2 py-1 mr-2">
                          {item.badge}
                        </span>
                      )}
                    </>
                  )}
                  
                  {collapsed && item.badge && (
                    <span className="absolute right-1 top-1 bg-red-500 text-white text-xs rounded-full w-4 h-4 flex items-center justify-center">
                      {item.badge}
                    </span>
                  )}
                </a>
              </li>
            );
          })}
        </ul>
      </nav>

      {/* معلومات إضافية في الأسفل */}
      {!collapsed && (
        <div className="absolute bottom-4 left-0 right-0 px-6">
          <div className="bg-blue-50 rounded-lg p-4">
            <h3 className="text-sm font-medium text-blue-900 mb-2">
              {t('common.needHelp')}
            </h3>
            <p className="text-xs text-blue-700 mb-3">
              {t('common.helpDescription')}
            </p>
            <button className="w-full bg-blue-600 text-white text-xs py-2 px-3 rounded-md hover:bg-blue-700 transition-colors">
              {t('common.contactSupport')}
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default ArabicSidebar;