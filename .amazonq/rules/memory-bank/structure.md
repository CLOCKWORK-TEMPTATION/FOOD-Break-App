# BreakApp Project Structure

## Directory Organization

### Root Level
```
breakapp/
├── backend/          # Node.js/Express API server
├── mobile/           # React Native mobile application  
├── docs/             # Project documentation
├── .amazonq/         # AI assistant rules and memory
├── .qodo/            # Code quality and workflow tools
├── package.json      # Workspace configuration
├── README.md         # Project overview
└── TODO.md           # Development roadmap
```

### Backend Structure (`/backend/`)
```
backend/
├── src/
│   ├── controllers/  # Request handlers and business logic
│   ├── middleware/   # Authentication, validation, logging
│   ├── routes/       # API endpoint definitions
│   │   └── index.js  # Main route aggregator
│   ├── services/     # Business logic and external integrations
│   ├── utils/        # Helper functions and utilities
│   ├── app.js        # Express application setup
│   └── server.js     # Server entry point
├── prisma/
│   └── schema.prisma # Database schema definition
├── package.json      # Backend dependencies
├── nodemon.json      # Development server configuration
└── env.example.txt   # Environment variables template
```

### Mobile Structure (`/mobile/`)
```
mobile/
├── src/
│   ├── components/   # Reusable UI components
│   ├── screens/      # Screen-level components
│   ├── services/     # API clients and external services
│   └── store/        # State management (Redux/Zustand)
├── App.tsx           # Main application component
├── package.json      # Mobile dependencies
├── app.json          # Expo/React Native configuration
└── tsconfig.json     # TypeScript configuration
```

### Documentation (`/docs/`)
```
docs/
├── architecture.md   # System architecture overview
└── database.md       # Database design and relationships
```

## Core Components & Relationships

### Backend Architecture
- **Server Entry Point**: `server.js` initializes the HTTP server
- **Application Setup**: `app.js` configures Express middleware and routes
- **Route Management**: `routes/index.js` aggregates all API endpoints
- **Database Layer**: Prisma ORM handles PostgreSQL interactions
- **Business Logic**: Controllers and services implement core functionality

### Mobile Architecture  
- **Entry Point**: `App.tsx` bootstraps the React Native application
- **Screen Navigation**: React Navigation manages screen transitions
- **State Management**: Centralized store for application state
- **API Integration**: Services layer handles backend communication
- **UI Components**: Reusable components for consistent design

### Data Flow
1. **Mobile App** → API requests → **Backend Routes**
2. **Controllers** → Business logic → **Services**
3. **Services** → Database queries → **Prisma ORM**
4. **Database** → Response data → **Mobile App**

## Architectural Patterns

### Monorepo Structure
- **Workspace Management**: npm workspaces for unified dependency management
- **Shared Scripts**: Root-level scripts coordinate backend and mobile development
- **Independent Deployment**: Each workspace can be deployed separately

### API Design
- **RESTful Architecture**: Standard HTTP methods and status codes
- **Route Organization**: Logical grouping by feature/resource
- **Middleware Pipeline**: Authentication, validation, and error handling
- **Service Layer**: Separation of business logic from HTTP concerns

### Mobile Architecture
- **Component-Based**: Modular UI components for reusability
- **Screen-Based Navigation**: Clear separation of application screens
- **Centralized State**: Single source of truth for application data
- **Service Abstraction**: Clean API integration layer

### Database Design
- **Relational Model**: PostgreSQL for ACID compliance and complex queries
- **ORM Integration**: Prisma for type-safe database operations
- **Schema Management**: Version-controlled database migrations
- **Performance Optimization**: Indexed queries and relationship optimization

## Development Workflow

### Environment Setup
- **Node.js 18+**: Runtime requirement for both backend and mobile
- **PostgreSQL 14+**: Database server for data persistence
- **React Native CLI**: Mobile development toolchain
- **Development Scripts**: Unified commands for workspace management

### Build Process
- **Backend**: Express server with nodemon for hot reloading
- **Mobile**: React Native Metro bundler for development builds
- **Database**: Prisma migrations for schema synchronization
- **Testing**: Jest framework for unit and integration tests

### Deployment Strategy
- **Backend**: Node.js server deployment to cloud infrastructure
- **Mobile**: React Native builds for iOS and Android app stores
- **Database**: Managed PostgreSQL service (AWS RDS/GCP Cloud SQL)
- **CI/CD**: GitHub Actions for automated testing and deployment