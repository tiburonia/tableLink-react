# TableLink - Restaurant Management Platform

## Overview

TableLink is a comprehensive web-based restaurant management platform that integrates multiple systems into a unified solution. The platform serves restaurants, kitchen staff, and customers through specialized interfaces:

- **TLG (TableLink Guest)**: Customer-facing mobile web application for QR ordering, store discovery, reviews, and loyalty programs
- **POS (Point of Sale)**: Staff-facing order management and payment processing system
- **KDS (Kitchen Display System)**: Real-time kitchen order display and status management
- **KRP (Kitchen Receipt Printer)**: Automated kitchen receipt printing system
- **TLM (TableLink Manager)**: Restaurant owner/manager dashboard
- **Admin**: Platform administration tools

The system handles the complete restaurant workflow from customer ordering through kitchen preparation to payment settlement, with real-time synchronization across all components.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture

**Technology Stack**: Vanilla JavaScript SPA (Single Page Application) with no frameworks

**Layered Architecture Pattern**:
- **View Layer**: Pure DOM rendering without business logic (e.g., `renderMap.js`, `renderStore.js`)
- **Controller Layer**: Event handling and flow control, connecting UI events to services
- **Service Layer**: Business logic and data transformation
- **Repository Layer**: Direct API communication and data fetching

**Key Design Decisions**:
- Module-based organization with ES6 imports/exports
- Event-driven communication between modules
- Client-side state management without external libraries
- Mobile-first responsive design with iOS/Android compatibility
- Touch-optimized UI with `-webkit-tap-highlight-color` disabled

### Backend Architecture

**Technology**: Node.js with Express.js framework

**Core Structure**:
- `src/server.js`: Main application entry point
- `src/routes/`: API endpoint definitions (POS, KDS, TLL, KRP routes)
- `src/controllers/`: Request handling and response formatting
- `src/services/`: Business logic layer
- `src/repositories/`: Database access layer
- `src/middleware/`: Authentication, error handling, rate limiting

**API Design Philosophy**:
- RESTful endpoints with `/api` prefix
- Session-based authentication via cookies
- Header-based store authentication (`X-Store-Id`)
- Idempotency support for payment operations
- Consistent JSON response format with `{success, data, message/error}` structure

### Database Architecture

**Technology**: PostgreSQL with PostGIS extension for geospatial features

**Schema Design Principles**:
- Separation of concerns (stores, addresses, orders, payments in distinct tables)
- Event sourcing for order modifications (immutable TLL orders, mutable POS orders)
- Denormalized fields for performance (rating_average, review_count cached in stores)
- Custom ENUM types for state management (order_status, item_status, pay_status)

**Key Tables**:
- `stores`: Core restaurant entities
- `store_addresses`: Geospatial address data with PostGIS geometry
- `orders`: Order header records
- `order_tickets`: Batch grouping within orders (supports multiple rounds of ordering)
- `order_items`: Individual menu items with status tracking
- `payments`: Payment transaction records
- `users` / `guests`: Customer identity management
- `reviews`: Customer feedback system
- `store_points` / `coupons`: Loyalty program data

**State Machine Design**:
- Orders: `PENDING` → `CONFIRMED` → `VOID`
- Items: `PENDING` → `COOKING` → `READY` → `DONE` → `SERVED` (with `CANCELED` branch)
- Payments: `AUTHORIZED` → `PAID` (with `VOID`/`REFUNDED`/`FAILED` branches)

**Transaction Safety**:
- Pessimistic locking (`SELECT FOR UPDATE`) for payment operations
- Database triggers for real-time notifications (`pg_notify`)
- Calculated totals via stored functions (`calc_check_total`)

### Real-Time Communication

**WebSocket Implementation** (Socket.IO):
- Namespace-based separation by system (KDS, POS, KRP)
- Room-based broadcasting per store
- Event types: `new-order`, `ticket-modified`, `item-status-change`, `payment-completed`

**PostgreSQL LISTEN/NOTIFY**:
- Database-level change notifications
- Channels: `order_changes`, `payment_changes`, `kds_events`, `table_changes`
- Triggers fire on INSERT/UPDATE to broadcast changes immediately

**SSE (Server-Sent Events)**:
- Alternative to WebSocket for POS system updates
- Long-polling fallback for network-restricted environments

### Geospatial System

**Map Integration**: Kakao Maps JavaScript API

**Clustering Strategy**:
- Level 1-5: Individual store markers
- Level 6-7: Neighborhood (dong) aggregation
- Level 8-9: District (sigungu) aggregation  
- Level 10+: Province (sido) aggregation

**Data Structure**:
- PostGIS `geometry(Point, 4326)` for coordinates
- GIST spatial index on `store_addresses.geom`
- Viewport-based queries with `ST_MakeEnvelope` and `ST_Within`
- Address parsing for Korean administrative divisions (sido/sigungu/eupmyeondong)

**Performance Optimization**:
- Server-side clustering calculations
- Marker caching and show/hide toggling (no recreation)
- Single mode switching function to prevent simultaneous marker types

## External Dependencies

### Third-Party Services

**Kakao Maps API**:
- Map rendering and navigation
- Geocoding and reverse geocoding
- Location-based store discovery
- Cluster marker visualization

**Toss Payments API**:
- Payment authorization and confirmation
- Multiple payment methods (card, virtual account, transfer)
- Webhook-based payment status updates
- Idempotency key support for duplicate prevention

### Key NPM Packages

**Core Runtime**:
- `express` (^5.1.0): Web application framework
- `pg` (^8.16.3): PostgreSQL client
- `socket.io` (^4.8.1): Real-time bidirectional communication
- `dotenv` (^17.2.2): Environment variable management

**Security & Rate Limiting**:
- `cors` (^2.8.5): Cross-origin resource sharing
- `express-rate-limit` (^8.0.1): API rate limiting
- `jsonwebtoken` (^9.0.2): JWT token generation/validation

**Utilities**:
- `uuid` (^11.1.0): Unique identifier generation
- `node-fetch` (^3.3.2): HTTP client for external API calls
- `xlsx` (^0.18.5): Excel file generation for reports

### Database Extensions

**PostGIS**: Geospatial data types and functions
- Enables geometry columns and spatial indexing
- Provides distance calculations and boundary queries
- Powers the clustering and map marker systems

### Environment Variables

Required configuration in `.env`:
- `DATABASE_URL`: PostgreSQL connection string
- `TOSS_SECRET_KEY`: Toss Payments API secret
- `KAKAO_API_KEY`: Kakao Maps JavaScript API key
- `PORT`: Server port (default 5000)
- `NODE_ENV`: Environment mode (development/production)