import { prisma } from '../utils/db.js';

export class PermissionRepository {
  async findAll() {
    return prisma.permission.findMany({
      orderBy: [{ category: 'asc' }, { name: 'asc' }],
    });
  }

  async findById(id: string) {
    return prisma.permission.findUnique({
      where: { id },
    });
  }

  async findByName(name: string) {
    return prisma.permission.findUnique({
      where: { name },
    });
  }

  async getUserPermissions(userId: string): Promise<string[]> {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        userRoles: {
          include: {
            role: {
              include: {
                rolePermissions: {
                  include: {
                    permission: true,
                  },
                },
              },
            },
          },
        },
      },
    });

    if (!user) return [];

    const permissions = new Set<string>();
    user.userRoles.forEach((userRole) => {
      userRole.role.rolePermissions.forEach((rolePermission) => {
        permissions.add(rolePermission.permission.name);
      });
    });

    return Array.from(permissions);
  }
}
