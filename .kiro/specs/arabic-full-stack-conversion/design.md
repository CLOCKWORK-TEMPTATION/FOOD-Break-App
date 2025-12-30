# Design Document: Arabic Film Production Break App

## Overview

This design document outlines the technical architecture for building a comprehensive Arabic-language film production break request system (BreakApp). The system serves Egyptian film production crews by providing native Arabic language support, film industry-specific terminology, and culturally appropriate workflows for meal ordering during film shoots.

The design focuses on creating a full-stack application that integrates localization, cultural adaptation, role-based access control, real-time GPS tracking, and seamless payment processing while maintaining the existing technical infrastructure where applicable.

**Key Design Principles:**
- Arabic-first user experience with comprehensive RTL support
- Film industry-specific terminology and workflows
- Egyptian cultural context and design patterns
- Real-time tracking and notification systems
- Scalable architecture supporting mobile and web platforms


## Architecture

### High-Level Architecture

The system follows a microservices-oriented architecture with comprehensive localization and real-time capabilities:

```
┌─────────────────────────────────────────────────────────────┐
│                    Client Applications                      │
│  ┌─────────────────┐  ┌─────────────────┐  ┌──────────────┐ │
│  │   Mobile App    │  │    Web App      │  │  Admin Panel │ │
│  │   (Arabic RTL)  │  │  (Arabic RTL)   │  │  (Bilingual) │ │
│  │   React Native  │  │    Next.js      │  │   Next.js    │ │
│  └─────────────────┘  └─────────────────┘  └──────────────┘ │
└─────────────────────────────────────────────────────────────┘
                              │
┌─────────────────────────────────────────────────────────────┐
│                   API Gateway & Services                    │
│  ┌─────────────────┐  ┌─────────────────┐  ┌──────────────┐ │
│  │ Authentication  │  │ Localization    │  │ Notification │ │
│  │ Service         │  │ Service         │  │ Service      │ │
│  └─────────────────┘  └─────────────────┘  └──────────────┘ │
│  ┌─────────────────┐  ┌─────────────────┐  ┌──────────────┐ │
│  │ Order Service   │  │ GPS Tracking    │  │ Payment      │ │
│  │ (Arabic)        │  │ Service         │  │ Service      │ │
│  └─────────────────┘  └─────────────────┘  └──────────────┘ │
│  ┌─────────────────┐  ┌─────────────────┐  ┌──────────────┐ │
│  │ Menu Service    │  │ Film Industry   │  │ Analytics    │ │
│  │                 │  │ Integration     │  │ Service      │ │
│  └─────────────────┘  └─────────────────┘  └──────────────┘ │
└─────────────────────────────────────────────────────────────┘
                              │
┌─────────────────────────────────────────────────────────────┐
│                     Data Layer                              │
│  ┌─────────────────┐  ┌─────────────────┐  ┌──────────────┐ │
│  │ PostgreSQL      │  │ Redis Cache     │  │ File Storage │ │
│  │ (Primary DB)    │  │ (Sessions/Cache)│  │ (Images/Docs)│ │
│  └─────────────────┘  └─────────────────┘  └──────────────┘ │
│  ┌─────────────────┐  ┌─────────────────┐  ┌──────────────┐ │
│  │ Localization    │  │ GPS Tracking    │  │ Analytics    │ │
│  │ Database        │  │ Database        │  │ Database     │ │
│  └─────────────────┘  └─────────────────┘  └──────────────┘ │
└─────────────────────────────────────────────────────────────┘
```

### Technology Stack Selection

**Frontend Applications:**
- **Mobile App**: React Native with TypeScript for cross-platform iOS/Android support
- **Web Application**: Next.js 14+ with App Router for SSR and optimal performance
- **Admin Panel**: Next.js with advanced dashboard components
- **UI Framework**: TailwindCSS with custom RTL utilities and shadcn/ui components
- **State Management**: Zustand for client state, TanStack Query for server state

**Backend Services:**
- **API Framework**: Node.js with Express.js for RESTful APIs
- **Database ORM**: Prisma with PostgreSQL for type-safe database operations
- **Authentication**: JWT with refresh tokens and role-based access control
- **Real-time Communication**: Socket.io for GPS tracking and notifications
- **File Storage**: AWS S3 or compatible service for media assets

