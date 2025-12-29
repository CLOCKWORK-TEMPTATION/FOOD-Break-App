import React, { useState, useEffect, useRef } from 'react';
import styles from './ArabicAI.module.css';

interface AIRecommendation {
  id: string;
  type: 'menu' | 'restaurant' | 'promotion' | 'dietary';
  title: string;
  description: string;
  confidence: number;
  reasoning: string;
  data: any;
}

interface ChatMessage {
  id: string;
  type: 'user' | 'ai';
  content: string;
  timestamp: Date;
  suggestions?: string[];
}

interface UserPreferences {
  dietary: string[];
  allergies: string[];
  favoriteCategories: string[];
  priceRange: { min: number; max: number };
  preferredTime: string;
}

const ArabicAI: React.FC = () => {
  const [recommendations, setRecommendations] = useState<AIRecommendation[]>([]);
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [currentMessage, setCurrentMessage] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [userPreferences, setUserPreferences] = useState<UserPreferences | null>(null);
  const [activeTab, setActiveTab] = useState<'recommendations' | 'chat' | 'preferences'>('recommendations');
  const [loading, setLoading] = useState(false);
  const chatEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetchRecommendations();
    fetchUserPreferences();
    initializeChat();
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [chatMessages]);

  const scrollToBottom = () => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const fetchRecommendations = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/ai/recommendations', {
        headers: {
          'Accept-Language': 'ar',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      
      if (!response.ok) {
        throw new Error('فشل في جلب التوصيات');
      }
      
      const data = await response.json();
      setRecommendations(data.recommendations);
    } catch (error) {
      console.error('خطأ في جلب التوصيات:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchUserPreferences = async () => {
    try {
      const response = await fetch('/api/ai/preferences', {
        headers: {
          'Accept-Language': 'ar',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        setUserPreferences(data.preferences);
      }
    } catch (error) {
      console.error('خطأ في جلب التفضيلات:', error);
    }
  };

  const initializeChat = () => {
    const welcomeMessage: ChatMessage = {
      id: '1',
      type: 'ai',
      content: 'مرحباً! أنا مساعدك الذكي في BreakApp. كيف يمكنني مساعدتك اليوم؟',
      timestamp: new Date(),
      suggestions: [
        'اقترح لي وجبة صحية',
        'ما هي أفضل المطاعم القريبة؟',
        'أريد طعاماً حلالاً',
        'اقترح لي عروض اليوم'
      ]
    };
    setChatMessages([welcomeMessage]);
  };

  const sendMessage = async () => {
    if (!currentMessage.trim()) return;

    const userMessage: ChatMessage = {
      id: Date.now().toString(),
      type: 'user',
      content: currentMessage,
      timestamp: new Date()
    };

    setChatMessages(prev => [...prev, userMessage]);
    setCurrentMessage('');
    setIsTyping(true);

    try {
      const response = await fetch('/api/ai/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept-Language': 'ar',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({
          message: currentMessage,
          context: {
            preferences: userPreferences,
            previousMessages: chatMessages.slice(-5)
          }
        })
      });

      if (!response.ok) {
        throw new Error('فشل في إرسال الرسالة');
      }

      const data = await response.json();
      
      const aiMessage: ChatMessage = {
        id: (Date.now() + 1).toString(),
        type: 'ai',
        content: data.response,
        timestamp: new Date(),
        suggestions: data.suggestions
      };

      setChatMessages(prev => [...prev, aiMessage]);
    } catch (error) {
      console.error('خطأ في إرسال الرسالة:', error);
      const errorMessage: ChatMessage = {
        id: (Date.now() + 1).toString(),
        type: 'ai',
        content: 'عذراً، حدث خطأ في معالجة رسالتك. يرجى المحاولة مرة أخرى.',
        timestamp: new Date()
      };
      setChatMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsTyping(false);
    }
  };

  const handleSuggestionClick = (suggestion: string) => {
    setCurrentMessage(suggestion);
  };

  const updatePreferences = async (newPreferences: Partial<UserPreferences>) => {
    try {
      const response = await fetch('/api/ai/preferences', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Accept-Language': 'ar',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify(newPreferences)
      });

      if (response.ok) {
        const data = await response.json();
        setUserPreferences(data.preferences);
        fetchRecommendations(); // إعادة جلب التوصيات بناءً على التفضيلات الجديدة
      }
    } catch (error) {
      console.error('خطأ في تحديث التفضيلات:', error);
    }
  };

  const getConfidenceColor = (confidence: number) => {
    if (confidence >= 0.8) return '#27ae60';
    if (confidence >= 0.6) return '#f39c12';
    return '#e74c3c';
  };

  const getRecommendationIcon = (type: string) => {
    switch (type) {
      case 'menu': return '🍽️';
      case 'restaurant': return '🏪';
      case 'promotion': return '🎉';
      case 'dietary': return '🥗';
      default: return '💡';
    }
  };

  const formatArabicNumber = (num: number): string => {
    return num.toLocaleString('ar-SA');
  };

  return (
    <div className={styles.aiContainer}>
      <div className={styles.header}>
        <h1>المساعد الذكي العربي</h1>
        <div className={styles.tabs}>
          <button 
            className={`${styles.tab} ${activeTab === 'recommendations' ? styles.active : ''}`}
            onClick={() => setActiveTab('recommendations')}
          >
            التوصيات الذكية
          </button>
          <button 
            className={`${styles.tab} ${activeTab === 'chat' ? styles.active : ''}`}
            onClick={() => setActiveTab('chat')}
          >
            المحادثة الذكية
          </button>
          <button 
            className={`${styles.tab} ${activeTab === 'preferences' ? styles.active : ''}`}
            onClick={() => setActiveTab('preferences')}
          >
            التفضيلات
          </button>
        </div>
      </div>

      {activeTab === 'recommendations' && (
        <div className={styles.recommendationsTab}>
          <div className={styles.sectionHeader}>
            <h2>التوصيات المخصصة لك</h2>
            <button onClick={fetchRecommendations} className={styles.refreshButton}>
              تحديث التوصيات
            </button>
          </div>

          {loading ? (
            <div className={styles.loadingContainer}>
              <div className={styles.spinner}></div>
              <p>جاري تحليل تفضيلاتك وإنشاء التوصيات...</p>
            </div>
          ) : (
            <div className={styles.recommendationsGrid}>
              {recommendations.map((recommendation) => (
                <div key={recommendation.id} className={styles.