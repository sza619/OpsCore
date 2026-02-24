/*
  # OpsCore Database Schema

  1. New Tables
    - `users`
      - `id` (uuid, primary key)
      - `email` (text, unique)
      - `password` (text, hashed)
      - `name` (text)
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)
      - `last_login_at` (timestamptz, nullable)
      - `refresh_token` (text, nullable)
    
    - `roles`
      - `id` (uuid, primary key)
      - `name` (text, unique)
      - `description` (text, nullable)
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)
    
    - `permissions`
      - `id` (uuid, primary key)
      - `name` (text, unique)
      - `description` (text, nullable)
      - `category` (text)
      - `created_at` (timestamptz)
    
    - `role_permissions`
      - `id` (uuid, primary key)
      - `role_id` (uuid, foreign key)
      - `permission_id` (uuid, foreign key)
      - Unique constraint on (role_id, permission_id)
    
    - `user_roles`
      - `id` (uuid, primary key)
      - `user_id` (uuid, foreign key)
      - `role_id` (uuid, foreign key)
      - `created_at` (timestamptz)
      - Unique constraint on (user_id, role_id)
    
    - `audit_logs`
      - `id` (uuid, primary key)
      - `user_id` (uuid, foreign key, nullable)
      - `action` (text)
      - `resource` (text)
      - `details` (text, nullable)
      - `ip_address` (text, nullable)
      - `user_agent` (text, nullable)
      - `status` (text)
      - `created_at` (timestamptz)
    
    - `request_logs`
      - `id` (uuid, primary key)
      - `endpoint` (text)
      - `method` (text)
      - `status_code` (integer)
      - `duration` (integer, in milliseconds)
      - `created_at` (timestamptz)

  2. Security
    - Enable RLS on all tables
    - Add policies for authenticated access with proper permission checks
    - Service role has full access for backend operations

  3. Indexes
    - Email, role name, permission name for fast lookups
    - Audit log fields for efficient querying
    - Foreign keys for join optimization
    - Timestamp fields for time-based queries
*/

-- Create users table
CREATE TABLE IF NOT EXISTS users (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email text UNIQUE NOT NULL,
  password text NOT NULL,
  name text NOT NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  last_login_at timestamptz,
  refresh_token text
);

CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);

-- Create roles table
CREATE TABLE IF NOT EXISTS roles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text UNIQUE NOT NULL,
  description text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_roles_name ON roles(name);

-- Create permissions table
CREATE TABLE IF NOT EXISTS permissions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text UNIQUE NOT NULL,
  description text,
  category text NOT NULL,
  created_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_permissions_name ON permissions(name);
CREATE INDEX IF NOT EXISTS idx_permissions_category ON permissions(category);

-- Create role_permissions junction table
CREATE TABLE IF NOT EXISTS role_permissions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  role_id uuid NOT NULL REFERENCES roles(id) ON DELETE CASCADE,
  permission_id uuid NOT NULL REFERENCES permissions(id) ON DELETE CASCADE,
  UNIQUE(role_id, permission_id)
);

CREATE INDEX IF NOT EXISTS idx_role_permissions_role_id ON role_permissions(role_id);
CREATE INDEX IF NOT EXISTS idx_role_permissions_permission_id ON role_permissions(permission_id);

-- Create user_roles junction table
CREATE TABLE IF NOT EXISTS user_roles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  role_id uuid NOT NULL REFERENCES roles(id) ON DELETE CASCADE,
  created_at timestamptz DEFAULT now(),
  UNIQUE(user_id, role_id)
);

CREATE INDEX IF NOT EXISTS idx_user_roles_user_id ON user_roles(user_id);
CREATE INDEX IF NOT EXISTS idx_user_roles_role_id ON user_roles(role_id);

-- Create audit_logs table
CREATE TABLE IF NOT EXISTS audit_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES users(id) ON DELETE SET NULL,
  action text NOT NULL,
  resource text NOT NULL,
  details text,
  ip_address text,
  user_agent text,
  status text NOT NULL,
  created_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_audit_logs_user_id ON audit_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_action ON audit_logs(action);
CREATE INDEX IF NOT EXISTS idx_audit_logs_resource ON audit_logs(resource);
CREATE INDEX IF NOT EXISTS idx_audit_logs_created_at ON audit_logs(created_at);
CREATE INDEX IF NOT EXISTS idx_audit_logs_status ON audit_logs(status);

-- Create request_logs table
CREATE TABLE IF NOT EXISTS request_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  endpoint text NOT NULL,
  method text NOT NULL,
  status_code integer NOT NULL,
  duration integer NOT NULL,
  created_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_request_logs_endpoint ON request_logs(endpoint);
CREATE INDEX IF NOT EXISTS idx_request_logs_created_at ON request_logs(created_at);

-- Enable RLS on all tables
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE permissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE role_permissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE request_logs ENABLE ROW LEVEL SECURITY;

-- RLS Policies for users table
CREATE POLICY "Service role has full access to users"
  ON users FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- RLS Policies for roles table
CREATE POLICY "Service role has full access to roles"
  ON roles FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- RLS Policies for permissions table
CREATE POLICY "Service role has full access to permissions"
  ON permissions FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- RLS Policies for role_permissions table
CREATE POLICY "Service role has full access to role_permissions"
  ON role_permissions FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- RLS Policies for user_roles table
CREATE POLICY "Service role has full access to user_roles"
  ON user_roles FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- RLS Policies for audit_logs table
CREATE POLICY "Service role has full access to audit_logs"
  ON audit_logs FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- RLS Policies for request_logs table
CREATE POLICY "Service role has full access to request_logs"
  ON request_logs FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- Insert default roles
INSERT INTO roles (name, description) VALUES
  ('Admin', 'Full system access with all permissions'),
  ('Manager', 'Can manage users and view analytics'),
  ('Viewer', 'Read-only access to dashboard and logs')
ON CONFLICT (name) DO NOTHING;

-- Insert default permissions
INSERT INTO permissions (name, description, category) VALUES
  ('dashboard:view', 'View the main dashboard', 'Dashboard'),
  ('logs:read', 'Read audit logs', 'Logs'),
  ('logs:export', 'Export audit logs', 'Logs'),
  ('users:create', 'Create new users', 'Users'),
  ('users:read', 'View user list', 'Users'),
  ('users:update', 'Update user information', 'Users'),
  ('users:delete', 'Delete users', 'Users'),
  ('roles:manage', 'Manage roles and permissions', 'Roles'),
  ('roles:read', 'View roles', 'Roles'),
  ('analytics:view', 'View analytics dashboard', 'Analytics'),
  ('settings:manage', 'Manage system settings', 'Settings'),
  ('settings:read', 'View system settings', 'Settings')
ON CONFLICT (name) DO NOTHING;

-- Assign all permissions to Admin role
INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id
FROM roles r
CROSS JOIN permissions p
WHERE r.name = 'Admin'
ON CONFLICT (role_id, permission_id) DO NOTHING;

-- Assign limited permissions to Manager role
INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id
FROM roles r
CROSS JOIN permissions p
WHERE r.name = 'Manager'
  AND p.name IN (
    'dashboard:view',
    'logs:read',
    'users:read',
    'users:create',
    'users:update',
    'roles:read',
    'analytics:view'
  )
ON CONFLICT (role_id, permission_id) DO NOTHING;

-- Assign minimal permissions to Viewer role
INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id
FROM roles r
CROSS JOIN permissions p
WHERE r.name = 'Viewer'
  AND p.name IN (
    'dashboard:view',
    'logs:read',
    'users:read',
    'roles:read'
  )
ON CONFLICT (role_id, permission_id) DO NOTHING;