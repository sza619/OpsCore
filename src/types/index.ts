export interface User {
  id: string;
  email: string;
  name: string;
  roles: Role[];
  permissions: string[];
  createdAt?: string;
  lastLoginAt?: string;
}

export interface Role {
  id: string;
  name: string;
  description?: string;
  rolePermissions?: RolePermission[];
  _count?: {
    userRoles: number;
  };
}

export interface Permission {
  id: string;
  name: string;
  description?: string;
  category: string;
}

export interface RolePermission {
  id: string;
  permission: Permission;
}

export interface AuditLog {
  id: string;
  userId?: string;
  action: string;
  resource: string;
  details?: string;
  ipAddress?: string;
  status: string;
  createdAt: string;
  user?: {
    id: string;
    email: string;
    name: string;
  };
}

export interface SystemAlert {
  id: number;
  message: string;
  severity: 'info' | 'warning' | 'error';
  timestamp: Date;
}
