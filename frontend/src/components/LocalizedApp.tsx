import React, { createContext, useContext, useEffect, useState } from 'react';
import { useTranslation, getSavedLanguage, saveLanguage, getTextDirection } from '../config/localization';

// إنشاء Context للتعريب
interface LocalizationContextType {
  t: (key: string, params?: Record<string, any>) => string;
  lang: string;
  direction: 'rtl' | 'ltr';
  setLanguage: (lang: string) => void;
}

const LocalizationContext = createContext<LocalizationContextType | undefined>(undefined);

// Provider للتعريب
export const LocalizationProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentLang, setCurrentLang] = useState(getSavedLanguage());
  const { t, direction } = useTranslation(currentLang);

  const setLanguage = (lang: string) => {
    setCurrentLang(lang);
    saveLanguage(lang);
    
    // تحديث اتجاه الصفحة
    document.documentElement.dir = getTextDirection(lang);
    document.documentElement.lang = lang;
  };

  useEffect(() => {
    // تطبيق الاتجاه عند التحميل
    document.documentElement.dir = direction;
    document.documentElement.lang = currentLang;
  }, [direction, currentLang]);

  const value: LocalizationContextType = {
    t,
    lang: currentLang,
    direction,
    setLanguage
  };

  return (
    <LocalizationContext.Provider value={value}>
      {children}
    </LocalizationContext.Provider>
  );
};

// Hook لاستخدام التعريب
export const useLocalization = (): LocalizationContextType => {
  const context = useContext(LocalizationContext);
  if (!context) {
    throw new Error('useLocalization must be used within LocalizationProvider');
  }
  return context;
};

// مكون تبديل اللغة
export const LanguageToggle: React.FC = () => {
  const { lang, setLanguage, t } = useLocalization();

  return (
    <div className="language-toggle">
      <button
        onClick={() => setLanguage(lang === 'ar' ? 'en' : 'ar')}
        className="btn btn-outline"
        title={t('settings.language')}
      >
        {lang === 'ar' ? 'EN' : 'عر'}
      </button>
    </div>
  );
};

// مكون النص المعرب
interface LocalizedTextProps {
  messageKey: string;
  params?: Record<string, any>;
  fallback?: string;
  className?: string;
  tag?: keyof JSX.IntrinsicElements;
}

export const LocalizedText: React.FC<LocalizedTextProps> = ({
  messageKey,
  params = {},
  fallback,
  className,
  tag: Tag = 'span'
}) => {
  const { t } = useLocalization();
  const text = t(messageKey, params) || fallback || messageKey;

  return <Tag className={className}>{text}</Tag>;
};

// مكون العنوان المعرب
export const LocalizedTitle: React.FC<LocalizedTextProps> = (props) => {
  return <LocalizedText {...props} tag="h1" className={`title ${props.className || ''}`} />;
};

// مكون الزر المعرب
interface LocalizedButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  messageKey: string;
  params?: Record<string, any>;
  loading?: boolean;
  loadingMessageKey?: string;
}

export const LocalizedButton: React.FC<LocalizedButtonProps> = ({
  messageKey,
  params = {},
  loading = false,
  loadingMessageKey = 'common.loading',
  children,
  disabled,
  className,
  ...props
}) => {
  const { t } = useLocalization();
  
  const buttonText = loading ? t(loadingMessageKey) : t(messageKey, params);
  const isDisabled = disabled || loading;

  return (
    <button
      {...props}
      disabled={isDisabled}
      className={`btn ${className || ''} ${loading ? 'loading' : ''}`}
    >
      {loading && <span className="spinner" />}
      {buttonText}
      {children}
    </button>
  );
};

// مكون النموذج المعرب
interface LocalizedFormProps {
  children: React.ReactNode;
  onSubmit: (e: React.FormEvent) => void;
  className?: string;
}

export const LocalizedForm: React.FC<LocalizedFormProps> = ({
  children,
  onSubmit,
  className
}) => {
  const { direction } = useLocalization();

  return (
    <form
      onSubmit={onSubmit}
      className={`form ${direction} ${className || ''}`}
      dir={direction}
    >
      {children}
    </form>
  );
};

// مكون حقل الإدخال المعرب
interface LocalizedInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  labelKey: string;
  errorKey?: string;
  error?: string;
  required?: boolean;
}