**Database Architecture:**
- **Primary Database**: PostgreSQL 14+ for ACID compliance and complex queries
- **Caching Layer**: Redis for session management and frequently accessed data
- **Search Engine**: PostgreSQL full-text search with Arabic language support

**Infrastructure & DevOps:**
- **Containerization**: Docker with multi-stage builds
- **Orchestration**: Docker Compose for development, Kubernetes for production
- **CI/CD**: GitHub Actions with automated testing and deployment
- **Monitoring**: Sentry for error tracking, Prometheus + Grafana for metrics

**Rationale for Technology Choices:**
- **React Native**: Enables code sharing between iOS and Android while maintaining native performance
- **Next.js**: Provides excellent SEO, SSR capabilities, and built-in optimization features
- **PostgreSQL**: Offers robust ACID compliance, excellent Arabic text handling, and complex query support
- **Prisma**: Provides type safety, excellent migration system, and Arabic text handling
- **Redis**: Essential for real-time features like GPS tracking and session management

## Components and Interfaces

### 1. Localization and Cultural Adaptation Service

**Purpose:** Manages comprehensive Arabic language support and Egyptian cultural context

**Key Components:**
- **Translation Manager:** Dynamic text translation with context-aware caching
- **RTL Layout Engine:** Automatic UI component adjustment for right-to-left reading
- **Cultural Context Provider:** Egyptian film industry terminology and expressions
- **Arabic Typography System:** Font rendering and text styling optimization
- **Number and Date Formatter:** Arabic/Western numeral support with Egyptian locale

**Interfaces:**
```typescript
interface LocalizationService {
  translate(key: string, params?: Record<string, any>, context?: string): string;
  setLocale(locale: 'ar-EG' | 'en'): void;
  formatCurrency(amount: number, currency: 'EGP'): string;
  formatDate(date: Date, format?: 'hijri' | 'gregorian'): string;
  formatNumber(num: number, style?: 'arabic' | 'western'): string;
  isRTL(): boolean;
  getFilmTerminology(englishTerm: string): string;
}

interface CulturalAdapter {
  adaptUserRole(genericRole: string): FilmIndustryRole;
  getContextualGreeting(timeOfDay: string, userRole: string): string;
  formatNotificationMessage(type: string, context: object): string;
  validateCulturalAppropriatenesss(content: string): ValidationResult;
}
```

### 2. Menu Management System

**Purpose:** Handles restaurant partnerships, menu items, and location-based filtering

**Key Components:**
- **Restaurant Partnership Manager:** Core menu and partner restaurant management
- **Geographic Menu Service:** Location-based filtering and proximity calculations
- **Menu Item Localization:** Arabic menu descriptions and cultural food categories
- **Quality Tracking System:** Restaurant ratings and hygiene monitoring
- **Menu Rotation Engine:** Daily/weekly menu updates and seasonal adjustments

**Interfaces:**
```typescript
interface MenuService {
  getCoreMenu(restaurantId: string): Promise<MenuItem[]>;
  getGeographicMenu(location: GeoLocation, radius: number): Promise<Restaurant[]>;
  searchMenuItems(query: string, filters: MenuFilters): Promise<MenuItem[]>;
  updateMenuRotation(restaurantId: string, schedule: RotationSchedule): Promise<void>;
  trackQualityRating(restaurantId: string, rating: QualityRating): Promise<void>;
}

interface MenuItem {
  id: string;
  names: LocalizedText;
  descriptions: LocalizedText;
  price: Price;
  category: FoodCategory;
  culturalInfo: CulturalFoodInfo;
  nutritionalInfo?: NutritionalInfo;
  allergens: string[];
  availability: AvailabilitySchedule;
}
```

### 3. Order Management and Exception System

**Purpose:** Manages meal orders, exception handling, and role-based ordering privileges

