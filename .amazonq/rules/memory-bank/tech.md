# BreakApp - Technology Stack

## Programming Languages

### JavaScript/TypeScript
- **Backend**: Node.js 18+ with JavaScript (ES6+)
- **Mobile**: TypeScript 5.1+ with React Native
- **Frontend**: TypeScript 5.1+ with React 18
- **Rationale**: Type safety, modern async/await, strong ecosystem

### Python
- **MCP Server**: Python 3.x
- **ML Services**: TensorFlow/PyTorch integration
- **Location**: `mcp-server-mas-sequential-thinking/`

## Backend Stack

### Runtime & Framework
- **Node.js**: 18.0.0+ (LTS)
- **Express.js**: 4.18.2 - Web framework
- **Nodemon**: 3.0.2 - Development auto-reload

### Database & ORM
- **PostgreSQL**: 14+ - Primary database
- **Prisma**: 5.22.0 - ORM and query builder
- **Prisma Client**: 5.22.0 - Type-safe database client

### Authentication & Security
- **jsonwebtoken**: 9.0.2 - JWT token generation/verification
- **bcryptjs**: 2.4.3 - Password hashing
- **helmet**: 7.1.0 - Security headers
- **cors**: 2.8.5 - Cross-origin resource sharing
- **express-rate-limit**: 8.2.1 - Rate limiting

### Validation & Data Processing
- **zod**: 4.2.1 - Schema validation
- **express-validator**: 7.0.1 - Request validation

### Payment Integration
- **stripe**: 20.1.0 - Stripe payment processing
- **@paypal/checkout-server-sdk**: 1.0.3 - PayPal integration

### Machine Learning
- **@tensorflow/tfjs**: 4.15.0 - TensorFlow.js
- **@tensorflow/tfjs-node**: 4.15.0 - Node.js backend for TensorFlow

### Utilities
- **axios**: 1.6.2 - HTTP client
- **qrcode**: 1.5.3 - QR code generation
- **node-cron**: 4.2.1 - Scheduled jobs
- **nodemailer**: 7.0.12 - Email sending
- **compression**: 1.7.4 - Response compression
- **morgan**: 1.10.0 - HTTP request logger

### Monitoring & Error Tracking
- **@sentry/node**: 10.32.1 - Error tracking and monitoring

### Testing
- **jest**: 29.7.0 - Test framework
- **supertest**: 6.3.3 - HTTP assertion library
- **jest-junit**: 16.0.0 - JUnit reporter for CI
- **jest-mock-extended**: 4.0.0 - Advanced mocking
- **@types/jest**: 30.0.0 - TypeScript types for Jest
- **@types/supertest**: 6.0.3 - TypeScript types for Supertest

## Mobile Stack

### Framework & Runtime
- **React Native**: 0.72.6
- **React**: 18.2.0
- **Expo**: ~49.0.15 - Development platform
- **TypeScript**: 5.1.3

### Navigation
- **@react-navigation/native**: 6.1.9 - Navigation library
- **@react-navigation/native-stack**: 6.9.17 - Stack navigator
- **@react-navigation/bottom-tabs**: 6.5.11 - Tab navigator
- **react-native-screens**: 3.22.0 - Native screen optimization
- **react-native-safe-area-context**: 4.6.3 - Safe area handling

### Device Features
- **expo-camera**: 13.4.4 - Camera access
- **expo-barcode-scanner**: 12.5.3 - QR code scanning
- **expo-location**: 16.1.0 - GPS location
- **expo-notifications**: 0.20.1 - Push notifications
- **react-native-maps**: 1.7.1 - Map integration

### State & Storage
- **@react-native-async-storage/async-storage**: 1.18.2 - Local storage
- **axios**: 1.6.2 - API client

### UI Components
- **@expo/vector-icons**: 13.0.0 - Icon library

### Testing
- **jest**: 29.2.1 - Test framework
- **jest-expo**: 49.0.0 - Expo preset for Jest
- **@testing-library/react-native**: 12.4.2 - Testing utilities
- **@testing-library/jest-native**: 5.4.3 - Custom matchers
- **react-test-renderer**: 18.2.0 - React renderer for tests

### Development Tools
- **@babel/core**: 7.20.0 - JavaScript compiler
- **eslint**: 8.57.0 - Linting
- **@typescript-eslint/eslint-plugin**: 6.13.1 - TypeScript linting
- **@typescript-eslint/parser**: 6.13.1 - TypeScript parser

## Frontend Stack (Web Dashboard)

### Framework & Build Tool
- **React**: 18.2.0
- **TypeScript**: 5.1.3
- **Vite**: Latest - Build tool and dev server
- **Vitest**: Latest - Testing framework

### Testing
- **@testing-library/react-native**: 12.4.2 - Component testing

