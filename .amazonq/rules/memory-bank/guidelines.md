# BreakApp - Development Guidelines

## Code Quality Standards

### Documentation & Comments
- **Bilingual Documentation**: Arabic and English comments throughout the codebase
- **Arabic-First Approach**: Primary documentation in Arabic (العربية الفصحى), with English translations
- **Function Headers**: Comprehensive JSDoc/docstring headers explaining purpose, parameters, and return values
- **Inline Comments**: Explain complex logic, business rules, and non-obvious implementations
- **Example Pattern**:
```javascript
/**
 * خدمة تدريب نماذج التعلم الآلي
 * ML Model Training Service
 *
 * تدريب وتحديث نماذج:
 * - Recommendation System
 * - Predictive Ordering
 */
```

### Naming Conventions
- **Variables & Functions**: camelCase (JavaScript/TypeScript)
- **Classes & Components**: PascalCase
- **Constants**: UPPER_SNAKE_CASE
- **Files**: kebab-case for utilities, PascalCase for components
- **Database Models**: PascalCase (Prisma convention)
- **Descriptive Names**: Self-documenting code with clear, meaningful names
- **Arabic Context**: Use English names with Arabic documentation

### Code Formatting
- **Indentation**: 2 spaces (JavaScript/TypeScript), 4 spaces (Python)
- **Line Length**: Aim for 80-100 characters, max 120
- **Semicolons**: Required in JavaScript/TypeScript
- **Trailing Commas**: Use in multi-line objects/arrays
- **String Quotes**: Single quotes for JavaScript, double quotes for JSON
- **Template Literals**: Use for string interpolation

### File Organization
- **Single Responsibility**: One primary export per file
- **Logical Grouping**: Related functions/classes in same file
- **Index Files**: Use index.js/ts for clean imports
- **Separation of Concerns**: Controllers, services, models in separate directories

## Structural Conventions

### Service Layer Pattern
- **Service Classes**: Singleton pattern with `new ServiceName()` export
- **Method Organization**: Public methods first, private methods prefixed with `_`
- **Dependency Injection**: Services import other services as needed
- **Example**:
```javascript
class FoodLabelService {
  async createOrUpdateFoodLabel(menuItemId, labelData) { /* ... */ }
  
  async getFoodLabel(menuItemId) { /* ... */ }
  
  _validateLabelData(data) { /* private helper */ }
}

module.exports = new FoodLabelService();
```

### Controller Pattern
- **Thin Controllers**: Delegate business logic to services
- **Request Validation**: Validate input before service calls
- **Error Handling**: Try-catch blocks with proper error responses
- **Response Format**: Consistent JSON structure `{ success, data, error }`

### Database Access Pattern
- **Prisma Client**: Use `@prisma/client` for all database operations
- **Transactions**: Use `prisma.$transaction()` for multi-step operations
- **Cascading**: Define cascade rules in Prisma schema
- **Indexes**: Add indexes for frequently queried fields

### API Design Patterns
- **RESTful Endpoints**: Resource-based URLs with HTTP verbs
- **Versioning**: `/api/v1/` prefix for all routes
- **Pagination**: Cursor-based pagination for large datasets
- **Filtering**: Query parameters for filtering and sorting
- **Error Responses**: Consistent error format with status codes

## Testing Standards

### Test Structure
- **Describe Blocks**: Group related tests logically
- **Hierarchical Organization**: Nested describe blocks for features/methods
- **Test Naming**: Descriptive test names explaining expected behavior
- **Example**:
```typescript
describe('DietaryService', () => {
  describe('Dietary Profile Management', () => {
    describe('getDietaryProfile', () => {
      it('should return dietary profile when it exists', async () => {
        // Test implementation
      });
    });
  });
});
```

### Test Coverage
- **Unit Tests**: Test individual functions/methods in isolation
- **Integration Tests**: Test API endpoints with database
- **E2E Tests**: Test critical user journeys
- **Mock Strategy**: Mock external dependencies (API clients, databases)
- **Fixtures**: Use test fixtures for consistent test data

### Test Patterns
- **AAA Pattern**: Arrange, Act, Assert
- **Setup/Teardown**: Use `beforeEach`/`afterEach` for test isolation
- **Mock Clearing**: Clear mocks between tests with `jest.clearAllMocks()`
- **Async Testing**: Use `async/await` for asynchronous tests
- **Error Testing**: Test both success and error scenarios

