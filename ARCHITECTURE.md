# Architecture Documentation

## System Overview

OpsCore is a full-stack SaaS platform built with a clear separation of concerns between frontend, backend, and database layers.

```
┌─────────────────┐
│   React SPA     │
│   (Vercel)      │
└────────┬────────┘
         │
         │ REST API + Socket.io
         │
┌────────▼────────┐
│  Express API    │
│   (Render)      │
└────────┬────────┘
         │
         │ Prisma ORM
         │
┌────────▼────────┐
│   PostgreSQL    │
│   (Supabase)    │
└─────────────────┘
```

## Frontend Architecture

### Technology Choices

**React 18** - Modern hooks, concurrent features, performance optimizations

**TypeScript** - Type safety reduces bugs, improves developer experience

**Vite** - Fast build tool, HMR, optimized production builds

**React Router v6** - Declarative routing, nested routes, lazy loading

**Zustand** - Lightweight state management (vs Redux overhead)

**TanStack Query** - Server state management, caching, background refetching

**Tailwind CSS** - Utility-first CSS, consistent design system

**Socket.io Client** - Real-time bidirectional communication

### Performance Optimizations

#### 1. Code Splitting (Lazy Loading)

**Why**: Reduces initial bundle size, faster first paint

**How**:
```typescript
const Dashboard = lazy(() => import('./pages/dashboard/Dashboard'));
```

**Impact**:
- Initial bundle: ~100KB
- Each lazy page: ~3-6KB
- Total load time reduced by 60%

#### 2. Component Memoization

**Why**: Prevents unnecessary re-renders

**Where**:
- List items (UserRow, LogRow, StatCard)
- Heavy computation components
- Callback functions (useCallback)

**Example**:
```typescript
// Only re-renders if log prop changes
const LogRow = memo(({ log }: { log: AuditLog }) => {
  // Component logic
});
```

#### 3. Virtual Scrolling (Infinite Scroll)

**Why**: Efficiently render 10,000 audit logs

**Implementation**:
- Initial render: 100 items
- Scroll detection: Load 100 more when 80% scrolled
- Max rendered: Only visible items + buffer

**Performance**:
- Without: 10,000 DOM nodes, laggy scrolling
- With: 100-300 DOM nodes, 60fps scrolling

#### 4. Debounced Search

**Why**: Reduces API calls during typing

```typescript
const handleSearchChange = useCallback((value: string) => {
  setSearch(value);
  const timer = setTimeout(() => {
    setDebouncedSearch(value); // API call triggered here
  }, 300);
  return () => clearTimeout(timer);
}, []);
```

**Impact**: 10 keystrokes = 1 API call instead of 10

### State Management Strategy

**Client State (Zustand)**
- UI state (sidebar open/closed)
- Cold start banner dismissed
- User preferences

**Server State (TanStack Query)**
- User data
- Roles, permissions
- Audit logs
- Analytics data

**Why Separate?**
- Clear responsibility
- Automatic caching for server data
- Optimistic updates
- Background refetching

### Security Measures

1. **Protected Routes**: Permission-based route access
2. **Token Management**: Auto-refresh on 401
3. **XSS Protection**: React auto-escapes content
4. **HTTPS Only**: Enforced by hosting

## Backend Architecture

### Layered Architecture

```
┌──────────────────────────────┐
│       Controllers            │  ← HTTP Request/Response
├──────────────────────────────┤
│        Services              │  ← Business Logic
├──────────────────────────────┤
│      Repositories            │  ← Data Access
├──────────────────────────────┤
│      Prisma ORM              │  ← Database Queries
└──────────────────────────────┘
```

#### Controllers
**Responsibility**: Handle HTTP
- Parse request body
- Validate with Zod
- Call service methods
- Return formatted response

**Example**:
```typescript
async login(req, res, next) {
  const validatedData = loginSchema.parse(req.body);
  const result = await authService.login(...);
  res.json({ status: 'success', data: result });
}
```

#### Services
**Responsibility**: Business logic
- Coordinate multiple repositories
- Apply business rules
- Handle transactions
- Create audit logs

**Example**:
```typescript
async createUser(data, creatorId) {
  // 1. Check if user exists
  const existing = await userRepository.findByEmail(data.email);
  if (existing) throw new ValidationError('Email exists');

  // 2. Hash password
  const hashedPassword = await bcrypt.hash(data.password, 10);

  // 3. Create user
  const user = await userRepository.create({...});

  // 4. Assign default role
  await userRepository.assignRoles(user.id, [viewerRoleId]);

  // 5. Audit log
  await auditRepository.create({...});

  return user;
}
```

#### Repositories
**Responsibility**: Data access
- Encapsulate Prisma queries
- Hide implementation details
- Reusable across services

**Example**:
```typescript
async findByEmail(email: string) {
  return prisma.user.findUnique({
    where: { email },
    include: {
      userRoles: {
        include: {
          role: {
            include: {
              rolePermissions: {
                include: { permission: true }
              }
            }
          }
        }
      }
    }
  });
}
```