**Key Components:**
- **Order Workflow Engine:** Break window management and order submission
- **Exception Manager:** VIP/Regular crew exception quota and type handling
- **QR Code System:** Project access control and crew verification
- **Order Aggregation Service:** Production team coordination and bulk ordering
- **Cost Calculation Engine:** Differential payment calculation for exceptions

**Interfaces:**
```typescript
interface OrderService {
  createOrder(userId: string, items: OrderItem[], orderType: OrderType): Promise<Order>;
  processException(userId: string, exceptionRequest: ExceptionRequest): Promise<ExceptionOrder>;
  validateOrderWindow(projectId: string): Promise<OrderWindowStatus>;
  aggregateOrders(projectId: string, breakId: string): Promise<OrderSummary>;
  calculateCosts(order: Order, userRole: UserRole): Promise<CostBreakdown>;
}

interface ExceptionManager {
  checkExceptionQuota(userId: string, userRole: UserRole): Promise<QuotaStatus>;
  processFullException(order: Order): Promise<ExceptionResult>;
  processLimitedException(order: Order, standardCost: number): Promise<ExceptionResult>;
  processSelfPaidException(order: Order): Promise<ExceptionResult>;
}
```

### 4. GPS Tracking and Delivery System

**Purpose:** Real-time delivery tracking, ETA calculation, and location-based services

**Key Components:**
- **Real-time GPS Tracker:** Driver location monitoring and route optimization
- **ETA Calculator:** Dynamic delivery time estimation with traffic data
- **Geofencing Service:** Location-based notifications and delivery confirmations
- **Map Integration:** Interactive delivery tracking with Arabic interface
- **Delivery Status Manager:** Order fulfillment workflow and status updates

**Interfaces:**
```typescript
interface GPSTrackingService {
  trackDelivery(orderId: string): Promise<DeliveryTracking>;
  calculateETA(driverLocation: GeoLocation, destination: GeoLocation): Promise<ETAResult>;
  updateDriverLocation(driverId: string, location: GeoLocation): Promise<void>;
  getDeliveryRoute(orderId: string): Promise<DeliveryRoute>;
  notifyProximityAlert(orderId: string, distance: number): Promise<void>;
}

interface DeliveryTracking {
  orderId: string;
  driverInfo: DriverInfo;
  currentLocation: GeoLocation;
  estimatedArrival: Date;
  status: DeliveryStatus;
  route: GeoLocation[];
  notifications: DeliveryNotification[];
}
```

### 5. Payment Integration System

**Purpose:** Egyptian payment gateway integration and multi-currency support

**Key Components:**
- **Egyptian Payment Gateway:** Integration with local payment providers
- **Mobile Payment Service:** Vodafone Cash, Orange Money, and other local methods
- **Currency Manager:** EGP-focused pricing with Arabic numeral formatting
- **Invoice Generator:** Arabic invoice creation with cultural formatting
- **Payment Reconciliation:** Financial reporting and settlement management

**Interfaces:**
```typescript
interface PaymentService {
  processPayment(amount: number, method: PaymentMethod, currency: 'EGP'): Promise<PaymentResult>;
  generateInvoice(order: Order, language: 'ar' | 'en'): Promise<Invoice>;
  refundPayment(paymentId: string, amount?: number): Promise<RefundResult>;
  getPaymentMethods(userLocation: string): Promise<PaymentMethod[]>;
  reconcilePayments(dateRange: DateRange): Promise<ReconciliationReport>;
}

interface EgyptianPaymentGateway {
  processVodafoneCash(phoneNumber: string, amount: number): Promise<PaymentResult>;
  processOrangeMoney(phoneNumber: string, amount: number): Promise<PaymentResult>;
  processBankCard(cardDetails: CardDetails, amount: number): Promise<PaymentResult>;
  processInstaPay(accountId: string, amount: number): Promise<PaymentResult>;
}
```

### 6. Film Industry Integration Service

**Purpose:** Shooting schedule integration and film production workflow management

**Key Components:**
- **Schedule Integration Manager:** Production scheduling software connectivity
- **Break Window Calculator:** Automatic break timing based on shooting schedules
- **Crew Management System:** Role-based access and film industry hierarchy
- **Production Analytics:** Spending reports and budget tracking for productions
- **Attendance Integration:** Crew check-in and order activation linking