### Assertion Patterns
```typescript
// Existence checks
expect(result).toBeDefined();
expect(result).not.toBeNull();

// Value checks
expect(result).toEqual(expectedValue);
expect(result.property).toBe(value);

// Array checks
expect(array).toHaveLength(3);
expect(array).toContain(item);

// Error checks
await expect(asyncFunction()).rejects.toThrow('Error message');
```

## Semantic Patterns

### Error Handling
- **Try-Catch Blocks**: Wrap all async operations
- **Logging**: Use logger service, not console.log
- **Error Propagation**: Throw errors up to controller layer
- **User-Friendly Messages**: Translate technical errors to user messages
- **Example**:
```javascript
try {
  const result = await someOperation();
  logger.info('Operation successful');
  return result;
} catch (error) {
  logger.error(`Operation failed: ${error.message}`);
  throw error;
}
```

### Async/Await Pattern
- **Consistent Usage**: Use async/await over promises
- **Error Handling**: Always wrap in try-catch
- **Parallel Operations**: Use `Promise.all()` for independent operations
- **Sequential Operations**: Use await for dependent operations

### Data Validation
- **Input Validation**: Validate all user inputs
- **Schema Validation**: Use Zod for TypeScript schema validation
- **Sanitization**: Sanitize inputs to prevent injection attacks
- **Type Checking**: Leverage TypeScript for compile-time checks

### Null/Undefined Handling
- **Null Coalescing**: Use `??` operator for default values
- **Optional Chaining**: Use `?.` for safe property access
- **Explicit Checks**: Check for null/undefined before operations
- **Default Parameters**: Use default parameters in functions

### Array Operations
- **Functional Methods**: Use map, filter, reduce over loops
- **Immutability**: Avoid mutating arrays, create new ones
- **Deduplication**: Use Set for unique values
- **Example**:
```javascript
// Deduplicate warnings
const uniqueWarnings = [...new Set(allWarnings)];

// Transform data
const itemIds = items.map(item => item.id);

// Filter data
const compatibleItems = items.filter(item => item.isCompatible);
```

### Object Patterns
- **Destructuring**: Use destructuring for cleaner code
- **Spread Operator**: Use spread for object merging
- **Property Shorthand**: Use shorthand when key matches variable name
- **Example**:
```javascript
const { userId, menuItemId } = request.body;

const updatedData = {
  ...existingData,
  newField: value
};
```

## Machine Learning Patterns

### Model Training
- **TensorFlow.js**: Use `@tensorflow/tfjs-node` for backend ML
- **Data Preparation**: Normalize features before training
- **Model Architecture**: Sequential models with dense layers
- **Training Callbacks**: Log progress during training
- **Model Persistence**: Save models to file system

### Model Structure
```javascript
const model = tf.sequential();

model.add(tf.layers.dense({
  inputShape: [inputDim],
  units: 128,
  activation: 'relu',
  kernelInitializer: 'heNormal'
}));

model.add(tf.layers.dropout({ rate: 0.3 }));

model.compile({
  optimizer: tf.train.adam(0.001),
  loss: 'meanSquaredError',
  metrics: ['mae', 'acc']
});
```

### Data Normalization
- **Feature Scaling**: Normalize features to 0-1 range
- **Tensor Creation**: Use `tf.tensor2d()` for 2D data
- **Data Mapping**: Create maps for categorical data encoding

## Database Patterns

### Prisma Schema Conventions
- **Model Names**: Singular PascalCase (User, Order, MenuItem)
- **Field Names**: camelCase
- **Relations**: Define both sides of relationships
- **Enums**: Use for fixed value sets
- **Indexes**: Add `@@index` for frequently queried fields
- **Unique Constraints**: Use `@unique` or `@@unique` for uniqueness

### Query Patterns
```javascript
// Find with relations
const user = await prisma.user.findUnique({
  where: { id: userId },
  include: { orders: true, preferences: true }
});

// Upsert pattern
const record = await prisma.model.upsert({
  where: { id },
  update: { /* update data */ },
  create: { /* create data */ }
});

// Transactions
await prisma.$transaction([
  prisma.model1.create({ data }),
  prisma.model2.update({ where, data })
]);
```

### Data Modeling
- **Normalization**: Follow 3NF principles
- **Cascading Deletes**: Use `onDelete: Cascade` for dependent data
- **Soft Deletes**: Use `isActive` flag instead of hard deletes
- **Timestamps**: Include `createdAt` and `updatedAt` on all models
- **JSON Fields**: Use for flexible/dynamic data structures

## API Usage Patterns

