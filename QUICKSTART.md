# Quick Start Guide

Get OpsCore running locally in 5 minutes.

## Prerequisites

- Node.js 18+ installed
- Git installed
- Terminal/Command Prompt

## Step 1: Clone & Install

```bash
# Clone repository
git clone <your-repo-url>
cd opscore

# Install frontend dependencies
npm install

# Install backend dependencies
cd backend
npm install
cd ..
```

## Step 2: Database Setup

The database schema is already applied to Supabase. You just need the connection string.

### Get Supabase Connection String

1. Go to your Supabase project
2. Navigate to Settings → Database
3. Copy the "Connection string" under "Connection Pooling"
4. Replace `[YOUR-PASSWORD]` with your actual database password

### Configure Backend

```bash
cd backend
cp .env.example .env
```

Edit `backend/.env`:

```env
DATABASE_URL="your-supabase-connection-string"
JWT_SECRET="dev-secret-key-change-in-production"
JWT_REFRESH_SECRET="dev-refresh-secret-key"
JWT_EXPIRES_IN="15m"
JWT_REFRESH_EXPIRES_IN="7d"
PORT=3001
NODE_ENV="development"
FRONTEND_URL="http://localhost:5173"
```

### Seed Database

```bash
# Still in backend directory
npm run seed
```

This creates:

- Admin user: admin@opscore.io / admin123
- 50 test users
- 10,000 audit logs
- 3 roles, 12 permissions

## Step 3: Configure Frontend

```bash
# Go back to project root
cd ..

# Create frontend .env
cp .env.example .env
```

Edit `.env`:

```env
VITE_API_URL=http://localhost:3001/api
```

## Step 4: Start Development Servers

Open TWO terminal windows:

### Terminal 1: Backend

```bash
cd backend
npm run dev
```

You should see:

```
Server running on port 3001
Database connected successfully
```

### Terminal 2: Frontend

```bash
# In project root
npm run dev
```

You should see:

```
VITE v5.x.x ready in xxx ms

➜  Local:   http://localhost:5173/
```

## Step 5: Open Application

1. Open browser: http://localhost:5173
2. Login with: admin@opscore.io / admin123
3. Explore the dashboard!

## What You'll See

### Dashboard

- Real-time active users count
- Live audit log stream
- Requests per minute metric
- System alerts appearing

### Users Page

- List of all users
- Create/Edit/Delete (if Admin)
- Role assignment

### Roles & Permissions

- View all roles
- See permissions per role
- Permission categories

### Audit Logs

- 10,000 logs with infinite scroll
- Search functionality
- Debounced search (300ms)

### Analytics

- User activity metrics
- Role distribution chart
- Top API endpoints
- System statistics

### Settings

- General settings (demo UI)
- Email notifications toggles

## Common Issues

### Port Already in Use

**Backend (3001)**:

```bash
# Find process
lsof -ti:3001

# Kill process
kill -9 $(lsof -ti:3001)
```

**Frontend (5173)**:

```bash
# Find process
lsof -ti:5173

# Kill process
kill -9 $(lsof -ti:5173)
```

### Database Connection Error

1. Check `DATABASE_URL` in `backend/.env`
2. Verify password is correct
3. Test connection:

```bash
cd backend
npx prisma db pull
```

### Can't Login

1. Verify backend is running (port 3001)
2. Check browser console for errors
3. Verify `VITE_API_URL` in frontend `.env`
4. Try clearing browser cookies and localStorage

### Real-Time Not Working

1. Check Socket.io connection in browser Network tab
2. Verify backend logs show "Client connected"
3. Refresh page
4. Check CORS configuration matches

## Test User Credentials

All test users have password: `password123`

**Admin** (Full Access):

- admin@opscore.io

**Manager** (Limited):

- Check seeded users list for managers

**Viewer** (Read Only):

- Most seeded users are viewers

## Next Steps

1. **Read Architecture**: See `ARCHITECTURE.md`
2. **Deploy**: Follow `DEPLOYMENT.md`
3. **Customize**: Modify branding, add features
4. **Add Tests**: Write unit and integration tests

## Development Tips

### Hot Reload

Both frontend and backend have hot reload:

- Frontend: Instant with Vite HMR
- Backend: Auto-restart with tsx watch

### Database Changes

After modifying `prisma/schema.prisma`:

```bash
cd backend

# Generate Prisma client
npx prisma generate

# Apply changes to DB (if needed)
npx prisma db push

# Or create migration
npx prisma migrate dev --name your_migration_name
```

### View Database

```bash
cd backend
npx prisma studio
```

Opens visual database editor at http://localhost:5555

### Check API Routes

Backend routes:

- Health: http://localhost:3001/health
- Auth: http://localhost:3001/api/auth/\*
- Users: http://localhost:3001/api/users
- Roles: http://localhost:3001/api/roles
- Audit: http://localhost:3001/api/audit
- Analytics: http://localhost:3001/api/analytics

### Debug Tips

**Backend Logs**:

- Console logs show all requests
- Error stack traces in development
- Audit logs tracked in database

**Frontend Logs**:

- React DevTools for component inspection
- TanStack Query DevTools for cache inspection
- Browser Network tab for API calls

## Production Build

Test production build locally:

```bash
# Build frontend
npm run build

# Preview
npm run preview

# Build backend
cd backend
npm run build

# Run production build
npm start
```

## Quick Command Reference

```bash
# Install all dependencies
npm install && cd backend && npm install && cd ..

# Start both servers (use two terminals)
cd backend && npm run dev  # Terminal 1
npm run dev                # Terminal 2 (in root)

# Seed database
cd backend && npm run seed

# Build for production
npm run build              # Frontend
cd backend && npm run build  # Backend

# Run production
npm run preview            # Frontend
cd backend && npm start    # Backend
```

## Getting Help

- Check logs in terminal
- Read error messages carefully
- Search issues in repository
- Check browser console
- Review `.env` files

## Performance Features Demo

### Code Splitting

- Open browser DevTools → Network
- Navigate between pages
- See lazy-loaded chunks

### Memoization

- Open React DevTools → Profiler
- Interact with lists
- See reduced re-renders

### Infinite Scroll

- Go to Audit Logs
- Scroll down
- Watch "Loading more..." indicator

### Debounced Search

- Type in search box quickly
- Open Network tab
- See single API call after 300ms

## Project Structure

```
project/
├── src/                    # Frontend source
│   ├── api/               # API client, socket
│   ├── components/        # React components
│   ├── hooks/             # Custom hooks
│   ├── pages/             # Page components
│   ├── stores/            # Zustand stores
│   ├── types/             # TypeScript types
│   └── utils/             # Utilities
├── backend/               # Backend source
│   └── src/
│       ├── controllers/   # Request handlers
│       ├── services/      # Business logic
│       ├── repositories/  # Data access
│       ├── middleware/    # Auth, RBAC
│       ├── routes/        # API routes
│       ├── sockets/       # Socket.io
│       ├── utils/         # Helpers
│       └── prisma/        # DB schema
└── dist/                  # Build output
```

Happy coding!