**Interfaces:**
```typescript
interface FilmIndustryService {
  integrateShootingSchedule(projectId: string, schedule: ShootingSchedule): Promise<void>;
  calculateBreakWindows(schedule: ShootingSchedule): Promise<BreakWindow[]>;
  mapCrewRoles(genericRoles: string[]): Promise<FilmIndustryRole[]>;
  generateProductionReport(projectId: string, period: DateRange): Promise<ProductionReport>;
  syncAttendance(projectId: string, attendanceData: AttendanceRecord[]): Promise<void>;
}

interface ShootingSchedule {
  projectId: string;
  scenes: Scene[];
  breaks: ScheduledBreak[];
  crewAssignments: CrewAssignment[];
  locations: FilmLocation[];
  timeline: ScheduleTimeline;
}
```

## Data Models

## Data Models

### Core User and Role Management

```typescript
interface User {
  id: string;
  personalInfo: {
    arabicName: string;
    englishName?: string;
    phoneNumber: string;
    email?: string;
    profileImage?: string;
  };
  filmIndustryInfo: {
    role: FilmIndustryRole;
    department: FilmDepartment;
    experienceLevel: ExperienceLevel;
    unionMembership?: UnionInfo;
    specializations: string[];
  };
  preferences: {
    language: 'ar-EG' | 'en';
    numberFormat: 'arabic' | 'western';
    dateFormat: 'hijri' | 'gregorian' | 'both';
    notificationSettings: NotificationPreferences;
    dietaryRestrictions: DietaryRestriction[];
  };
  systemInfo: {
    createdAt: Date;
    lastLoginAt: Date;
    isActive: boolean;
    verificationStatus: VerificationStatus;
  };
}

interface FilmIndustryRole {
  id: string;
  arabicTitle: string;
  englishTitle: string;
  department: FilmDepartment;
  hierarchy: RoleHierarchy;
  permissions: Permission[];
  isVIP: boolean;
  exceptionQuota?: ExceptionQuota;
}

interface ExceptionQuota {
  allowedPerPeriod: number;
  periodDays: number;
  unlimitedExceptions: boolean;
  currentUsage: number;
  resetDate: Date;
}
```

### Menu and Restaurant Management

```typescript
interface Restaurant {
  id: string;
  basicInfo: {
    names: LocalizedText;
    descriptions: LocalizedText;
    logo?: string;
    images: string[];
  };
  locationInfo: {
    address: LocalizedAddress;
    coordinates: GeoLocation;
    serviceRadius: number;
    deliveryZones: DeliveryZone[];
  };
  operationalInfo: {
    operatingHours: OperatingSchedule;
    cuisineTypes: CuisineType[];
    averagePreparationTime: number;
    minimumOrderAmount?: number;
  };
  qualityMetrics: {
    hygieneRating: number;
    customerRating: number;
    deliveryRating: number;
    lastInspectionDate: Date;
    certifications: Certification[];
  };
  partnershipInfo: {
    partnershipType: 'core' | 'geographic' | 'premium';
    contractStartDate: Date;
    contractEndDate: Date;
    specialTerms?: string;
  };
}

interface MenuItem {
  id: string;
  restaurantId: string;
  names: LocalizedText;
  descriptions: LocalizedText;
  pricing: {
    basePrice: number;
    currency: 'EGP';
    discounts?: Discount[];
    bulkPricing?: BulkPricing[];
  };
  categorization: {
    category: FoodCategory;
    subcategory?: string;
    tags: string[];
    culturalSignificance?: CulturalInfo;
  };
  nutritionalInfo: {
    calories?: number;
    allergens: Allergen[];
    dietaryFlags: DietaryFlag[];
    ingredients?: LocalizedText;
    nutritionFacts?: NutritionFacts;
  };
  availability: {
    isAvailable: boolean;
    availableHours?: TimeRange[];
    seasonalAvailability?: SeasonalInfo;
    preparationTime: number;
    dailyLimit?: number;
  };
  media: {
    images: string[];
    videos?: string[];
    thumbnails: string[];
  };
}
```

### Order and Exception Management

