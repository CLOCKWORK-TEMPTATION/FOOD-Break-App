/**
 * صفحة الدفع العربية
 * Arabic Payment Page with RTL Support
 */

import React, { useState, useEffect } from 'react';
import { useTranslation } from '../config/localization';
import ArabicLayout from '../components/layout/ArabicLayout';
import ArabicButton from '../components/forms/ArabicButton';
import {
  CreditCardIcon,
  BanknotesIcon,
  DevicePhoneMobileIcon,
  BuildingLibraryIcon,
  CheckCircleIcon,
  XCircleIcon,
  ClockIcon,
  ArrowPathIcon,
  DocumentTextIcon,
  ShieldCheckIcon
} from '@heroicons/react/24/outline';

// أنواع البيانات
interface PaymentMethod {
  id: string;
  name: string;
  nameEn: string;
  icon: string;
  minAmount: number;
  maxAmount: number;
  processingFee: number;
  processingFeeType: 'percentage' | 'fixed';
  requiresOtp?: boolean;
  requiresReference?: boolean;
}

interface OrderSummary {
  orderId: string;
  orderNumber: string;
  items: Array<{
    name: string;
    quantity: number;
    price: number;
  }>;
  subtotal: number;
  tax: number;
  deliveryFee: number;
  discount: number;
  total: number;
}

interface PaymentResult {
  success: boolean;
  paymentId?: string;
  reference?: string;
  status?: string;
  statusText?: string;
  instructions?: {
    type: string;
    message: string;
    reference?: string;
    expiresAt?: string;
  };
  error?: string;
}

// أيقونات طرق الدفع
const PaymentMethodIcons: Record<string, React.ElementType> = {
  'credit-card': CreditCardIcon,
  'vodafone': DevicePhoneMobileIcon,
  'orange': DevicePhoneMobileIcon,
  'etisalat': DevicePhoneMobileIcon,
  'we': DevicePhoneMobileIcon,
  'fawry': BanknotesIcon,
  'aman': BanknotesIcon,
  'instapay': BuildingLibraryIcon,
  'bank': BuildingLibraryIcon,
  'cash': BanknotesIcon
};

