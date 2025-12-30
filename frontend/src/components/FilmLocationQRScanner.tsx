/**
 * ماسح QR Code للوصول لمواقع التصوير
 * Film Location QR Code Scanner for Break Orders
 */

import React, { useState, useRef, useEffect } from 'react';
import { useTranslation } from '../config/localization';
import { 
  QrCodeIcon,
  CameraIcon,
  FilmIcon,
  MapPinIcon,
  ClockIcon,
  CheckCircleIcon,
  XCircleIcon
} from '@heroicons/react/24/outline';

interface Project {
  id: string;
  name: string;
  location: string;
  latitude?: number;
  longitude?: number;
  isOrderWindowOpen: boolean;
  orderWindowEnd: string;
  timeRemainingMinutes: number;
}

interface FilmLocationQRScannerProps {
  onProjectAccess?: (project: Project) => void;
  onError?: (error: string) => void;
}

const FilmLocationQRScanner: React.FC<FilmLocationQRScannerProps> = ({
  onProjectAccess,
  onError
}) => {
  const { t } = useTranslation();
  const [isScanning, setIsScanning] = useState(false);
  const [project, setProject] = useState<Project | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [manualCode, setManualCode] = useState('');
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);

  // تنظيف الكاميرا عند إلغاء التحميل
  useEffect(() => {
    return () => {
      stopCamera();
    };
  }, []);

  const startCamera = async () => {
    try {
      setError(null);
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { 
          facingMode: 'environment', // الكاميرا الخلفية
          width: { ideal: 1280 },
          height: { ideal: 720 }
        }
      });
      
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play();
      }
      
      setIsScanning(true);
      startQRDetection();
    } catch (err) {
      console.error('خطأ في تشغيل الكاميرا:', err);
      setError('لا يمكن الوصول للكاميرا. يرجى التأكد من الأذونات.');
    }
  };

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    setIsScanning(false);
  };

  const startQRDetection = () => {
    const detectQR = () => {
      if (!isScanning || !videoRef.current || !canvasRef.current) return;

      const video = videoRef.current;
      const canvas = canvasRef.current;
      const context = canvas.getContext('2d');

      if (video.readyState === video.HAVE_ENOUGH_DATA) {
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        context?.drawImage(video, 0, 0, canvas.width, canvas.height);

        const imageData = context?.getImageData(0, 0, canvas.width, canvas.height);
        
        // هنا يمكن إضافة مكتبة QR detection مثل jsQR
        // const code = jsQR(imageData.data, imageData.width, imageData.height);
        // if (code) {
        //   handleQRCodeDetected(code.data);
        //   return;
        // }
      }

      requestAnimationFrame(detectQR);
    };

    detectQR();
  };

  const handleQRCodeDetected = async (qrData: string) => {
    stopCamera();
    await processQRCode(qrData);
  };

  const processQRCode = async (qrToken: string) => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/projects/access-by-qr', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept-Language': 'ar',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({ qrToken })
      });

      const data = await response.json();

      if (data.success) {
        const projectData = data.data.project;
        setProject(projectData);
        onProjectAccess?.(projectData);
      } else {
        setError(data.error?.message || 'رمز QR غير صحيح أو منتهي الصلاحية');
        onError?.(data.error?.message || 'رمز QR غير صحيح');
      }
    } catch (err) {
      console.error('خطأ في معالجة رمز QR:', err);
      setError('حدث خطأ في الاتصال بالخادم');
      onError?.('حدث خطأ في الاتصال بالخادم');
    } finally {
      setLoading(false);
    }
  };

  const handleManualEntry = async () => {
    if (!manualCode.trim()) {
      setError('يرجى إدخال رمز الوصول');
      return;
    }

    await processQRCode(manualCode.trim());
  };

  const resetScanner = () => {
    setProject(null);
    setError(null);
    setManualCode('');
    stopCamera();
  };

  if (project) {
    return (
      <div className="bg-white rounded-lg shadow p-6" dir="rtl">
        <div className="text-center">
          <CheckCircleIcon className="h-16 w-16 text-green-500 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-gray-900 mb-2">
            تم الوصول لموقع التصوير بنجاح!
          </h3>
          
          <div className="bg-gray-50 rounded-lg p-4 mb-6">
            <div className="flex items-center justify-center space-x-2 space-x-reverse mb-3">
              <FilmIcon className="h-6 w-6 text-blue-600" />
              <h4 className="text-lg font-medium text-gray-900">{project.name}</h4>
            </div>
            
            <div className="flex items-center justify-center space-x-2 space-x-reverse text-gray-600 mb-2">
              <MapPinIcon className="h-4 w-4" />
              <span className="text-sm">{project.location}</span>
            </div>

            {project.isOrderWindowOpen ? (
              <div className="flex items-center justify-center space-x-2 space-x-reverse text-green-600">
                <ClockIcon className="h-4 w-4" />
                <span className="text-sm font-medium">
                  نافذة طلب البريك مفتوحة - {project.timeRemainingMinutes} دقيقة متبقية
                </span>
              </div>
            ) : (
              <div className="flex items-center justify-center space-x-2 space-x-reverse text-red-600">
                <XCircleIcon className="h-4 w-4" />
                <span className="text-sm font-medium">انتهت فترة طلب البريك لهذا اليوم</span>
              </div>
            )}
          </div>

          <div className="flex justify-center space-x-3 space-x-reverse">
            {project.isOrderWindowOpen && (
              <button className="bg-blue-600 text-white px-6 py-2 rounded-md hover:bg-blue-700 transition-colors">
                طلب بريك الآن
              </button>
            )}
            <button
              onClick={resetScanner}
              className="bg-gray-300 text-gray-700 px-6 py-2 rounded-md hover:bg-gray-400 transition-colors"
            >
              مسح موقع آخر
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow p-6" dir="rtl">
      <div className="text-center mb-6">
        <QrCodeIcon className="h-16 w-16 text-blue-600 mx-auto mb-4" />
        <h3 className="text-xl font-semibold text-gray-900 mb-2">
          مسح QR Code لموقع التصوير
        </h3>
        <p className="text-gray-600">
          امسح رمز QR الخاص بموقع التصوير للوصول وطلب البريك
        </p>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mb-4">
          <div className="flex items-center space-x-2 space-x-reverse">
            <XCircleIcon className="h-5 w-5 flex-shrink-0" />
            <span>{error}</span>
          </div>
        </div>
      )}

      {loading && (
        <div className="text-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">جاري التحقق من رمز الوصول...</p>
        </div>
      )}

      {!isScanning && !loading && (
        <div className="space-y-6">
          {/* Camera Scanner */}
          <div className="text-center">
            <button
              onClick={startCamera}
              className="bg-blue-600 text-white px-6 py-3 rounded-md hover:bg-blue-700 transition-colors flex items-center space-x-2 space-x-reverse mx-auto"
            >
              <CameraIcon className="h-5 w-5" />
              <span>تشغيل الكاميرا للمسح</span>
            </button>
          </div>

          {/* Manual Entry */}
          <div className="border-t pt-6">
            <h4 className="text-md font-medium text-gray-900 mb-4 text-center">
              أو أدخل رمز الوصول يدوياً
            </h4>
            <div className="flex space-x-3 space-x-reverse">
              <input
                type="text"
                value={manualCode}
                onChange={(e) => setManualCode(e.target.value)}
                placeholder="أدخل رمز الوصول هنا..."
                className="flex-1 border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                onKeyPress={(e) => e.key === 'Enter' && handleManualEntry()}
              />
              <button
                onClick={handleManualEntry}
                disabled={!manualCode.trim()}
                className="bg-gray-600 text-white px-4 py-2 rounded-md hover:bg-gray-700 transition-colors disabled:bg-gray-300 disabled:cursor-not-allowed"
              >
                دخول
              </button>
            </div>
          </div>
        </div>
      )}

      {isScanning && (
        <div className="space-y-4">
          <div className="relative">
            <video
              ref={videoRef}
              className="w-full h-64 bg-black rounded-lg object-cover"
              playsInline
              muted
            />
            <canvas ref={canvasRef} className="hidden" />
            
            {/* Scanning Overlay */}
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="border-2 border-blue-500 w-48 h-48 rounded-lg relative">
                <div className="absolute top-0 left-0 w-6 h-6 border-t-4 border-l-4 border-blue-500 rounded-tl-lg"></div>
                <div className="absolute top-0 right-0 w-6 h-6 border-t-4 border-r-4 border-blue-500 rounded-tr-lg"></div>
                <div className="absolute bottom-0 left-0 w-6 h-6 border-b-4 border-l-4 border-blue-500 rounded-bl-lg"></div>
                <div className="absolute bottom-0 right-0 w-6 h-6 border-b-4 border-r-4 border-blue-500 rounded-br-lg"></div>
              </div>
            </div>
          </div>

          <div className="text-center">
            <p className="text-gray-600 mb-4">وجه الكاميرا نحو رمز QR الخاص بموقع التصوير</p>
            <button
              onClick={stopCamera}
              className="bg-red-600 text-white px-4 py-2 rounded-md hover:bg-red-700 transition-colors"
            >
              إيقاف المسح
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default FilmLocationQRScanner;