```typescript
interface Order {
  id: string;
  orderInfo: {
    userId: string;
    projectId: string;
    breakId: string;
    orderType: OrderType;
    status: OrderStatus;
    priority: OrderPriority;
  };
  items: OrderItem[];
  timing: {
    orderPlacedAt: Date;
    requestedDeliveryTime: Date;
    estimatedDeliveryTime: Date;
    actualDeliveryTime?: Date;
    breakWindowStart: Date;
    breakWindowEnd: Date;
  };
  location: {
    deliveryAddress: LocalizedAddress;
    coordinates: GeoLocation;
    specialInstructions?: LocalizedText;
    accessInstructions?: LocalizedText;
  };
  financial: {
    subtotal: number;
    taxes: number;
    deliveryFee: number;
    tips?: number;
    total: number;
    currency: 'EGP';
    paymentStatus: PaymentStatus;
    costBreakdown: CostBreakdown;
  };
  tracking: {
    trackingId?: string;
    driverInfo?: DriverInfo;
    deliveryUpdates: DeliveryUpdate[];
    estimatedArrival?: Date;
  };
}

interface ExceptionOrder extends Order {
  exceptionInfo: {
    exceptionType: ExceptionType;
    justification: string;
    approvalStatus: ApprovalStatus;
    approvedBy?: string;
    approvalDate?: Date;
    costDifference?: number;
    paymentResponsibility: PaymentResponsibility;
  };
  quotaImpact: {
    quotaUsed: boolean;
    remainingQuota: number;
    nextResetDate: Date;
  };
}

enum ExceptionType {
  FULL_EXCEPTION = 'full_exception',      // الاستثناء التام
  LIMITED_EXCEPTION = 'limited_exception', // الاستثناء في الحدود  
  SELF_PAID_EXCEPTION = 'self_paid_exception' // الاستثناء المدفوع بالكامل
}

enum PaymentResponsibility {
  PRODUCTION = 'production',
  USER = 'user',
  SHARED = 'shared'
}
```

### GPS Tracking and Delivery

```typescript
interface DeliveryTracking {
  id: string;
  orderId: string;
  driverInfo: {
    driverId: string;
    arabicName: string;
    phoneNumber: string;
    vehicleInfo: VehicleInfo;
    rating: number;
  };
  locationData: {
    currentLocation: GeoLocation;
    destination: GeoLocation;
    route: GeoLocation[];
    lastUpdated: Date;
  };
  timing: {
    pickupTime?: Date;
    estimatedArrival: Date;
    actualArrival?: Date;
    deliveryCompleted?: Date;
  };
  status: {
    currentStatus: DeliveryStatus;
    statusHistory: StatusUpdate[];
    notifications: DeliveryNotification[];
  };
  realTimeData: {
    speed: number;
    heading: number;
    accuracy: number;
    batteryLevel?: number;
    isOnline: boolean;
  };
}

interface GeoLocation {
  latitude: number;
  longitude: number;
  altitude?: number;
  accuracy?: number;
  timestamp: Date;
}

enum DeliveryStatus {
  PREPARING = 'preparing',
  READY_FOR_PICKUP = 'ready_for_pickup',
  PICKED_UP = 'picked_up',
  IN_TRANSIT = 'in_transit',
  NEARBY = 'nearby',
  DELIVERED = 'delivered',
  FAILED = 'failed'
}
```

### Localization and Cultural Data

