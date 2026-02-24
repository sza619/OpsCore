# OpsCore - Production-Ready Internal Operations Platform

A full-stack SaaS platform demonstrating enterprise-grade architecture, real-time features, advanced RBAC, and performance optimizations.

## Features

- **Real-time Operations Dashboard** with Socket.io for live updates
- **Advanced RBAC System** with dynamic permission engine
- **JWT Authentication** with access and refresh tokens
- **Performance Optimizations** including lazy loading, memoization, and virtualized tables
- **Clean Architecture** with layered backend structure
- **PostgreSQL Database** with Prisma ORM
- **10,000+ Dummy Audit Logs** for performance testing
- **Cold Start Detection** for Render free tier deployment
- **Toast Notifications** for all user actions

## Tech Stack

### Frontend
- **React 18** with TypeScript and Vite
- **React Router v6** for routing
- **Zustand** for client state management
- **TanStack Query** for server state management
- **Tailwind CSS** for styling
- **Socket.io Client** for real-time features
- **react-window** for virtualized tables (10,000 audit logs)
- **React Toastify** for notifications

### Backend
- **Node.js** with Express and TypeScript
- **Prisma ORM** for database access
- **PostgreSQL** (Supabase)
- **JWT** for authentication (access + refresh tokens)
- **bcrypt** for password hashing
- **Zod** for validation
- **Socket.io** for real-time communication
- **Helmet** for security headers
- **express-rate-limit** for rate limiting
- **CORS** configured for cross-origin requests

## Architecture

### Backend Structure

```
backend/src/
├── controllers/      # Request handlers
├── services/         # Business logic layer
├── repositories/     # Data access layer
├── routes/           # API route definitions
├── middleware/       # Auth, RBAC, error handling
├── sockets/          # Socket.io setup
├── utils/            # JWT, validation, DB connection
└── prisma/           # Database schema
```

#### Layered Architecture Explanation

1. **Controllers**: Handle HTTP requests/responses, validate input, call services
2. **Services**: Contain business logic, orchestrate repository calls, handle transactions
3. **Repositories**: Direct database access, encapsulate Prisma queries
4. **Middleware**: Cross-cutting concerns (auth, permissions, logging, errors)

This separation ensures:
- **Testability**: Each layer can be tested independently
- **Maintainability**: Changes to one layer don't cascade
- **Reusability**: Services can be called from multiple controllers
- **Clarity**: Clear responsibility for each component

### RBAC Design

The Role-Based Access Control system uses a flexible, granular permission model:

#### Database Schema
```
User -> UserRole -> Role -> RolePermission -> Permission
```

- **Users** can have multiple **Roles**
- **Roles** can have multiple **Permissions**
- Permissions are checked at both **backend** (middleware) and **frontend** (UI hiding)

#### Permission Format
Permissions follow the pattern: `resource:action`
- `dashboard:view`
- `users:create`, `users:read`, `users:update`, `users:delete`
- `roles:manage`, `roles:read`
- `logs:read`, `logs:export`
- `analytics:view`
- `settings:manage`, `settings:read`

#### Implementation
- **Backend**: `requirePermission()` middleware blocks unauthorized requests
- **Frontend**: `hasPermission()` hook conditionally renders UI elements
- **Sidebar**: Automatically filters navigation based on user permissions

### Database Schema

