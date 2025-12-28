# BreakApp - Project Structure

## Directory Organization

```
breakapp/
├── backend/                    # Node.js/Express backend API
│   ├── prisma/                # Database schema and migrations
│   │   ├── migrations/        # Database migration files
│   │   ├── schema.prisma      # Prisma schema definition
│   │   ├── seed.js            # Database seeding script
│   │   └── seed-emotion.js    # Emotion AI data seeding
│   ├── src/                   # Backend source code
│   │   ├── controllers/       # Request handlers
│   │   ├── services/          # Business logic layer
│   │   │   ├── ml/           # Machine learning services
│   │   │   ├── dietary/      # Dietary and nutrition services
│   │   │   └── ...           # Other service modules
│   │   ├── routes/            # API route definitions
│   │   ├── middleware/        # Express middleware
│   │   ├── models/            # Data models
│   │   ├── utils/             # Utility functions
│   │   ├── jobs/              # Background jobs and cron tasks
│   │   ├── app.js             # Express app configuration
│   │   └── server.js          # Server entry point
│   ├── tests/                 # Test suites
│   │   ├── unit/             # Unit tests
│   │   ├── integration/      # Integration tests
│   │   ├── e2e/              # End-to-end tests
│   │   ├── fixtures/         # Test data fixtures
│   │   ├── mocks/            # Mock objects
│   │   └── helpers/          # Test utilities
│   ├── docs/                  # Backend documentation
│   ├── .env                   # Environment variables
│   ├── package.json           # Backend dependencies
│   └── jest.config.js         # Jest test configuration
│
├── mobile/                    # React Native mobile application
│   ├── src/                   # Mobile source code
│   │   ├── screens/          # Screen components
│   │   ├── components/       # Reusable UI components
│   │   ├── navigation/       # Navigation configuration
│   │   ├── services/         # API client services
│   │   ├── theme/            # Theme and styling
│   │   └── __tests__/        # Mobile tests
│   ├── App.tsx               # Mobile app entry point
│   ├── app.json              # Expo configuration
│   ├── package.json          # Mobile dependencies
│   └── jest.config.js        # Jest configuration
│
├── frontend/                  # React web dashboard (admin/producer)
│   ├── src/                   # Frontend source code
│   │   ├── pages/            # Page components
│   │   ├── components/       # Reusable components
│   │   ├── services/         # API services
│   │   ├── test/             # Test utilities
│   │   ├── __tests__/        # Frontend tests
│   │   ├── App.tsx           # App entry point
│   │   └── main.tsx          # Vite entry point
│   ├── package.json          # Frontend dependencies
│   ├── vite.config.ts        # Vite configuration
│   └── vitest.config.ts      # Vitest configuration
│
├── mcp-server-mas-sequential-thinking/  # Python MCP server
│   ├── src/                   # Python source code
│   │   └── mcp_server_mas_sequential_thinking/
│   │       └── routing/       # Multi-agent routing logic
│   ├── pyproject.toml         # Python dependencies
│   └── README.md              # MCP server documentation
│
├── docs/                      # Project documentation
│   ├── architecture.md        # System architecture
│   ├── database.md            # Database schema docs
│   ├── EMOTION_AI_FEATURE.md  # Emotion AI documentation
│   ├── NUTRITION_FEATURE.md   # Nutrition feature docs
│   └── ...                    # Other documentation
│
├── e2e/                       # End-to-end tests (Playwright)
│   ├── auth.spec.ts           # Authentication tests
│   ├── orders.spec.ts         # Order workflow tests
│   └── playwright.config.ts   # Playwright configuration
│
├── .amazonq/                  # Amazon Q configuration
│   └── rules/                 # Development rules
│       ├── AGENTS.md          # Agent instructions
│       └── memory-bank/       # Memory bank documentation
│
├── package.json               # Root workspace configuration
├── README.md                  # Project README
└── TODO.md                    # Development roadmap
```

## Core Components & Relationships

### Backend Architecture

#### Controllers Layer
- **Purpose**: Handle HTTP requests, validate input, return responses
- **Pattern**: Thin controllers delegate to services
- **Location**: `backend/src/controllers/`
- **Examples**: `authController.js`, `orderController.js`, `menuController.js`

#### Services Layer
- **Purpose**: Business logic, data processing, external integrations
- **Pattern**: Service-oriented architecture with specialized modules
- **Location**: `backend/src/services/`
- **Key Services**:
  - `ml/`: Machine learning services (recommendations, predictions)
  - `dietary/`: Nutrition and dietary management
  - `payment/`: Payment processing (Stripe, PayPal)
  - `notification/`: Push, email, SMS notifications
  - `qr/`: QR code generation and validation

#### Routes Layer
- **Purpose**: Define API endpoints and middleware chains
- **Pattern**: RESTful API design with versioning
- **Location**: `backend/src/routes/`
- **Structure**: `/api/v1/{resource}`

#### Middleware Layer
- **Purpose**: Request preprocessing, authentication, validation
- **Location**: `backend/src/middleware/`
- **Key Middleware**:
  - `auth.js`: JWT authentication
  - `validation.js`: Request validation (Zod schemas)
  - `errorHandler.js`: Centralized error handling
  - `rateLimiter.js`: Rate limiting protection

