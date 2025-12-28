import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Alert, AlertDescription } from './ui/alert';
import { Badge } from './ui/badge';
import { Separator } from './ui/separator';
import { 
  CreditCard, 
  Wallet, 
  Receipt, 
  CheckCircle, 
  AlertCircle,
  Download,
  Eye,
  Calendar,
  DollarSign
} from 'lucide-react';
import { formatArabicNumber, formatArabicCurrency, formatArabicDate } from '../utils/arabicFormatters';
import styles from './ArabicPayment.module.css';

interface PaymentMethod {
  id: string;
  type: 'credit_card' | 'debit_card' | 'wallet' | 'bank_transfer';
  name: string;
  details: string;
  isDefault: boolean;
}

interface Invoice {
  id: string;
  orderNumber: string;
  amount: number;
  tax: number;
  total: number;
  status: 'pending' | 'paid' | 'failed' | 'refunded';
  createdAt: string;
  paidAt?: string;
  items: InvoiceItem[];
}

interface InvoiceItem {
  id: string;
  name: string;
  quantity: number;
  price: number;
  total: number;
}

interface PaymentFormData {
  amount: number;
  paymentMethodId: string;
  description: string;
}

const ArabicPayment: React.FC = () => {
  const [paymentMethods, setPaymentMethods] = useState<PaymentMethod[]>([]);
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null);
  const [paymentForm, setPaymentForm] = useState<PaymentFormData>({
    amount: 0,
    paymentMethodId: '',
    description: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'payment' | 'invoices' | 'methods'>('payment');

  useEffect(() => {
    loadPaymentMethods();
    loadInvoices();
  }, []);

  const loadPaymentMethods = async () => {
    try {
      const response = await fetch('/api/payment/methods', {
        headers: {
          'Accept-Language': 'ar'
        }
      });
      const data = await response.json();
      if (data.success) {
        setPaymentMethods(data.data);
      }
    } catch (err) {
      console.error('خطأ في تحميل طرق الدفع:', err);
    }
  };

  const loadInvoices = async () => {
    try {
      const response = await fetch('/api/payment/invoices', {
        headers: {
          'Accept-Language': 'ar'
        }
      });
      const data = await response.json();
      if (data.success) {
        setInvoices(data.data);
      }
    } catch (err) {
      console.error('خطأ في تحميل الفواتير:', err);
    }
  };

  const handlePayment = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccess(null);

    try {
      const response = await fetch('/api/payment/process', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept-Language': 'ar'
        },
        body: JSON.stringify(paymentForm)
      });

      const data = await response.json();
      
      if (data.success) {
        setSuccess('تم الدفع بنجاح! سيتم تحديث حالة الطلب قريباً.');
        setPaymentForm({ amount: 0, paymentMethodId: '', description: '' });
        loadInvoices(); // إعادة تحميل الفواتير
      } else {
        setError(data.error?.message || 'فشل في معالجة الدفع');
      }
    } catch (err) {
      setError('حدث خطأ في الاتصال بالخادم');
    } finally {
      setLoading(false);
    }
  };

  const downloadInvoice = async (invoiceId: string) => {
    try {
      const response = await fetch(`/api/payment/invoices/${invoiceId}/download`, {
        headers: {
          'Accept-Language': 'ar'
        }
      });
      
      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `فاتورة-${invoiceId}.pdf`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
      }
    } catch (err) {
      console.error('خطأ في تحميل الفاتورة:', err);
    }
  };

  const getStatusBadge = (status: Invoice['status']) => {
    const statusConfig = {
      pending: { label: 'في الانتظار', variant: 'secondary' as const },
      paid: { label: 'مدفوعة', variant: 'default' as const },
      failed: { label: 'فشلت', variant: 'destructive' as const },
      refunded: { label: 'مستردة', variant: 'outline' as const }
    };

    const config = statusConfig[status];
    return <Badge variant={config.variant}>{config.label}</Badge>;
  };

  const getPaymentMethodIcon = (type: PaymentMethod['type']) => {
    switch (type) {
      case 'credit_card':
      case 'debit_card':
        return <CreditCard className="h-4 w-4" />;
      case 'wallet':
        return <Wallet className="h-4 w-4" />;
      default:
        return <DollarSign className="h-4 w-4" />;
    }
  };

  return (
    <div className={`${styles.container} space-y-6`} dir="rtl">
      {/* التبويبات */}
      <div className="flex space-x-1 space-x-reverse bg-muted p-1 rounded-lg">
        <Button
          variant={activeTab === 'payment' ? 'default' : 'ghost'}
          onClick={() => setActiveTab('payment')}
          className="flex-1"
        >
          <DollarSign className="h-4 w-4 ml-2" />
          دفع جديد
        </Button>
        <Button
          variant={activeTab === 'invoices' ? 'default' : 'ghost'}
          onClick={() => setActiveTab('invoices')}
          className="flex-1"
        >
          <Receipt className="h-4 w-4 ml-2" />
          الفواتير
        </Button>
        <Button
          variant={activeTab === 'methods' ? 'default' : 'ghost'}
          onClick={() => setActiveTab('methods')}
          className="flex-1"
        >
          <CreditCard className="h-4 w-4 ml-2" />
          طرق الدفع
        </Button>
      </div>

      {/* رسائل النجاح والخطأ */}
      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {success && (
        <Alert>
          <CheckCircle className="h-4 w-4" />
          <AlertDescription>{success}</AlertDescription>
        </Alert>
      )}

      {/* تبويب الدفع الجديد */}
      {activeTab === 'payment' && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <DollarSign className="h-5 w-5 ml-2" />
              إجراء دفعة جديدة
            </CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handlePayment} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="amount">المبلغ (ريال سعودي)</Label>
                  <Input
                    id="amount"
                    type="number"
                    step="0.01"
                    min="0"
                    value={paymentForm.amount || ''}
                    onChange={(e) => setPaymentForm(prev => ({
                      ...prev,
                      amount: parseFloat(e.target.value) || 0
                    }))}
                    placeholder="أدخل المبلغ"
                    required
                  />
                  {paymentForm.amount > 0 && (
                    <p className="text-sm text-muted-foreground">
                      المبلغ بالأرقام العربية: {formatArabicCurrency(paymentForm.amount)}
                    </p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="paymentMethod">طريقة الدفع</Label>
                  <Select
                    value={paymentForm.paymentMethodId}
                    onValueChange={(value) => setPaymentForm(prev => ({
                      ...prev,
                      paymentMethodId: value
                    }))}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="اختر طريقة الدفع" />
                    </SelectTrigger>
                    <SelectContent>
                      {paymentMethods.map((method) => (
                        <SelectItem key={method.id} value={method.id}>
                          <div className="flex items-center">
                            {getPaymentMethodIcon(method.type)}
                            <span className="mr-2">{method.name}</span>
                            {method.isDefault && (
                              <Badge variant="outline" className="mr-2">افتراضي</Badge>
                            )}
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">وصف الدفعة (اختياري)</Label>
                <Input
                  id="description"
                  value={paymentForm.description}
                  onChange={(e) => setPaymentForm(prev => ({
                    ...prev,
                    description: e.target.value
                  }))}
                  placeholder="أدخل وصف للدفعة"
                />
              </div>

              <Button 
                type="submit" 
                disabled={loading || !paymentForm.amount || !paymentForm.paymentMethodId}
                className="w-full"
              >
                {loading ? 'جاري المعالجة...' : 'تأكيد الدفع'}
              </Button>
            </form>
          </CardContent>
        </Card>
      )}

      {/* تبويب الفواتير */}
      {activeTab === 'invoices' && (
        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Receipt className="h-5 w-5 ml-2" />
                سجل الفواتير
              </CardTitle>
            </CardHeader>
            <CardContent>
              {invoices.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <Receipt className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>لا توجد فواتير حتى الآن</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {invoices.map((invoice) => (
                    <Card key={invoice.id} className="border">
                      <CardContent className="p-4">
                        <div className="flex justify-between items-start mb-4">
                          <div>
                            <h3 className="font-semibold">
                              فاتورة رقم {formatArabicNumber(invoice.orderNumber)}
                            </h3>
                            <p className="text-sm text-muted-foreground">
                              تاريخ الإنشاء: {formatArabicDate(invoice.createdAt)}
                            </p>
                            {invoice.paidAt && (
                              <p className="text-sm text-muted-foreground">
                                تاريخ الدفع: {formatArabicDate(invoice.paidAt)}
                              </p>
                            )}
                          </div>
                          <div className="text-left">
                            {getStatusBadge(invoice.status)}
                            <p className="text-lg font-bold mt-2">
                              {formatArabicCurrency(invoice.total)}
                            </p>
                          </div>
                        </div>

                        <Separator className="my-4" />

                        <div className="space-y-2">
                          <div className="flex justify-between text-sm">
                            <span>المبلغ الأساسي:</span>
                            <span>{formatArabicCurrency(invoice.amount)}</span>
                          </div>
                          <div className="flex justify-between text-sm">
                            <span>الضريبة:</span>
                            <span>{formatArabicCurrency(invoice.tax)}</span>
                          </div>
                          <div className="flex justify-between font-semibold">
                            <span>المجموع:</span>
                            <span>{formatArabicCurrency(invoice.total)}</span>
                          </div>
                        </div>

                        <div className="flex gap-2 mt-4">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setSelectedInvoice(invoice)}
                          >
                            <Eye className="h-4 w-4 ml-1" />
                            عرض التفاصيل
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => downloadInvoice(invoice.id)}
                          >
                            <Download className="h-4 w-4 ml-1" />
                            تحميل PDF
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      )}

      {/* تبويب طرق الدفع */}
      {activeTab === 'methods' && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <CreditCard className="h-5 w-5 ml-2" />
              طرق الدفع المحفوظة
            </CardTitle>
          </CardHeader>
          <CardContent>
            {paymentMethods.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <CreditCard className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>لا توجد طرق دفع محفوظة</p>
                <Button variant="outline" className="mt-4">
                  إضافة طريقة دفع جديدة
                </Button>
              </div>
            ) : (
              <div className="space-y-4">
                {paymentMethods.map((method) => (
                  <Card key={method.id} className="border">
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center">
                          {getPaymentMethodIcon(method.type)}
                          <div className="mr-3">
                            <h3 className="font-semibold">{method.name}</h3>
                            <p className="text-sm text-muted-foreground">
                              {method.details}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          {method.isDefault && (
                            <Badge variant="default">افتراضي</Badge>
                          )}
                          <Button variant="outline" size="sm">
                            تعديل
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* نافذة تفاصيل الفاتورة */}
      {selectedInvoice && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <Card className="w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span>تفاصيل الفاتورة رقم {formatArabicNumber(selectedInvoice.orderNumber)}</span>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setSelectedInvoice(null)}
                >
                  ✕
                </Button>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="font-semibold">رقم الفاتورة:</span>
                    <p>{formatArabicNumber(selectedInvoice.id)}</p>
                  </div>
                  <div>
                    <span className="font-semibold">الحالة:</span>
                    <p>{getStatusBadge(selectedInvoice.status)}</p>
                  </div>
                  <div>
                    <span className="font-semibold">تاريخ الإنشاء:</span>
                    <p>{formatArabicDate(selectedInvoice.createdAt)}</p>
                  </div>
                  {selectedInvoice.paidAt && (
                    <div>
                      <span className="font-semibold">تاريخ الدفع:</span>
                      <p>{formatArabicDate(selectedInvoice.paidAt)}</p>
                    </div>
                  )}
                </div>

                <Separator />

                <div>
                  <h3 className="font-semibold mb-3">تفاصيل الطلب:</h3>
                  <div className="space-y-2">
                    {selectedInvoice.items.map((item) => (
                      <div key={item.id} className="flex justify-between items-center py-2 border-b">
                        <div>
                          <p className="font-medium">{item.name}</p>
                          <p className="text-sm text-muted-foreground">
                            الكمية: {formatArabicNumber(item.quantity)} × {formatArabicCurrency(item.price)}
                          </p>
                        </div>
                        <p className="font-semibold">{formatArabicCurrency(item.total)}</p>
                      </div>
                    ))}
                  </div>
                </div>

                <Separator />

                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span>المبلغ الأساسي:</span>
                    <span>{formatArabicCurrency(selectedInvoice.amount)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>الضريبة ({formatArabicNumber(15)}%):</span>
                    <span>{formatArabicCurrency(selectedInvoice.tax)}</span>
                  </div>
                  <div className="flex justify-between text-lg font-bold">
                    <span>المجموع:</span>
                    <span>{formatArabicCurrency(selectedInvoice.total)}</span>
                  </div>
                </div>

                <div className="flex gap-2 pt-4">
                  <Button
                    onClick={() => downloadInvoice(selectedInvoice.id)}
                    className="flex-1"
                  >
                    <Download className="h-4 w-4 ml-1" />
                    تحميل الفاتورة
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => setSelectedInvoice(null)}
                    className="flex-1"
                  >
                    إغلاق
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
};

export default ArabicPayment;