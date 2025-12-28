import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Alert,
} from 'react-native';

const OrderConfirmationScreen = ({ route, navigation }) => {
  const { selectedItems, totalPrice, projectData } = route.params;
  const [isSubmitting, setIsSubmitting] = useState(false);

  // تقديم الطلب
  const submitOrder = async () => {
    setIsSubmitting(true);
    
    try {
      const orderData = {
        userId: 'user123', // TODO: جلب من المصادقة
        projectId: projectData.projectId,
        menuItems: selectedItems.map(item => ({
          itemId: item.id,
          itemName: item.name,
          restaurantId: item.restaurantId || 'rest1',
          restaurantName: item.restaurant,
          price: item.price,
          quantity: item.quantity,
        })),
        orderWindow: {
          startTime: new Date().setHours(7, 0, 0, 0),
          endTime: new Date().setHours(9, 0, 0, 0),
        },
      };

      const response = await fetch('/api/v1/workflow/orders', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(orderData),
      });

      const result = await response.json();

      if (result.success) {
        Alert.alert(
          'تم تقديم الطلب',
          'تم تقديم طلبك بنجاح. ستصلك إشعارات بحالة الطلب.',
          [
            {
              text: 'موافق',
              onPress: () => navigation.navigate('OrderTrackingScreen', {
                orderId: result.order.id,
              }),
            },
          ]
        );
      } else {
        Alert.alert('خطأ', result.error || 'فشل في تقديم الطلب');
      }
    } catch (error) {
      Alert.alert('خطأ', 'فشل في الاتصال بالخادم');
    } finally {
      setIsSubmitting(false);
    }
  };

  // عرض عنصر الطلب
  const renderOrderItem = ({ item }) => (
    <View style={styles.orderItem}>
      <View style={styles.itemInfo}>
        <Text style={styles.itemName}>{item.name}</Text>
        <Text style={styles.restaurantName}>{item.restaurant}</Text>
        <Text style={styles.itemPrice}>{item.price} جنيه × {item.quantity}</Text>
      </View>
      <Text style={styles.itemTotal}>
        {item.price * item.quantity} جنيه
      </Text>
    </View>
  );

  return (
    <View style={styles.container}>
      {/* رأس الشاشة */}
      <View style={styles.header}>
        <Text style={styles.title}>تأكيد الطلب</Text>
        <Text style={styles.projectName}>{projectData.projectName}</Text>
      </View>

      {/* قائمة العناصر المطلوبة */}
      <View style={styles.orderSection}>
        <Text style={styles.sectionTitle}>العناصر المطلوبة</Text>
        <FlatList
          data={selectedItems}
          renderItem={renderOrderItem}
          keyExtractor={(item) => item.id}
          style={styles.orderList}
        />
      </View>

      {/* ملخص الطلب */}
      <View style={styles.summarySection}>
        <View style={styles.summaryRow}>
          <Text style={styles.summaryLabel}>عدد العناصر:</Text>
          <Text style={styles.summaryValue}>
            {selectedItems.reduce((sum, item) => sum + item.quantity, 0)}
          </Text>
        </View>
        <View style={styles.summaryRow}>
          <Text style={styles.summaryLabel}>المجموع الفرعي:</Text>
          <Text style={styles.summaryValue}>{totalPrice} جنيه</Text>
        </View>
        <View style={styles.summaryRow}>
          <Text style={styles.summaryLabel}>رسوم التوصيل:</Text>
          <Text style={styles.summaryValue}>مجاناً</Text>
        </View>
        <View style={[styles.summaryRow, styles.totalRow]}>
          <Text style={styles.totalLabel}>المجموع الكلي:</Text>
          <Text style={styles.totalValue}>{totalPrice} جنيه</Text>
        </View>
      </View>

      {/* معلومات إضافية */}
      <View style={styles.infoSection}>
        <Text style={styles.infoTitle}>معلومات مهمة:</Text>
        <Text style={styles.infoText}>
          • سيتم توصيل الطلب خلال موقع التصوير
        </Text>
        <Text style={styles.infoText}>
          • ستصلك إشعارات بحالة الطلب
        </Text>
        <Text style={styles.infoText}>
          • يمكنك تتبع الطلب عبر GPS
        </Text>
      </View>

      {/* أزرار التحكم */}
      <View style={styles.buttonSection}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
          disabled={isSubmitting}
        >
          <Text style={styles.backButtonText}>تعديل الطلب</Text>
        </TouchableOpacity>
        
        <TouchableOpacity
          style={[styles.submitButton, isSubmitting && styles.disabledButton]}
          onPress={submitOrder}
          disabled={isSubmitting}
        >
          <Text style={styles.submitButtonText}>
            {isSubmitting ? 'جاري التقديم...' : 'تأكيد وإرسال'}
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  header: {
    backgroundColor: '#fff',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 5,
  },
  projectName: {
    fontSize: 16,
    color: '#666',
  },
  orderSection: {
    backgroundColor: '#fff',
    margin: 10,
    borderRadius: 8,
    padding: 15,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 15,
  },
  orderList: {
    maxHeight: 200,
  },
  orderItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  itemInfo: {
    flex: 1,
  },
  itemName: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 2,
  },
  restaurantName: {
    fontSize: 14,
    color: '#666',
    marginBottom: 2,
  },
  itemPrice: {
    fontSize: 14,
    color: '#888',
  },
  itemTotal: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#007AFF',
  },
  summarySection: {
    backgroundColor: '#fff',
    margin: 10,
    borderRadius: 8,
    padding: 15,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 8,
  },
  summaryLabel: {
    fontSize: 16,
    color: '#666',
  },
  summaryValue: {
    fontSize: 16,
    fontWeight: '600',
  },
  totalRow: {
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
    marginTop: 10,
    paddingTop: 15,
  },
  totalLabel: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  totalValue: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#007AFF',
  },
  infoSection: {
    backgroundColor: '#fff',
    margin: 10,
    borderRadius: 8,
    padding: 15,
  },
  infoTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  infoText: {
    fontSize: 14,
    color: '#666',
    marginBottom: 5,
  },
  buttonSection: {
    flexDirection: 'row',
    padding: 20,
    gap: 10,
  },
  backButton: {
    flex: 1,
    backgroundColor: '#f0f0f0',
    paddingVertical: 15,
    borderRadius: 8,
    alignItems: 'center',
  },
  backButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#666',
  },
  submitButton: {
    flex: 2,
    backgroundColor: '#007AFF',
    paddingVertical: 15,
    borderRadius: 8,
    alignItems: 'center',
  },
  submitButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#fff',
  },
  disabledButton: {
    backgroundColor: '#ccc',
  },
});

export default OrderConfirmationScreen;