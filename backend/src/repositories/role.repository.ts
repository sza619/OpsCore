import { prisma } from '../utils/db.js';

export class RoleRepository {
  async findAll() {
    return prisma.role.findMany({
      include: {
        rolePermissions: {
          include: {
            permission: true,
          },
        },
        _count: {
          select: {
            userRoles: true,
          },
        },
      },
      orderBy: { name: 'asc' },
    });
  }

  async findById(id: string) {
    return prisma.role.findUnique({
      where: { id },
      include: {
        rolePermissions: {
          include: {
            permission: true,
          },
        },
      },
    });
  }

  async findByName(name: string) {
    return prisma.role.findUnique({
      where: { name },
    });
  }

  async create(data: { name: string; description?: string }) {
    return prisma.role.create({
      data,
    });
  }

  async update(id: string, data: { name?: string; description?: string }) {
    return prisma.role.update({
      where: { id },
      data,
    });
  }

  async delete(id: string) {
    return prisma.role.delete({
      where: { id },
    });
  }

  async assignPermissions(roleId: string, permissionIds: string[]) {
    await prisma.rolePermission.deleteMany({
      where: { roleId },
    });

    if (permissionIds.length > 0) {
      await prisma.rolePermission.createMany({
        data: permissionIds.map((permissionId) => ({ roleId, permissionId })),
      });
    }
  }
}
