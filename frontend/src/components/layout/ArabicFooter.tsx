/**
 * مكون التذييل العربي
 * Arabic Footer Component
 */

import React from 'react';
import { useTranslation } from '../../config/localization';

const ArabicFooter: React.FC = () => {
  const { t } = useTranslation();
  const currentYear = new Date().getFullYear();

  return (
    <footer className="bg-white border-t border-gray-200 mt-auto">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="py-6">
          <div className="flex flex-col md:flex-row justify-between items-center space-y-4 md:space-y-0">
            
            {/* معلومات الحقوق */}
            <div className="text-center md:text-right">
              <p className="text-sm text-gray-600">
                © {currentYear} {t('common.appName', {}, 'BreakApp')}. {t('common.allRightsReserved')}
              </p>
            </div>

            {/* روابط مفيدة */}
            <div className="flex space-x-6 space-x-reverse">
              <a 
                href="/privacy" 
                className="text-sm text-gray-600 hover:text-gray-900 transition-colors"
              >
                {t('common.privacyPolicy')}
              </a>
              <a 
                href="/terms" 
                className="text-sm text-gray-600 hover:text-gray-900 transition-colors"
              >
                {t('common.termsOfService')}
              </a>
              <a 
                href="/help" 
                className="text-sm text-gray-600 hover:text-gray-900 transition-colors"
              >
                {t('common.help')}
              </a>
              <a 
                href="/contact" 
                className="text-sm text-gray-600 hover:text-gray-900 transition-colors"
              >
                {t('common.contact')}
              </a>
            </div>

            {/* معلومات الإصدار */}
            <div className="text-center md:text-left">
              <p className="text-xs text-gray-500">
                {t('common.version')} 1.0.0
              </p>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default ArabicFooter;