export const LocalizedInput: React.FC<LocalizedInputProps> = ({
  labelKey,
  errorKey,
  error,
  required = false,
  className,
  ...props
}) => {
  const { t } = useLocalization();
  
  const label = t(labelKey);
  const errorMessage = error || (errorKey ? t(errorKey) : '');

  return (
    <div className={`input-group ${className || ''}`}>
      <label className="input-label">
        {label}
        {required && <span className="required">*</span>}
      </label>
      <input
        {...props}
        className={`input ${error ? 'error' : ''}`}
        placeholder={label}
      />
      {errorMessage && (
        <span className="error-message">{errorMessage}</span>
      )}
    </div>
  );
};

// مكون القائمة المنسدلة المعربة
interface LocalizedSelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  labelKey: string;
  options: Array<{ value: string; labelKey: string; label?: string }>;
  errorKey?: string;
  error?: string;
  required?: boolean;
}

export const LocalizedSelect: React.FC<LocalizedSelectProps> = ({
  labelKey,
  options,
  errorKey,
  error,
  required = false,
  className,
  ...props
}) => {
  const { t } = useLocalization();
  
  const label = t(labelKey);
  const errorMessage = error || (errorKey ? t(errorKey) : '');

  return (
    <div className={`select-group ${className || ''}`}>
      <label className="select-label">
        {label}
        {required && <span className="required">*</span>}
      </label>
      <select
        {...props}
        className={`select ${error ? 'error' : ''}`}
      >
        <option value="">{t('common.select')} {label}</option>
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label || t(option.labelKey)}
          </option>
        ))}
      </select>
      {errorMessage && (
        <span className="error-message">{errorMessage}</span>
      )}
    </div>
  );
};

// مكون رسالة التحميل
export const LoadingMessage: React.FC<{ messageKey?: string }> = ({
  messageKey = 'common.loading'
}) => {
  const { t } = useLocalization();

  return (
    <div className="loading-container">
      <div className="spinner large" />
      <p className="loading-text">{t(messageKey)}</p>
    </div>
  );
};

// مكون رسالة الخطأ
export const ErrorMessage: React.FC<{
  messageKey?: string;
  message?: string;
  onRetry?: () => void;
}> = ({
  messageKey = 'errors.unknownError',
  message,
  onRetry
}) => {
  const { t } = useLocalization();
  
  const errorText = message || t(messageKey);

  return (
    <div className="error-container">
      <div className="error-icon">⚠️</div>
      <p className="error-text">{errorText}</p>
      {onRetry && (
        <LocalizedButton
          messageKey="errors.tryAgain"
          onClick={onRetry}
          className="retry-btn"
        />
      )}
    </div>
  );
};

// مكون رسالة النجاح
export const SuccessMessage: React.FC<{
  messageKey?: string;
  message?: string;
  onClose?: () => void;
}> = ({
  messageKey = 'common.success',
  message,
  onClose
}) => {
  const { t } = useLocalization();
  
  const successText = message || t(messageKey);

  return (
    <div className="success-container">
      <div className="success-icon">✅</div>
      <p className="success-text">{successText}</p>
      {onClose && (
        <button onClick={onClose} className="close-btn">
          ×
        </button>
      )}
    </div>
  );
};

// مكون التأكيد المعرب
interface ConfirmDialogProps {
  isOpen: boolean;
  titleKey: string;
  messageKey: string;
  confirmKey?: string;
  cancelKey?: string;
  onConfirm: () => void;
  onCancel: () => void;
  loading?: boolean;
}

export const ConfirmDialog: React.FC<ConfirmDialogProps> = ({
  isOpen,
  titleKey,
  messageKey,
  confirmKey = 'common.confirm',
  cancelKey = 'common.cancel',
  onConfirm,
  onCancel,
  loading = false
}) => {
  const { t } = useLocalization();

  if (!isOpen) return null;

  return (
    <div className="modal-overlay">
      <div className="modal-content">
        <h3 className="modal-title">{t(titleKey)}</h3>
        <p className="modal-message">{t(messageKey)}</p>
        <div className="modal-actions">
          <LocalizedButton
            messageKey={cancelKey}
            onClick={onCancel}
            className="btn-secondary"
            disabled={loading}
          />
          <LocalizedButton
            messageKey={confirmKey}
            onClick={onConfirm}
            className="btn-primary"
            loading={loading}
          />
        </div>
      </div>
    </div>
  );
};

export default LocalizationProvider;