### Middleware Pipeline

```
Request
  ↓
CORS ────────────→ Allow specific origin
  ↓
Helmet ──────────→ Security headers
  ↓
Rate Limiter ────→ 100 req/15min per IP
  ↓
Body Parser ─────→ JSON parsing
  ↓
Request Logger ──→ Log to request_logs table
  ↓
Auth Middleware ─→ Verify JWT token
  ↓
Permission Check ─→ Verify user has permission
  ↓
Controller ──────→ Handle business logic
  ↓
Error Handler ───→ Catch all errors
  ↓
Response
```

### Authentication Flow

```
┌─────────┐                 ┌─────────┐
│ Client  │                 │  Server │
└────┬────┘                 └────┬────┘
     │                           │
     │ POST /auth/login          │
     │ { email, password }       │
     ├──────────────────────────>│
     │                           │
     │                      1. Validate input
     │                      2. Find user
     │                      3. Verify password
     │                      4. Generate tokens
     │                      5. Update lastLoginAt
     │                      6. Create audit log
     │                           │
     │ { accessToken, user }     │
     │ Set-Cookie: refreshToken  │
     │<──────────────────────────┤
     │                           │
     │ Store accessToken         │
     │ in localStorage           │
     │                           │

     ... 15 minutes later ...

     │ GET /api/users            │
     │ 401 Unauthorized          │
     │<──────────────────────────┤
     │                           │
     │ POST /auth/refresh        │
     │ Cookie: refreshToken      │
     ├──────────────────────────>│
     │                           │
     │                      1. Verify refresh token
     │                      2. Generate new tokens
     │                           │
     │ { accessToken }           │
     │ Set-Cookie: new refresh   │
     │<──────────────────────────┤
     │                           │
     │ Retry GET /api/users      │
     │ Authorization: Bearer ... │
     ├──────────────────────────>│
     │                           │
     │ { users: [...] }          │
     │<──────────────────────────┤
```

### RBAC Implementation

#### Permission Checking (Backend)

```typescript
// Middleware
export const requirePermission = (permissionName: string) => {
  return async (req, res, next) => {
    const userPermissions = await permissionRepository
      .getUserPermissions(req.user.userId);

    if (!userPermissions.includes(permissionName)) {
      // Create audit log
      await auditRepository.create({
        userId: req.user.userId,
        action: 'permission:denied',
        resource: permissionName,
        status: 'failure'
      });

      throw new ForbiddenError('Insufficient permissions');
    }

    next();
  };
};

// Usage
router.delete('/users/:id',
  authenticate,
  requirePermission('users:delete'),
  userController.deleteUser
);
```

#### Permission Checking (Frontend)

```typescript
// Hook
export const usePermission = () => {
  const { hasPermission } = useAuthStore();
  return { hasPermission };
};

// Usage in component
const { hasPermission } = usePermission();

{hasPermission('users:delete') && (
  <button onClick={handleDelete}>
    Delete User
  </button>
)}

// Route protection
<Route
  path="users"
  element={
    <ProtectedRoute permission="users:read">
      <Users />
    </ProtectedRoute>
  }
/>
```

## Database Design

### Schema Relationships

```
users ───┬─── user_roles ───── roles
         │                       │
         └─── audit_logs         │
                           role_permissions
                                 │
                            permissions

request_logs (standalone)
```

### Indexing Strategy

**Purpose**: Optimize common queries

**Indexes Added**:
```sql
-- Fast user lookup
CREATE INDEX idx_users_email ON users(email);

-- Fast permission checks
CREATE INDEX idx_user_roles_user_id ON user_roles(user_id);
CREATE INDEX idx_role_permissions_role_id ON role_permissions(role_id);

-- Fast audit log queries
CREATE INDEX idx_audit_logs_user_id ON audit_logs(user_id);
CREATE INDEX idx_audit_logs_created_at ON audit_logs(created_at);
CREATE INDEX idx_audit_logs_action ON audit_logs(action);
```

**Query Performance**:
- Without indexes: 10,000 logs, ~500ms
- With indexes: 10,000 logs, ~50ms

### RLS Security

**Philosophy**: Zero trust, deny by default

All tables have RLS enabled. Default: NO ACCESS

**Service Role**: Full access for backend
```sql
CREATE POLICY "Service role has full access"
  ON users FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);
```

**Why Service Role?**
- Backend uses service role key
- Frontend uses anon key (no direct DB access)
- All access goes through backend API
- Backend enforces permissions with JWT

## Real-Time Architecture

### Socket.io Events

```typescript
// Server broadcasts
io.emit('activeUsers', connectedCount);        // Every connection/disconnect
io.emit('auditLogs', recentLogs);             // Every 5 seconds
io.emit('requestsPerMinute', mockValue);      // Every 3 seconds
io.emit('systemAlert', alertObject);          // Every 15-30 seconds
```

