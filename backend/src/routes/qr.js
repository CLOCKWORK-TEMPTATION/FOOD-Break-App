const express = require('express');
const router = express.Router();
const qrCodeService = require('../services/qrCodeService');
const auth = require('../middleware/auth');

// توليد QR Code للمشروع
router.post('/project/:projectId', auth, async (req, res) => {
  try {
    const { projectId } = req.params;
    
    // التحقق من صلاحية المستخدم لإنشاء QR Code للمشروع
    if (req.user.role !== 'ADMIN' && req.user.role !== 'PROJECT_MANAGER') {
      return res.status(403).json({
        success: false,
        error: {
          code: 'ACCESS_DENIED',
          message: 'غير مصرح لك بإنشاء QR Code للمشروع'
        }
      });
    }

    const projectData = {
      id: projectId,
      name: req.body.projectName || `Project ${projectId}`
    };

    const qrResult = await qrCodeService.generateProjectQR(projectData);

    res.json({
      success: true,
      data: qrResult
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: {
        code: 'QR_GENERATION_FAILED',
        message: error.message
      }
    });
  }
});

// التحقق من صحة QR Code
router.post('/validate', async (req, res) => {
  try {
    const { token } = req.body;
    
    if (!token) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'MISSING_TOKEN',
          message: 'Token مطلوب للتحقق'
        }
      });
    }

    const validation = await qrCodeService.validateQRCode(token);

    res.json({
      success: true,
      data: validation
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      error: {
        code: 'QR_VALIDATION_FAILED',
        message: error.message
      }
    });
  }
});

// فك تشفير QR Code من النص
router.post('/decode', async (req, res) => {
  try {
    const { qrText } = req.body;
    
    if (!qrText) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'MISSING_QR_TEXT',
          message: 'نص QR Code مطلوب'
        }
      });
    }

    const decodedData = await qrCodeService.decodeQRData(qrText);

    res.json({
      success: true,
      data: decodedData
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      error: {
        code: 'QR_DECODE_FAILED',
        message: error.message
      }
    });
  }
});

// الوصول للمشروع عبر QR Code
router.post('/access', auth, async (req, res) => {
  try {
    const { qrToken } = req.body;
    
    const validation = await qrCodeService.validateQRCode(qrToken);
    
    if (!validation.valid) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'INVALID_QR_CODE',
          message: 'QR Code غير صحيح'
        }
      });
    }

    // التحقق من صلاحية الوصول للمشروع
    const accessValidation = await qrCodeService.validateProjectAccess(
      validation.projectId, 
      req.user.id
    );

    res.json({
      success: true,
      data: {
        projectAccess: accessValidation,
        qrValidation: validation
      }
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      error: {
        code: 'PROJECT_ACCESS_FAILED',
        message: error.message
      }
    });
  }
});

// إنشاء QR Code مخصص
router.post('/custom', auth, async (req, res) => {
  try {
    const { data, options } = req.body;
    
    if (!data) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'MISSING_DATA',
          message: 'البيانات مطلوبة لإنشاء QR Code'
        }
      });
    }

    const qrCode = await qrCodeService.generateCustomQR(data, options);

    res.json({
      success: true,
      data: {
        qrCode,
        generatedAt: new Date().toISOString()
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: {
        code: 'CUSTOM_QR_FAILED',
        message: error.message
      }
    });
  }
});

module.exports = router;