### Internal API Calls (Mobile/Frontend)
```typescript
// API Client with error handling
const result = await apiClient.get('/endpoint');

if (result.data.success) {
  return result.data.data;
} else {
  throw new Error(result.data.error.message);
}

// Handle 404 gracefully
try {
  const data = await apiClient.get('/resource');
  return data;
} catch (error) {
  if (error.response?.status === 404) {
    return null;
  }
  throw error;
}
```

### Response Format
```javascript
// Success response
return res.json({
  success: true,
  data: result,
  meta: { pagination: { /* ... */ } }
});

// Error response
return res.status(400).json({
  success: false,
  error: {
    code: 'VALIDATION_ERROR',
    message: 'Invalid input',
    details: validationErrors
  }
});
```

## Code Idioms

### Constants and Configuration
```javascript
// Label icons and colors
const LABEL_ICONS = {
  halal: '🕌',
  vegetarian: '🥬',
  vegan: '🌱'
};

const LABEL_COLORS = {
  halal: '#2E7D32',
  vegetarian: '#4CAF50'
};
```

### Map-Based Lookups
```javascript
// Create maps for efficient lookups
const userMap = new Map(users.map((user, idx) => [user.id, idx]));
const value = userMap.get(userId);

// Return map from array
const labelsMap = new Map(labels.map(label => [label.menuItemId, label]));
```

### Conditional Object Properties
```javascript
// Use nullish coalescing for defaults
const data = {
  field1: value ?? defaultValue,
  field2: input.field2 ?? false
};

// Conditional property inclusion
const config = {
  required: true,
  ...(optional && { optional: value })
};
```

### Array Transformation Chains
```javascript
// Chain operations for data transformation
const result = items
  .filter(item => item.isActive)
  .map(item => ({
    id: item.id,
    name: item.name
  }))
  .sort((a, b) => a.name.localeCompare(b.name));
```

## Popular Annotations

### TypeScript Types
```typescript
// Interface definitions
interface DietaryProfile {
  id: string;
  isHalal: boolean;
  isVegetarian: boolean;
  // ... other fields
}

// Type aliases
type MenuItemAnalysis = {
  menuItemId: string;
  isCompatible: boolean;
  compatibilityScore: number;
};

// Enum types
enum AllergySeverity {
  MILD = 'MILD',
  MODERATE = 'MODERATE',
  SEVERE = 'SEVERE',
  CRITICAL = 'CRITICAL'
}
```

### JSDoc Comments
```javascript
/**
 * @param {string} menuItemId - Menu item identifier
 * @param {Object} labelData - Label data object
 * @returns {Promise<FoodLabel>} Created or updated food label
 */
async createOrUpdateFoodLabel(menuItemId, labelData) {
  // Implementation
}
```

### Jest Test Annotations
```typescript
// Mock setup
jest.mock('../apiClient', () => ({
  get: jest.fn(),
  post: jest.fn()
}));

// Type assertions for mocks
(apiClient.get as jest.Mock).mockResolvedValueOnce({ data });

// Test lifecycle
beforeEach(() => {
  jest.clearAllMocks();
});
```

## Best Practices Summary

### Code Organization
1. Group related functionality in services
2. Keep controllers thin and focused
3. Use consistent file naming conventions
4. Organize imports logically (external, internal, types)

### Error Handling
1. Always use try-catch for async operations
2. Log errors with context
3. Provide user-friendly error messages
4. Handle edge cases explicitly

### Testing
1. Write tests alongside code
2. Test both success and failure paths
3. Use descriptive test names
4. Mock external dependencies

### Performance
1. Use parallel operations where possible
2. Implement pagination for large datasets
3. Add database indexes for frequent queries
4. Cache expensive computations

### Security
1. Validate all user inputs
2. Sanitize data to prevent injection
3. Use parameterized queries (Prisma handles this)
4. Implement proper authentication/authorization

### Maintainability
1. Write self-documenting code
2. Keep functions small and focused
3. Avoid deep nesting
4. Use meaningful variable names
5. Document complex business logic

## Frequency Analysis

Based on codebase analysis, these patterns appear most frequently:

1. **Bilingual Documentation** (100% of analyzed files)
2. **Service Singleton Pattern** (Backend services)
3. **Async/Await with Try-Catch** (All async operations)
4. **Prisma Upsert Pattern** (Database operations)
5. **Describe Block Nesting** (Test files)
6. **Mock Clearing in beforeEach** (Test files)
7. **Nullish Coalescing for Defaults** (Data handling)
8. **Map-Based Lookups** (Performance optimization)
9. **Array Functional Methods** (Data transformation)
10. **Consistent Error Response Format** (API responses)
