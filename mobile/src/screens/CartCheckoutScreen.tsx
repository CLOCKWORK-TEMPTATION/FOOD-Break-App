/**
 * شاشة السلة والدفع
 * عرض المنتجات المضافة إلى السلة والدفع
 */

import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  SafeAreaView,
  Alert,
  ActivityIndicator,
  ScrollView,
  Modal,
  TextInput,
} from 'react-native';
import { useDispatch, useSelector } from 'react-redux';
import apiService from '../services/apiService';
import { clearCart, setCurrentOrder } from '../store';

export default function CartCheckoutScreen({ navigation, route }) {
  const dispatch = useDispatch();
  const { cart, cartTotal, selectedRestaurant } = useSelector(
    state => state.menu
  );
  const { currentProject } = useSelector(state => state.workflow);

  const [loading, setLoading] = useState(false);
  const [showPromoModal, setShowPromoModal] = useState(false);
  const [promoCode, setPromoCode] = useState('');
  const [discount, setDiscount] = useState(0);

  // حساب الإجمالي مع الخصم
  const subtotal = cartTotal;
  const deliveryFee = 15;
  const total = subtotal + deliveryFee - discount;

  const handleApplyPromo = async () => {
    if (!promoCode.trim()) {
      Alert.alert('خطأ', 'أدخل كود الخصم');
      return;
    }

    try {
      // هنا يمكن التحقق من كود الخصم من الـ Backend
      // للآن نفترض كود تجريبي
      if (promoCode === 'FIRST50') {
        setDiscount(Math.min(subtotal * 0.5, 50));
        setShowPromoModal(false);
        Alert.alert('نجاح', 'تم تطبيق كود الخصم بنجاح');
      } else {
        Alert.alert('خطأ', 'كود الخصم غير صحيح');
      }
    } catch (error) {
      Alert.alert('خطأ', 'فشل التحقق من الكود');
    }
  };

  const handleCheckout = async () => {
    if (!cart.length) {
      Alert.alert('خطأ', 'السلة فارغة');
      return;
    }

    if (!selectedRestaurant) {
      Alert.alert('خطأ', 'لم يتم اختيار مطعم');
      return;
    }

    try {
      setLoading(true);

      const orderData = {
        projectId: currentProject.id,
        restaurantId: selectedRestaurant.id,
        menuItems: cart.map(item => ({
          menuItemId: item.menuItemId,
          quantity: item.quantity,
        })),
        totalAmount: total,
        notes: '',
      };

      const response = await apiService.orderService.submitOrder(orderData);

      dispatch(setCurrentOrder(response.data));
      dispatch(clearCart());

      Alert.alert('نجاح', 'تم تقديم الطلب بنجاح');
      navigation.replace('OrderConfirmation', {
        orderId: response.data.id,
      });
    } catch (error) {
      Alert.alert('خطأ', error.message || 'فشل تقديم الطلب');
    } finally {
      setLoading(false);
    }
  };

  const renderCartItem = ({ item }) => (
    <View style={styles.cartItem}>
      <View style={styles.itemInfo}>
        <Text style={styles.itemName}>{item.name}</Text>
        <Text style={styles.itemPrice}>{item.price} SR</Text>
      </View>
      <View style={styles.quantityInfo}>
        <Text style={styles.quantity}>x{item.quantity}</Text>
        <Text style={styles.itemTotal}>
          {(item.price * item.quantity).toFixed(2)} SR
        </Text>
      </View>
    </View>
  );

  if (!selectedRestaurant) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyIcon}>🛒</Text>
          <Text style={styles.emptyText}>السلة فارغة</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text style={styles.backButton}>{'< رجوع'}</Text>
        </TouchableOpacity>
        <Text style={styles.title}>السلة</Text>
        <View style={styles.placeholder} />
      </View>

      {/* Restaurant Name */}
      <View style={styles.restaurantSection}>
        <Text style={styles.restaurantName}>{selectedRestaurant.name}</Text>
        <Text style={styles.itemCount}>{cart.length} عنصر في السلة</Text>
      </View>

      {/* Cart Items */}
      <FlatList
        data={cart}
        renderItem={renderCartItem}
        keyExtractor={item => item.menuItemId}
        scrollEnabled={false}
        contentContainerStyle={styles.cartItemsContainer}
      />

      {/* Summary and Checkout */}
      <ScrollView style={styles.summaryContainer}>
        {/* Delivery Address */}
        <View style={styles.deliverySection}>
          <Text style={styles.sectionTitle}>عنوان التوصيل</Text>
          <View style={styles.addressBox}>
            <Text style={styles.addressText}>
              {currentProject?.deliveryAddress || 'عنوان افتراضي'}
            </Text>
            <TouchableOpacity>
              <Text style={styles.changeLink}>تغيير</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Promo Code */}
        <View style={styles.promoSection}>
          <Text style={styles.sectionTitle}>كود الخصم</Text>
          <TouchableOpacity
            style={styles.promoButton}
            onPress={() => setShowPromoModal(true)}
          >
            <Text style={styles.promoButtonText}>
              {discount > 0 ? `خصم: ${discount.toFixed(2)} SR` : 'إضافة كود'}
            </Text>
          </TouchableOpacity>
        </View>

        {/* Price Summary */}
        <View style={styles.priceSummary}>
          <View style={styles.priceRow}>
            <Text style={styles.priceLabel}>السعر الفرعي</Text>
            <Text style={styles.priceValue}>{subtotal.toFixed(2)} SR</Text>
          </View>

          <View style={styles.priceRow}>
            <Text style={styles.priceLabel}>رسوم التوصيل</Text>
            <Text style={styles.priceValue}>{deliveryFee.toFixed(2)} SR</Text>
          </View>

          {discount > 0 && (
            <View style={styles.priceRow}>
              <Text style={styles.discountLabel}>الخصم</Text>
              <Text style={styles.discountValue}>-{discount.toFixed(2)} SR</Text>
            </View>
          )}

          <View style={styles.divider} />

          <View style={styles.totalRow}>
            <Text style={styles.totalLabel}>الإجمالي</Text>
            <Text style={styles.totalValue}>{total.toFixed(2)} SR</Text>
          </View>
        </View>

        {/* Terms and Conditions */}
        <View style={styles.termsSection}>
          <Text style={styles.termsText}>
            بالنقر على "تأكيد الطلب"، أوافق على شروط الخدمة وسياسة الخصوصية
          </Text>
        </View>
      </ScrollView>

      {/* Checkout Button */}
      <View style={styles.checkoutButtonContainer}>
        <TouchableOpacity
          style={[styles.checkoutButton, loading && styles.disabledButton]}
          onPress={handleCheckout}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator size="small" color="#fff" />
          ) : (
            <Text style={styles.checkoutButtonText}>تأكيد الطلب</Text>
          )}
        </TouchableOpacity>
      </View>

      {/* Promo Modal */}
      <Modal visible={showPromoModal} transparent animationType="slide">
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>كود الخصم</Text>

            <View style={styles.inputContainer}>
              <TextInput
                style={styles.promoInput}
                placeholder="أدخل كود الخصم"
                value={promoCode}
                onChangeText={setPromoCode}
                placeholderTextColor="#999"
              />
            </View>

            <View style={styles.modalButtonContainer}>
              <TouchableOpacity
                style={styles.modalButton}
                onPress={() => setShowPromoModal(false)}
              >
                <Text style={styles.modalButtonText}>إلغاء</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.modalButton, styles.applyButton]}
                onPress={handleApplyPromo}
              >
                <Text style={styles.applyButtonText}>تطبيق</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 16,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  backButton: {
    fontSize: 14,
    color: '#FF6B35',
    fontWeight: 'bold',
  },
  placeholder: {
    width: 50,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
  },
  restaurantSection: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#fff',
  },
  restaurantName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
  },
  itemCount: {
    fontSize: 12,
    color: '#666',
    marginTop: 4,
  },
  cartItemsContainer: {
    backgroundColor: '#fff',
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  cartItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  itemInfo: {
    flex: 1,
  },
  itemName: {
    fontSize: 14,
    color: '#333',
    fontWeight: '500',
  },
  itemPrice: {
    fontSize: 12,
    color: '#666',
    marginTop: 4,
  },
  quantityInfo: {
    alignItems: 'flex-end',
  },
  quantity: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#333',
  },
  itemTotal: {
    fontSize: 12,
    color: '#FF6B35',
    marginTop: 4,
    fontWeight: 'bold',
  },
  summaryContainer: {
    flex: 1,
    paddingHorizontal: 16,
  },
  deliverySection: {
    marginTop: 16,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 8,
  },
  addressBox: {
    backgroundColor: '#fff',
    padding: 12,
    borderRadius: 8,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  addressText: {
    fontSize: 13,
    color: '#666',
    flex: 1,
  },
  changeLink: {
    fontSize: 12,
    color: '#FF6B35',
    fontWeight: 'bold',
  },
  promoSection: {
    marginTop: 16,
  },
  promoButton: {
    backgroundColor: '#fff',
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  promoButtonText: {
    fontSize: 13,
    color: '#FF6B35',
    fontWeight: '500',
  },
  priceSummary: {
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 8,
    marginTop: 16,
  },
  priceRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  priceLabel: {
    fontSize: 13,
    color: '#666',
  },
  priceValue: {
    fontSize: 13,
    color: '#333',
    fontWeight: '500',
  },
  discountLabel: {
    fontSize: 13,
    color: '#4CAF50',
  },
  discountValue: {
    fontSize: 13,
    color: '#4CAF50',
    fontWeight: '500',
  },
  divider: {
    height: 1,
    backgroundColor: '#f0f0f0',
    marginVertical: 8,
  },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingTop: 8,
  },
  totalLabel: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
  },
  totalValue: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#FF6B35',
  },
  termsSection: {
    marginVertical: 16,
    paddingHorizontal: 4,
  },
  termsText: {
    fontSize: 11,
    color: '#999',
    lineHeight: 16,
  },
  checkoutButtonContainer: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#fff',
  },
  checkoutButton: {
    backgroundColor: '#FF6B35',
    paddingVertical: 14,
    borderRadius: 8,
    alignItems: 'center',
  },
  disabledButton: {
    opacity: 0.6,
  },
  checkoutButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyIcon: {
    fontSize: 60,
    marginBottom: 16,
  },
  emptyText: {
    fontSize: 16,
    color: '#666',
  },
  modalContainer: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    padding: 20,
    paddingBottom: 30,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 16,
  },
  inputContainer: {
    marginBottom: 16,
  },
  promoInput: {
    borderWidth: 1,
    borderColor: '#e0e0e0',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 14,
    color: '#333',
  },
  modalButtonContainer: {
    flexDirection: 'row',
    gap: 12,
  },
  modalButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    backgroundColor: '#f0f0f0',
    alignItems: 'center',
  },
  modalButtonText: {
    fontSize: 14,
    color: '#666',
    fontWeight: 'bold',
  },
  applyButton: {
    backgroundColor: '#FF6B35',
  },
  applyButtonText: {
    fontSize: 14,
    color: '#fff',
    fontWeight: 'bold',
  },
});
