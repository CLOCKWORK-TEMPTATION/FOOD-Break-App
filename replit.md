# BreakApp - Arabic Full Stack Food Ordering System

## Overview
BreakApp is a full-stack food ordering system designed for Arabic/RTL support. It includes production management dashboards, order management, crew scheduling, and analytics features.

## Project Architecture

### Frontend (React + Vite + TypeScript)
- **Location**: `/frontend`
- **Port**: 5000 (dev server)
- **Framework**: React 18 with TypeScript
- **Styling**: Tailwind CSS + CSS Modules
- **State Management**: React Query, Zustand
- **Routing**: React Router v6

### Backend (Node.js + Express)
- **Location**: `/backend`
- **Port**: 3000
- **Database**: PostgreSQL with Prisma ORM
- **API Version**: v1 (`/api/v1/*`)

### Key Routes
- `/` - Redirects to Producer Dashboard
- `/producer` - Production Control Dashboard
- `/admin` - Admin Dashboard with Arabic RTL support

## Development Setup

### Frontend
```bash
cd frontend && npm run dev
```

### Backend
```bash
cd backend && npm run dev
```

### Database
- PostgreSQL database is auto-configured via Replit
- Run migrations: `cd backend && npx prisma migrate deploy`
- Generate client: `cd backend && npx prisma generate`

## Environment Variables
- `DATABASE_URL` - PostgreSQL connection string (auto-configured)
- `JWT_SECRET` - JWT signing secret
- `PORT` - Backend port (default: 3000)
- `NODE_ENV` - Environment (development/production)

## Recent Changes
- 2024-12-30: Initial Replit environment setup
- Configured Vite to allow all hosts for proxy compatibility
- Set up Tailwind CSS configuration
- Fixed API client to use relative URLs for Vite proxy

## User Preferences
- Arabic RTL layout support is a priority
- Production dashboard features are the main focus
