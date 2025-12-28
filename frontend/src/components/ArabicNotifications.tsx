import React, { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Switch } from './ui/switch';
import { Label } from './ui/label';
import { Separator } from './ui/separator';
import { ScrollArea } from './ui/scroll-area';
import { 
  Bell, 
  BellRing, 
  Check, 
  X, 
  Settings, 
  Volume2, 
  VolumeX,
  Smartphone,
  Mail,
  MessageSquare,
  AlertTriangle,
  Info,
  CheckCircle,
  Clock,
  Trash2,
  MarkAsUnread,
  Filter,
  Search
} from 'lucide-react';
import { Input } from './ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { formatArabicDate, formatArabicNumber } from '../utils/arabicFormatters';
import styles from './ArabicNotifications.module.css';

interface Notification {
  id: string;
  title: string;
  message: string;
  type: 'info' | 'success' | 'warning' | 'error';
  category: 'order' | 'payment' | 'delivery' | 'system' | 'promotion';
  isRead: boolean;
  createdAt: string;
  actionUrl?: string;
  actionText?: string;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  sender?: string;
  metadata?: Record<string, any>;
}

interface NotificationSettings {
  pushEnabled: boolean;
  emailEnabled: boolean;
  smsEnabled: boolean;
  soundEnabled: boolean;
  categories: {
    order: boolean;
    payment: boolean;
    delivery: boolean;
    system: boolean;
    promotion: boolean;
  };
  quietHours: {
    enabled: boolean;
    startTime: string;
    endTime: string;
  };
}

