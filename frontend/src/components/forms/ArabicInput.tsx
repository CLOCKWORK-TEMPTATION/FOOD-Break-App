/**
 * مكون حقل الإدخال العربي
 * Arabic Input Component with RTL support
 */

import React, { forwardRef } from 'react';
import { useTranslation } from '../../config/localization';
import { ExclamationCircleIcon } from '@heroicons/react/24/outline';

interface ArabicInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  helperText?: string;
  required?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
}

const ArabicInput = forwardRef<HTMLInputElement, ArabicInputProps>(({
  label,
  error,
  helperText,
  required = false,
  leftIcon,
  rightIcon,
  className = '',
  ...props
}, ref) => {
  const { t, direction } = useTranslation();

  const inputId = props.id || `input-${Math.random().toString(36).substr(2, 9)}`;

  return (
    <div className="w-full">
      {/* التسمية */}
      {label && (
        <label 
          htmlFor={inputId}
          className={`
            block text-sm font-medium text-gray-700 mb-2
            ${direction === 'rtl' ? 'text-right' : 'text-left'}
          `}
        >
          {label}
          {required && <span className="text-red-500 mr-1">*</span>}
        </label>
      )}

      {/* حاوية الإدخال */}
      <div className="relative">
        {/* الأيقونة اليمنى */}
        {rightIcon && (
          <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
            <div className="h-5 w-5 text-gray-400">
              {rightIcon}
            </div>
          </div>
        )}

        {/* حقل الإدخال */}
        <input
          ref={ref}
          id={inputId}
          dir={direction}
          className={`
            block w-full px-3 py-2 border rounded-md shadow-sm
            placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500
            transition-colors duration-200
            ${error 
              ? 'border-red-300 text-red-900 placeholder-red-300 focus:ring-red-500 focus:border-red-500' 
              : 'border-gray-300 text-gray-900'
            }
            ${rightIcon ? 'pr-10' : 'pr-3'}
            ${leftIcon ? 'pl-10' : 'pl-3'}
            ${direction === 'rtl' ? 'text-right' : 'text-left'}
            ${className}
          `}
          {...props}
        />

        {/* الأيقونة اليسرى */}
        {leftIcon && (
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <div className="h-5 w-5 text-gray-400">
              {leftIcon}
            </div>
          </div>
        )}

        {/* أيقونة الخطأ */}
        {error && (
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <ExclamationCircleIcon className="h-5 w-5 text-red-500" />
          </div>
        )}
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

ArabicInput.displayName = 'ArabicInput';

export default ArabicInput;