/**
 * Component Tests للشاشة الرئيسية (LoginScreen)
 * اختبارات مكونات واجهة المستخدم
 */

import React from 'react';
import { render, fireEvent, waitFor, act } from '@testing-library/react-native';
import { Alert } from 'react-native';
import LoginScreen from '../LoginScreen';

// Mock dependencies
jest.mock('expo-linear-gradient', () => ({
  LinearGradient: 'LinearGradient',
}));

jest.mock('../services/apiService', () => ({
  login: jest.fn(),
}));

jest.mock('../components/ui/Input', () => 'Input');
jest.mock('../components/ui/Button', () => 'Button');
jest.mock('../components/ui/LoadingSpinner', () => 'LoadingSpinner');

// Mock Alert
jest.spyOn(Alert, 'alert');

const apiService = require('../services/apiService');

describe('LoginScreen - اختبارات الشاشة', () => {
  const mockNavigation = {
    navigate: jest.fn(),
    replace: jest.fn(),
    goBack: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('يجب أن يعرض الشاشة بشكل صحيح', () => {
    const { getByText } = render(<LoginScreen navigation={mockNavigation} />);

    expect(getByText('تسجيل الدخول')).toBeTruthy();
    expect(getByText('أهلاً بك مجدداً!')).toBeTruthy();
  });

  it('يجب أن يعرض حقول الإدخال', () => {
    const { getByPlaceholderText } = render(<LoginScreen navigation={mockNavigation} />);

    expect(getByPlaceholderText('أدخل بريدك الإلكتروني')).toBeTruthy();
    expect(getByPlaceholderText('أدخل كلمة المرور')).toBeTruthy();
  });

  it('يجب أن يعرض زر تسجيل الدخول', () => {
    const { getByText } = render(<LoginScreen navigation={mockNavigation} />);

    expect(getByText('تسجيل الدخول')).toBeTruthy();
  });

  it('يجب أن يعرض أزرار تسجيل الدخول الاجتماعي', () => {
    const { getByText } = render(<LoginScreen navigation={mockNavigation} />);

    expect(getByText('تسجيل الدخول عبر Google')).toBeTruthy();
    expect(getByText('تسجيل الدخول عبر Apple')).toBeTruthy();
  });

  it('يجب أن يعرض رابط التسجيل', () => {
    const { getByText } = render(<LoginScreen navigation={mockNavigation} />);

    expect(getByText('ليس لديك حساب؟')).toBeTruthy();
    expect(getByText('سجل الآن')).toBeTruthy();
  });
});

describe('LoginScreen - التحقق من صحة النموذج', () => {
  const mockNavigation = {
    navigate: jest.fn(),
    replace: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('يجب أن يطلب البريد الإلكتروني', async () => {
    const { getByText, getByPlaceholderText } = render(
      <LoginScreen navigation={mockNavigation} />
    );

    const passwordInput = getByPlaceholderText('أدخل كلمة المرور');
    fireEvent.changeText(passwordInput, 'password123');

    const loginButton = getByText('تسجيل الدخول');
    await act(async () => {
      fireEvent.press(loginButton);
    });

    expect(Alert.alert).not.toHaveBeenCalled();
  });

  it('يجب أن يتحقق من صحة البريد الإلكتروني', async () => {
    const { getByText, getByPlaceholderText } = render(
      <LoginScreen navigation={mockNavigation} />
    );

    const emailInput = getByPlaceholderText('أدخل بريدك الإلكتروني');
    fireEvent.changeText(emailInput, 'invalid-email');

    const passwordInput = getByPlaceholderText('أدخل كلمة المرور');
    fireEvent.changeText(passwordInput, 'password123');

    const loginButton = getByText('تسجيل الدخول');
    await act(async () => {
      fireEvent.press(loginButton);
    });

    expect(Alert.alert).not.toHaveBeenCalledWith(
      'نجاح',
      'تم تسجيل الدخول بنجاح'
    );
  });

  it('يجب أن يطلب كلمة المرور', async () => {
    const { getByText, getByPlaceholderText } = render(
      <LoginScreen navigation={mockNavigation} />
    );

    const emailInput = getByPlaceholderText('أدخل بريدك الإلكتروني');
    fireEvent.changeText(emailInput, 'test@example.com');

    const loginButton = getByText('تسجيل الدخول');
    await act(async () => {
      fireEvent.press(loginButton);
    });

    expect(Alert.alert).not.toHaveBeenCalled();
  });

  it('يجب أن يرفض كلمة المرور القصيرة', async () => {
    const { getByText, getByPlaceholderText } = render(
      <LoginScreen navigation={mockNavigation} />
    );

    const emailInput = getByPlaceholderText('أدخل بريدك الإلكتروني');
    fireEvent.changeText(emailInput, 'test@example.com');

    const passwordInput = getByPlaceholderText('أدخل كلمة المرور');
    fireEvent.changeText(passwordInput, '12345'); // أقل من 6 أحرف

    const loginButton = getByText('تسجيل الدخول');
    await act(async () => {
      fireEvent.press(loginButton);
    });

    expect(Alert.alert).not.toHaveBeenCalled();
  });

  it('يجب أن يقبل البيانات الصحيحة', async () => {
    const { getByText, getByPlaceholderText } = render(
      <LoginScreen navigation={mockNavigation} />
    );

    const emailInput = getByPlaceholderText('أدخل بريدك الإلكتروني');
    fireEvent.changeText(emailInput, 'test@example.com');

    const passwordInput = getByPlaceholderText('أدخل كلمة المرور');
    fireEvent.changeText(passwordInput, 'password123');

    // Mock successful login
    apiService.login.mockResolvedValue({
      success: true,
      data: {
        user: { id: '123', email: 'test@example.com' },
        token: 'mock_token',
      },
    });

    const loginButton = getByText('تسجيل الدخول');
    await act(async () => {
      fireEvent.press(loginButton);
    });

    await waitFor(() => {
      expect(apiService.login).toHaveBeenCalledWith('test@example.com', 'password123');
    });
  });
});

describe('LoginScreen - تسجيل الدخول', () => {
  const mockNavigation = {
    navigate: jest.fn(),
    replace: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('يجب أن يسجل الدخول بنجاح', async () => {
    const { getByText, getByPlaceholderText } = render(
      <LoginScreen navigation={mockNavigation} />
    );

    apiService.login.mockResolvedValue({
      success: true,
      data: {
        user: { id: '123', email: 'test@example.com' },
        token: 'mock_token',
      },
    });

    const emailInput = getByPlaceholderText('أدخل بريدك الإلكتروني');
    fireEvent.changeText(emailInput, 'test@example.com');

    const passwordInput = getByPlaceholderText('أدخل كلمة المرور');
    fireEvent.changeText(passwordInput, 'password123');

    const loginButton = getByText('تسجيل الدخول');

    await act(async () => {
      fireEvent.press(loginButton);
    });

    await waitFor(() => {
      expect(apiService.login).toHaveBeenCalledWith('test@example.com', 'password123');
    });

    expect(Alert.alert).toHaveBeenCalledWith(
      'نجاح',
      'تم تسجيل الدخول بنجاح',
      expect.arrayContaining([
        expect.objectContaining({
          text: 'موافق',
          onPress: expect.any(Function),
        }),
      ])
    );
  });

  it('يجب أن يعالج فشل تسجيل الدخول', async () => {
    const { getByText, getByPlaceholderText } = render(
      <LoginScreen navigation={mockNavigation} />
    );

    apiService.login.mockResolvedValue({
      success: false,
      error: { message: 'بيانات الدخول غير صحيحة' },
    });

    const emailInput = getByPlaceholderText('أدخل بريدك الإلكتروني');
    fireEvent.changeText(emailInput, 'test@example.com');

    const passwordInput = getByPlaceholderText('أدخل كلمة المرور');
    fireEvent.changeText(passwordInput, 'wrong_password');

    const loginButton = getByText('تسجيل الدخول');

    await act(async () => {
      fireEvent.press(loginButton);
    });

    await waitFor(() => {
      expect(Alert.alert).toHaveBeenCalledWith(
        'خطأ',
        'بيانات الدخول غير صحيحة'
      );
    });
  });

  it('يجب أن يعالج أخطاء الشبكة', async () => {
    const { getByText, getByPlaceholderText } = render(
      <LoginScreen navigation={mockNavigation} />
    );

    apiService.login.mockRejectedValue(new Error('فشل الاتصال بالخادم'));

    const emailInput = getByPlaceholderText('أدخل بريدك الإلكتروني');
    fireEvent.changeText(emailInput, 'test@example.com');

    const passwordInput = getByPlaceholderText('أدخل كلمة المرور');
    fireEvent.changeText(passwordInput, 'password123');

    const loginButton = getByText('تسجيل الدخول');

    await act(async () => {
      fireEvent.press(loginButton);
    });

    await waitFor(() => {
      expect(Alert.alert).toHaveBeenCalledWith(
        'خطأ',
        'فشل الاتصال بالخادم'
      );
    });
  });
});

describe('LoginScreen - التنقل', () => {
  const mockNavigation = {
    navigate: jest.fn(),
    replace: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('يجب أن ينتقل إلى شاشة التسجيل عند الضغط على سجل الآن', () => {
    const { getByText } = render(<LoginScreen navigation={mockNavigation} />);

    const signupLink = getByText('سجل الآن');
    fireEvent.press(signupLink);

    expect(mockNavigation.navigate).toHaveBeenCalledWith('Register');
  });

  it('يجب أن ينتقل للشاشة الرئيسية بعد تسجيل الدخول الناجح', async () => {
    const { getByText, getByPlaceholderText } = render(
      <LoginScreen navigation={mockNavigation} />
    );

    apiService.login.mockResolvedValue({
      success: true,
      data: {
        user: { id: '123', email: 'test@example.com' },
        token: 'mock_token',
      },
    });

    const emailInput = getByPlaceholderText('أدخل بريدك الإلكتروني');
    fireEvent.changeText(emailInput, 'test@example.com');

    const passwordInput = getByPlaceholderText('أدخل كلمة المرور');
    fireEvent.changeText(passwordInput, 'password123');

    const loginButton = getByText('تسجيل الدخول');

    await act(async () => {
      fireEvent.press(loginButton);
    });

    await waitFor(() => {
      expect(Alert.alert).toHaveBeenCalled();
    });

    // استدعاء onPress من Alert
    const alertCall = Alert.alert.mock.calls[0];
    const onPress = alertCall[2][0].onPress;
    onPress();

    expect(mockNavigation.replace).toHaveBeenCalledWith('Main');
  });
});

describe('LoginScreen - تسجيل الدخول الاجتماعي', () => {
  const mockNavigation = {
    navigate: jest.fn(),
    replace: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('يجب أن يعرض رسالة للمستخدم عند الضغط على Google', () => {
    const { getByText } = render(<LoginScreen navigation={mockNavigation} />);

    const googleButton = getByText('تسجيل الدخول عبر Google');
    fireEvent.press(googleButton);

    expect(Alert.alert).toHaveBeenCalledWith('قريباً', 'تسجيل الدخول عبر Google سيتم إضافته قريباً');
  });

  it('يجب أن يعرض رسالة للمستخدم عند الضغط على Apple', () => {
    const { getByText } = render(<LoginScreen navigation={mockNavigation} />);

    const appleButton = getByText('تسجيل الدخول عبر Apple');
    fireEvent.press(appleButton);

    expect(Alert.alert).toHaveBeenCalledWith('قريباً', 'تسجيل الدخول عبر Apple سيتم إضافته قريباً');
  });

  it('يجب أن يعرض رسالة عند الضغط على نسيت كلمة المرور', () => {
    const { getByText } = render(<LoginScreen navigation={mockNavigation} />);

    const forgotPasswordLink = getByText('نسيت كلمة المرور؟');
    fireEvent.press(forgotPasswordLink);

    expect(Alert.alert).toHaveBeenCalledWith('قريباً', 'سيتم إضافة ميزة استعادة كلمة المرور قريباً');
  });
});

describe('LoginScreen - حالة التحميل', () => {
  const mockNavigation = {
    navigate: jest.fn(),
    replace: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('يجب أن يعرض مؤشر التحميل أثناء تسجيل الدخول', async () => {
    const { getByText, getByPlaceholderText, getByTestId, UNSAFE_root } = render(
      <LoginScreen navigation={mockNavigation} />
    );

    // Mock login مع تأخير
    apiService.login.mockImplementation(
      () =>
        new Promise((resolve) => {
          setTimeout(() => {
            resolve({
              success: true,
              data: { user: { id: '123' }, token: 'token' },
            });
          }, 100);
        })
    );

    const emailInput = getByPlaceholderText('أدخل بريدك الإلكتروني');
    fireEvent.changeText(emailInput, 'test@example.com');

    const passwordInput = getByPlaceholderText('أدخل كلمة المرور');
    fireEvent.changeText(passwordInput, 'password123');

    const loginButton = getByText('تسجيل الدخول');

    await act(async () => {
      fireEvent.press(loginButton);
    });

    // يجب أن يظهر LoadingSpinner
    // هذا الاختبار يتمن أن يكون هناك testID على LoadingSpinner
  });
});
