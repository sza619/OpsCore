import { Request, Response, NextFunction } from 'express';
import { AnalyticsRepository } from '../repositories/analytics.repository.js';

const analyticsRepository = new AnalyticsRepository();

export const requestLogger = async (req: Request, res: Response, next: NextFunction) => {
  const startTime = Date.now();

  res.on('finish', async () => {
    const duration = Date.now() - startTime;

    try {
      await analyticsRepository.logRequest({
        endpoint: req.path,
        method: req.method,
        statusCode: res.statusCode,
        duration,
      });
    } catch (error) {
      console.error('Failed to log request:', error);
    }
  });

  next();
};
