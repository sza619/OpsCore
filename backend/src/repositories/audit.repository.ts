import { prisma } from '../utils/db.js';

export class AuditRepository {
  async create(data: {
    userId?: string;
    action: string;
    resource: string;
    details?: string;
    ipAddress?: string;
    userAgent?: string;
    status: string;
  }) {
    return prisma.auditLog.create({
      data,
    });
  }

  async findAll(skip: number = 0, take: number = 50, search?: string) {
    const where = search
      ? {
          OR: [
            { action: { contains: search, mode: 'insensitive' as const } },
            { resource: { contains: search, mode: 'insensitive' as const } },
            { details: { contains: search, mode: 'insensitive' as const } },
          ],
        }
      : {};

    const [logs, total] = await Promise.all([
      prisma.auditLog.findMany({
        where,
        skip,
        take,
        include: {
          user: {
            select: {
              id: true,
              email: true,
              name: true,
            },
          },
        },
        orderBy: { createdAt: 'desc' },
      }),
      prisma.auditLog.count({ where }),
    ]);

    return { logs, total };
  }

  async getRecentLogs(limit: number = 100) {
    return prisma.auditLog.findMany({
      take: limit,
      include: {
        user: {
          select: {
            id: true,
            email: true,
            name: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }
}
