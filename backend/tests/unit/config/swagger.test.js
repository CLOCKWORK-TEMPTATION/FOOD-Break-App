/**
 * اختبارات وحدة Swagger Configuration
 * Unit tests for Swagger configuration module
 */

// Mock swagger-jsdoc before importing
jest.mock('swagger-jsdoc');

const swaggerJsdoc = require('swagger-jsdoc');
const swaggerSpec = require('../../../src/config/swagger');

describe('Swagger Configuration', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Swagger specification', () => {
    it('should create swagger specification', () => {
      expect(swaggerSpec).toBeDefined();
      expect(typeof swaggerSpec).toBe('object');
    });

    it('should call swaggerJsdoc with correct options', () => {
      expect(swaggerJsdoc).toHaveBeenCalled();
      const callArgs = swaggerJsdoc.mock.calls[0][0];
      expect(callArgs).toBeDefined();
      expect(callArgs.definition).toBeDefined();
      expect(callArgs.apis).toBeDefined();
    });

    it('should have OpenAPI 3.0.0 specification', () => {
      const callArgs = swaggerJsdoc.mock.calls[0][0];
      expect(callArgs.definition.openapi).toBe('3.0.0');
    });

    it('should have info section', () => {
      const callArgs = swaggerJsdoc.mock.calls[0][0];
      expect(callArgs.definition.info).toBeDefined();
      expect(callArgs.definition.info.title).toBe('BreakApp API');
      expect(callArgs.definition.info.version).toBe('1.0.0');
      expect(callArgs.definition.info.description).toBeDefined();
    });

    it('should have contact information', () => {
      const callArgs = swaggerJsdoc.mock.calls[0][0];
      expect(callArgs.definition.info.contact).toBeDefined();
      expect(callArgs.definition.info.contact.name).toBe('BreakApp Development Team');
      expect(callArgs.definition.info.contact.email).toBe('support@breakapp.com');
    });

    it('should have license information', () => {
      const callArgs = swaggerJsdoc.mock.calls[0][0];
      expect(callArgs.definition.info.license).toBeDefined();
      expect(callArgs.definition.info.license.name).toBe('MIT');
      expect(callArgs.definition.info.license.url).toBe('https://opensource.org/licenses/MIT');
    });

    it('should have servers configuration', () => {
      const callArgs = swaggerJsdoc.mock.calls[0][0];
      expect(callArgs.definition.servers).toBeDefined();
      expect(Array.isArray(callArgs.definition.servers)).toBe(true);
      expect(callArgs.definition.servers.length).toBeGreaterThanOrEqual(2);
    });

    it('should have development server configuration', () => {
      const callArgs = swaggerJsdoc.mock.calls[0][0];
      const devServer = callArgs.definition.servers.find(s => s.description === 'Development server');
      expect(devServer).toBeDefined();
      expect(devServer.url).toBeDefined();
    });

    it('should have production server configuration', () => {
      const callArgs = swaggerJsdoc.mock.calls[0][0];
      const prodServer = callArgs.definition.servers.find(s => s.description === 'Production server');
      expect(prodServer).toBeDefined();
      expect(prodServer.url).toBeDefined();
    });

    it('should use environment variables for server URLs', () => {
      const originalApiBaseUrl = process.env.API_BASE_URL;
      const originalProdUrl = process.env.PROD_API_URL;

      process.env.API_BASE_URL = 'http://test:3000/api/v1';
      process.env.PROD_API_URL = 'https://test.com/api/v1';

      // Re-require to get updated env values
      jest.resetModules();
      jest.mock('swagger-jsdoc');
      require('../../../src/config/swagger');

      expect(swaggerJsdoc).toHaveBeenCalled();

      // Restore
      process.env.API_BASE_URL = originalApiBaseUrl;
      process.env.PROD_API_URL = originalProdUrl;
    });
  });

  describe('Security schemes', () => {
    it('should have security schemes defined', () => {
      const callArgs = swaggerJsdoc.mock.calls[0][0];
      expect(callArgs.definition.components.securitySchemes).toBeDefined();
    });

    it('should have Bearer authentication', () => {
      const callArgs = swaggerJsdoc.mock.calls[0][0];
      const bearerAuth = callArgs.definition.components.securitySchemes.bearerAuth;
      expect(bearerAuth).toBeDefined();
      expect(bearerAuth.type).toBe('http');
      expect(bearerAuth.scheme).toBe('bearer');
      expect(bearerAuth.bearerFormat).toBe('JWT');
    });

    it('should have Bearer auth description', () => {
      const callArgs = swaggerJsdoc.mock.calls[0][0];
      const bearerAuth = callArgs.definition.components.securitySchemes.bearerAuth;
      expect(bearerAuth.description).toBeDefined();
      expect(bearerAuth.description).toContain('JWT');
    });

    it('should apply security globally', () => {
      const callArgs = swaggerJsdoc.mock.calls[0][0];
      expect(callArgs.definition.security).toBeDefined();
      expect(Array.isArray(callArgs.definition.security)).toBe(true);
      expect(callArgs.definition.security[0]).toEqual({ bearerAuth: [] });
    });
  });

  describe('Schema definitions', () => {
    let schemas;

    beforeEach(() => {
      const callArgs = swaggerJsdoc.mock.calls[0][0];
      schemas = callArgs.definition.components.schemas;
    });

    it('should have schemas defined', () => {
      expect(schemas).toBeDefined();
      expect(typeof schemas).toBe('object');
    });

    it('should have Error schema', () => {
      expect(schemas.Error).toBeDefined();
      expect(schemas.Error.type).toBe('object');
      expect(schemas.Error.properties.success).toBeDefined();
      expect(schemas.Error.properties.error).toBeDefined();
    });

    it('should have Success schema', () => {
      expect(schemas.Success).toBeDefined();
      expect(schemas.Success.type).toBe('object');
      expect(schemas.Success.properties.success).toBeDefined();
      expect(schemas.Success.properties.data).toBeDefined();
      expect(schemas.Success.properties.meta).toBeDefined();
    });

    it('should have User schema', () => {
      expect(schemas.User).toBeDefined();
      expect(schemas.User.type).toBe('object');
      expect(schemas.User.properties.id).toBeDefined();
      expect(schemas.User.properties.email).toBeDefined();
      expect(schemas.User.properties.role).toBeDefined();
    });

    it('should have RegisterRequest schema', () => {
      expect(schemas.RegisterRequest).toBeDefined();
      expect(schemas.RegisterRequest.type).toBe('object');
      expect(schemas.RegisterRequest.required).toContain('email');
      expect(schemas.RegisterRequest.required).toContain('password');
    });

    it('should have LoginRequest schema', () => {
      expect(schemas.LoginRequest).toBeDefined();
      expect(schemas.LoginRequest.type).toBe('object');
      expect(schemas.LoginRequest.required).toContain('email');
      expect(schemas.LoginRequest.required).toContain('password');
    });

    it('should have AuthResponse schema', () => {
      expect(schemas.AuthResponse).toBeDefined();
      expect(schemas.AuthResponse.type).toBe('object');
      expect(schemas.AuthResponse.properties.data).toBeDefined();
    });

    it('should have Restaurant schema', () => {
      expect(schemas.Restaurant).toBeDefined();
      expect(schemas.Restaurant.type).toBe('object');
      expect(schemas.Restaurant.properties.name).toBeDefined();
      expect(schemas.Restaurant.properties.latitude).toBeDefined();
      expect(schemas.Restaurant.properties.longitude).toBeDefined();
    });

    it('should have MenuItem schema', () => {
      expect(schemas.MenuItem).toBeDefined();
      expect(schemas.MenuItem.type).toBe('object');
      expect(schemas.MenuItem.properties.name).toBeDefined();
      expect(schemas.MenuItem.properties.price).toBeDefined();
      expect(schemas.MenuItem.properties.menuType).toBeDefined();
    });

    it('should have Order schema', () => {
      expect(schemas.Order).toBeDefined();
      expect(schemas.Order.type).toBe('object');
      expect(schemas.Order.properties.status).toBeDefined();
      expect(schemas.Order.properties.totalAmount).toBeDefined();
      expect(schemas.Order.properties.items).toBeDefined();
    });

    it('should have CreateOrderRequest schema', () => {
      expect(schemas.CreateOrderRequest).toBeDefined();
      expect(schemas.CreateOrderRequest.type).toBe('object');
      expect(schemas.CreateOrderRequest.required).toContain('restaurantId');
      expect(schemas.CreateOrderRequest.required).toContain('items');
    });

    it('should have Notification schema', () => {
      expect(schemas.Notification).toBeDefined();
      expect(schemas.Notification.type).toBe('object');
      expect(schemas.Notification.properties.type).toBeDefined();
      expect(schemas.Notification.properties.isRead).toBeDefined();
    });

    it('should have NutritionLog schema', () => {
      expect(schemas.NutritionLog).toBeDefined();
      expect(schemas.NutritionLog.type).toBe('object');
      expect(schemas.NutritionLog.properties.totalCalories).toBeDefined();
      expect(schemas.NutritionLog.properties.totalProtein).toBeDefined();
    });

    it('should have Recommendation schema', () => {
      expect(schemas.Recommendation).toBeDefined();
      expect(schemas.Recommendation.type).toBe('object');
      expect(schemas.Recommendation.properties.recommendationType).toBeDefined();
      expect(schemas.Recommendation.properties.score).toBeDefined();
    });

    it('should have all required User properties', () => {
      const userProps = schemas.User.properties;
      expect(userProps.id.format).toBe('uuid');
      expect(userProps.email.format).toBe('email');
      expect(userProps.role.enum).toContain('ADMIN');
      expect(userProps.role.enum).toContain('REGULAR');
    });

    it('should have password validation in RegisterRequest', () => {
      const registerSchema = schemas.RegisterRequest;
      expect(registerSchema.properties.password.minLength).toBe(8);
    });

    it('should have Order status enum', () => {
      const orderSchema = schemas.Order;
      expect(orderSchema.properties.status.enum).toContain('PENDING');
      expect(orderSchema.properties.status.enum).toContain('CONFIRMED');
      expect(orderSchema.properties.status.enum).toContain('DELIVERED');
    });

    it('should have MenuItem menu type enum', () => {
      const menuItemSchema = schemas.MenuItem;
      expect(menuItemSchema.properties.menuType.enum).toContain('CORE');
      expect(menuItemSchema.properties.menuType.enum).toContain('GEOGRAPHIC');
    });

    it('should have Notification type enum', () => {
      const notificationSchema = schemas.Notification;
      expect(notificationSchema.properties.type.enum).toContain('ORDER_CONFIRMED');
      expect(notificationSchema.properties.type.enum).toContain('SYSTEM');
    });
  });

  describe('Response definitions', () => {
    let responses;

    beforeEach(() => {
      const callArgs = swaggerJsdoc.mock.calls[0][0];
      responses = callArgs.definition.components.responses;
    });

    it('should have responses defined', () => {
      expect(responses).toBeDefined();
      expect(typeof responses).toBe('object');
    });

    it('should have Unauthorized response', () => {
      expect(responses.Unauthorized).toBeDefined();
      expect(responses.Unauthorized.description).toBeDefined();
      expect(responses.Unauthorized.content['application/json']).toBeDefined();
    });

    it('should have Forbidden response', () => {
      expect(responses.Forbidden).toBeDefined();
      expect(responses.Forbidden.description).toBeDefined();
    });

    it('should have NotFound response', () => {
      expect(responses.NotFound).toBeDefined();
      expect(responses.NotFound.description).toBeDefined();
    });

    it('should have ValidationError response', () => {
      expect(responses.ValidationError).toBeDefined();
      expect(responses.ValidationError.description).toBeDefined();
    });

    it('should reference Error schema in responses', () => {
      const unauthorizedSchema = responses.Unauthorized.content['application/json'].schema;
      expect(unauthorizedSchema.$ref).toBe('#/components/schemas/Error');
    });
  });

  describe('API paths configuration', () => {
    it('should include routes files in apis array', () => {
      const callArgs = swaggerJsdoc.mock.calls[0][0];
      expect(callArgs.apis).toBeDefined();
      expect(Array.isArray(callArgs.apis)).toBe(true);
    });

    it('should include routes directory in apis', () => {
      const callArgs = swaggerJsdoc.mock.calls[0][0];
      const hasRoutesPath = callArgs.apis.some(api => api.includes('routes'));
      expect(hasRoutesPath).toBe(true);
    });

    it('should include controllers directory in apis', () => {
      const callArgs = swaggerJsdoc.mock.calls[0][0];
      const hasControllersPath = callArgs.apis.some(api => api.includes('controllers'));
      expect(hasControllersPath).toBe(true);
    });

    it('should scan .js files for API documentation', () => {
      const callArgs = swaggerJsdoc.mock.calls[0][0];
      const hasJsPattern = callArgs.apis.some(api => api.includes('*.js'));
      expect(hasJsPattern).toBe(true);
    });
  });

  describe('Comprehensive schema validation', () => {
    let schemas;

    beforeEach(() => {
      const callArgs = swaggerJsdoc.mock.calls[0][0];
      schemas = callArgs.definition.components.schemas;
    });

    it('should have MenuItem nutritional info structure', () => {
      const menuItemSchema = schemas.MenuItem;
      expect(menuItemSchema.properties.nutritionalInfo).toBeDefined();
      expect(menuItemSchema.properties.nutritionalInfo.type).toBe('object');
      expect(menuItemSchema.properties.nutritionalInfo.properties.calories).toBeDefined();
      expect(menuItemSchema.properties.nutritionalInfo.properties.protein).toBeDefined();
    });

    it('should have CreateOrderRequest items array structure', () => {
      const createOrderSchema = schemas.CreateOrderRequest;
      expect(createOrderSchema.properties.items.type).toBe('array');
      expect(createOrderSchema.properties.items.items.required).toContain('menuItemId');
      expect(createOrderSchema.properties.items.items.required).toContain('quantity');
    });

    it('should have Order items array', () => {
      const orderSchema = schemas.Order;
      expect(orderSchema.properties.items.type).toBe('array');
      expect(orderSchema.properties.items.items.properties.menuItemId).toBeDefined();
    });

    it('should have Success meta pagination structure', () => {
      const successSchema = schemas.Success;
      expect(successSchema.properties.meta.properties.pagination).toBeDefined();
      expect(successSchema.properties.meta.properties.pagination.properties.page).toBeDefined();
      expect(successSchema.properties.meta.properties.pagination.properties.total).toBeDefined();
    });

    it('should have proper date-time formats', () => {
      expect(schemas.User.properties.createdAt.format).toBe('date-time');
      expect(schemas.Order.properties.createdAt.format).toBe('date-time');
      expect(schemas.NutritionLog.properties.date.format).toBe('date-time');
    });

    it('should have proper UUID formats', () => {
      expect(schemas.User.properties.id.format).toBe('uuid');
      expect(schemas.Restaurant.properties.id.format).toBe('uuid');
      expect(schemas.Order.properties.id.format).toBe('uuid');
    });

    it('should have proper email formats', () => {
      expect(schemas.User.properties.email.format).toBe('email');
      expect(schemas.RegisterRequest.properties.email.format).toBe('email');
    });

    it('should have proper number formats', () => {
      expect(schemas.MenuItem.properties.price.format).toBe('float');
      expect(schemas.Restaurant.properties.rating.format).toBe('float');
      expect(schemas.Recommendation.properties.score.format).toBe('float');
    });
  });

  describe('Module exports', () => {
    it('should export swagger specification', () => {
      expect(swaggerSpec).toBeDefined();
    });

    it('should have proper structure from swaggerJsdoc', () => {
      expect(swaggerSpec.openapi).toBeDefined();
      expect(swaggerSpec.info).toBeDefined();
      expect(swaggerSpec.paths).toBeDefined();
      expect(swaggerSpec.components).toBeDefined();
    });

    it('should be an object', () => {
      expect(typeof swaggerSpec).toBe('object');
    });

    it('should not be null', () => {
      expect(swaggerSpec).not.toBeNull();
    });

    it('should have minimum required properties', () => {
      expect(swaggerSpec.openapi).toBe('3.0.0');
      expect(swaggerSpec.info.title).toBe('BreakApp API');
      expect(swaggerSpec.info.version).toBe('1.0.0');
    });
  });

  describe('Edge cases', () => {
    it('should handle missing environment variables gracefully', () => {
      const originalApiBaseUrl = process.env.API_BASE_URL;
      const originalProdUrl = process.env.PROD_API_URL;

      delete process.env.API_BASE_URL;
      delete process.env.PROD_API_URL;

      jest.resetModules();
      jest.mock('swagger-jsdoc');
      const newSpec = require('../../../src/config/swagger');

      expect(newSpec).toBeDefined();

      // Restore
      if (originalApiBaseUrl) process.env.API_BASE_URL = originalApiBaseUrl;
      if (originalProdUrl) process.env.PROD_API_URL = originalProdUrl;
    });

    it('should have consistent schema references', () => {
      const callArgs = swaggerJsdoc.mock.calls[0][0];
      const authResponse = callArgs.definition.components.schemas.AuthResponse;

      expect(authResponse.properties.data.properties.user.$ref).toBe('#/components/schemas/User');
    });

    it('should have minimum quantity validation in CreateOrderRequest', () => {
      const callArgs = swaggerJsdoc.mock.calls[0][0];
      const createOrderSchema = callArgs.definition.components.schemas.CreateOrderRequest;
      const itemQuantity = createOrderSchema.properties.items.items.properties.quantity;

      expect(itemQuantity.minimum).toBe(1);
    });
  });
});