## End-to-End Testing

### Framework
- **Playwright**: 1.57.0 - Browser automation
- **@playwright/test**: 1.57.0 - Test runner

## Python Stack (MCP Server)

### Package Manager
- **uv**: Modern Python package manager
- **pyproject.toml**: Dependency management

### Framework
- **MCP Server**: Multi-agent sequential thinking server

## Build Systems & Package Managers

### Node.js
- **npm**: 9.0.0+ - Primary package manager
- **Workspaces**: Monorepo management (backend, mobile)

### Python
- **uv**: Fast Python package installer

## Development Commands

### Root Workspace
```bash
# Install all dependencies
npm run install:all

# Run backend in development mode
npm run dev:backend

# Run mobile app
npm run dev:mobile

# Run all tests
npm run test

# Run unit tests only
npm run test:unit

# Run unit tests with watch mode
npm run test:unit:watch

# Run unit tests with coverage
npm run test:unit:coverage

# Run E2E tests
npm run test:e2e

# Run E2E tests with UI
npm run test:e2e:ui

# Run E2E tests in headed mode
npm run test:e2e:headed

# Debug E2E tests
npm run test:e2e:debug

# Run all tests (unit + E2E)
npm run test:all

# Show E2E test report
npm run test:report
```

### Backend
```bash
cd backend

# Start server
npm start

# Development mode with auto-reload
npm run dev

# Run tests
npm test

# Watch mode for tests
npm run test:watch

# Unit tests only
npm run test:unit

# Integration tests only
npm run test:integration

# E2E tests only
npm run test:e2e

# Coverage report
npm run test:coverage

# CI test run
npm run test:ci

# Verbose test output
npm run test:verbose

# Run all test suites
npm run test:all

# Database migrations
npm run db:migrate

# Generate Prisma client
npm run db:generate

# Seed database
npm run db:seed

# Seed emotion AI data
npm run db:seed:emotion

# Open Prisma Studio
npm run db:studio
```

### Mobile
```bash
cd mobile

# Start Expo dev server
npm start

# Run on Android
npm run android

# Run on iOS
npm run ios

# Run on web
npm run web

# Run tests
npm test

# Watch mode for tests
npm run test:watch

# Coverage report
npm run test:coverage

# Lint code
npm run lint
```

### Frontend
```bash
cd frontend

# Development server
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview

# Run tests
npm test

# Lint code
npm run lint
```

## Environment Requirements

### Node.js
- **Version**: 18.0.0 or higher
- **npm**: 9.0.0 or higher

### Database
- **PostgreSQL**: 14 or higher
- **Connection**: DATABASE_URL environment variable

### Mobile Development
- **iOS**: Xcode 14+ (macOS only)
- **Android**: Android Studio with SDK 33+
- **Expo CLI**: Installed globally or via npx

### Python (MCP Server)
- **Version**: 3.8 or higher
- **uv**: Installed for package management

## Configuration Files

### Backend
- **package.json**: Dependencies and scripts
- **jest.config.js**: Jest test configuration
- **nodemon.json**: Nodemon configuration
- **.env**: Environment variables (not in git)
- **.env.example**: Environment template
- **prisma/schema.prisma**: Database schema

### Mobile
- **package.json**: Dependencies and scripts
- **app.json**: Expo configuration
- **jest.config.js**: Jest configuration
- **tsconfig.json**: TypeScript configuration
- **.eslintrc.cjs**: ESLint configuration

### Frontend
- **package.json**: Dependencies and scripts
- **vite.config.ts**: Vite configuration
- **vitest.config.ts**: Vitest configuration
- **tsconfig.json**: TypeScript configuration

### E2E
- **playwright.config.ts**: Playwright configuration
- **playwright.config.js**: Alternative config

### Root
- **package.json**: Workspace configuration
- **.gitignore**: Git ignore rules
- **.github/workflows/ci.yml**: CI/CD pipeline

## API Versions
- **REST API**: v1 (base path: `/api/v1`)
- **Database Schema**: Managed via Prisma migrations

## External Services (Planned)
- **Payment**: Stripe, PayPal
- **Maps**: Google Maps API
- **Notifications**: Firebase Cloud Messaging (FCM)
- **Email**: SMTP (Nodemailer)
- **SMS**: Twilio (planned)
- **Cloud Storage**: AWS S3 / Google Cloud Storage
- **Monitoring**: Sentry
- **Analytics**: Mixpanel / Amplitude (planned)

## Development Tools
- **Version Control**: Git
- **CI/CD**: GitHub Actions
- **Code Editor**: VS Code (recommended)
- **API Testing**: Postman / Insomnia
- **Database Client**: Prisma Studio, pgAdmin, DBeaver
