import { prisma } from '../utils/db.js';

export class AnalyticsRepository {
  async getRequestsByEndpoint() {
    return prisma.requestLog.groupBy({
      by: ['endpoint', 'method'],
      _count: {
        _all: true,
      },
      _avg: {
        duration: true,
      },
      orderBy: {
        _count: {
          _all: 'desc',
        },
      },
      take: 20,
    });
  }

  async getRoleDistribution() {
    return prisma.role.findMany({
      include: {
        _count: {
          select: {
            userRoles: true,
          },
        },
      },
    });
  }

  async getUserActivitySummary() {
    const [totalUsers, activeUsers, recentLogins] = await Promise.all([
      prisma.user.count(),
      prisma.user.count({
        where: {
          lastLoginAt: {
            gte: new Date(Date.now() - 24 * 60 * 60 * 1000),
          },
        },
      }),
      prisma.user.count({
        where: {
          lastLoginAt: {
            gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
          },
        },
      }),
    ]);

    return { totalUsers, activeUsers, recentLogins };
  }

  async getSystemStats() {
    const [totalLogs, totalRequests, avgResponseTime] = await Promise.all([
      prisma.auditLog.count(),
      prisma.requestLog.count(),
      prisma.requestLog.aggregate({
        _avg: {
          duration: true,
        },
      }),
    ]);

    return {
      totalLogs,
      totalRequests,
      avgResponseTime: avgResponseTime._avg.duration || 0,
    };
  }

  async logRequest(data: {
    endpoint: string;
    method: string;
    statusCode: number;
    duration: number;
  }) {
    return prisma.requestLog.create({
      data,
    });
  }
}