const ArabicPayment: React.FC = () => {
  const { t } = useTranslation();
  
  // حالة المكون
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [paymentMethods, setPaymentMethods] = useState<PaymentMethod[]>([]);
  const [selectedMethod, setSelectedMethod] = useState<string | null>(null);
  const [orderSummary, setOrderSummary] = useState<OrderSummary | null>(null);
  const [paymentResult, setPaymentResult] = useState<PaymentResult | null>(null);
  const [step, setStep] = useState<'select' | 'details' | 'otp' | 'result'>('select');
  
  // بيانات النموذج
  const [phoneNumber, setPhoneNumber] = useState('');
  const [otp, setOtp] = useState('');
  const [cardDetails, setCardDetails] = useState({
    number: '',
    expiry: '',
    cvv: '',
    name: ''
  });
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  // جلب طرق الدفع المتاحة
  useEffect(() => {
    fetchPaymentMethods();
    fetchOrderSummary();
  }, []);

  const fetchPaymentMethods = async () => {
    try {
      const response = await fetch('/api/payments/methods?amount=100&currency=EGP', {
        headers: {
          'Accept-Language': 'ar',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });

      const data = await response.json();
      
      if (data.success) {
        setPaymentMethods(data.data.methods || []);
      }
    } catch (error) {
      console.error('خطأ في جلب طرق الدفع:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchOrderSummary = async () => {
    // محاكاة جلب ملخص الطلب
    setOrderSummary({
      orderId: 'order-123',
      orderNumber: 'ORD-2024-0001',
      items: [
        { name: 'وجبة دجاج مشوي', quantity: 2, price: 75 },
        { name: 'سلطة خضراء', quantity: 1, price: 25 },
        { name: 'مشروب غازي', quantity: 2, price: 15 }
      ],
      subtotal: 205,
      tax: 28.70,
      deliveryFee: 15,
      discount: 20,
      total: 228.70
    });
  };

  // حساب رسوم المعالجة
  const calculateProcessingFee = (method: PaymentMethod | undefined, amount: number): number => {
    if (!method) return 0;
    if (method.processingFeeType === 'percentage') {
      return Math.round(amount * method.processingFee * 100) / 100;
    }
    return method.processingFee;
  };

  // بدء عملية الدفع
  const initiatePayment = async () => {
    if (!selectedMethod || !orderSummary) return;

    setProcessing(true);
    
    try {
      const method = paymentMethods.find(m => m.id === selectedMethod);
      
      const response = await fetch('/api/payments/create', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept-Language': 'ar',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({
          orderId: orderSummary.orderId,
          amount: orderSummary.total,
          currency: 'EGP',
          paymentMethod: selectedMethod,
          phoneNumber: phoneNumber || undefined
        })
      });

      const data = await response.json();
      
      if (data.success) {
        setPaymentResult(data);
        
        if (method?.requiresOtp) {
          setStep('otp');
        } else if (method?.requiresReference || data.data?.instructions?.type === 'REFERENCE_PAYMENT') {
          setStep('result');
        } else {
          setStep('result');
        }
      } else {
        setPaymentResult({
          success: false,
          error: data.error || 'فشل في إنشاء عملية الدفع'
        });
        setStep('result');
      }
    } catch (error) {
      setPaymentResult({
        success: false,
        error: 'حدث خطأ في الاتصال بالخادم'
      });
      setStep('result');
    } finally {
      setProcessing(false);
    }
  };

  // التحقق من OTP
  const verifyOtp = async () => {
    if (!otp || otp.length !== 6) return;

    setProcessing(true);
    
    try {
      const response = await fetch('/api/payments/verify-otp', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept-Language': 'ar',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({
          paymentId: paymentResult?.paymentId,
          otp
        })
      });

      const data = await response.json();
      
      setPaymentResult(data);
      setStep('result');
    } catch (error) {
      setPaymentResult({
        success: false,
        error: 'فشل في التحقق من رمز OTP'
      });
      setStep('result');
    } finally {
      setProcessing(false);
    }
  };

  // عرض أيقونة طريقة الدفع
  const getMethodIcon = (iconName: string) => {
    const IconComponent = PaymentMethodIcons[iconName] || BanknotesIcon;
    return IconComponent;
  };

  // تنسيق المبلغ
  const formatAmount = (amount: number): string => {
    return `${amount.toLocaleString('ar-EG')} ج.م`;
  };

  const selectedPaymentMethod = paymentMethods.find(m => m.id === selectedMethod);
  const processingFee = calculateProcessingFee(selectedPaymentMethod, orderSummary?.total || 0);
  const finalTotal = (orderSummary?.total || 0) + processingFee;

  return (
    <ArabicLayout 
      sidebarCollapsed={sidebarCollapsed}
      onSidebarToggle={() => setSidebarCollapsed(!sidebarCollapsed)}
    >
      <div className="max-w-4xl mx-auto py-8 px-4">
        {/* العنوان */}
        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">
            إتمام عملية الدفع
          </h1>
          <p className="text-gray-600">
            اختر طريقة الدفع المناسبة لإتمام طلبك
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* القسم الرئيسي */}
          <div className="lg:col-span-2">
            {step === 'select' && (
              <div className="bg-white rounded-lg shadow-md p-6">
                <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                  <CreditCardIcon className="w-5 h-5 ml-2 text-blue-600" />
                  اختر طريقة الدفع
                </h2>

                {loading ? (
                  <div className="flex items-center justify-center py-12">
                    <ArrowPathIcon className="w-8 h-8 text-blue-600 animate-spin" />
                    <span className="mr-2 text-gray-600">جاري التحميل...</span>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {paymentMethods.map((method) => {
                      const IconComponent = getMethodIcon(method.icon);
                      const fee = calculateProcessingFee(method, orderSummary?.total || 0);
                      
                      return (
                        <div
                          key={method.id}
                          onClick={() => setSelectedMethod(method.id)}
                          className={`
                            border rounded-lg p-4 cursor-pointer transition-all
                            ${selectedMethod === method.id 
                              ? 'border-blue-500 bg-blue-50 ring-2 ring-blue-200' 
                              : 'border-gray-200 hover:border-blue-300 hover:bg-gray-50'
                            }
                          `}
                        >
                          <div className="flex items-center justify-between">
                            <div className="flex items-center">
                              <div className={`
                                w-12 h-12 rounded-full flex items-center justify-center
                                ${selectedMethod === method.id ? 'bg-blue-100' : 'bg-gray-100'}
                              `}>
                                <IconComponent className={`w-6 h-6 ${selectedMethod === method.id ? 'text-blue-600' : 'text-gray-600'}`} />
                              </div>
                              <div className="mr-4">
                                <h3 className="font-medium text-gray-900">{method.name}</h3>
                                <p className="text-sm text-gray-500">{method.nameEn}</p>
                              </div>
                            </div>
                            <div className="text-left">
                              {fee > 0 ? (
                                <span className="text-sm text-gray-500">
                                  رسوم: {formatAmount(fee)}
                                </span>
                              ) : (
                                <span className="text-sm text-green-600">بدون رسوم</span>
                              )}
                            </div>
                          </div>

                          {/* حقول إضافية للمحافظ الإلكترونية */}
                          {selectedMethod === method.id && method.requiresOtp && (
                            <div className="mt-4 pt-4 border-t border-gray-200">
                              <label className="block text-sm font-medium text-gray-700 mb-2">
                                رقم الهاتف المحمول
                              </label>
                              <input
                                type="tel"
                                value={phoneNumber}
                                onChange={(e) => setPhoneNumber(e.target.value)}
                                placeholder="01xxxxxxxxx"
                                className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                                dir="ltr"
                              />
                            </div>
                          )}

                          {/* حقول البطاقة */}
                          {selectedMethod === method.id && method.id === 'CARD' && (
                            <div className="mt-4 pt-4 border-t border-gray-200 space-y-3">
                              <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                  رقم البطاقة
                                </label>
                                <input
                                  type="text"
                                  value={cardDetails.number}
                                  onChange={(e) => setCardDetails({...cardDetails, number: e.target.value})}
                                  placeholder="xxxx xxxx xxxx xxxx"
                                  className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                                  dir="ltr"
                                />
                              </div>
                              <div className="grid grid-cols-3 gap-3">
                                <div className="col-span-2">
                                  <label className="block text-sm font-medium text-gray-700 mb-2">
                                    تاريخ الانتهاء
                                  </label>
                                  <input
                                    type="text"
                                    value={cardDetails.expiry}
                                    onChange={(e) => setCardDetails({...cardDetails, expiry: e.target.value})}
                                    placeholder="MM/YY"
                                    className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                                    dir="ltr"
                                  />
                                </div>
                                <div>
                                  <label className="block text-sm font-medium text-gray-700 mb-2">
                                    CVV
                                  </label>
                                  <input
                                    type="text"
                                    value={cardDetails.cvv}
                                    onChange={(e) => setCardDetails({...cardDetails, cvv: e.target.value})}
                                    placeholder="xxx"
                                    maxLength={4}
                                    className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                                    dir="ltr"
                                  />
                                </div>
                              </div>
                              <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                  الاسم على البطاقة
                                </label>
                                <input
                                  type="text"
                                  value={cardDetails.name}
                                  onChange={(e) => setCardDetails({...cardDetails, name: e.target.value})}
                                  placeholder="AHMED MOHAMED"
                                  className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                                  dir="ltr"
                                />
                              </div>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}

                {/* زر المتابعة */}
                <div className="mt-6">
                  <ArabicButton
                    variant="primary"
                    onClick={initiatePayment}
                    disabled={!selectedMethod || processing}
                    className="w-full"
                  >
                    {processing ? (
                      <span className="flex items-center justify-center">
                        <ArrowPathIcon className="w-5 h-5 ml-2 animate-spin" />
                        جاري المعالجة...
                      </span>
                    ) : (
                      `ادفع ${formatAmount(finalTotal)}`
                    )}
                  </ArabicButton>
                </div>

                {/* شعار الأمان */}
                <div className="mt-4 flex items-center justify-center text-sm text-gray-500">
                  <ShieldCheckIcon className="w-4 h-4 ml-1 text-green-600" />
                  معاملاتك محمية ومشفرة بالكامل
                </div>
              </div>
            )}

            {/* خطوة إدخال OTP */}
            {step === 'otp' && (
              <div className="bg-white rounded-lg shadow-md p-6 text-center">
                <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <DevicePhoneMobileIcon className="w-8 h-8 text-blue-600" />
                </div>
                <h2 className="text-xl font-semibold text-gray-900 mb-2">
                  أدخل رمز التحقق
                </h2>
                <p className="text-gray-600 mb-6">
                  تم إرسال رمز تحقق مكون من 6 أرقام إلى رقم {phoneNumber}
                </p>

                <div className="max-w-xs mx-auto mb-6">
                  <input
                    type="text"
                    value={otp}
                    onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
                    placeholder="------"
                    maxLength={6}
                    className="w-full text-center text-2xl tracking-widest px-4 py-3 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                    dir="ltr"
                  />
                </div>

                <ArabicButton
                  variant="primary"
                  onClick={verifyOtp}
                  disabled={otp.length !== 6 || processing}
                  className="w-full max-w-xs mx-auto"
                >
                  {processing ? 'جاري التحقق...' : 'تأكيد'}
                </ArabicButton>

                <button
                  onClick={() => setStep('select')}
                  className="mt-4 text-sm text-blue-600 hover:underline"
                >
                  تغيير طريقة الدفع
                </button>
              </div>
            )}

            {/* خطوة النتيجة */}
            {step === 'result' && paymentResult && (
              <div className="bg-white rounded-lg shadow-md p-6 text-center">
                {paymentResult.success ? (
                  <>
                    <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                      <CheckCircleIcon className="w-12 h-12 text-green-600" />
                    </div>
                    <h2 className="text-xl font-semibold text-green-600 mb-2">
                      {paymentResult.statusText || 'تمت العملية بنجاح'}
                    </h2>

                    {paymentResult.instructions?.type === 'REFERENCE_PAYMENT' && (
                      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mt-4 text-right">
                        <h3 className="font-medium text-yellow-800 mb-2">
                          تعليمات الدفع
                        </h3>
                        <p className="text-yellow-700 mb-2">
                          {paymentResult.instructions.message}
                        </p>
                        <div className="bg-white rounded p-3 mt-2">
                          <span className="text-sm text-gray-500">الرقم المرجعي:</span>
                          <p className="text-2xl font-bold text-gray-900 tracking-wider" dir="ltr">
                            {paymentResult.instructions.reference}
                          </p>
                        </div>
                        {paymentResult.instructions.expiresAt && (
                          <p className="text-sm text-yellow-600 mt-2">
                            <ClockIcon className="w-4 h-4 inline ml-1" />
                            صالح حتى: {new Date(paymentResult.instructions.expiresAt).toLocaleDateString('ar-EG')}
                          </p>
                        )}
                      </div>
                    )}

                    {paymentResult.reference && paymentResult.instructions?.type !== 'REFERENCE_PAYMENT' && (
                      <p className="text-gray-600 mt-2">
                        رقم العملية: <span className="font-mono">{paymentResult.reference}</span>
                      </p>
                    )}

                    <div className="mt-6 space-y-3">
                      <ArabicButton
                        variant="primary"
                        onClick={() => window.location.href = '/orders'}
                        className="w-full max-w-xs mx-auto"
                      >
                        عرض الطلبات
                      </ArabicButton>
                      <ArabicButton
                        variant="secondary"
                        onClick={() => window.location.href = '/invoices/' + paymentResult.paymentId}
                        className="w-full max-w-xs mx-auto flex items-center justify-center"
                      >
                        <DocumentTextIcon className="w-5 h-5 ml-2" />
                        عرض الفاتورة
                      </ArabicButton>
                    </div>
                  </>
                ) : (
                  <>
                    <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                      <XCircleIcon className="w-12 h-12 text-red-600" />
                    </div>
                    <h2 className="text-xl font-semibold text-red-600 mb-2">
                      فشل في إتمام الدفع
                    </h2>
                    <p className="text-gray-600 mb-6">
                      {paymentResult.error}
                    </p>
                    <ArabicButton
                      variant="primary"
                      onClick={() => {
                        setPaymentResult(null);
                        setStep('select');
                      }}
                      className="w-full max-w-xs mx-auto"
                    >
                      المحاولة مرة أخرى
                    </ArabicButton>
                  </>
                )}
              </div>
            )}
          </div>

          {/* ملخص الطلب */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-lg shadow-md p-6 sticky top-4">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">
                ملخص الطلب
              </h2>

              {orderSummary && (
                <>
                  {/* عناصر الطلب */}
                  <div className="space-y-3 mb-4">
                    {orderSummary.items.map((item, index) => (
                      <div key={index} className="flex justify-between text-sm">
                        <span className="text-gray-600">
                          {item.name} × {item.quantity}
                        </span>
                        <span className="text-gray-900">
                          {formatAmount(item.price * item.quantity)}
                        </span>
                      </div>
                    ))}
                  </div>

                  <div className="border-t border-gray-200 pt-4 space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">المجموع الفرعي</span>
                      <span className="text-gray-900">{formatAmount(orderSummary.subtotal)}</span>
                    </div>
                    
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">الضريبة (14%)</span>
                      <span className="text-gray-900">{formatAmount(orderSummary.tax)}</span>
                    </div>
                    
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">رسوم التوصيل</span>
                      <span className="text-gray-900">{formatAmount(orderSummary.deliveryFee)}</span>
                    </div>
                    
                    {orderSummary.discount > 0 && (
                      <div className="flex justify-between text-sm text-green-600">
                        <span>الخصم</span>
                        <span>-{formatAmount(orderSummary.discount)}</span>
                      </div>
                    )}

                    {processingFee > 0 && (
                      <div className="flex justify-between text-sm text-gray-500">
                        <span>رسوم المعالجة</span>
                        <span>{formatAmount(processingFee)}</span>
                      </div>
                    )}
                  </div>

                  <div className="border-t border-gray-200 mt-4 pt-4">
                    <div className="flex justify-between">
                      <span className="text-lg font-semibold text-gray-900">الإجمالي</span>
                      <span className="text-lg font-bold text-blue-600">{formatAmount(finalTotal)}</span>
                    </div>
                  </div>
                </>
              )}
            </div>

            {/* معلومات إضافية */}
            <div className="bg-gray-50 rounded-lg p-4 mt-4">
              <h3 className="font-medium text-gray-900 mb-2">طرق الدفع المتاحة</h3>
              <ul className="text-sm text-gray-600 space-y-1">
                <li>✓ فودافون كاش</li>
                <li>✓ أورانج موني</li>
                <li>✓ اتصالات كاش</li>
                <li>✓ فوري</li>
                <li>✓ البطاقة البنكية</li>
                <li>✓ الدفع عند الاستلام</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </ArabicLayout>
  );
};

export default ArabicPayment;
