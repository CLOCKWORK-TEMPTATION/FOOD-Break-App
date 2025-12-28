import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Input from '../ui/Input';
import Button from '../ui/Button';
import LoadingSpinner from '../ui/LoadingSpinner';
import paymentService from '../../services/paymentService';

interface PaymentFormProps {
  amount: number;
  currency?: string;
  onPaymentSuccess: (paymentResult: any) => void;
  onPaymentError: (error: string) => void;
  savedPaymentMethods?: any[];
  allowSaveCard?: boolean;
}

const PaymentForm: React.FC<PaymentFormProps> = ({
  amount,
  currency = 'EGP',
  onPaymentSuccess,
  onPaymentError,
  savedPaymentMethods = [],
  allowSaveCard = true,
}) => {
  const [loading, setLoading] = useState(false);
  const [cardNumber, setCardNumber] = useState('');
  const [expiryDate, setExpiryDate] = useState('');
  const [cvv, setCvv] = useState('');
  const [cardholderName, setCardholderName] = useState('');
  const [saveCard, setSaveCard] = useState(false);
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState<string | null>(null);
  const [errors, setErrors] = useState<{ [key: string]: string }>({});

  const formatCardNumber = (text: string) => {
    // Remove all non-digit characters
    const cleaned = text.replace(/\D/g, '');
    
    // Add space every 4 digits
    const formatted = cleaned.replace(/(\d{4})(?=\d)/g, '$1 ');
    
    return formatted;
  };

  const formatExpiryDate = (text: string) => {
    // Remove all non-digit characters
    const cleaned = text.replace(/\D/g, '');
    
    // Add slash after 2 digits
    if (cleaned.length >= 2) {
      return cleaned.slice(0, 2) + '/' + cleaned.slice(2, 4);
    }
    
    return cleaned;
  };

  const handleCardNumberChange = (text: string) => {
    const formatted = formatCardNumber(text);
    setCardNumber(formatted);
    
    // Validate card number
    if (formatted.replace(/\s/g, '').length > 0) {
      const isValid = paymentService.validateCardNumber(formatted);
      setErrors(prev => ({
        ...prev,
        cardNumber: isValid ? '' : 'رقم البطاقة غير صالح'
      }));
    }
  };

  const handleExpiryDateChange = (text: string) => {
    const formatted = formatExpiryDate(text);
    setExpiryDate(formatted);
    
    // Validate expiry date
    if (formatted.length === 5) {
      const [month, year] = formatted.split('/');
      const currentDate = new Date();
      const currentYear = currentDate.getFullYear() % 100;
      const currentMonth = currentDate.getMonth() + 1;
      
      const monthNum = parseInt(month);
      const yearNum = parseInt(year);
      
      if (monthNum < 1 || monthNum > 12) {
        setErrors(prev => ({ ...prev, expiryDate: 'شهر غير صالح' }));
      } else if (yearNum < currentYear || (yearNum === currentYear && monthNum < currentMonth)) {
        setErrors(prev => ({ ...prev, expiryDate: 'تاريخ الانتهاء منتهي' }));
      } else {
        setErrors(prev => ({ ...prev, expiryDate: '' }));
      }
    }
  };

  const validateForm = () => {
    const newErrors: { [key: string]: string } = {};

    if (!selectedPaymentMethod) {
      if (!cardNumber.trim()) {
        newErrors.cardNumber = 'رقم البطاقة مطلوب';
      } else if (!paymentService.validateCardNumber(cardNumber)) {
        newErrors.cardNumber = 'رقم البطاقة غير صالح';
      }

      if (!expiryDate.trim()) {
        newErrors.expiryDate = 'تاريخ الانتهاء مطلوب';
      } else if (expiryDate.length !== 5) {
        newErrors.expiryDate = 'تاريخ الانتهاء غير مكتمل';
      }

      if (!cvv.trim()) {
        newErrors.cvv = 'رمز CVV مطلوب';
      } else if (cvv.length < 3 || cvv.length > 4) {
        newErrors.cvv = 'رمز CVV غير صالح';
      }

      if (!cardholderName.trim()) {
        newErrors.cardholderName = 'اسم حامل البطاقة مطلوب';
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handlePayment = async () => {
    if (!validateForm()) return;

    setLoading(true);
    try {
      let paymentResult;

      if (selectedPaymentMethod) {
        // Use saved payment method
        paymentResult = await paymentService.confirmPayment(
          selectedPaymentMethod,
          '' // paymentIntentId will be handled by backend
        );
      } else {
        // Create new payment method and process payment
        const paymentIntent = await paymentService.createPaymentIntent(amount, currency);
        
        // Here you would typically use Stripe's SDK to create a payment method
        // For now, we'll simulate the process
        const mockPaymentMethodId = 'pm_mock_' + Date.now();
        
        if (saveCard) {
          await paymentService.savePaymentMethod(mockPaymentMethodId);
        }

        paymentResult = await paymentService.confirmPayment(
          mockPaymentMethodId,
          paymentIntent.id
        );
      }

      if (paymentResult.success) {
        onPaymentSuccess(paymentResult);
      } else {
        onPaymentError(paymentResult.error || 'فشل معالجة الدفع');
      }
    } catch (error: any) {
      onPaymentError(error.message || 'حدث خطأ أثناء معالجة الدفع');
    } finally {
      setLoading(false);
    }
  };

  const renderSavedPaymentMethod = (method: any) => (
    <TouchableOpacity
      key={method.id}
      style={[
        styles.savedMethodCard,
        selectedPaymentMethod === method.id && styles.selectedMethodCard
      ]}
      onPress={() => setSelectedPaymentMethod(method.id)}
    >
      <View style={styles.methodInfo}>
        <Ionicons 
          name={method.type === 'visa' ? 'card' : 'card-outline'} 
          size={24} 
          color="#007AFF" 
        />
        <View style={styles.methodDetails}>
          <Text style={styles.methodType}>
            {method.type === 'card' ? 'بطاقة ائتمان' : method.type}
          </Text>
          <Text style={styles.methodLast4}>**** {method.last4}</Text>
        </View>
      </View>
      {selectedPaymentMethod === method.id && (
        <Ionicons name="checkmark-circle" size={24} color="#007AFF" />
      )}
    </TouchableOpacity>
  );

  if (loading) {
    return <LoadingSpinner fullScreen message="جاري معالجة الدفع..." />;
  }

  return (
    <ScrollView style={styles.container}>
      <View style={styles.content}>
        {/* Payment Amount */}
        <View style={styles.amountContainer}>
          <Text style={styles.amountLabel}>المبلغ الإجمالي</Text>
          <Text style={styles.amountText}>
            {amount.toFixed(2)} {currency}
          </Text>
        </View>

        {/* Saved Payment Methods */}
        {savedPaymentMethods.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>طرق الدفع المحفوظة</Text>
            {savedPaymentMethods.map(renderSavedPaymentMethod)}
            
            <TouchableOpacity
              style={styles.addNewCardButton}
              onPress={() => setSelectedPaymentMethod(null)}
            >
              <Ionicons name="add-circle-outline" size={20} color="#007AFF" />
              <Text style={styles.addNewCardText}>إضافة بطاقة جديدة</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* New Card Form */}
        {!selectedPaymentMethod && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>معلومات البطاقة</Text>
            
            <Input
              label="رقم البطاقة"
              placeholder="1234 5678 9012 3456"
              value={cardNumber}
              onChangeText={handleCardNumberChange}
              keyboardType="numeric"
              error={errors.cardNumber}
              maxLength={19}
            />

            <View style={styles.row}>
              <View style={styles.halfInput}>
                <Input
                  label="تاريخ الانتهاء"
                  placeholder="MM/YY"
                  value={expiryDate}
                  onChangeText={handleExpiryDateChange}
                  keyboardType="numeric"
                  error={errors.expiryDate}
                  maxLength={5}
                />
              </View>
              <View style={styles.halfInput}>
                <Input
                  label="CVV"
                  placeholder="123"
                  value={cvv}
                  onChangeText={setCvv}
                  keyboardType="numeric"
                  error={errors.cvv}
                  secureTextEntry
                  maxLength={4}
                />
              </View>
            </View>

            <Input
              label="اسم حامل البطاقة"
              placeholder="أدخل اسم حامل البطاقة"
              value={cardholderName}
              onChangeText={setCardholderName}
              error={errors.cardholderName}
            />

            {allowSaveCard && (
              <TouchableOpacity
                style={styles.saveCardContainer}
                onPress={() => setSaveCard(!saveCard)}
              >
                <Ionicons
                  name={saveCard ? 'checkbox-outline' : 'square-outline'}
                  size={20}
                  color="#007AFF"
                />
                <Text style={styles.saveCardText}>حفظ البطاقة للاستخدام المستقبلي</Text>
              </TouchableOpacity>
            )}
          </View>
        )}

        {/* Payment Button */}
        <Button
          title={`ادفع ${amount.toFixed(2)} ${currency}`}
          onPress={handlePayment}
          fullWidth
          size="large"
          style={styles.payButton}
        />

        {/* Security Notice */}
        <View style={styles.securityNotice}>
          <Ionicons name="lock-closed-outline" size={16} color="#666" />
          <Text style={styles.securityText}>
            تتم معالجة معلومات الدفع الخاصة بك بشكل آمن ومشفر
          </Text>
        </View>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  content: {
    padding: 20,
  },
  amountContainer: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 20,
    alignItems: 'center',
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  amountLabel: {
    fontSize: 16,
    color: '#666',
    marginBottom: 8,
  },
  amountText: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#333',
  },
  section: {
    marginBottom: 25,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 15,
  },
  savedMethodCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 15,
    marginBottom: 10,
    borderWidth: 2,
    borderColor: '#e9ecef',
  },
  selectedMethodCard: {
    borderColor: '#007AFF',
  },
  methodInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  methodDetails: {
    marginLeft: 12,
  },
  methodType: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  methodLast4: {
    fontSize: 14,
    color: '#666',
    marginTop: 2,
  },
  addNewCardButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 15,
    borderWidth: 2,
    borderColor: '#007AFF',
    borderStyle: 'dashed',
  },
  addNewCardText: {
    marginLeft: 8,
    color: '#007AFF',
    fontSize: 16,
    fontWeight: '600',
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  halfInput: {
    flex: 1,
    marginHorizontal: 5,
  },
  saveCardContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 15,
  },
  saveCardText: {
    marginLeft: 10,
    fontSize: 14,
    color: '#666',
  },
  payButton: {
    marginTop: 20,
  },
  securityNotice: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 20,
    padding: 10,
  },
  securityText: {
    marginLeft: 8,
    fontSize: 12,
    color: '#666',
    textAlign: 'center',
  },
});

export default PaymentForm;