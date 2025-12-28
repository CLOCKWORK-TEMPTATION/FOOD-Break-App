const compression = require('compression');
const { cacheService } = require('./cacheService');

/**
 * Performance Optimization Service
 * خدمة تحسين الأداء
 */

// Database Query Optimization
const optimizeQuery = {
  // استخدام select لتحديد الحقول المطلوبة فقط
  selectFields: (fields) => {
    return fields.reduce((acc, field) => {
      acc[field] = true;
      return acc;
    }, {});
  },

  // Pagination helper
  paginate: (page = 1, limit = 20) => {
    const skip = (page - 1) * limit;
    return { skip, take: Math.min(limit, 100) };
  },

  // Include optimization
  includeRelations: (relations) => {
    return relations.reduce((acc, relation) => {
      acc[relation] = true;
      return acc;
    }, {});
  }
};

// Image Optimization
const optimizeImage = {
  // تحديد حجم الصورة المناسب
  getOptimalSize: (type) => {
    const sizes = {
      thumbnail: { width: 150, height: 150 },
      small: { width: 300, height: 300 },
      medium: { width: 600, height: 600 },
      large: { width: 1200, height: 1200 }
    };
    return sizes[type] || sizes.medium;
  },

  // Lazy loading helper
  lazyLoadConfig: {
    loading: 'lazy',
    decoding: 'async'
  }
};

// API Response Optimization
const optimizeResponse = {
  // تقليل حجم الاستجابة
  minimize: (data) => {
    if (Array.isArray(data)) {
      return data.map(item => optimizeResponse.minimize(item));
    }

    if (typeof data === 'object' && data !== null) {
      const optimized = {};
      for (const key in data) {
        if (data[key] !== null && data[key] !== undefined) {
          optimized[key] = optimizeResponse.minimize(data[key]);
        }
      }
      return optimized;
    }

    return data;
  },

  // Pagination metadata
  paginationMeta: (page, limit, total) => {
    return {
      page: parseInt(page),
      limit: parseInt(limit),
      total,
      pages: Math.ceil(total / limit),
      hasNext: page * limit < total,
      hasPrev: page > 1
    };
  }
};

// Compression middleware configuration
const compressionConfig = compression({
  filter: (req, res) => {
    if (req.headers['x-no-compression']) {
      return false;
    }
    return compression.filter(req, res);
  },
  level: 6,
  threshold: 1024
});

// Batch Operations
const batchOperations = {
  // معالجة دفعات من البيانات
  async processBatch(items, batchSize, processor) {
    const results = [];
    for (let i = 0; i < items.length; i += batchSize) {
      const batch = items.slice(i, i + batchSize);
      const batchResults = await Promise.all(batch.map(processor));
      results.push(...batchResults);
    }
    return results;
  },

  // تقسيم المصفوفة إلى دفعات
  chunk: (array, size) => {
    const chunks = [];
    for (let i = 0; i < array.length; i += size) {
      chunks.push(array.slice(i, i + size));
    }
    return chunks;
  }
};

// Memory Management
const memoryManagement = {
  // تنظيف الذاكرة
  cleanup: () => {
    if (global.gc) {
      global.gc();
    }
  },

  // مراقبة استخدام الذاكرة
  getMemoryUsage: () => {
    const usage = process.memoryUsage();
    return {
      rss: Math.round(usage.rss / 1024 / 1024) + ' MB',
      heapTotal: Math.round(usage.heapTotal / 1024 / 1024) + ' MB',
      heapUsed: Math.round(usage.heapUsed / 1024 / 1024) + ' MB',
      external: Math.round(usage.external / 1024 / 1024) + ' MB'
    };
  }
};

// Request Debouncing
const debounce = (func, wait) => {
  let timeout;
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
};

// Request Throttling
const throttle = (func, limit) => {
  let inThrottle;
  return function(...args) {
    if (!inThrottle) {
      func.apply(this, args);
      inThrottle = true;
      setTimeout(() => inThrottle = false, limit);
    }
  };
};

module.exports = {
  optimizeQuery,
  optimizeImage,
  optimizeResponse,
  compressionConfig,
  batchOperations,
  memoryManagement,
  debounce,
  throttle
};
