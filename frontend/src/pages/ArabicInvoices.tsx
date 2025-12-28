/**
 * صفحة الفواتير العربية
 * Arabic Invoices Page with RTL Support
 */

import React, { useState, useEffect } from 'react';
import ArabicLayout from '../components/layout/ArabicLayout';
import ArabicButton from '../components/forms/ArabicButton';

// أيقونات بسيطة باستخدام SVG
const DocumentIcon = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
  </svg>
);

const DownloadIcon = () => (
  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
  </svg>
);

const EyeIcon = () => (
  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
  </svg>
);

const PrintIcon = () => (
  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
  </svg>
);

// أنواع البيانات
interface Invoice {
  id: string;
  invoiceNumber: string;
  createdAt: string;
  createdAtFormatted: string;
  createdAtHijri: string;
  createdAtCombined: string;
  totalAmount: number;
  totalAmountFormatted: string;
  totalAmountInWords: string;
  status: string;
  statusInfo: {
    name: string;
    color: string;
  };
  customer: {
    name: string;
    email: string;
  };
  order: {
    id: string;
    orderNumber: string;
  } | null;
  items: Array<{
    name: string;
    nameAr: string;
    quantity: number;
    unitPrice: number;
    total: number;
    unitPriceFormatted: string;
    totalFormatted: string;
  }>;
}

interface InvoiceStatistics {
  counts: {
    total: number;
    paid: number;
    pending: number;
    overdue: number;
  };
  amounts: {
    total: number;
    totalFormatted: string;
    paid: number;
    paidFormatted: string;
    pending: number;
    pendingFormatted: string;
  };
  paymentRate: string;
}

