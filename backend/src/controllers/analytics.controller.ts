import { Response, NextFunction } from 'express';
import { AuthRequest } from '../middleware/auth.middleware.js';
import { AnalyticsRepository } from '../repositories/analytics.repository.js';

const analyticsRepository = new AnalyticsRepository();

export class AnalyticsController {
  async getRequestsByEndpoint(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const data = await analyticsRepository.getRequestsByEndpoint();

      res.json({
        status: 'success',
        data,
      });
    } catch (error) {
      next(error);
    }
  }

  async getRoleDistribution(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const data = await analyticsRepository.getRoleDistribution();

      res.json({
        status: 'success',
        data,
      });
    } catch (error) {
      next(error);
    }
  }

  async getUserActivitySummary(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const data = await analyticsRepository.getUserActivitySummary();

      res.json({
        status: 'success',
        data,
      });
    } catch (error) {
      next(error);
    }
  }

  async getSystemStats(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const data = await analyticsRepository.getSystemStats();

      res.json({
        status: 'success',
        data,
      });
    } catch (error) {
      next(error);
    }
  }

  async getDashboardData(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const [userActivity, systemStats, roleDistribution] = await Promise.all([
        analyticsRepository.getUserActivitySummary(),
        analyticsRepository.getSystemStats(),
        analyticsRepository.getRoleDistribution(),
      ]);

      res.json({
        status: 'success',
        data: {
          userActivity,
          systemStats,
          roleDistribution,
        },
      });
    } catch (error) {
      next(error);
    }
  }
}
