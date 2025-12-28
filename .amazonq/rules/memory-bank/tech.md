# BreakApp Technology Stack

## Programming Languages & Versions

### Backend
- **JavaScript (Node.js)**: Runtime environment
- **Node.js**: 18+ (specified in root package.json engines)
- **npm**: 9+ (package manager requirement)

### Mobile
- **TypeScript**: 5.1.3 (strongly typed JavaScript)
- **JavaScript**: React Native runtime
- **React**: 18.2.0 (UI library)
- **React Native**: 0.72.6 (mobile framework)

### Database
- **SQL**: PostgreSQL query language
- **Prisma Schema**: Database modeling language

## Core Frameworks & Libraries

### Backend Stack
- **Express.js**: 4.18.2 (web application framework)
- **Prisma**: 5.7.1 (database ORM and client)
- **PostgreSQL**: Database system (version 14+ required)

### Mobile Stack
- **Expo**: ~49.0.15 (React Native development platform)
- **React Navigation**: 6.x (navigation library)
  - Native Stack Navigator: 6.9.17
  - Bottom Tabs Navigator: 6.5.11
- **Redux Toolkit**: 2.0.1 (state management)
- **React Redux**: 9.0.4 (React bindings for Redux)

## Security & Authentication
- **JWT**: jsonwebtoken 9.0.2 (authentication tokens)
- **bcryptjs**: 2.4.3 (password hashing)
- **Helmet**: 7.1.0 (security headers)
- **express-validator**: 7.0.1 (input validation)

## Development Tools

### Backend Development
- **nodemon**: 3.0.2 (development server auto-restart)
- **Jest**: 29.7.0 (testing framework)
- **Supertest**: 6.3.3 (HTTP assertion testing)
- **Morgan**: 1.10.0 (HTTP request logging)
- **Compression**: 1.7.4 (response compression)

### Mobile Development
- **TypeScript**: 5.1.3 (type checking)
- **ESLint**: 8.57.0 (code linting)
- **@typescript-eslint**: 6.13.1 (TypeScript ESLint rules)
- **Jest**: 29.2.1 (testing framework)
- **@testing-library/react-native**: 12.4.2 (component testing)
- **Babel**: 7.20.0 (JavaScript transpilation)

## Mobile-Specific Libraries
- **expo-location**: ~16.1.0 (GPS and location services)
- **expo-camera**: ~13.4.4 (QR code scanning)
- **expo-notifications**: ~0.20.1 (push notifications)
- **react-native-screens**: ~3.22.0 (native screen optimization)
- **react-native-safe-area-context**: 4.6.3 (safe area handling)
- **@react-native-async-storage/async-storage**: 1.18.2 (local storage)
- **axios**: 1.6.2 (HTTP client)

## Build Systems & Package Management

### Workspace Configuration
- **npm workspaces**: Monorepo dependency management
- **Root package.json**: Workspace orchestration
- **Individual package.json**: Service-specific dependencies

### Development Scripts
```bash
# Root level commands
npm run install:all    # Install all workspace dependencies
npm run dev:backend     # Start backend development server
npm run dev:mobile      # Start mobile development server
npm test               # Run tests across workspaces

# Backend specific
npm run start          # Production server start
npm run dev            # Development server with hot reload
npm run db:migrate     # Run database migrations
npm run db:generate    # Generate Prisma client
npm run db:seed        # Seed database with initial data
npm run db:studio      # Open Prisma Studio

# Mobile specific
npm run start          # Start Expo development server
npm run android        # Run on Android emulator
npm run ios            # Run on iOS simulator
npm run web            # Run in web browser
npm run lint           # Run ESLint code analysis
```

## Database Technology
- **PostgreSQL**: 14+ (relational database)
- **Prisma ORM**: Type-safe database client
- **Prisma Migrate**: Database schema versioning
- **Prisma Studio**: Database GUI tool

## API & Communication
- **RESTful API**: HTTP-based service architecture
- **CORS**: 2.8.5 (cross-origin resource sharing)
- **JSON**: Data interchange format
- **JWT**: Stateless authentication tokens

## Environment & Configuration
- **dotenv**: 16.3.1 (environment variable management)
- **Environment Files**: .env configuration
- **nodemon.json**: Development server configuration
- **tsconfig.json**: TypeScript compiler configuration
- **app.json**: Expo/React Native app configuration

## Testing Framework
- **Jest**: Unit and integration testing
- **Supertest**: API endpoint testing
- **React Native Testing Library**: Component testing
- **Test Scripts**: Automated test execution with watch mode

## Code Quality & Standards
- **ESLint**: Code linting and style enforcement
- **TypeScript**: Static type checking
- **Prettier**: Code formatting (implied by ESLint config)
- **Git**: Version control system

## Infrastructure Requirements
- **Node.js**: 18+ runtime environment
- **npm**: 9+ package manager
- **PostgreSQL**: 14+ database server
- **React Native CLI**: Mobile development toolchain
- **Expo CLI**: Mobile development platform

## Future Technology Integrations (Planned)
- **Google Maps API**: Location and mapping services
- **Stripe/PayPal**: Payment processing
- **AWS/GCP/Azure**: Cloud infrastructure
- **Sentry**: Error tracking and monitoring
- **Firebase**: Push notifications and analytics
- **Docker**: Containerization for deployment
- **GitHub Actions**: CI/CD pipeline automation