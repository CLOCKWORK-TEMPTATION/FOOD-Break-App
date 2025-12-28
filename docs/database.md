# Database Schema Documentation

## Overview

BreakApp uses PostgreSQL as the primary database with Prisma as the ORM. The schema is defined in `backend/prisma/schema.prisma`.

## Entity Relationship Diagram

```
User ──┬── Order ──┬── Restaurant
       │           └── OrderItem ── MenuItem ── Restaurant
       │
       ├── Exception ── Order
       ├── Review ── Restaurant
       └── Notification

Restaurant ── MenuItem
```

## Core Models

### User
Represents application users with different roles.

**Fields:**
- `id`: UUID (Primary Key)
- `email`: String (Unique)
- `passwordHash`: String
- `firstName`, `lastName`: String
- `phoneNumber`: String (Optional)
- `role`: Enum (REGULAR, VIP, ADMIN, PRODUCER)
- `isActive`: Boolean
- `createdAt`, `updatedAt`: DateTime

**Relations:**
- One-to-Many: Orders, Exceptions, Reviews, Notifications

### Restaurant
Represents restaurant partners and nearby restaurants.

**Fields:**
- `id`: UUID (Primary Key)
- `name`: String
- `description`: String (Optional)
- `cuisineType`: String (Optional)
- `address`: String
- `latitude`, `longitude`: Float (for geographic filtering)
- `phoneNumber`, `email`: String (Optional)
- `isPartner`: Boolean (Core Menu partner)
- `isActive`: Boolean
- `rating`: Float
- `createdAt`, `updatedAt`, `lastReviewed`: DateTime

**Relations:**
- One-to-Many: MenuItems, Orders, Reviews

### MenuItem
Represents menu items from restaurants.

**Fields:**
- `id`: UUID (Primary Key)
- `restaurantId`: UUID (Foreign Key)
- `name`: String
- `nameAr`: String (Arabic name)
- `description`, `descriptionAr`: String (Optional)
- `price`: Float
- `category`: String (Optional)
- `imageUrl`: String (Optional)
- `isAvailable`: Boolean
- `menuType`: Enum (CORE, GEOGRAPHIC)
- `qualityScore`: Float
- `createdAt`, `updatedAt`: DateTime

**Menu Types:**
- **CORE**: Fixed menu items from partner restaurants (القائمة الثابتة المتجددة)
- **GEOGRAPHIC**: Location-based menu items within 2-3 km radius (القائمة الجغرافية)

### Order
Represents user orders.

**Fields:**
- `id`: UUID (Primary Key)
- `userId`: UUID (Foreign Key)
- `restaurantId`: UUID (Foreign Key, Optional)
- `projectId`: String (QR code project reference)
- `status`: Enum (PENDING, CONFIRMED, PREPARING, OUT_FOR_DELIVERY, DELIVERED, CANCELLED)
- `orderType`: Enum (REGULAR, EXCEPTION)
- `totalAmount`: Float
- `exceptionType`: Enum (FULL, LIMITED, SELF_PAID) - Optional
- `exceptionAmount`: Float (Amount paid by user)
- `deliveryAddress`: String (Optional)
- `deliveryLat`, `deliveryLng`: Float (GPS coordinates)
- `estimatedTime`, `deliveredAt`: DateTime (Optional)
- `createdAt`, `updatedAt`: DateTime

**Relations:**
- Many-to-One: User, Restaurant
- One-to-Many: OrderItems

### Exception
Tracks exception orders for users.

**Fields:**
- `id`: UUID (Primary Key)
- `userId`: UUID (Foreign Key)
- `orderId`: UUID (Foreign Key, Unique)
- `exceptionType`: Enum (FULL, LIMITED, SELF_PAID)
- `amount`: Float
- `quotaUsed`: Boolean
- `approvedBy`: String (Admin/Producer ID)
- `createdAt`: DateTime

**Exception Types:**
- **FULL** (الاستثناء التام): Any restaurant, fully paid by production
- **LIMITED** (الاستثناء في الحدود): Pay only the difference
- **SELF_PAID** (الاستثناء المدفوع بالكامل): User pays everything

### Review
User reviews and ratings for restaurants and menu items.

**Fields:**
- `id`: UUID (Primary Key)
- `userId`: UUID (Foreign Key)
- `restaurantId`: UUID (Foreign Key)
- `menuItemId`: UUID (Optional)
- `rating`: Int (1-5)
- `comment`: String (Optional)
- `images`: String[] (Array of image URLs)
- `createdAt`, `updatedAt`: DateTime

## Indexes and Constraints

### Recommended Indexes
- `User.email` (Unique Index)
- `Restaurant.latitude, Restaurant.longitude` (Spatial Index for geographic queries)
- `Order.userId, Order.createdAt` (Composite Index for user order history)
- `Order.status, Order.createdAt` (Composite Index for order management)
- `MenuItem.restaurantId, MenuItem.menuType` (Composite Index for menu filtering)

## Migration Strategy

1. Use Prisma Migrate for schema changes
2. Create migration files for each schema change
3. Test migrations in development before production
4. Backup database before applying migrations

## Seeding Data

Initial seed data includes:
- Admin user
- Sample restaurants
- Sample menu items
- Test projects

Run seed script: `npm run db:seed`


