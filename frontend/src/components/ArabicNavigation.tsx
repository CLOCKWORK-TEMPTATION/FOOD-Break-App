/**
 * مكون التنقل العربي
 * Arabic Navigation Component
 */

import React from 'react';
import { useLocalization } from '../components/LocalizedApp';
import { 
  ShoppingBagIcon,
  ClipboardDocumentListIcon,
  BuildingStorefrontIcon
} from '@heroicons/react/24/outline';

interface ArabicNavigationProps {
  currentPage?: string;
  className?: string;
}

const ArabicNavigation: React.FC<ArabicNavigationProps> = ({ 
  currentPage, 
  className = '' 
}) => {
  const { t, direction } = useLocalization();

  const navigationItems = [
    {
      key: 'orders',
      label: t('navigation.orders'),
      icon: ShoppingBagIcon,
      href: '/arabic/orders',
      description: 'عرض وإدارة جميع طلبات المطاعم'
    },
    {
      key: 'menu',
      label: t('navigation.menu'),
      icon: ClipboardDocumentListIcon,
      href: '/arabic/menu',
      description: 'إدارة قوائم الطعام والأسعار'
    },
    {
      key: 'restaurants',
      label: t('navigation.restaurants'),
      icon: BuildingStorefrontIcon,
      href: '/arabic/restaurants',
      description: 'إدارة المطاعم والمعلومات العامة'
    }
  ];

  return (
    <nav className={`arabic-navigation ${className}`} dir={direction}>
      <div className="nav-container">
        <h2 className="nav-title">{t('navigation.dashboard')}</h2>
        <div className="nav-items">
          {navigationItems.map((item) => {
            const Icon = item.icon;
            const isActive = currentPage === item.key;
            
            return (
              <a
                key={item.key}
                href={item.href}
                className={`nav-item ${isActive ? 'active' : ''}`}
              >
                <Icon className="nav-icon" />
                <div className="nav-content">
                  <span className="nav-label">{item.label}</span>
                  <span className="nav-description">{item.description}</span>
                </div>
              </a>
            );
          })}
        </div>
      </div>
      
      <style>{`
        .arabic-navigation {
          background: #f8fafc;
          border: 1px solid #e2e8f0;
          border-radius: 12px;
          padding: 1.5rem;
          margin-bottom: 2rem;
        }
        
        .nav-container {
          max-width: 100%;
        }
        
        .nav-title {
          font-size: 1.5rem;
          font-weight: bold;
          color: #1e293b;
          margin-bottom: 1.5rem;
          text-align: ${direction === 'rtl' ? 'right' : 'left'};
        }
        
        .nav-items {
          display: flex;
          flex-direction: column;
          gap: 0.75rem;
        }
        
        .nav-item {
          display: flex;
          align-items: center;
          gap: 1rem;
          padding: 1rem;
          background: white;
          border: 1px solid #e2e8f0;
          border-radius: 8px;
          text-decoration: none;
          color: #475569;
          transition: all 0.2s ease;
        }
        
        .nav-item:hover {
          background: #f1f5f9;
          border-color: #cbd5e1;
          transform: translateY(-1px);
          box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
        }
        
        .nav-item.active {
          background: #3b82f6;
          border-color: #3b82f6;
          color: white;
        }
        
        .nav-icon {
          width: 24px;
          height: 24px;
          flex-shrink: 0;
        }
        
        .nav-content {
          display: flex;
          flex-direction: column;
          gap: 0.25rem;
        }
        
        .nav-label {
          font-weight: 600;
          font-size: 1rem;
        }
        
        .nav-description {
          font-size: 0.875rem;
          opacity: 0.8;
        }
        
        .nav-item.active .nav-description {
          opacity: 0.9;
        }
        
        @media (max-width: 768px) {
          .arabic-navigation {
            padding: 1rem;
            margin-bottom: 1rem;
          }
          
          .nav-title {
            font-size: 1.25rem;
            margin-bottom: 1rem;
          }
          
          .nav-item {
            padding: 0.75rem;
          }
          
          .nav-icon {
            width: 20px;
            height: 20px;
          }
          
          .nav-label {
            font-size: 0.875rem;
          }
          
          .nav-description {
            font-size: 0.75rem;
          }
        }
      `}</style>
    </nav>
  );
};

export default ArabicNavigation;