const ArabicNotifications: React.FC = () => {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [settings, setSettings] = useState<NotificationSettings>({
    pushEnabled: true,
    emailEnabled: true,
    smsEnabled: false,
    soundEnabled: true,
    categories: {
      order: true,
      payment: true,
      delivery: true,
      system: true,
      promotion: false
    },
    quietHours: {
      enabled: false,
      startTime: '22:00',
      endTime: '08:00'
    }
  });
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<'notifications' | 'settings'>('notifications');
  const [filter, setFilter] = useState<'all' | 'unread' | 'read'>('all');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedNotifications, setSelectedNotifications] = useState<string[]>([]);

  useEffect(() => {
    loadNotifications();
    loadSettings();
    
    // إعداد WebSocket للإشعارات الفورية
    setupWebSocket();
    
    // طلب إذن الإشعارات
    requestNotificationPermission();
  }, []);

  const loadNotifications = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/notifications', {
        headers: {
          'Accept-Language': 'ar'
        }
      });
      const data = await response.json();
      if (data.success) {
        setNotifications(data.data);
      }
    } catch (error) {
      console.error('خطأ في تحميل الإشعارات:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadSettings = async () => {
    try {
      const response = await fetch('/api/notifications/settings', {
        headers: {
          'Accept-Language': 'ar'
        }
      });
      const data = await response.json();
      if (data.success) {
        setSettings(data.data);
      }
    } catch (error) {
      console.error('خطأ في تحميل إعدادات الإشعارات:', error);
    }
  };

  const setupWebSocket = () => {
    const ws = new WebSocket(`ws://localhost:3001/notifications`);
    
    ws.onmessage = (event) => {
      const notification = JSON.parse(event.data);
      setNotifications(prev => [notification, ...prev]);
      
      // عرض إشعار المتصفح
      if (settings.pushEnabled && 'Notification' in window && Notification.permission === 'granted') {
        new Notification(notification.title, {
          body: notification.message,
          icon: '/icon-192x192.png',
          dir: 'rtl',
          lang: 'ar'
        });
      }
      
      // تشغيل الصوت
      if (settings.soundEnabled) {
        playNotificationSound();
      }
    };

    return () => ws.close();
  };

  const requestNotificationPermission = async () => {
    if ('Notification' in window && Notification.permission === 'default') {
      await Notification.requestPermission();
    }
  };

  const playNotificationSound = () => {
    const audio = new Audio('/sounds/notification.mp3');
    audio.play().catch(console.error);
  };

  const markAsRead = async (notificationId: string) => {
    try {
      const response = await fetch(`/api/notifications/${notificationId}/read`, {
        method: 'PATCH',
        headers: {
          'Accept-Language': 'ar'
        }
      });
      
      if (response.ok) {
        setNotifications(prev => 
          prev.map(n => 
            n.id === notificationId ? { ...n, isRead: true } : n
          )
        );
      }
    } catch (error) {
      console.error('خطأ في تحديث حالة الإشعار:', error);
    }
  };

  const markAsUnread = async (notificationId: string) => {
    try {
      const response = await fetch(`/api/notifications/${notificationId}/unread`, {
        method: 'PATCH',
        headers: {
          'Accept-Language': 'ar'
        }
      });
      
      if (response.ok) {
        setNotifications(prev => 
          prev.map(n => 
            n.id === notificationId ? { ...n, isRead: false } : n
          )
        );
      }
    } catch (error) {
      console.error('خطأ في تحديث حالة الإشعار:', error);
    }
  };

  const deleteNotification = async (notificationId: string) => {
    try {
      const response = await fetch(`/api/notifications/${notificationId}`, {
        method: 'DELETE',
        headers: {
          'Accept-Language': 'ar'
        }
      });
      
      if (response.ok) {
        setNotifications(prev => prev.filter(n => n.id !== notificationId));
      }
    } catch (error) {
      console.error('خطأ في حذف الإشعار:', error);
    }
  };

  const markAllAsRead = async () => {
    try {
      const response = await fetch('/api/notifications/mark-all-read', {
        method: 'PATCH',
        headers: {
          'Accept-Language': 'ar'
        }
      });
      
      if (response.ok) {
        setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
      }
    } catch (error) {
      console.error('خطأ في تحديث جميع الإشعارات:', error);
    }
  };

  const deleteSelected = async () => {
    try {
      const response = await fetch('/api/notifications/bulk-delete', {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          'Accept-Language': 'ar'
        },
        body: JSON.stringify({ notificationIds: selectedNotifications })
      });
      
      if (response.ok) {
        setNotifications(prev => 
          prev.filter(n => !selectedNotifications.includes(n.id))
        );
        setSelectedNotifications([]);
      }
    } catch (error) {
      console.error('خطأ في حذف الإشعارات المحددة:', error);
    }
  };

  const updateSettings = async (newSettings: NotificationSettings) => {
    try {
      const response = await fetch('/api/notifications/settings', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Accept-Language': 'ar'
        },
        body: JSON.stringify(newSettings)
      });
      
      if (response.ok) {
        setSettings(newSettings);
      }
    } catch (error) {
      console.error('خطأ في تحديث الإعدادات:', error);
    }
  };

  const getNotificationIcon = (type: Notification['type']) => {
    switch (type) {
      case 'success':
        return <CheckCircle className="h-5 w-5 text-green-500" />;
      case 'warning':
        return <AlertTriangle className="h-5 w-5 text-yellow-500" />;
      case 'error':
        return <X className="h-5 w-5 text-red-500" />;
      default:
        return <Info className="h-5 w-5 text-blue-500" />;
    }
  };

  const getCategoryIcon = (category: Notification['category']) => {
    switch (category) {
      case 'order':
        return '🍽️';
      case 'payment':
        return '💳';
      case 'delivery':
        return '🚚';
      case 'system':
        return '⚙️';
      case 'promotion':
        return '🎉';
      default:
        return '📢';
    }
  };

  const getCategoryName = (category: Notification['category']) => {
    const names = {
      order: 'الطلبات',
      payment: 'المدفوعات',
      delivery: 'التوصيل',
      system: 'النظام',
      promotion: 'العروض'
    };
    return names[category] || category;
  };

  const getPriorityBadge = (priority: Notification['priority']) => {
    const config = {
      low: { label: 'منخفضة', variant: 'secondary' as const },
      medium: { label: 'متوسطة', variant: 'outline' as const },
      high: { label: 'عالية', variant: 'default' as const },
      urgent: { label: 'عاجلة', variant: 'destructive' as const }
    };
    
    const { label, variant } = config[priority];
    return <Badge variant={variant} className="text-xs">{label}</Badge>;
  };

  const filteredNotifications = notifications.filter(notification => {
    // تصفية حسب الحالة
    if (filter === 'read' && !notification.isRead) return false;
    if (filter === 'unread' && notification.isRead) return false;
    
    // تصفية حسب الفئة
    if (categoryFilter !== 'all' && notification.category !== categoryFilter) return false;
    
    // تصفية حسب البحث
    if (searchTerm && !notification.title.includes(searchTerm) && !notification.message.includes(searchTerm)) {
      return false;
    }
    
    return true;
  });

  const unreadCount = notifications.filter(n => !n.isRead).length;

  return (
    <div className={`${styles.container} space-y-6`} dir="rtl">
      {/* رأس الصفحة */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3 space-x-reverse">
          <div className="relative">
            <Bell className="h-8 w-8 text-primary" />
            {unreadCount > 0 && (
              <Badge 
                variant="destructive" 
                className="absolute -top-2 -right-2 h-5 w-5 rounded-full p-0 flex items-center justify-center text-xs"
              >
                {formatArabicNumber(unreadCount)}
              </Badge>
            )}
          </div>
          <div>
            <h1 className="text-2xl font-bold">الإشعارات</h1>
            <p className="text-muted-foreground">
              {formatArabicNumber(unreadCount)} إشعار غير مقروء من أصل {formatArabicNumber(notifications.length)}
            </p>
          </div>
        </div>
        
        <div className="flex space-x-2 space-x-reverse">
          <Button
            variant="outline"
            onClick={markAllAsRead}
            disabled={unreadCount === 0}
          >
            <Check className="h-4 w-4 ml-2" />
            تحديد الكل كمقروء
          </Button>
          {selectedNotifications.length > 0 && (
            <Button
              variant="destructive"
              onClick={deleteSelected}
            >
              <Trash2 className="h-4 w-4 ml-2" />
              حذف المحدد ({formatArabicNumber(selectedNotifications.length)})
            </Button>
          )}
        </div>
      </div>

      {/* التبويبات */}
      <div className="flex space-x-1 space-x-reverse bg-muted p-1 rounded-lg">
        <Button
          variant={activeTab === 'notifications' ? 'default' : 'ghost'}
          onClick={() => setActiveTab('notifications')}
          className="flex-1"
        >
          <BellRing className="h-4 w-4 ml-2" />
          الإشعارات
        </Button>
        <Button
          variant={activeTab === 'settings' ? 'default' : 'ghost'}
          onClick={() => setActiveTab('settings')}
          className="flex-1"
        >
          <Settings className="h-4 w-4 ml-2" />
          الإعدادات
        </Button>
      </div>

      {/* تبويب الإشعارات */}
      {activeTab === 'notifications' && (
        <div className="space-y-4">
          {/* أدوات التصفية والبحث */}
          <Card>
            <CardContent className="p-4">
              <div className="flex flex-col md:flex-row gap-4">
                <div className="flex-1">
                  <div className="relative">
                    <Search className="absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="البحث في الإشعارات..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pr-10"
                    />
                  </div>
                </div>
                
                <div className="flex gap-2">
                  <Select value={filter} onValueChange={(value: any) => setFilter(value)}>
                    <SelectTrigger className="w-32">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">الكل</SelectItem>
                      <SelectItem value="unread">غير مقروء</SelectItem>
                      <SelectItem value="read">مقروء</SelectItem>
                    </SelectContent>
                  </Select>
                  
                  <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                    <SelectTrigger className="w-32">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">جميع الفئات</SelectItem>
                      <SelectItem value="order">الطلبات</SelectItem>
                      <SelectItem value="payment">المدفوعات</SelectItem>
                      <SelectItem value="delivery">التوصيل</SelectItem>
                      <SelectItem value="system">النظام</SelectItem>
                      <SelectItem value="promotion">العروض</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* قائمة الإشعارات */}
          <ScrollArea className="h-[600px]">
            <div className="space-y-2">
              {loading ? (
                <div className="text-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
                  <p className="mt-2 text-muted-foreground">جاري التحميل...</p>
                </div>
              ) : filteredNotifications.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <Bell className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>لا توجد إشعارات</p>
                </div>
              ) : (
                filteredNotifications.map((notification) => (
                  <Card 
                    key={notification.id} 
                    className={`transition-all hover:shadow-md ${
                      !notification.isRead ? 'border-primary bg-primary/5' : ''
                    } ${
                      selectedNotifications.includes(notification.id) ? 'ring-2 ring-primary' : ''
                    }`}
                  >
                    <CardContent className="p-4">
                      <div className="flex items-start space-x-4 space-x-reverse">
                        {/* Checkbox للتحديد */}
                        <input
                          type="checkbox"
                          checked={selectedNotifications.includes(notification.id)}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setSelectedNotifications(prev => [...prev, notification.id]);
                            } else {
                              setSelectedNotifications(prev => prev.filter(id => id !== notification.id));
                            }
                          }}
                          className="mt-1"
                        />
                        
                        {/* أيقونة الفئة */}
                        <div className="text-2xl">
                          {getCategoryIcon(notification.category)}
                        </div>
                        
                        {/* محتوى الإشعار */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between mb-2">
                            <div className="flex items-center space-x-2 space-x-reverse">
                              <h3 className={`font-semibold ${!notification.isRead ? 'text-primary' : ''}`}>
                                {notification.title}
                              </h3>
                              {!notification.isRead && (
                                <div className="w-2 h-2 bg-primary rounded-full"></div>
                              )}
                            </div>
                            <div className="flex items-center space-x-2 space-x-reverse">
                              {getPriorityBadge(notification.priority)}
                              <Badge variant="outline" className="text-xs">
                                {getCategoryName(notification.category)}
                              </Badge>
                            </div>
                          </div>
                          
                          <p className="text-muted-foreground mb-3 line-clamp-2">
                            {notification.message}
                          </p>
                          
                          <div className="flex items-center justify-between">
                            <div className="flex items-center space-x-2 space-x-reverse text-sm text-muted-foreground">
                              <Clock className="h-4 w-4" />
                              <span>{formatArabicDate(notification.createdAt)}</span>
                              {notification.sender && (
                                <>
                                  <span>•</span>
                                  <span>{notification.sender}</span>
                                </>
                              )}
                            </div>
                            
                            <div className="flex items-center space-x-1 space-x-reverse">
                              {notification.actionUrl && (
                                <Button variant="outline" size="sm">
                                  {notification.actionText || 'عرض'}
                                </Button>
                              )}
                              
                              {notification.isRead ? (
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => markAsUnread(notification.id)}
                                >
                                  <MarkAsUnread className="h-4 w-4" />
                                </Button>
                              ) : (
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => markAsRead(notification.id)}
                                >
                                  <Check className="h-4 w-4" />
                                </Button>
                              )}
                              
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => deleteNotification(notification.id)}
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))
              )}
            </div>
          </ScrollArea>
        </div>
      )}

      {/* تبويب الإعدادات */}
      {activeTab === 'settings' && (
        <div className="space-y-6">
          {/* إعدادات عامة */}
          <Card>
            <CardHeader>
              <CardTitle>الإعدادات العامة</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3 space-x-reverse">
                  <Smartphone className="h-5 w-5" />
                  <div>
                    <Label>الإشعارات المنبثقة</Label>
                    <p className="text-sm text-muted-foreground">
                      عرض الإشعارات في المتصفح
                    </p>
                  </div>
                </div>
                <Switch
                  checked={settings.pushEnabled}
                  onCheckedChange={(checked) => 
                    updateSettings({ ...settings, pushEnabled: checked })
                  }
                />
              </div>
              
              <Separator />
              
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3 space-x-reverse">
                  <Mail className="h-5 w-5" />
                  <div>
                    <Label>الإشعارات بالبريد الإلكتروني</Label>
                    <p className="text-sm text-muted-foreground">
                      إرسال الإشعارات المهمة بالبريد الإلكتروني
                    </p>
                  </div>
                </div>
                <Switch
                  checked={settings.emailEnabled}
                  onCheckedChange={(checked) => 
                    updateSettings({ ...settings, emailEnabled: checked })
                  }
                />
              </div>
              
              <Separator />
              
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3 space-x-reverse">
                  <MessageSquare className="h-5 w-5" />
                  <div>
                    <Label>الرسائل النصية</Label>
                    <p className="text-sm text-muted-foreground">
                      إرسال الإشعارات العاجلة برسائل نصية
                    </p>
                  </div>
                </div>
                <Switch
                  checked={settings.smsEnabled}
                  onCheckedChange={(checked) => 
                    updateSettings({ ...settings, smsEnabled: checked })
                  }
                />
              </div>
              
              <Separator />
              
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3 space-x-reverse">
                  {settings.soundEnabled ? (
                    <Volume2 className="h-5 w-5" />
                  ) : (
                    <VolumeX className="h-5 w-5" />
                  )}
                  <div>
                    <Label>الأصوات</Label>
                    <p className="text-sm text-muted-foreground">
                      تشغيل صوت عند وصول إشعار جديد
                    </p>
                  </div>
                </div>
                <Switch
                  checked={settings.soundEnabled}
                  onCheckedChange={(checked) => 
                    updateSettings({ ...settings, soundEnabled: checked })
                  }
                />
              </div>
            </CardContent>
          </Card>

          {/* إعدادات الفئات */}
          <Card>
            <CardHeader>
              <CardTitle>فئات الإشعارات</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {Object.entries(settings.categories).map(([category, enabled]) => (
                <div key={category} className="flex items-center justify-between">
                  <div className="flex items-center space-x-3 space-x-reverse">
                    <span className="text-xl">{getCategoryIcon(category as any)}</span>
                    <Label>{getCategoryName(category as any)}</Label>
                  </div>
                  <Switch
                    checked={enabled}
                    onCheckedChange={(checked) => 
                      updateSettings({
                        ...settings,
                        categories: { ...settings.categories, [category]: checked }
                      })
                    }
                  />
                </div>
              ))}
            </CardContent>
          </Card>

          {/* ساعات الهدوء */}
          <Card>
            <CardHeader>
              <CardTitle>ساعات الهدوء</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <Label>تفعيل ساعات الهدوء</Label>
                <Switch
                  checked={settings.quietHours.enabled}
                  onCheckedChange={(checked) => 
                    updateSettings({
                      ...settings,
                      quietHours: { ...settings.quietHours, enabled: checked }
                    })
                  }
                />
              </div>
              
              {settings.quietHours.enabled && (
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>من الساعة</Label>
                    <Input
                      type="time"
                      value={settings.quietHours.startTime}
                      onChange={(e) => 
                        updateSettings({
                          ...settings,
                          quietHours: { ...settings.quietHours, startTime: e.target.value }
                        })
                      }
                    />
                  </div>
                  <div>
                    <Label>إلى الساعة</Label>
                    <Input
                      type="time"
                      value={settings.quietHours.endTime}
                      onChange={(e) => 
                        updateSettings({
                          ...settings,
                          quietHours: { ...settings.quietHours, endTime: e.target.value }
                        })
                      }
                    />
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
};

export default ArabicNotifications;