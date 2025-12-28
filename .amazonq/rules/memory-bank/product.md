# BreakApp - Product Overview

## Project Purpose
BreakApp is a comprehensive food ordering and delivery management system designed specifically for production teams (film crews, TV shows, etc.). It streamlines meal ordering, tracks deliveries, handles exceptions, and optimizes food costs through intelligent AI-powered features.

## Value Proposition
- **Automated Order Management**: Eliminates manual coordination of team meal orders during production shoots
- **Smart Cost Control**: Tracks budgets, manages exceptions, and provides financial intelligence for producers
- **Personalized Experience**: AI-driven recommendations based on weather, preferences, and nutritional needs
- **Emergency Ready**: Fast-track ordering system for production schedule changes
- **Health-Conscious**: Nutrition tracking, dietary restrictions, allergy management, and wellness challenges

## Key Features & Capabilities

### Core Ordering System
- **QR Code Access**: Project-based access control via QR codes for crew members
- **Dual Menu System**:
  - Core Menu: Vetted partner restaurants with quality tracking
  - Geographic Menu: Location-based restaurants within 2-3km radius
- **Order Window Management**: Time-bound ordering (first hour of shooting)
- **Real-time GPS Tracking**: Live delivery tracking with ETA calculations
- **Half-hourly Reminders**: Automated notifications for non-submitters

### Exception Management
- **Three Exception Types**:
  - Full Exception: Production pays everything (VIP unlimited, regular users once/3 weeks)
  - Limited Exception: User pays the difference above standard meal cost
  - Self-Paid Exception: User pays everything
- **Cost Budget System**: Threshold alerts for VIP/producer spending limits
- **Quota Tracking**: Automatic exception quota management per user role

### AI & Intelligence Features
- **Smart Recommendations**: Weather-based, personalized, and dietary diversity suggestions
- **Predictive Ordering**: Auto-fill orders based on user patterns and behavior analysis
- **Emotion-Based AI**: Mood tracking with comfort food recommendations for stressful days
- **Quantity Forecasting**: Predict demand for restaurant negotiations and bulk discounts

### Health & Nutrition
- **Personal Nutrition Dashboard**: Calorie tracking, macronutrients, weekly reports
- **Custom Diet Filters**: Halal, vegan, gluten-free, keto, low-sodium, etc.
- **Allergy Alert System**: Red alerts for allergens with ingredient cross-checking
- **Team Health Challenges**: Collective nutrition goals and competitions
- **Medical Profile Integration**: Optional medical data for critical allergy management

### Emergency & Safety
- **Emergency Mode**: Fast-track ordering with priority restaurant network
- **Pre-prepared Meal Inventory**: Ready meals for schedule changes
- **Medical Emergency Hotline**: Integrated emergency contact system
- **Allergy Blocking**: Prevent orders containing user allergens

### Financial Management
- **Payment Integration**: Stripe, PayPal, Apple Pay, Google Pay support
- **Invoice Generation**: Automated PDF invoices with itemized billing
- **Weekly Settlements**: Payroll-integrated financial settlements
- **Cost Analytics**: Budget forecasting, spending reports, cross-project comparisons
- **Producer Dashboard**: Comprehensive financial intelligence and reporting

### Production Integration
- **Project Management**: Multi-project support with role-based access (Member, VIP, Producer, Admin)
- **Attendance Integration**: Auto-cancel orders for absent crew members
- **Schedule Sync**: Adjust delivery times based on shooting schedule changes
- **Notification System**: Order status updates, delivery alerts, cost warnings

## Target Users

### Primary Users
- **Production Crew Members**: Regular team members ordering daily meals
- **VIP Personnel**: Key staff (directors, stars) with unlimited exception privileges
- **Producers**: Budget managers monitoring costs and approving exceptions
- **Logistics Managers**: Coordinators managing orders and deliveries

### Secondary Users
- **Restaurant Partners**: Core menu restaurants with quality commitments
- **Delivery Personnel**: Drivers with GPS tracking integration
- **System Administrators**: Platform managers handling user roles and system configuration

## Use Cases

### Daily Operations
1. **Morning Order Submission**: Crew scans QR code, browses menu, submits order within first hour
2. **Order Aggregation**: System consolidates orders per restaurant for bulk processing
3. **Delivery Tracking**: Crew tracks delivery in real-time with map view and ETA
4. **Exception Handling**: VIP orders from non-partner restaurant, system tracks cost differential

### Intelligence Features
1. **Weather-Based Suggestions**: Cold day triggers warm soup recommendations
2. **Predictive Pre-fill**: Regular orderer sees auto-suggested order based on history
3. **Nutrition Alert**: User receives "no vegetables this week" diversity warning
4. **Emotion Support**: Stressed user gets comfort food suggestions

### Emergency Scenarios
1. **Schedule Change**: Shooting delayed, emergency mode activates fast-track ordering
2. **Allergy Alert**: User attempts order with allergen, system blocks with red alert
3. **Budget Exceeded**: VIP order exceeds threshold, producer receives immediate notification
4. **Medical Emergency**: Crew member has allergic reaction, emergency hotline activated

### Financial Management
1. **Weekly Settlement**: System generates invoices for exception payments, integrates with payroll
2. **Budget Forecasting**: Producer reviews spending patterns and adjusts project budgets
3. **Restaurant Negotiation**: System provides demand forecasts for bulk discount discussions
4. **Cost Optimization**: Analytics identify high-cost patterns and suggest alternatives

## Technology Highlights
- **Multi-platform**: React Native mobile app, React web dashboard
- **Real-time**: GPS tracking, live notifications, instant order updates
- **AI/ML**: TensorFlow-based recommendation engine and predictive models
- **Secure**: JWT authentication, role-based access, GDPR/HIPAA compliance
- **Scalable**: PostgreSQL database, Prisma ORM, cloud-ready architecture
