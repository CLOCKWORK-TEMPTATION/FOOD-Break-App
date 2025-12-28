# BreakApp Backend API

Express.js backend API for BreakApp.

## Setup

1. Install dependencies:
```bash
npm install
```

2. Set up environment variables:
```bash
cp .env.example .env
# Edit .env with your configuration
```

3. Set up database:
```bash
# Generate Prisma Client
npm run db:generate

# Run migrations
npm run db:migrate

# Seed database (optional)
npm run db:seed
```

4. Start development server:
```bash
npm run dev
```

The API will be available at `http://localhost:3000`

## Environment Variables

See `.env.example` for required environment variables.

## API Endpoints

### Health Check
- `GET /health` - Health check endpoint

### API Routes (To be implemented)
- `/api/v1/auth` - Authentication endpoints
- `/api/v1/menus` - Menu management
- `/api/v1/restaurants` - Restaurant management
- `/api/v1/orders` - Order management
- `/api/v1/exceptions` - Exception system

## Database

This project uses PostgreSQL with Prisma ORM.

### Database Commands
- `npm run db:generate` - Generate Prisma Client
- `npm run db:migrate` - Run database migrations
- `npm run db:seed` - Seed database with initial data
- `npm run db:studio` - Open Prisma Studio

## Development

### Running Tests
```bash
npm test
```

### Project Structure
```
backend/
├── src/
│   ├── server.js          # Express server setup
│   ├── app.js             # App configuration
│   ├── routes/            # API route handlers
│   ├── controllers/       # Request handlers
│   ├── middleware/        # Custom middleware
│   ├── services/          # Business logic
│   └── utils/             # Utility functions
├── prisma/
│   └── schema.prisma      # Database schema
└── tests/                 # Test files
```


