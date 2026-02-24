import { Response, NextFunction } from 'express';
import { AuthRequest } from './auth.middleware.js';
import { PermissionRepository } from '../repositories/permission.repository.js';
import { AuditRepository } from '../repositories/audit.repository.js';
import { ForbiddenError } from '../utils/errors.js';

const permissionRepository = new PermissionRepository();
const auditRepository = new AuditRepository();

export const requirePermission = (permissionName: string) => {
  return async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      if (!req.user) {
        throw new ForbiddenError('Authentication required');
      }

      const userPermissions = await permissionRepository.getUserPermissions(req.user.userId);

      if (!userPermissions.includes(permissionName)) {
        await auditRepository.create({
          userId: req.user.userId,
          action: 'permission:denied',
          resource: permissionName,
          details: `User attempted to access ${permissionName} without permission`,
          ipAddress: req.ip,
          userAgent: req.headers['user-agent'],
          status: 'failure',
        });

        throw new ForbiddenError('Insufficient permissions');
      }

      next();
    } catch (error) {
      next(error);
    }
  };
};
