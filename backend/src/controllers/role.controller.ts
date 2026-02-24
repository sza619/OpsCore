import { Response, NextFunction } from 'express';
import { AuthRequest } from '../middleware/auth.middleware.js';
import { RoleService } from '../services/role.service.js';
import { createRoleSchema, updateRoleSchema } from '../utils/validation.js';

const roleService = new RoleService();

export class RoleController {
  async getRoles(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const roles = await roleService.getRoles();

      res.json({
        status: 'success',
        data: roles,
      });
    } catch (error) {
      next(error);
    }
  }

  async getRoleById(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const role = await roleService.getRoleById(req.params.id);

      res.json({
        status: 'success',
        data: role,
      });
    } catch (error) {
      next(error);
    }
  }

  async createRole(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const validatedData = createRoleSchema.parse(req.body);
      const role = await roleService.createRole(
        validatedData,
        req.user!.userId,
        req.ip
      );

      res.status(201).json({
        status: 'success',
        data: role,
      });
    } catch (error) {
      next(error);
    }
  }

  async updateRole(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const validatedData = updateRoleSchema.parse(req.body);
      const role = await roleService.updateRole(
        req.params.id,
        validatedData,
        req.user!.userId,
        req.ip
      );

      res.json({
        status: 'success',
        data: role,
      });
    } catch (error) {
      next(error);
    }
  }

  async deleteRole(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      await roleService.deleteRole(req.params.id, req.user!.userId, req.ip);

      res.json({
        status: 'success',
        message: 'Role deleted successfully',
      });
    } catch (error) {
      next(error);
    }
  }

  async getPermissions(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const permissions = await roleService.getPermissions();

      res.json({
        status: 'success',
        data: permissions,
      });
    } catch (error) {
      next(error);
    }
  }
}
