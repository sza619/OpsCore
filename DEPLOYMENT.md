# Deployment Guide

## Overview

This guide covers deploying OpsCore to production using:
- **Frontend**: Vercel
- **Backend**: Render (free tier)
- **Database**: Supabase (PostgreSQL)

## Prerequisites

1. GitHub account with repository pushed
2. Vercel account
3. Render account
4. Supabase project created

## Database Setup (Supabase)

### 1. Create Supabase Project

The database schema is already applied via the migration. The following tables exist:
- users
- roles
- permissions
- role_permissions
- user_roles
- audit_logs
- request_logs

### 2. Get Connection String

1. Navigate to Project Settings > Database
2. Copy the connection string (Connection Pooling recommended)
3. Format: `postgresql://postgres.[project-ref]:[password]@[host]:5432/postgres`

### 3. Seed Database

After deployment, seed the database:

```bash
# Install backend dependencies
cd backend
npm install

# Set DATABASE_URL environment variable
export DATABASE_URL="your-supabase-connection-string"

# Run seed script
npm run seed
```

This creates:
- Admin user (admin@opscore.io / admin123)
- 50 dummy users
- 10,000 audit logs
- 3 default roles (Admin, Manager, Viewer)
- 12 permissions

## Backend Deployment (Render)

### 1. Create Web Service