```typescript
interface LocalizationEntry {
  id: string;
  key: string;
  context: string;
  translations: {
    'ar-EG': string;
    'en'?: string;
  };
  metadata: {
    category: LocalizationCategory;
    lastUpdated: Date;
    updatedBy: string;
    reviewStatus: ReviewStatus;
    culturalNotes?: string;
    filmIndustryContext?: string;
  };
  usage: {
    frequency: number;
    lastUsed: Date;
    contexts: string[];
  };
}

interface FilmTerminology {
  id: string;
  englishTerm: string;
  arabicTerm: string;
  category: TerminologyCategory;
  department: FilmDepartment;
  definition: LocalizedText;
  usage: {
    contexts: string[];
    examples: LocalizedText[];
    relatedTerms: string[];
  };
  cultural: {
    egyptianSpecific: boolean;
    regionalVariations?: RegionalVariation[];
    formalityLevel: FormalityLevel;
  };
}

enum TerminologyCategory {
  ROLES = 'roles',
  EQUIPMENT = 'equipment',
  PROCESSES = 'processes',
  LOCATIONS = 'locations',
  TIME_PERIODS = 'time_periods',
  FOOD_RELATED = 'food_related'
}

enum FilmDepartment {
  DIRECTION = 'direction',
  PRODUCTION = 'production',
  CINEMATOGRAPHY = 'cinematography',
  SOUND = 'sound',
  ART = 'art',
  COSTUME = 'costume',
  MAKEUP = 'makeup',
  EDITING = 'editing',
  CATERING = 'catering'
}
```

### Payment and Financial Data

```typescript
interface Payment {
  id: string;
  orderId: string;
  userId: string;
  amount: {
    subtotal: number;
    taxes: number;
    fees: number;
    total: number;
    currency: 'EGP';
  };
  method: {
    type: PaymentMethodType;
    provider: PaymentProvider;
    details: PaymentMethodDetails;
  };
  processing: {
    status: PaymentStatus;
    transactionId?: string;
    gatewayResponse?: GatewayResponse;
    processedAt?: Date;
    failureReason?: string;
  };
  egyptian: {
    taxId?: string;
    invoiceNumber: string;
    arabicInvoice: boolean;
    localRegulations: RegulatoryCompliance;
  };
}

enum PaymentMethodType {
  VODAFONE_CASH = 'vodafone_cash',
  ORANGE_MONEY = 'orange_money',
  BANK_CARD = 'bank_card',
  INSTAPAY = 'instapay',
  CASH_ON_DELIVERY = 'cash_on_delivery',
  PRODUCTION_ACCOUNT = 'production_account'
}

interface EgyptianInvoice {
  id: string;
  paymentId: string;
  invoiceNumber: string;
  arabicContent: {
    companyName: string;
    customerName: string;
    itemDescriptions: string[];
    totalAmount: string;
    taxBreakdown: TaxBreakdown;
  };
  regulatory: {
    taxAuthority: string;
    complianceCode: string;
    digitalSignature: string;
    qrCode: string;
  };
  formatting: {
    rightToLeft: boolean;
    arabicNumerals: boolean;
    culturalElements: CulturalElement[];
  };
}
```

## Correctness Properties

*A property is a characteristic or behavior that should hold true across all valid executions of a system—essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees.*

Based on the prework analysis, I've identified key properties that can be tested to ensure the Arabic film production break app maintains correctness across all system operations. After reviewing all properties for redundancy, the following consolidated set provides comprehensive validation coverage:

### Property 1: Arabic Language Universality
*For any* user interface component generated by the system, all displayed text should be in Arabic script and use authentic Egyptian Arabic terminology for film production concepts.
**Validates: Requirements 1.1, 1.2**

### Property 2: RTL Layout Consistency
*For any* UI component rendered by the system, the layout direction should be right-to-left (RTL) and automatically adjusted by the localization system.
**Validates: Requirements 1.3, 4.2**

### Property 3: Film Industry Role Mapping
*For any* user role or business term in the system, it should be correctly mapped to specific Egyptian film production positions with appropriate Arabic terminology and access levels.
**Validates: Requirements 2.1, 2.2, 2.4, 1.4**

### Property 4: Role-Based Access Control
*For any* system operation or ordering request, access should be granted or denied based on the user's film industry role, with VIP personnel having unlimited exception privileges and regular crew having quota-limited exceptions.
**Validates: Requirements 2.3, 2.5, 6.1, 6.2**

### Property 5: Egyptian Cultural Design Consistency
*For any* visual component or communication generated by the system, it should use Egyptian color schemes, cultural symbols, expressions, and design patterns appropriate to the context.
**Validates: Requirements 3.1, 3.2, 3.4**

### Property 6: Arabic Typography and Formatting
*For any* text content, numerical value, or currency amount displayed by the system, it should use proper Arabic typography, correct numeral formatting based on user preference, and EGP currency formatting.
**Validates: Requirements 3.3, 3.5, 4.5**