#### Database Layer
- **ORM**: Prisma
- **Database**: PostgreSQL
- **Schema**: `backend/prisma/schema.prisma`
- **Key Models**:
  - User, UserPreferences, DietaryProfile, AllergyProfile
  - Restaurant, MenuItem, NutritionalInfo, FoodLabel
  - Order, OrderItem, OrderTracking
  - Exception, CostBudget, CostAlert
  - Project, ProjectMember, ProjectReminderSettings
  - Recommendation, UserBehavior, OrderPattern
  - Payment, Invoice
  - EmotionProfile, UserMoodLog
  - MedicalProfile, AllergyAlert

### Mobile Application Architecture

#### Screen Components
- **Purpose**: Full-screen views for user interactions
- **Location**: `mobile/src/screens/`
- **Examples**: `HomeScreen`, `MenuScreen`, `OrderScreen`, `ProfileScreen`

#### Navigation
- **Library**: React Navigation
- **Pattern**: Stack and tab navigation
- **Location**: `mobile/src/navigation/`

#### Services
- **Purpose**: API communication, data fetching
- **Location**: `mobile/src/services/`
- **Pattern**: Axios-based HTTP client with interceptors

### Frontend Dashboard Architecture

#### Pages
- **Purpose**: Admin and producer dashboard views
- **Location**: `frontend/src/pages/`
- **Examples**: Analytics, Orders, Users, Restaurants

#### Components
- **Purpose**: Reusable UI components
- **Location**: `frontend/src/components/`
- **Pattern**: Functional components with hooks

## Architectural Patterns

### Layered Architecture
```
Presentation Layer (Mobile/Web)
    ↓
API Layer (Express Routes)
    ↓
Business Logic Layer (Services)
    ↓
Data Access Layer (Prisma ORM)
    ↓
Database Layer (PostgreSQL)
```

### Service-Oriented Design
- **Separation of Concerns**: Each service handles specific domain logic
- **Dependency Injection**: Services injected into controllers
- **Testability**: Services can be mocked for unit testing

### Repository Pattern (via Prisma)
- **Abstraction**: Prisma Client abstracts database operations
- **Type Safety**: TypeScript types generated from schema
- **Migrations**: Version-controlled schema changes

### API Design Patterns
- **RESTful**: Resource-based URLs, HTTP verbs
- **Pagination**: Cursor-based pagination for large datasets
- **Filtering**: Query parameters for filtering and sorting
- **Error Handling**: Consistent error response format

### Authentication & Authorization
- **JWT Tokens**: Stateless authentication
- **Role-Based Access Control (RBAC)**: User roles (REGULAR, VIP, ADMIN, PRODUCER)
- **Project-Based Access**: QR code tokens for project membership

### Real-time Features
- **GPS Tracking**: Periodic location updates stored in OrderTracking
- **Notifications**: Push notifications via Expo (mobile) and web push
- **Live Updates**: Polling or WebSocket for order status changes

## Data Flow Examples

### Order Submission Flow
```
Mobile App → POST /api/orders
    ↓
orderController.createOrder()
    ↓
orderService.createOrder()
    ↓
- Validate user quota
- Check project access
- Calculate costs
- Create order in DB
- Trigger notifications
    ↓
Response to Mobile App
```

### Recommendation Generation Flow
```
Cron Job (daily)
    ↓
recommendationService.generateRecommendations()
    ↓
- Fetch user order history
- Get weather data
- Analyze dietary patterns
- Run ML model
- Store recommendations
    ↓
Mobile App fetches recommendations
```

### Exception Approval Flow
```
User requests exception
    ↓
exceptionService.requestException()
    ↓
- Check user quota
- Calculate cost differential
- Check budget thresholds
- Create cost alert if needed
- Notify producer/admin
    ↓
Producer approves/rejects
    ↓
Update exception status
```

## Testing Strategy

### Unit Tests
- **Location**: `backend/tests/unit/`
- **Coverage**: Services, utilities, helpers
- **Framework**: Jest
- **Pattern**: Isolated tests with mocks

### Integration Tests
- **Location**: `backend/tests/integration/`
- **Coverage**: API endpoints, database operations
- **Framework**: Jest + Supertest
- **Pattern**: Test database with fixtures

### E2E Tests
- **Location**: `e2e/`
- **Coverage**: Critical user journeys
- **Framework**: Playwright
- **Pattern**: Full stack testing with test database

### Mobile Tests
- **Location**: `mobile/src/__tests__/`
- **Framework**: Jest + React Native Testing Library
- **Coverage**: Components, screens, services

## Configuration Management

### Environment Variables
- **Backend**: `.env` (DATABASE_URL, JWT_SECRET, API keys)
- **Mobile**: Expo configuration in `app.json`
- **Frontend**: Vite environment variables

### Workspace Configuration
- **Root**: `package.json` defines workspaces (backend, mobile)
- **Scripts**: Centralized npm scripts for dev, test, build

## Deployment Architecture (Planned)
- **Backend**: Node.js server on AWS/GCP/Azure
- **Database**: Managed PostgreSQL (RDS, Cloud SQL)
- **Mobile**: Expo build → App Store / Google Play
- **Frontend**: Static hosting (S3, Vercel, Netlify)
- **CI/CD**: GitHub Actions (`.github/workflows/ci.yml`)
