# BreakApp Development Guidelines

## Code Quality Standards

### File Structure & Organization
- **Consistent Directory Structure**: Follow established patterns with `src/` as main source directory
- **Modular Organization**: Separate concerns into dedicated directories (controllers, routes, services, components, screens)
- **Index Files**: Use `index.js` files as aggregators for route mounting and module exports
- **Configuration Separation**: Keep app configuration in dedicated files (`app.js` for config objects)

### Naming Conventions
- **Files**: Use camelCase for JavaScript files, PascalCase for React components
- **Variables**: Use camelCase for variables and functions (`defaultLimit`, `maxRadius`)
- **Constants**: Use camelCase for configuration objects, UPPER_SNAKE_CASE for environment variables
- **Components**: Use PascalCase for React components (`HomeScreen`, `MenuScreen`)
- **Routes**: Use lowercase with hyphens for API endpoints (`/api/v1/restaurants`)

### Code Formatting Patterns
- **Indentation**: 2 spaces consistently across all files
- **Line Endings**: Windows CRLF (`\r\n`) format
- **Semicolons**: Always use semicolons to terminate statements
- **Quotes**: Single quotes for strings in JavaScript, double quotes in JSON
- **Trailing Commas**: Use trailing commas in multi-line objects and arrays

## Backend Development Standards

### Express.js Application Structure
```javascript
// Standard middleware order (from server.js)
app.use(helmet());           // Security headers first
app.use(compression());      // Compression second
app.use(cors());            // CORS configuration
app.use(express.json());    // JSON parsing
app.use(express.urlencoded()); // URL encoding
app.use(morgan());          // Logging (development only)
```

### Environment Configuration Patterns
- **dotenv First**: Always load environment variables at the top with `require('dotenv').config()`
- **Fallback Values**: Provide sensible defaults for all environment variables
- **Environment Checks**: Use `process.env.NODE_ENV` for environment-specific behavior
- **Port Configuration**: Default to port 3000 with environment override capability

### API Design Standards
- **Versioned APIs**: Use `/api/v1` prefix pattern for all API routes
- **Health Endpoints**: Always include `/health` endpoint with status, timestamp, and uptime
- **Consistent Response Format**: Use JSON objects with consistent structure
- **Error Handling**: Implement global error handler with environment-aware error messages
- **404 Handling**: Provide custom 404 handler with path information

### Route Organization
- **Modular Routes**: Separate route definitions into dedicated files by feature
- **Route Mounting**: Use router.use() to mount feature routes in index.js
- **Placeholder Documentation**: Include commented examples of planned routes
- **Endpoint Discovery**: Provide endpoint listing in root API response

### Configuration Management
- **Centralized Config**: Use dedicated configuration objects in app.js
- **Business Logic Constants**: Define domain-specific constants (delivery radius, quotas)
- **Nested Configuration**: Organize related settings in nested objects
- **Environment Integration**: Reference environment variables in configuration objects

## Mobile Development Standards

### React Native Component Structure
```typescript
// Standard component pattern (from App.tsx)
import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { StatusBar } from 'expo-status-bar';

const ComponentName = () => {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Content</Text>
      <StatusBar style="auto" />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#fff',
  },
});
```

### Navigation Setup Patterns
- **SafeAreaProvider**: Always wrap app in SafeAreaProvider for proper safe area handling
- **NavigationContainer**: Use NavigationContainer as root navigation wrapper
- **Stack Navigator**: Use createNativeStackNavigator for screen navigation
- **Screen Options**: Configure screen titles and options consistently

### TypeScript Integration
- **File Extensions**: Use `.tsx` for React components, `.ts` for utility files
- **Import Organization**: Group imports by source (React, React Native, third-party, local)
- **Component Typing**: Use proper TypeScript interfaces for component props
- **Export Patterns**: Use default exports for main components

### Styling Conventions
- **StyleSheet.create**: Always use StyleSheet.create for component styles
- **Style Naming**: Use descriptive names that match component hierarchy
- **Consistent Units**: Use consistent spacing units (padding: 20, marginBottom: 16)
- **Color Consistency**: Use hex colors with consistent naming patterns

## Development Workflow Standards

### Dependency Management
- **Exact Versions**: Pin exact versions for critical dependencies
- **Workspace Scripts**: Use npm workspace commands for monorepo management
- **Development vs Production**: Separate devDependencies from production dependencies
- **Script Naming**: Use consistent script naming patterns (dev, start, test)

### Error Handling Patterns
- **Global Error Handler**: Implement comprehensive error handling middleware
- **Environment-Aware Errors**: Show detailed errors in development, generic in production
- **Error Logging**: Use console.error for error logging with stack traces
- **Status Codes**: Use appropriate HTTP status codes (404, 500, etc.)

### Security Implementation
- **Helmet Integration**: Always use helmet() for security headers
- **CORS Configuration**: Configure CORS with specific origins and credentials
- **Input Validation**: Plan for express-validator integration
- **JWT Authentication**: Implement JWT-based authentication with proper secret management

### Testing Preparation
- **Jest Configuration**: Set up Jest for both backend and mobile testing
- **Test Scripts**: Include test and test:watch scripts in package.json
- **Testing Libraries**: Use supertest for API testing, React Native Testing Library for components
- **Test Organization**: Plan test files alongside source files

## Business Logic Patterns

### Domain-Specific Constants
```javascript
// Business rule configuration (from app.js)
exception: {
  regularUserQuota: {
    period: '3weeks',
    count: 1,
  },
  vipUserQuota: {
    unlimited: true,
  },
}
```

### API Versioning Strategy
- **Version in URL**: Include version in API path (`/api/v1`)
- **Environment Configuration**: Make API version configurable via environment
- **Backward Compatibility**: Plan for multiple API versions support

### Feature Planning Patterns
- **Commented Imports**: Use commented imports to document planned features
- **Placeholder Routes**: Include commented route definitions for future implementation
- **Progressive Implementation**: Build foundation first, add features incrementally

## Documentation Standards

### Code Comments
- **Inline Documentation**: Use comments to explain business logic and complex operations
- **TODO Comments**: Mark future implementations with clear TODO comments
- **Section Headers**: Use comment headers to separate logical sections
- **Configuration Comments**: Document configuration options and their purposes

### README Patterns
- **Emoji Usage**: Use emojis for visual section identification (🚀, 📍, 🔗)
- **Environment Information**: Always log environment, port, and version on startup
- **Script Documentation**: Document all available npm scripts and their purposes
- **Development Setup**: Provide clear setup instructions for new developers