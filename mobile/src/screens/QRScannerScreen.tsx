import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  SafeAreaView
} from 'react-native';
import { BarCodeScanner } from 'expo-barcode-scanner';
import { useDispatch } from 'react-redux';
import { workflowActions } from '../store';
import { qrCodeService } from '../services/apiService';

const QRScannerScreen = ({ navigation }) => {
  const [hasPermission, setHasPermission] = useState(null);
  const [scanned, setScanned] = useState(false);
  const [loading, setLoading] = useState(false);
  const dispatch = useDispatch();

  useEffect(() => {
    // طلب إذن الكاميرا
    (async () => {
      const { status } = await BarCodeScanner.requestPermissionsAsync();
      setHasPermission(status === 'granted');
    })();
  }, []);

  // معالجة مسح QR Code
  const handleBarCodeScanned = async ({ type, data }) => {
    setScanned(true);
    setLoading(true);

    try {
      // التحقق من صحة رمز QR
      const result = await qrCodeService.validateQR(data);

      if (result.success) {
        // تعيين المشروع الحالي
        dispatch(
          workflowActions.setCurrentProject({
            id: result.data.projectId,
            name: result.data.projectName,
            expiresAt: result.data.expiresAt
          })
        );

        // الانتقال لشاشة تقديم الطلب
        setLoading(false);
        setTimeout(() => {
          navigation.replace('OrderSubmission');
        }, 500);
      }
    } catch (error) {
      setLoading(false);
      Alert.alert(
        'خطأ في رمز QR',
        error.error?.message || 'رمز QR غير صحيح أو منتهي الصلاحية',
        [
          {
            text: 'حاول مجدداً',
            onPress: () => setScanned(false)
          }
        ]
      );
    }
  };

  if (hasPermission === null) {
    return (
      <SafeAreaView style={styles.container}>
        <Text style={styles.text}>جاري طلب الإذن للوصول إلى الكاميرا...</Text>
      </SafeAreaView>
    );
  }

  if (hasPermission === false) {
    return (
      <SafeAreaView style={styles.container}>
        <Text style={styles.text}>لا توجد إذن للوصول إلى الكاميرا</Text>
        <TouchableOpacity style={styles.button} onPress={() => navigation.goBack()}>
          <Text style={styles.buttonText}>العودة</Text>
        </TouchableOpacity>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.scanner}>
        {!loading ? (
          <BarCodeScanner
            onBarCodeScanned={scanned ? undefined : handleBarCodeScanned}
            style={StyleSheet.absoluteFillObject}
          />
        ) : (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#007AFF" />
            <Text style={styles.loadingText}>جاري التحقق من رمز QR...</Text>
          </View>
        )}

        {/* Frame للتركيز على منطقة QR */}
        <View style={styles.frameContainer}>
          <View style={styles.frame} />
        </View>
      </View>

      <View style={styles.controls}>
        <Text style={styles.title}>ضع رمز QR في الإطار</Text>
        <Text style={styles.subtitle}>
          سيتم قراءة الرمز تلقائياً لتفعيل المشروع
        </Text>

        {scanned && !loading && (
          <TouchableOpacity
            style={styles.button}
            onPress={() => setScanned(false)}
          >
            <Text style={styles.buttonText}>محاولة مرة أخرى</Text>
          </TouchableOpacity>
        )}

        <TouchableOpacity
          style={[styles.button, styles.secondaryButton]}
          onPress={() => navigation.goBack()}
        >
          <Text style={styles.secondaryButtonText}>إلغاء</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000'
  },
  scanner: {
    flex: 1,
    position: 'relative'
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.7)'
  },
  loadingText: {
    color: '#fff',
    marginTop: 10,
    fontSize: 16
  },
  frameContainer: {
    position: 'absolute',
    top: '50%',
    left: '50%',
    transform: [{ translateX: -75 }, { translateY: -75 }]
  },
  frame: {
    width: 150,
    height: 150,
    borderWidth: 2,
    borderColor: '#00FF00',
    borderRadius: 10
  },
  controls: {
    padding: 20,
    backgroundColor: '#fff',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#000',
    marginBottom: 10,
    textAlign: 'center'
  },
  subtitle: {
    fontSize: 14,
    color: '#666',
    marginBottom: 20,
    textAlign: 'center'
  },
  button: {
    backgroundColor: '#007AFF',
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
    marginVertical: 8
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600'
  },
  secondaryButton: {
    backgroundColor: '#f0f0f0',
    marginTop: 10
  },
  secondaryButtonText: {
    color: '#007AFF',
    fontSize: 16,
    fontWeight: '600'
  },
  text: {
    color: '#fff',
    textAlign: 'center',
    fontSize: 16
  }
});

export default QRScannerScreen;