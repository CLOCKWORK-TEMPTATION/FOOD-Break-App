# BreakApp Architecture

## System Overview

BreakApp is a food ordering and delivery management system designed for production teams. The system consists of:

1. **Backend API** (Node.js/Express)
2. **Mobile Application** (React Native)
3. **Database** (PostgreSQL)
4. **Cloud Infrastructure** (To be configured)

## Architecture Diagram

```
┌─────────────────┐
│  Mobile App     │
│  (React Native) │
└────────┬────────┘
         │
         │ HTTPS/REST API
         │
┌────────▼────────┐
│  Backend API    │
│  (Express.js)   │
└────────┬────────┘
         │
    ┌────┴────┐
    │         │
┌───▼───┐ ┌──▼────┐
│   DB  │ │  S3   │
│ (PG)  │ │ (AWS) │
└───────┘ └───────┘
```

## Technology Stack

### Backend
- **Runtime**: Node.js 18+
- **Framework**: Express.js
- **Database**: PostgreSQL
- **ORM**: Prisma
- **Authentication**: JWT
- **API Style**: RESTful

### Mobile
- **Framework**: React Native with Expo
- **Language**: TypeScript
- **State Management**: Redux Toolkit
- **Navigation**: React Navigation

### Infrastructure
- **Cloud Provider**: AWS / GCP / Azure (To be selected)
- **CI/CD**: GitHub Actions / GitLab CI
- **Monitoring**: Sentry
- **Maps**: Google Maps API

## Database Schema

See `backend/prisma/schema.prisma` for the complete database schema.

### Key Models
- **User**: Users with roles (REGULAR, VIP, ADMIN, PRODUCER)
- **Restaurant**: Restaurant partners
- **MenuItem**: Menu items (CORE and GEOGRAPHIC types)
- **Order**: Orders with status tracking
- **Exception**: Exception tracking system
- **Review**: User reviews and ratings
- **Notification**: Push notifications
- **Project**: QR code project references

## API Architecture

### RESTful Endpoints Structure

```
/api/v1/
├── /auth
│   ├── POST /register
│   ├── POST /login
│   └── POST /refresh
├── /menus
│   ├── GET / (list menus)
│   ├── GET /:id
│   └── POST / (create menu item)
├── /restaurants
│   ├── GET / (list restaurants)
│   ├── GET /:id
│   └── GET /nearby (geographic filtering)
├── /orders
│   ├── GET / (user orders)
│   ├── POST / (create order)
│   └── GET /:id
└── /exceptions
    ├── GET / (user exceptions)
    └── POST / (request exception)
```

## Security

- JWT-based authentication
- Password hashing with bcrypt
- HTTPS/TLS encryption
- CORS configuration
- Helmet.js security headers
- Input validation with express-validator
- Role-based access control (RBAC)

## Deployment

### Development
- Local PostgreSQL database
- Local development server (nodemon)
- Expo Go for mobile testing

### Production
- Containerized deployment (Docker)
- Managed PostgreSQL database
- CDN for static assets
- Load balancing
- Auto-scaling

## Future Considerations

- GraphQL API (optional)
- Real-time features (WebSockets)
- Caching layer (Redis)
- Message queue (RabbitMQ/SQS)
- Microservices architecture (if needed)