1. Go to Render Dashboard
2. Click "New +" → "Web Service"
3. Connect your GitHub repository
4. Configure:
   - **Name**: opscore-backend
   - **Environment**: Node
   - **Region**: Choose closest to users
   - **Branch**: main
   - **Root Directory**: Leave empty (we'll use cd in commands)

### 2. Build & Start Commands

**Build Command:**
```bash
cd backend && npm install && npx prisma generate && npm run build
```

**Start Command:**
```bash
cd backend && npm start
```

### 3. Environment Variables

Add these in Render dashboard:

```
DATABASE_URL=postgresql://postgres.[project-ref]:[password]@[host]:5432/postgres
JWT_SECRET=generate-a-secure-random-string-min-32-chars
JWT_REFRESH_SECRET=generate-another-secure-random-string-min-32-chars
JWT_EXPIRES_IN=15m
JWT_REFRESH_EXPIRES_IN=7d
NODE_ENV=production
FRONTEND_URL=https://your-frontend-domain.vercel.app
PORT=3001
```

**Generate Secure Secrets:**
```bash
# On Mac/Linux
openssl rand -base64 32

# Or Node.js
node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"
```

### 4. Deploy

1. Click "Create Web Service"
2. Wait for build and deployment (5-10 minutes)
3. Copy the service URL (e.g., `https://opscore-backend.onrender.com`)

### 5. Test Backend

```bash
# Health check
curl https://opscore-backend.onrender.com/health

# Should return: {"status":"ok","timestamp":"..."}
```

## Frontend Deployment (Vercel)

### 1. Import Project

1. Go to Vercel Dashboard
2. Click "Add New..." → "Project"
3. Import your GitHub repository
4. Configure:
   - **Framework Preset**: Vite
   - **Root Directory**: `/` (default)
   - **Build Command**: `npm run build` (auto-detected)
   - **Output Directory**: `dist` (auto-detected)

### 2. Environment Variables

Add in Vercel project settings:

```
VITE_API_URL=https://opscore-backend.onrender.com/api
```

**Important**: VITE_ prefix is required for Vite env vars!

### 3. Deploy

1. Click "Deploy"
2. Wait for build (2-3 minutes)
3. Copy deployment URL (e.g., `https://opscore.vercel.app`)

### 4. Update Backend FRONTEND_URL

Go back to Render and update:
```
FRONTEND_URL=https://opscore.vercel.app
```

This ensures CORS works correctly.

### 5. Redeploy Backend

After updating FRONTEND_URL, trigger a manual deploy in Render to apply the new CORS origin.

## Post-Deployment

### 1. Seed Production Database

If you haven't seeded yet:

```bash
# SSH into Render (or run locally)
cd backend
npm run seed
```

### 2. Test Authentication

1. Visit your Vercel URL
2. Login with: admin@opscore.io / admin123
3. Verify dashboard loads with real-time data

### 3. Verify Real-Time Features

- Dashboard should show active users count
- Audit logs should stream every 5 seconds
- System alerts should appear every 15-30 seconds
- Requests per minute metric should update

## Cold Start Considerations (Render Free Tier)

Render free tier spins down after 15 minutes of inactivity. First request after spin-down takes 30-60 seconds.

**User Experience Handling:**
1. Cold start detection banner shows automatically
2. Toast notification on first slow request
3. Users can dismiss the banner
4. Preference saved in localStorage

**To Avoid Cold Starts (Paid Plan):**
- Upgrade to Render Starter plan ($7/month)
- Keeps service always running
- No cold starts

## Environment Variables Summary

### Backend (.env)
```env
DATABASE_URL=postgresql://...
JWT_SECRET=your-secret-min-32-chars
JWT_REFRESH_SECRET=your-refresh-secret-min-32-chars
JWT_EXPIRES_IN=15m
JWT_REFRESH_EXPIRES_IN=7d
NODE_ENV=production
FRONTEND_URL=https://your-frontend.vercel.app
PORT=3001
```

### Frontend (.env)
```env
VITE_API_URL=https://your-backend.onrender.com/api
```

## Troubleshooting

### CORS Errors

**Problem**: Frontend shows CORS errors
**Solution**:
1. Verify FRONTEND_URL in backend matches exact frontend URL
2. No trailing slash in URLs
3. Redeploy backend after changing FRONTEND_URL

### Authentication Not Working

**Problem**: Login fails or redirects to login repeatedly
**Solution**:
1. Check JWT_SECRET is set in backend
2. Verify cookies are enabled in browser
3. Check browser console for errors
4. Ensure VITE_API_URL is correct

### Real-Time Not Working

**Problem**: Dashboard doesn't show live updates
**Solution**:
1. Socket.io requires FRONTEND_URL to be correct
2. Check browser dev tools Network tab for WebSocket connection
3. Verify backend is running (not in cold start)

### Database Connection Errors

**Problem**: Backend can't connect to database
**Solution**:
1. Verify DATABASE_URL is correct
2. Check Supabase project is active
3. Ensure connection pooling is enabled
4. Verify IP allowlist (Supabase allows all by default)

## Scaling & Performance

### Current Setup (Free Tier)
- **Concurrent Users**: ~50-100
- **Requests/Second**: ~10-20
- **Database Connections**: 1 instance

### Optimization Steps

1. **Add Redis for Caching**
   - Cache frequently accessed data
   - Store rate limit counters
   - Session management

2. **Enable Database Connection Pooling**
   - Already configured in Prisma
   - Use Supabase connection pooler

3. **Upgrade Render Plan**
   - Starter: $7/month (no cold starts)
   - Standard: $25/month (auto-scaling)

4. **Add CDN**
   - Vercel automatically uses CDN
   - No additional config needed

5. **Database Optimization**
   - Indexes already added for common queries
   - Consider read replicas for high traffic
   - Archive old audit logs (>90 days)

## Monitoring

### Application Monitoring

**Render Logs:**
- View in Render dashboard → Logs
- Filter by severity
- Download for analysis

**Vercel Logs:**
- View in Vercel dashboard → Deployments → Logs
- Real-time function logs
- Error tracking

### Database Monitoring

**Supabase:**
- Project → Database → Reports
- Query performance
- Connection pool usage
- Storage usage

### Uptime Monitoring

Consider adding:
- **UptimeRobot** (free): Ping health endpoint every 5 minutes
- **Better Uptime**: Status page + notifications
- **Sentry**: Error tracking and performance

## Security Checklist

- [x] JWT secrets are strong (32+ chars)
- [x] CORS configured with specific origin
- [x] Rate limiting enabled (100 req/15min)
- [x] Helmet security headers
- [x] Password hashing with bcrypt
- [x] Environment variables not committed
- [x] RLS policies on all database tables
- [x] Input validation with Zod
- [x] HTTPS enforced (automatic on Vercel/Render)

## Maintenance

### Weekly
- Check error logs in Render and Vercel
- Monitor database size in Supabase

### Monthly
- Review audit logs for suspicious activity
- Update dependencies: `npm outdated`
- Backup database (Supabase auto-backups)

### Quarterly
- Rotate JWT secrets
- Review and archive old audit logs
- Performance audit

## Support

For deployment issues:
- Render: https://render.com/docs
- Vercel: https://vercel.com/docs
- Supabase: https://supabase.com/docs
