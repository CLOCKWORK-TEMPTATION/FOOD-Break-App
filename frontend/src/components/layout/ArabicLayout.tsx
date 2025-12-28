/**
 * مكون التخطيط الرئيسي العربي
 * Arabic Main Layout Component with RTL support
 */

import React from 'react';
import { useTranslation } from '../../config/localization';
import ArabicHeader from './ArabicHeader';
import ArabicSidebar from './ArabicSidebar';
import ArabicFooter from './ArabicFooter';

interface ArabicLayoutProps {
  children: React.ReactNode;
  showSidebar?: boolean;
  sidebarCollapsed?: boolean;
  onSidebarToggle?: () => void;
}

const ArabicLayout: React.FC<ArabicLayoutProps> = ({
  children,
  showSidebar = true,
  sidebarCollapsed = false,
  onSidebarToggle
}) => {
  const { t, lang, direction } = useTranslation();

  return (
    <div 
      className={`min-h-screen bg-gray-50 ${direction}`} 
      dir={direction}
      lang={lang}
    >
      {/* الترويسة العربية */}
      <ArabicHeader 
        onSidebarToggle={onSidebarToggle}
        showSidebarToggle={showSidebar}
      />

      <div className="flex">
        {/* الشريط الجانبي العربي */}
        {showSidebar && (
          <ArabicSidebar 
            collapsed={sidebarCollapsed}
            onToggle={onSidebarToggle}
          />
        )}

        {/* المحتوى الرئيسي */}
        <main 
          className={`
            flex-1 
            transition-all 
            duration-300 
            ${showSidebar ? (sidebarCollapsed ? 'mr-16' : 'mr-64') : ''}
            ${direction === 'rtl' ? 'text-right' : 'text-left'}
          `}
        >
          <div className="p-6">
            {children}
          </div>
        </main>
      </div>

      {/* التذييل العربي */}
      <ArabicFooter />
    </div>
  );
};

export default ArabicLayout;