```prisma
model User {
  id           String    @id @default(uuid())
  email        String    @unique
  password     String
  name         String
  createdAt    DateTime  @default(now())
  updatedAt    DateTime  @updatedAt
  lastLoginAt  DateTime?
  refreshToken String?
  userRoles    UserRole[]
  auditLogs    AuditLog[]
}

model Role {
  id              String            @id @default(uuid())
  name            String            @unique
  description     String?
  userRoles       UserRole[]
  rolePermissions RolePermission[]
}

model Permission {
  id              String            @id @default(uuid())
  name            String            @unique
  description     String?
  category        String
  rolePermissions RolePermission[]
}

model UserRole {
  id     String @id @default(uuid())
  userId String
  roleId String
  user   User   @relation(...)
  role   Role   @relation(...)
}

model RolePermission {
  id           String     @id @default(uuid())
  roleId       String
  permissionId String
  role         Role       @relation(...)
  permission   Permission @relation(...)
}

model AuditLog {
  id        String   @id @default(uuid())
  userId    String?
  action    String
  resource  String
  details   String?
  ipAddress String?
  userAgent String?
  status    String
  createdAt DateTime @default(now())
  user      User?    @relation(...)
}

model RequestLog {
  id         String   @id @default(uuid())
  endpoint   String
  method     String
  statusCode Int
  duration   Int
  createdAt  DateTime @default(now())
}
```

### Real-Time Features

Socket.io broadcasts:
- **Active Users**: Live connection count
- **Audit Logs**: Stream of recent activity
- **Requests Per Minute**: Simulated API traffic
- **System Alerts**: Mock system notifications every 15-30 seconds

### Performance Optimizations

#### Code Splitting
- **React.lazy()** for route-based code splitting
- Each page loads only when accessed

#### Memoization
- **React.memo()** on list items (UserRow, StatCard, LogRow)
- **useCallback()** for stable function references
- **useMemo()** for expensive computations

#### Virtualization
- **react-window** for audit logs table
- Renders only visible rows out of 10,000 logs
- Maintains 60fps scrolling performance

#### Query Optimization
- **TanStack Query** with 5-minute stale time
- Database indexes on frequently queried fields
- Pagination for large datasets

### Security

- **Helmet** for security headers
- **Rate Limiting** (100 requests per 15 minutes)
- **CORS** configured for specific origin
- **JWT** with short-lived access tokens (15min) and refresh tokens (7 days)
- **bcrypt** for password hashing (10 rounds)
- **Zod** for input validation
- **RLS Policies** on all database tables
- **Centralized Error Handler** (no stack traces in production)

### Cold Start Explanation

**Why it happens:**
Render's free tier spins down inactive services after 15 minutes. The first request after downtime triggers a cold start, taking 30-60 seconds.

**How we handle it:**
1. **Detection**: Monitor request duration > 3 seconds
2. **Banner**: Dismissible notification explaining the delay
3. **Toast**: One-time alert on first cold start
4. **User Experience**: Clear communication prevents confusion

## Setup Instructions

### Prerequisites
- Node.js 18+
- PostgreSQL (Supabase account)
- npm or yarn

### Environment Variables

#### Backend (.env)
```env
DATABASE_URL="postgresql://user:password@host:5432/database"
JWT_SECRET="your-secret-key-change-in-production"
JWT_REFRESH_SECRET="your-refresh-secret-key-change-in-production"
JWT_EXPIRES_IN="15m"
JWT_REFRESH_EXPIRES_IN="7d"
PORT=3001
NODE_ENV="development"
FRONTEND_URL="http://localhost:5173"
```

#### Frontend (.env)
```env
VITE_API_URL=http://localhost:3001/api
```

### Local Development

1. **Clone and Install**
```bash
# Install frontend dependencies
npm install

# Install backend dependencies
cd backend
npm install
```

2. **Database Setup**
```bash
cd backend

# The schema is already applied to Supabase
# Just generate Prisma client
npx prisma generate

# Seed the database with dummy data
npm run seed
```

3. **Start Development Servers**
```bash
# Terminal 1: Backend
cd backend
npm run dev

# Terminal 2: Frontend (in project root)
npm run dev
```

4. **Access Application**
- Frontend: http://localhost:5173
- Backend API: http://localhost:3001

### Demo Credentials
```
Email: admin@opscore.io
Password: admin123
Role: Admin (Full Access)
```

## Deployment

### Frontend (Vercel)

1. **Connect Repository**
   - Import project to Vercel
   - Framework: Vite
   - Root Directory: `/`

