# OpsCore Backend

Express + TypeScript backend with layered architecture, RBAC, and real-time features.

## Quick Start

1. **Install dependencies**
```bash
npm install
```

2. **Set up environment**
```bash
cp .env.example .env
# Edit .env with your database credentials
```

3. **Generate Prisma Client**
```bash
npm run prisma:generate
```

4. **Seed database**
```bash
npm run seed
```

5. **Start development server**
```bash
npm run dev
```

## Scripts

- `npm run dev` - Start development server with hot reload
- `npm run build` - Build for production
- `npm start` - Start production server
- `npm run seed` - Seed database with dummy data
- `npm run prisma:generate` - Generate Prisma client

## API Endpoints

### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login
- `POST /api/auth/refresh` - Refresh access token
- `POST /api/auth/logout` - Logout
- `GET /api/auth/me` - Get current user

### Users
- `GET /api/users` - List users (requires `users:read`)
- `GET /api/users/:id` - Get user by ID
- `POST /api/users` - Create user (requires `users:create`)
- `PUT /api/users/:id` - Update user (requires `users:update`)
- `DELETE /api/users/:id` - Delete user (requires `users:delete`)

### Roles
- `GET /api/roles` - List roles (requires `roles:read`)
- `GET /api/roles/:id` - Get role by ID
- `GET /api/roles/permissions` - List all permissions
- `POST /api/roles` - Create role (requires `roles:manage`)
- `PUT /api/roles/:id` - Update role (requires `roles:manage`)
- `DELETE /api/roles/:id` - Delete role (requires `roles:manage`)

### Audit Logs
- `GET /api/audit` - List audit logs (requires `logs:read`)
- `GET /api/audit/recent` - Get recent logs

### Analytics
- `GET /api/analytics/dashboard` - Dashboard metrics
- `GET /api/analytics/requests` - Request statistics
- `GET /api/analytics/roles` - Role distribution
- `GET /api/analytics/users` - User activity summary
- `GET /api/analytics/stats` - System statistics

## Architecture

See main README.md for detailed architecture explanation.

## Database Schema

Located in `prisma/schema.prisma`. The schema is already applied to Supabase.

## Security

- JWT with refresh tokens
- bcrypt password hashing
- Rate limiting
- Helmet security headers
- CORS configuration
- Zod input validation
- RLS policies on all tables

## Real-Time

Socket.io events:
- `activeUsers` - Connected user count
- `requestsPerMinute` - API traffic metric
- `auditLogs` - Recent audit log stream
- `systemAlert` - System notifications
