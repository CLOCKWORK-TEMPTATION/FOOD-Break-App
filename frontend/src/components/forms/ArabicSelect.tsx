/**
 * مكون القائمة المنسدلة العربية
 * Arabic Select Component with RTL support
 */

import React, { forwardRef } from 'react';
import { useTranslation } from '../../config/localization';
import { ChevronDownIcon, ExclamationCircleIcon } from '@heroicons/react/24/outline';

interface Option {
  value: string | number;
  label: string;
  disabled?: boolean;
}

interface ArabicSelectProps extends Omit<React.SelectHTMLAttributes<HTMLSelectElement>, 'children'> {
  label?: string;
  error?: string;
  helperText?: string;
  required?: boolean;
  options: Option[];
  placeholder?: string;
}

const ArabicSelect = forwardRef<HTMLSelectElement, ArabicSelectProps>(({
  label,
  error,
  helperText,
  required = false,
  options,
  placeholder,
  className = '',
  ...props
}, ref) => {
  const { t, direction } = useTranslation();

  const selectId = props.id || `select-${Math.random().toString(36).substr(2, 9)}`;

  return (
    <div className="w-full">
      {/* التسمية */}
      {label && (
        <label 
          htmlFor={selectId}
          className={`
            block text-sm font-medium text-gray-700 mb-2
            ${direction === 'rtl' ? 'text-right' : 'text-left'}
          `}
        >
          {label}
          {required && <span className="text-red-500 mr-1">*</span>}
        </label>
      )}

      {/* حاوية القائمة المنسدلة */}
      <div className="relative">
        <select
          ref={ref}
          id={selectId}
          dir={direction}
          className={`
            block w-full px-3 py-2 border rounded-md shadow-sm
            bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500
            transition-colors duration-200 appearance-none
            ${error 
              ? 'border-red-300 text-red-900 focus:ring-red-500 focus:border-red-500' 
              : 'border-gray-300 text-gray-900'
            }
            ${direction === 'rtl' ? 'text-right pr-10' : 'text-left pl-3 pr-10'}
            ${className}
          `}
          {...props}
        >
          {/* الخيار الافتراضي */}
          {placeholder && (
            <option value="" disabled>
              {placeholder}
            </option>
          )}

          {/* الخيارات */}
          {options.map((option) => (
            <option 
              key={option.value} 
              value={option.value}
              disabled={option.disabled}
            >
              {option.label}
            </option>
          ))}
        </select>

        {/* أيقونة السهم */}
        <div className={`
          absolute inset-y-0 flex items-center pointer-events-none
          ${direction === 'rtl' ? 'left-0 pl-3' : 'right-0 pr-3'}
        `}>
          {error ? (
            <ExclamationCircleIcon className="h-5 w-5 text-red-500" />
          ) : (
            <ChevronDownIcon className="h-5 w-5 text-gray-400" />
          )}
        </div>
      </div>

      {/* رسالة الخطأ */}
      {error && (
        <p className={`
          mt-2 text-sm text-red-600
          ${direction === 'rtl' ? 'text-right' : 'text-left'}
        `}>
          {error}
        </p>
      )}

      {/* النص المساعد */}
      {helperText && !error && (
        <p className={`
          mt-2 text-sm text-gray-500
          ${direction === 'rtl' ? 'text-right' : 'text-left'}
        `}>
          {helperText}
        </p>
      )}
    </div>
  );
});

ArabicSelect.displayName = 'ArabicSelect';

export default ArabicSelect;