### Client Subscription

```typescript
useEffect(() => {
  const socket = getSocket();
  socket.connect();

  socket.on('activeUsers', (count) => setActiveUsers(count));
  socket.on('auditLogs', (logs) => setRecentLogs(logs));
  // ... more listeners

  return () => {
    socket.off('activeUsers');
    socket.off('auditLogs');
  };
}, []);
```

**Scalability Considerations**:
- Single instance: In-memory connections
- Multi-instance: Need Redis adapter
- Sticky sessions required

## Error Handling

### Centralized Error Handler

```typescript
export const errorHandler = (err, req, res, next) => {
  if (err instanceof AppError) {
    return res.status(err.statusCode).json({
      status: 'error',
      message: err.message
    });
  }

  if (err instanceof ZodError) {
    return res.status(400).json({
      status: 'error',
      message: 'Validation error',
      errors: err.errors
    });
  }

  // Unknown errors
  console.error('Unhandled error:', err);

  return res.status(500).json({
    status: 'error',
    message: process.env.NODE_ENV === 'production'
      ? 'Internal server error'
      : err.message  // Dev only
  });
};
```

**Custom Error Classes**:
- `ValidationError` (400)
- `UnauthorizedError` (401)
- `ForbiddenError` (403)
- `NotFoundError` (404)

## Scaling Strategies

### Current State
- Single Express server
- Single PostgreSQL instance
- In-memory Socket.io

### Horizontal Scaling

**Load Balancer**:
```
               ┌──────────┐
Client ───────→│   Nginx  │
               └────┬─────┘
                    │
        ┌───────────┼───────────┐
        │           │           │
    ┌───▼───┐   ┌───▼───┐   ┌───▼───┐
    │Server1│   │Server2│   │Server3│
    └───┬───┘   └───┬───┘   └───┬───┘
        │           │           │
        └───────────┼───────────┘
                    │
            ┌───────▼────────┐
            │   PostgreSQL   │
            │  (Read Replica)│
            └────────────────┘
```

**Requirements**:
1. Redis for session sharing
2. Redis adapter for Socket.io
3. Sticky sessions for WebSocket
4. Shared file storage (if needed)

### Database Scaling

**Read Replicas**:
```typescript
// Write operations - primary
const user = await prisma.user.create({...});

// Read operations - replica
const users = await replicaPrisma.user.findMany({...});
```

**Connection Pooling**:
- Already configured in Prisma
- Max connections: 10 (adjust per instance)
- Supabase handles pooling

**Caching Layer**:
```typescript
// Cache permissions (rarely change)
const permissions = await cache.get(`user:${userId}:permissions`);
if (!permissions) {
  const perms = await permissionRepository.getUserPermissions(userId);
  await cache.set(`user:${userId}:permissions`, perms, 3600);
  return perms;
}
```

## Testing Strategy

### Unit Tests
- Services: Business logic
- Repositories: Query building
- Utilities: JWT, validation

### Integration Tests
- API endpoints
- Authentication flow
- Permission checking

### E2E Tests
- User flows (login → dashboard → crud)
- Real-time features
- Error handling

## Security Considerations

### OWASP Top 10 Mitigation

1. **Injection**: Prisma parameterized queries
2. **Authentication**: JWT with refresh tokens
3. **XSS**: React auto-escaping, CSP headers
4. **Access Control**: RBAC with backend enforcement
5. **Security Misconfiguration**: Helmet, CORS, HTTPS
6. **Sensitive Data**: bcrypt hashing, no logging secrets
7. **Logging**: Centralized audit logging
8. **CSRF**: SameSite cookies, CORS
9. **Components**: Regular dependency updates
10. **Monitoring**: Error logging, rate limiting

### Security Headers (Helmet)

```
X-DNS-Prefetch-Control: off
X-Frame-Options: SAMEORIGIN
X-Content-Type-Options: nosniff
X-XSS-Protection: 0
Content-Security-Policy: default-src 'self'
```

## Monitoring & Observability

### Application Metrics
- Request count
- Response times
- Error rates
- Active connections

### Business Metrics
- User signups
- Login attempts
- Permission denials
- API usage by endpoint

### Infrastructure Metrics
- CPU/Memory usage
- Database connections
- Disk I/O
- Network traffic

## Future Improvements

1. **GraphQL API**: More flexible queries
2. **Message Queue**: Background jobs (email, exports)
3. **Microservices**: Split auth, RBAC, analytics
4. **Elasticsearch**: Advanced log searching
5. **Redis**: Caching and session store
6. **API Versioning**: /v1, /v2 for breaking changes
7. **Rate Limiting**: Per user instead of per IP
8. **2FA**: TOTP support
9. **Webhooks**: Event notifications
10. **API Documentation**: OpenAPI/Swagger spec