const ArabicInvoices: React.FC = () => {
  // حالة المكون
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [statistics, setStatistics] = useState<InvoiceStatistics | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  // جلب الفواتير
  useEffect(() => {
    fetchInvoices();
    fetchStatistics();
  }, [statusFilter]);

  const fetchInvoices = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (statusFilter !== 'ALL') {
        params.append('status', statusFilter);
      }

      const response = await fetch(`/api/invoices?${params.toString()}`, {
        headers: {
          'Accept-Language': 'ar',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });

      const data = await response.json();
      
      if (data.success) {
        setInvoices(data.data.invoices || []);
      }
    } catch (error) {
      console.error('خطأ في جلب الفواتير:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchStatistics = async () => {
    try {
      const response = await fetch('/api/invoices/statistics', {
        headers: {
          'Accept-Language': 'ar',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });

      const data = await response.json();
      
      if (data.success) {
        setStatistics(data.data);
      }
    } catch (error) {
      console.error('خطأ في جلب الإحصائيات:', error);
    }
  };

  // تحميل PDF
  const downloadPdf = async (invoiceId: string, invoiceNumber: string) => {
    try {
      const response = await fetch(`/api/invoices/${invoiceId}/pdf`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });

      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `فاتورة-${invoiceNumber}.pdf`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
      }
    } catch (error) {
      console.error('خطأ في تحميل PDF:', error);
    }
  };

  // طباعة الفاتورة
  const printInvoice = (invoice: Invoice) => {
    const printWindow = window.open('', '_blank');
    if (!printWindow) return;

    const content = `
      <!DOCTYPE html>
      <html dir="rtl" lang="ar">
      <head>
        <meta charset="UTF-8">
        <title>فاتورة ${invoice.invoiceNumber}</title>
        <style>
          body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; padding: 40px; direction: rtl; }
          .header { text-align: center; margin-bottom: 30px; }
          .company-name { font-size: 24px; font-weight: bold; color: #1e40af; }
          .invoice-title { font-size: 20px; margin-top: 10px; }
          .info-section { display: flex; justify-content: space-between; margin-bottom: 20px; }
          .info-block { flex: 1; }
          .info-label { color: #666; font-size: 12px; }
          .info-value { font-weight: bold; }
          table { width: 100%; border-collapse: collapse; margin: 20px 0; }
          th, td { border: 1px solid #ddd; padding: 10px; text-align: right; }
          th { background: #f5f5f5; }
          .totals { text-align: left; margin-top: 20px; }
          .total-row { display: flex; justify-content: space-between; padding: 5px 0; }
          .grand-total { font-size: 18px; font-weight: bold; color: #1e40af; border-top: 2px solid #1e40af; padding-top: 10px; }
          .amount-words { background: #f5f5f5; padding: 10px; margin-top: 20px; border-radius: 4px; }
          .footer { text-align: center; margin-top: 40px; font-size: 12px; color: #666; }
          @media print { body { padding: 20px; } }
        </style>
      </head>
      <body>
        <div class="header">
          <div class="company-name">بريك آب - BreakApp</div>
          <div class="invoice-title">فاتورة ضريبية</div>
        </div>
        
        <div class="info-section">
          <div class="info-block">
            <div class="info-label">رقم الفاتورة</div>
            <div class="info-value">${invoice.invoiceNumber}</div>
          </div>
          <div class="info-block">
            <div class="info-label">التاريخ</div>
            <div class="info-value">${invoice.createdAtCombined}</div>
          </div>
          <div class="info-block">
            <div class="info-label">العميل</div>
            <div class="info-value">${invoice.customer?.name || '-'}</div>
          </div>
        </div>
        
        <table>
          <thead>
            <tr>
              <th>البند</th>
              <th>الكمية</th>
              <th>سعر الوحدة</th>
              <th>الإجمالي</th>
            </tr>
          </thead>
          <tbody>
            ${invoice.items?.map(item => `
              <tr>
                <td>${item.nameAr || item.name}</td>
                <td>${item.quantity}</td>
                <td>${item.unitPriceFormatted}</td>
                <td>${item.totalFormatted}</td>
              </tr>
            `).join('')}
          </tbody>
        </table>
        
        <div class="totals">
          <div class="total-row grand-total">
            <span>الإجمالي:</span>
            <span>${invoice.totalAmountFormatted}</span>
          </div>
        </div>
        
        <div class="amount-words">
          فقط ${invoice.totalAmountInWords} لا غير
        </div>
        
        <div class="footer">
          تم الإنشاء في ${new Date().toLocaleDateString('ar-EG')} - BreakApp
        </div>
      </body>
      </html>
    `;

    printWindow.document.write(content);
    printWindow.document.close();
    printWindow.focus();
    printWindow.print();
  };

  // ألوان الحالات
  const getStatusBadge = (status: string, statusInfo: { name: string; color: string }) => {
    const colorClasses: Record<string, string> = {
      PAID: 'bg-green-100 text-green-800',
      PENDING: 'bg-yellow-100 text-yellow-800',
      OVERDUE: 'bg-red-100 text-red-800',
      CANCELLED: 'bg-gray-100 text-gray-800',
      REFUNDED: 'bg-purple-100 text-purple-800'
    };

    return (
      <span className={`px-2 py-1 rounded-full text-xs font-medium ${colorClasses[status] || 'bg-gray-100 text-gray-800'}`}>
        {statusInfo.name}
      </span>
    );
  };

  return (
    <ArabicLayout 
      sidebarCollapsed={sidebarCollapsed}
      onSidebarToggle={() => setSidebarCollapsed(!sidebarCollapsed)}
    >
      <div className="space-y-6">
        {/* العنوان */}
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 flex items-center">
              <DocumentIcon />
              <span className="mr-2">الفواتير</span>
            </h1>
            <p className="mt-1 text-sm text-gray-600">
              إدارة وعرض جميع الفواتير
            </p>
          </div>
        </div>

        {/* الإحصائيات */}
        {statistics && (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="bg-white rounded-lg shadow p-4">
              <div className="text-sm text-gray-500">إجمالي الفواتير</div>
              <div className="text-2xl font-bold text-gray-900">{statistics.counts.total}</div>
              <div className="text-sm text-gray-600">{statistics.amounts.totalFormatted}</div>
            </div>
            <div className="bg-white rounded-lg shadow p-4">
              <div className="text-sm text-gray-500">المدفوعة</div>
              <div className="text-2xl font-bold text-green-600">{statistics.counts.paid}</div>
              <div className="text-sm text-green-600">{statistics.amounts.paidFormatted}</div>
            </div>
            <div className="bg-white rounded-lg shadow p-4">
              <div className="text-sm text-gray-500">في الانتظار</div>
              <div className="text-2xl font-bold text-yellow-600">{statistics.counts.pending}</div>
              <div className="text-sm text-yellow-600">{statistics.amounts.pendingFormatted}</div>
            </div>
            <div className="bg-white rounded-lg shadow p-4">
              <div className="text-sm text-gray-500">نسبة التحصيل</div>
              <div className="text-2xl font-bold text-blue-600">{statistics.paymentRate}</div>
            </div>
          </div>
        )}

        {/* فلتر الحالة */}
        <div className="bg-white rounded-lg shadow p-4">
          <div className="flex items-center space-x-4 space-x-reverse">
            <label className="text-sm text-gray-700">تصفية حسب الحالة:</label>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="border border-gray-300 rounded-md px-3 py-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="ALL">الكل</option>
              <option value="PAID">مدفوعة</option>
              <option value="PENDING">في الانتظار</option>
              <option value="OVERDUE">متأخرة</option>
              <option value="CANCELLED">ملغاة</option>
            </select>
          </div>
        </div>

        {/* قائمة الفواتير */}
        <div className="bg-white rounded-lg shadow overflow-hidden">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
              <span className="mr-2 text-gray-600">جاري التحميل...</span>
            </div>
          ) : invoices.length === 0 ? (
            <div className="text-center py-12">
              <DocumentIcon />
              <p className="mt-2 text-gray-500">لا توجد فواتير</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                      رقم الفاتورة
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                      التاريخ
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                      العميل
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                      المبلغ
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                      الحالة
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                      الإجراءات
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {invoices.map((invoice) => (
                    <tr key={invoice.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="font-medium text-blue-600">{invoice.invoiceNumber}</span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">{invoice.createdAtFormatted}</div>
                        <div className="text-xs text-gray-500">{invoice.createdAtHijri}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">{invoice.customer?.name || '-'}</div>
                        <div className="text-xs text-gray-500">{invoice.customer?.email}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="font-medium text-gray-900">{invoice.totalAmountFormatted}</span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {getStatusBadge(invoice.status, invoice.statusInfo)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex space-x-2 space-x-reverse">
                          <button
                            onClick={() => {
                              setSelectedInvoice(invoice);
                              setShowModal(true);
                            }}
                            className="text-blue-600 hover:text-blue-800 p-1"
                            title="عرض"
                          >
                            <EyeIcon />
                          </button>
                          <button
                            onClick={() => downloadPdf(invoice.id, invoice.invoiceNumber)}
                            className="text-green-600 hover:text-green-800 p-1"
                            title="تحميل PDF"
                          >
                            <DownloadIcon />
                          </button>
                          <button
                            onClick={() => printInvoice(invoice)}
                            className="text-gray-600 hover:text-gray-800 p-1"
                            title="طباعة"
                          >
                            <PrintIcon />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* نافذة تفاصيل الفاتورة */}
        {showModal && selectedInvoice && (
          <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
            <div className="relative top-10 mx-auto p-5 border w-11/12 md:w-3/4 lg:w-1/2 shadow-lg rounded-lg bg-white">
              {/* رأس النافذة */}
              <div className="flex justify-between items-center border-b pb-4 mb-4">
                <h3 className="text-xl font-bold text-gray-900">
                  فاتورة رقم {selectedInvoice.invoiceNumber}
                </h3>
                <button
                  onClick={() => setShowModal(false)}
                  className="text-gray-400 hover:text-gray-600 text-2xl"
                >
                  ×
                </button>
              </div>

              {/* معلومات الفاتورة */}
              <div className="grid grid-cols-2 gap-4 mb-6">
                <div>
                  <span className="text-sm text-gray-500">التاريخ الميلادي:</span>
                  <p className="font-medium">{selectedInvoice.createdAtFormatted}</p>
                </div>
                <div>
                  <span className="text-sm text-gray-500">التاريخ الهجري:</span>
                  <p className="font-medium">{selectedInvoice.createdAtHijri}</p>
                </div>
                <div>
                  <span className="text-sm text-gray-500">العميل:</span>
                  <p className="font-medium">{selectedInvoice.customer?.name}</p>
                </div>
                <div>
                  <span className="text-sm text-gray-500">الحالة:</span>
                  <p>{getStatusBadge(selectedInvoice.status, selectedInvoice.statusInfo)}</p>
                </div>
              </div>

              {/* جدول العناصر */}
              <div className="border rounded-lg overflow-hidden mb-4">
                <table className="min-w-full">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-4 py-2 text-right text-sm">البند</th>
                      <th className="px-4 py-2 text-right text-sm">الكمية</th>
                      <th className="px-4 py-2 text-right text-sm">السعر</th>
                      <th className="px-4 py-2 text-right text-sm">الإجمالي</th>
                    </tr>
                  </thead>
                  <tbody>
                    {selectedInvoice.items?.map((item, index) => (
                      <tr key={index} className="border-t">
                        <td className="px-4 py-2">{item.nameAr || item.name}</td>
                        <td className="px-4 py-2">{item.quantity}</td>
                        <td className="px-4 py-2">{item.unitPriceFormatted}</td>
                        <td className="px-4 py-2">{item.totalFormatted}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* الإجمالي */}
              <div className="bg-gray-50 rounded-lg p-4 mb-4">
                <div className="flex justify-between items-center text-lg font-bold">
                  <span>الإجمالي:</span>
                  <span className="text-blue-600">{selectedInvoice.totalAmountFormatted}</span>
                </div>
                <p className="text-sm text-gray-600 mt-2">
                  فقط {selectedInvoice.totalAmountInWords} لا غير
                </p>
              </div>

              {/* أزرار الإجراءات */}
              <div className="flex justify-end space-x-3 space-x-reverse">
                <ArabicButton
                  variant="secondary"
                  onClick={() => setShowModal(false)}
                >
                  إغلاق
                </ArabicButton>
                <ArabicButton
                  variant="primary"
                  onClick={() => downloadPdf(selectedInvoice.id, selectedInvoice.invoiceNumber)}
                >
                  تحميل PDF
                </ArabicButton>
                <ArabicButton
                  variant="secondary"
                  onClick={() => printInvoice(selectedInvoice)}
                >
                  طباعة
                </ArabicButton>
              </div>
            </div>
          </div>
        )}
      </div>
    </ArabicLayout>
  );
};

export default ArabicInvoices;
