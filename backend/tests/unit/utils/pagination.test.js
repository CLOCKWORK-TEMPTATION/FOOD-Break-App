/**
 * Pagination Utilities Unit Tests
 * اختبارات وحدة أدوات الترقيم
 */

const {
  paginate,
  calculatePagination,
  getPaginationMeta,
  validatePaginationParams,
  DEFAULT_PAGE,
  DEFAULT_LIMIT,
  MAX_LIMIT
} = require('../../../src/utils/pagination');

describe('Pagination Utilities', () => {

  describe('paginate', () => {
    it('should return paginated subset of array', () => {
      const items = Array.from({ length: 100 }, (_, i) => ({ id: i + 1 }));
      const result = paginate(items, { page: 1, limit: 10 });

      expect(result).toHaveLength(10);
      expect(result[0].id).toBe(1);
      expect(result[9].id).toBe(10);
    });

    it('should handle second page correctly', () => {
      const items = Array.from({ length: 100 }, (_, i) => ({ id: i + 1 }));
      const result = paginate(items, { page: 2, limit: 10 });

      expect(result).toHaveLength(10);
      expect(result[0].id).toBe(11);
      expect(result[9].id).toBe(20);
    });

    it('should handle last page with fewer items', () => {
      const items = Array.from({ length: 25 }, (_, i) => ({ id: i + 1 }));
      const result = paginate(items, { page: 3, limit: 10 });

      expect(result).toHaveLength(5);
      expect(result[0].id).toBe(21);
      expect(result[4].id).toBe(25);
    });

    it('should return empty array for page beyond range', () => {
      const items = Array.from({ length: 10 }, (_, i) => ({ id: i + 1 }));
      const result = paginate(items, { page: 5, limit: 10 });

      expect(result).toHaveLength(0);
    });

    it('should use default values', () => {
      const items = Array.from({ length: 100 }, (_, i) => ({ id: i + 1 }));
      const result = paginate(items);

      expect(result).toHaveLength(DEFAULT_LIMIT);
      expect(result[0].id).toBe(1);
    });
  });

  describe('calculatePagination', () => {
    it('should calculate correct pagination metadata', () => {
      const total = 100;
      const page = 1;
      const limit = 10;

      const result = calculatePagination(total, page, limit);

      expect(result).toEqual({
        page: 1,
        limit: 10,
        total: 100,
        pages: 10,
        hasNext: true,
        hasPrev: false
      });
    });

    it('should calculate middle page correctly', () => {
      const total = 100;
      const page = 5;
      const limit = 10;

      const result = calculatePagination(total, page, limit);

      expect(result).toEqual({
        page: 5,
        limit: 10,
        total: 100,
        pages: 10,
        hasNext: true,
        hasPrev: true
      });
    });

    it('should handle last page', () => {
      const total = 95;
      const page = 10;
      const limit = 10;

      const result = calculatePagination(total, page, limit);

      expect(result).toEqual({
        page: 10,
        limit: 10,
        total: 95,
        pages: 10,
        hasNext: false,
        hasPrev: true
      });
    });

    it('should handle single page', () => {
      const total = 5;
      const page = 1;
      const limit = 10;

      const result = calculatePagination(total, page, limit);

      expect(result).toEqual({
        page: 1,
        limit: 10,
        total: 5,
        pages: 1,
        hasNext: false,
        hasPrev: false
      });
    });

    it('should handle empty results', () => {
      const total = 0;
      const page = 1;
      const limit = 10;

      const result = calculatePagination(total, page, limit);

      expect(result).toEqual({
        page: 1,
        limit: 10,
        total: 0,
        pages: 0,
        hasNext: false,
        hasPrev: false
      });
    });

    it('should round up pages correctly', () => {
      const total = 101;
      const page = 1;
      const limit = 10;

      const result = calculatePagination(total, page, limit);

      expect(result.pages).toBe(11);
    });
  });

  describe('getPaginationMeta', () => {
    it('should return complete pagination metadata', () => {
      const meta = getPaginationMeta({
        page: 2,
        limit: 20,
        total: 150
      });

      expect(meta).toHaveProperty('pagination');
      expect(meta.pagination).toEqual({
        page: 2,
        limit: 20,
        total: 150,
        pages: 8,
        hasNext: true,
        hasPrev: true
      });
    });

    it('should include additional metadata', () => {
      const meta = getPaginationMeta({
        page: 1,
        limit: 10,
        total: 100
      }, {
        sortBy: 'createdAt',
        sortOrder: 'desc'
      });

      expect(meta.pagination).toBeDefined();
      expect(meta.sortBy).toBe('createdAt');
      expect(meta.sortOrder).toBe('desc');
    });
  });

  describe('validatePaginationParams', () => {
    it('should accept valid pagination params', () => {
      const result = validatePaginationParams({ page: 1, limit: 10 });

      expect(result.valid).toBe(true);
      expect(result.page).toBe(1);
      expect(result.limit).toBe(10);
    });

    it('should use defaults for missing params', () => {
      const result = validatePaginationParams({});

      expect(result.valid).toBe(true);
      expect(result.page).toBe(DEFAULT_PAGE);
      expect(result.limit).toBe(DEFAULT_LIMIT);
    });

    it('should clamp page to minimum', () => {
      const result = validatePaginationParams({ page: -1 });

      expect(result.page).toBe(1);
    });

    it('should clamp limit to maximum', () => {
      const result = validatePaginationParams({ limit: 1000 });

      expect(result.limit).toBe(MAX_LIMIT);
    });

    it('should clamp limit to minimum', () => {
      const result = validatePaginationParams({ limit: 0 });

      expect(result.limit).toBe(1);
    });

    it('should handle string numbers', () => {
      const result = validatePaginationParams({ page: '2', limit: '20' });

      expect(result.valid).toBe(true);
      expect(result.page).toBe(2);
      expect(result.limit).toBe(20);
    });

    it('should reject invalid values', () => {
      const result = validatePaginationParams({ page: 'invalid', limit: 'abc' });

      expect(result.valid).toBe(false);
    });
  });

  describe('Integration Tests', () => {
    it('should handle complete pagination workflow', () => {
      const allItems = Array.from({ length: 45 }, (_, i) => ({
        id: i + 1,
        name: `Item ${i + 1}`
      }));

      const params = { page: 2, limit: 10 };
      const validated = validatePaginationParams(params);
      const paginatedItems = paginate(allItems, validated);
      const pagination = calculatePagination(allItems.length, validated.page, validated.limit);

      expect(paginatedItems).toHaveLength(10);
      expect(pagination.page).toBe(2);
      expect(pagination.total).toBe(45);
      expect(pagination.pages).toBe(5);
    });

    it('should handle filters with pagination', () => {
      const items = [
        { id: 1, category: 'A' },
        { id: 2, category: 'B' },
        { id: 3, category: 'A' },
        { id: 4, category: 'B' },
        { id: 5, category: 'A' }
      ];

      const filtered = items.filter(item => item.category === 'A');
      const paginated = paginate(filtered, { page: 1, limit: 2 });
      const pagination = calculatePagination(filtered.length, 1, 2);

      expect(paginated).toHaveLength(2);
      expect(pagination.total).toBe(3);
      expect(pagination.pages).toBe(2);
    });
  });

  describe('Edge Cases', () => {
    it('should handle very large datasets', () => {
      const total = 1000000;
      const page = 50000;
      const limit = 20;

      const result = calculatePagination(total, page, limit);

      expect(result.pages).toBe(50000);
      expect(result.hasNext).toBe(false);
      expect(result.hasPrev).toBe(true);
    });

    it('should handle page beyond total pages', () => {
      const total = 50;
      const page = 100;
      const limit = 10;

      const result = calculatePagination(total, page, limit);

      expect(result.page).toBe(100);
      expect(result.pages).toBe(5);
      expect(result.hasNext).toBe(false);
    });

    it('should handle limit larger than total', () => {
      const items = [1, 2, 3];
      const result = paginate(items, { page: 1, limit: 10 });

      expect(result).toHaveLength(3);
    });

    it('should handle negative page gracefully', () => {
      const total = 100;
      const page = -5;
      const limit = 10;

      const result = calculatePagination(total, page, limit);

      expect(result.pages).toBe(10);
    });
  });

  describe('Performance', () => {
    it('should paginate large arrays efficiently', () => {
      const items = Array.from({ length: 10000 }, (_, i) => ({ id: i + 1 }));

      const start = Date.now();
      const result = paginate(items, { page: 500, limit: 20 });
      const duration = Date.now() - start;

      expect(result).toHaveLength(20);
      expect(duration).toBeLessThan(100); // Should be very fast
    });
  });

  describe('Arabic Localization', () => {
    it('should support Arabic page numbers', () => {
      const result = validatePaginationParams({ page: '١', limit: '١٠' });

      // Should handle Arabic numerals if supported
      expect(result.valid).toBe(true);
    });

    it('should format pagination metadata in Arabic', () => {
      const meta = getPaginationMeta({
        page: 1,
        limit: 10,
        total: 100
      });

      // Metadata should be localizable
      expect(meta.pagination).toBeDefined();
    });
  });
});
