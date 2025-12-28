const QRCode = require('qrcode');
const crypto = require('crypto');

// إنشاء QR code للمشروع
const generateProjectQR = async (req, res) => {
  try {
    const { projectId, projectName, shootingDate } = req.body;
    
    // إنشاء رمز فريد للمشروع
    const projectCode = crypto.randomBytes(16).toString('hex');
    
    // بيانات QR code
    const qrData = {
      projectId,
      projectCode,
      projectName,
      shootingDate,
      createdAt: new Date().toISOString()
    };
    
    // إنشاء QR code
    const qrCodeUrl = await QRCode.toDataURL(JSON.stringify(qrData));
    
    // حفظ بيانات المشروع في قاعدة البيانات
    // TODO: إضافة Prisma model للمشاريع
    
    res.json({
      success: true,
      projectCode,
      qrCodeUrl,
      projectData: qrData
    });
  } catch (error) {
    console.error('خطأ في إنشاء QR code:', error);
    res.status(500).json({ error: 'فشل في إنشاء QR code' });
  }
};

// التحقق من صحة QR code
const verifyProjectQR = async (req, res) => {
  try {
    const { qrData } = req.body;
    
    const projectData = JSON.parse(qrData);
    
    // التحقق من صحة البيانات
    if (!projectData.projectId || !projectData.projectCode) {
      return res.status(400).json({ error: 'QR code غير صالح' });
    }
    
    // التحقق من تاريخ التصوير
    const shootingDate = new Date(projectData.shootingDate);
    const today = new Date();
    
    if (shootingDate.toDateString() !== today.toDateString()) {
      return res.status(400).json({ error: 'QR code غير صالح لهذا التاريخ' });
    }
    
    res.json({
      success: true,
      projectData,
      message: 'تم التحقق من المشروع بنجاح'
    });
  } catch (error) {
    console.error('خطأ في التحقق من QR code:', error);
    res.status(400).json({ error: 'QR code غير صالح' });
  }
};

module.exports = {
  generateProjectQR,
  verifyProjectQR
};