### Property 7: Arabic Text Processing
*For any* Arabic text input or date/time value processed by the system, it should be properly validated, formatted, and handled according to Arabic language standards.
**Validates: Requirements 4.3, 4.4**

### Property 8: Geographic Menu Filtering
*For any* location-based menu request, the system should return only restaurants within the specified radius (2-3 km) with proper distance calculations and delivery time estimates.
**Validates: Requirements 5.2, 5.5**

### Property 9: Menu Management Consistency
*For any* restaurant or menu item managed by the system, it should maintain Core Menu items, support rotation schedules, and track quality ratings correctly.
**Validates: Requirements 5.1, 5.3, 5.4**

### Property 10: Exception Order Processing
*For any* exception order request, the system should correctly process Full, Limited, or Self-Paid exceptions with appropriate cost calculations and payment responsibility assignments.
**Validates: Requirements 6.3, 6.4, 6.5, 8.3**

### Property 11: Break Window Order Management
*For any* break window period, the system should only allow order submissions during the first hour of shooting and send reminders to crew members who haven't submitted orders.
**Validates: Requirements 7.1, 7.4**

### Property 12: QR Code and Order Aggregation
*For any* project, the system should generate proper QR codes for access control and correctly aggregate orders for production team coordination.
**Validates: Requirements 7.2, 7.5**

### Property 13: Egyptian Payment Processing
*For any* payment transaction, the system should use EGP as primary currency, support Egyptian payment methods, and generate Arabic invoices with proper formatting.
**Validates: Requirements 8.2, 8.5**

### Property 14: Real-Time GPS Tracking
*For any* active delivery, the system should provide real-time GPS tracking, accurate ETA calculations, proximity notifications, and continuous status updates.
**Validates: Requirements 9.1, 9.2, 9.4, 9.5**

### Property 15: Data Migration Integrity
*For any* data migration operation, the system should preserve existing data, convert content to Arabic, maintain integrity, provide rollback capabilities, and validate completeness.
**Validates: Requirements 10.1, 10.2, 10.3, 10.4, 10.5**

<function_calls>
<invoke name="prework">
<parameter name="featureName">arabic-full-stack-conversion

## Error Handling

### Localization and Cultural Adaptation Errors

**Translation Fallback Strategy:**
- Primary: Arabic (Egyptian dialect) translation
- Fallback 1: Standard Arabic translation
- Fallback 2: English translation with Arabic UI structure
- Fallback 3: Translation key with context indicator
- All fallback events logged for translation team review

**RTL Layout Error Recovery:**
- Automatic detection of layout rendering failures
- Graceful degradation to LTR with RTL structure preservation
- Component-level error boundaries for layout-specific issues
- User notification of layout issues with manual refresh option

**Cultural Adaptation Errors:**
- Validation of cultural content appropriateness before display
- Fallback to neutral, respectful terminology when cultural terms unavailable
- User feedback mechanism for cultural accuracy improvements
- Escalation system for culturally sensitive content issues

### Order and Payment Processing Errors

**Exception Order Failures:**
- Quota validation with clear error messages in Arabic
- Payment method fallback for failed Egyptian gateways
- Order rollback system for partial payment failures
- Production team notification for VIP exception issues

**GPS Tracking and Delivery Errors:**
- Location service failure detection and user notification
- ETA recalculation when GPS data becomes unavailable
- Driver communication fallback via SMS/phone when app fails
- Delivery confirmation alternatives when GPS tracking fails

**Menu and Restaurant Integration Errors:**
- Restaurant availability validation before order placement
- Menu item availability real-time checking
- Geographic filtering fallback when location services fail
- Quality rating system resilience during data synchronization issues

### Data Migration and System Integration Errors

**Migration Failure Recovery:**
- Comprehensive rollback system with point-in-time recovery
- Data integrity validation at each migration step
- Backup verification before any conversion process begins
- Detailed error logging with Arabic error descriptions for support team

