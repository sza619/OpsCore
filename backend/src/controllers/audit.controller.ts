import { Response, NextFunction } from 'express';
import { AuthRequest } from '../middleware/auth.middleware.js';
import { AuditRepository } from '../repositories/audit.repository.js';

const auditRepository = new AuditRepository();

export class AuditController {
  async getAuditLogs(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 50;
      const search = req.query.search as string;

      const skip = (page - 1) * limit;
      const result = await auditRepository.findAll(skip, limit, search);

      res.json({
        status: 'success',
        data: result,
      });
    } catch (error) {
      next(error);
    }
  }

  async getRecentLogs(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const limit = parseInt(req.query.limit as string) || 100;
      const logs = await auditRepository.getRecentLogs(limit);

      res.json({
        status: 'success',
        data: logs,
      });
    } catch (error) {
      next(error);
    }
  }
}
