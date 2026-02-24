import { Response, NextFunction } from 'express';
import { AuthRequest } from '../middleware/auth.middleware.js';
import { UserService } from '../services/user.service.js';
import { createUserSchema, updateUserSchema } from '../utils/validation.js';

const userService = new UserService();

export class UserController {
  async getUsers(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 50;

      const result = await userService.getUsers(page, limit);

      res.json({
        status: 'success',
        data: result,
      });
    } catch (error) {
      next(error);
    }
  }

  async getUserById(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const user = await userService.getUserById(req.params.id);

      res.json({
        status: 'success',
        data: user,
      });
    } catch (error) {
      next(error);
    }
  }

  async createUser(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const validatedData = createUserSchema.parse(req.body);
      const user = await userService.createUser(
        validatedData,
        req.user!.userId,
        req.ip
      );

      res.status(201).json({
        status: 'success',
        data: user,
      });
    } catch (error) {
      next(error);
    }
  }

  async updateUser(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const validatedData = updateUserSchema.parse(req.body);
      const user = await userService.updateUser(
        req.params.id,
        validatedData,
        req.user!.userId,
        req.ip
      );

      res.json({
        status: 'success',
        data: user,
      });
    } catch (error) {
      next(error);
    }
  }

  async deleteUser(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      await userService.deleteUser(req.params.id, req.user!.userId, req.ip);

      res.json({
        status: 'success',
        message: 'User deleted successfully',
      });
    } catch (error) {
      next(error);
    }
  }
}