2. **Environment Variables**
   ```
   VITE_API_URL=https://your-backend.onrender.com/api
   ```

3. **Build Settings**
   - Build Command: `npm run build`
   - Output Directory: `dist`

### Backend (Render)

1. **Create Web Service**
   - Runtime: Node
   - Build Command: `cd backend && npm install && npx prisma generate && npm run build`
   - Start Command: `cd backend && npm start`

2. **Environment Variables**
   ```
   DATABASE_URL=<your-supabase-connection-string>
   JWT_SECRET=<generate-secure-key>
   JWT_REFRESH_SECRET=<generate-secure-key>
   JWT_EXPIRES_IN=15m
   JWT_REFRESH_EXPIRES_IN=7d
   NODE_ENV=production
   FRONTEND_URL=https://your-frontend.vercel.app
   ```

3. **Database (Supabase)**
   - Already configured and migrated
   - Run seed script manually if needed

### Post-Deployment

1. **Seed Production Database**
```bash
# Connect to your Render shell or run locally
cd backend
DATABASE_URL="<production-url>" npm run seed
```

2. **Test Authentication**
   - Visit your frontend URL
   - Login with admin credentials
   - Verify real-time features are working

## Scaling Considerations

### Current Architecture
- **Monolithic Backend**: Single Express server
- **Client-Side State**: Zustand for local, TanStack Query for server
- **Real-Time**: Socket.io with in-memory connections

### Scaling Path

#### Horizontal Scaling
1. **Load Balancer**: Add nginx/HAProxy
2. **Multiple Backend Instances**: Scale Express servers
3. **Session Store**: Redis for JWT blacklist/rate limiting
4. **Socket.io Adapter**: Redis adapter for multi-instance Socket.io

#### Database Optimization
1. **Read Replicas**: Separate read/write connections
2. **Caching Layer**: Redis for frequently accessed data
3. **Connection Pooling**: Already configured in Prisma

#### Microservices Migration
Potential service boundaries:
- **Auth Service**: User authentication, JWT management
- **RBAC Service**: Role/permission management
- **Audit Service**: Log collection and querying
- **Analytics Service**: Metrics aggregation
- **Real-Time Service**: Socket.io events

#### Performance Monitoring
- Add APM (Application Performance Monitoring)
- Database query monitoring
- Error tracking (Sentry)
- Logging aggregation (Datadog, LogRocket)

## Development Notes

### Code Organization
- Files are kept modular and focused (single responsibility)
- Large files are split into logical components
- Proper imports/exports throughout

### Performance Comments
Performance optimizations are documented inline:
```typescript
// Memoized to prevent re-renders on parent updates
const UserRow = memo(({ user, onEdit, onDelete }) => {
  // Component implementation
});

// Lazy loaded for code splitting
const Dashboard = lazy(() => import('./pages/dashboard/Dashboard'));

// Debounced search to reduce API calls
const handleSearchChange = useCallback((value: string) => {
  // Debounce implementation
}, []);
```

## Testing

### Manual Testing Checklist
- [ ] Login/Logout flow
- [ ] Registration with default Viewer role
- [ ] Permission-based UI rendering
- [ ] Real-time dashboard updates
- [ ] Virtualized audit log scrolling
- [ ] User CRUD operations (if Admin)
- [ ] Role/Permission viewing
- [ ] Analytics charts rendering
- [ ] Cold start banner display/dismiss
- [ ] Toast notifications on actions

### API Testing
```bash
# Health check
curl http://localhost:3001/health

# Login
curl -X POST http://localhost:3001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@opscore.io","password":"admin123"}'

# Get users (with token)
curl http://localhost:3001/api/users \
  -H "Authorization: Bearer <your-token>"
```

## License

MIT

## Support

For issues, questions, or contributions, please open an issue on GitHub.

---

**Built with best practices for production-ready SaaS applications.**