**Film Industry Integration Errors:**
- Schedule synchronization failure handling with manual override options
- Role mapping validation with fallback to generic roles
- Break window calculation errors with manual adjustment capabilities
- Production system connectivity issues with offline mode support

### Arabic Input and Processing Errors

**Text Input Validation Errors:**
- Arabic character encoding validation and correction
- RTL text direction enforcement with automatic correction
- Cultural appropriateness checking with suggestion system
- Input sanitization for security while preserving Arabic text integrity

**Typography and Rendering Errors:**
- Font loading failure detection with fallback fonts
- Arabic text rendering validation across different devices
- Number format conversion error handling
- Date/time formatting errors with user preference fallbacks

## Testing Strategy

### Dual Testing Approach

The testing strategy employs both unit testing and property-based testing to ensure comprehensive coverage of the Arabic film production break app functionality.

**Unit Tests:**
- Focus on specific examples of Arabic text rendering and cultural adaptation
- Test individual localization components with known Egyptian terminology
- Validate film industry role mapping with specific role examples
- Test payment integration with Egyptian gateway mock responses
- Verify GPS tracking with simulated location data
- Test menu management with sample restaurant and menu data

**Property-Based Tests:**
- Verify universal properties across all Arabic content and UI components
- Test RTL layout consistency across randomly generated UI elements
- Validate cultural appropriateness across various communication contexts
- Ensure role-based access control across all user types and operations
- Test exception order processing across all exception types and user roles
- Validate GPS tracking accuracy across random delivery scenarios

### Property-Based Testing Configuration

**Testing Framework:** Jest with fast-check for property-based testing
**Minimum Iterations:** 100 per property test to ensure comprehensive coverage
**Test Categories:**
- Localization properties (Arabic text, RTL layout, cultural adaptation)
- Role-based access control properties (permissions, exceptions, quotas)
- Geographic and menu management properties (filtering, rotation, quality)
- Payment and financial properties (EGP currency, Egyptian gateways, invoicing)
- GPS and delivery properties (tracking, ETA, notifications)
- Data integrity properties (migration, validation, rollback)

**Property Test Tagging:**
Each property test will be tagged with the format:
**Feature: arabic-film-production-break-app, Property {number}: {property_text}**

### Integration Testing

**Arabic UI Integration:**
- End-to-end testing of complete Arabic user workflows from registration to order completion
- Cross-browser RTL layout testing on major browsers and mobile devices
- Mobile device Arabic input testing with various keyboard configurations
- Cultural content approval workflows with Egyptian film industry expert validation

**System Integration:**
- Egyptian payment gateway integration testing with real sandbox environments
- Film industry scheduling system integration with production software APIs
- GPS tracking integration testing with real device location services
- Menu management integration with restaurant partner systems

**Real-World Scenario Testing:**
- Complete film production break ordering workflow testing
- Multi-user concurrent ordering during break windows
- Exception order processing under various user role combinations
- Delivery tracking during actual film shoot simulations

### Cultural and Language Quality Assurance

**Egyptian Film Industry Expert Review:**
- Terminology accuracy validation by industry professionals
- Cultural appropriateness assessment for all user communications
- User experience evaluation from Egyptian film crew perspective
- Workflow alignment verification with actual film production practices

**Arabic Language Quality Assurance:**
- Native Egyptian Arabic speaker review of all content
- Egyptian dialect accuracy validation for film industry terms
- RTL layout usability testing with Arabic-speaking users
- Arabic accessibility compliance testing for users with disabilities

**Performance and Scalability Testing:**
- Load testing with Arabic text processing and RTL rendering
- GPS tracking performance testing with multiple concurrent deliveries
- Database performance testing with Arabic text indexing and search
- Mobile app performance testing with Arabic font rendering and RTL layouts

### Continuous Quality Monitoring

**Automated Quality Checks:**
- Continuous integration pipeline with Arabic text validation
- Automated RTL layout regression testing
- Cultural content appropriateness monitoring
- Payment gateway connectivity and response time monitoring

**User Feedback Integration:**
- In-app feedback system for cultural accuracy improvements
- Arabic language quality reporting by users
- Film industry terminology suggestion system
- Delivery experience feedback with GPS tracking accuracy reports