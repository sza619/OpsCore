import bcrypt from 'bcrypt';
import { UserRepository } from '../repositories/user.repository.js';
import { AuditRepository } from '../repositories/audit.repository.js';
import { ValidationError, NotFoundError } from '../utils/errors.js';

export class UserService {
  private userRepository = new UserRepository();
  private auditRepository = new AuditRepository();

  async getUsers(page: number = 1, limit: number = 50) {
    const skip = (page - 1) * limit;
    return this.userRepository.findAll(skip, limit);
  }

  async getUserById(id: string) {
    const user = await this.userRepository.findById(id);
    if (!user) {
      throw new NotFoundError('User not found');
    }
    return this.sanitizeUser(user);
  }

  async createUser(
    data: { email: string; password: string; name: string; roleIds?: string[] },
    creatorId: string,
    ipAddress?: string
  ) {
    const existingUser = await this.userRepository.findByEmail(data.email);
    if (existingUser) {
      throw new ValidationError('Email already exists');
    }

    const hashedPassword = await bcrypt.hash(data.password, 10);
    const user = await this.userRepository.create({
      email: data.email,
      password: hashedPassword,
      name: data.name,
    });

    if (data.roleIds && data.roleIds.length > 0) {
      await this.userRepository.assignRoles(user.id, data.roleIds);
    }

    await this.auditRepository.create({
      userId: creatorId,
      action: 'user:create',
      resource: 'users',
      details: `Created user ${user.email}`,
      ipAddress,
      status: 'success',
    });

    return this.getUserById(user.id);
  }

  async updateUser(
    id: string,
    data: { email?: string; name?: string; roleIds?: string[] },
    updaterId: string,
    ipAddress?: string
  ) {
    const user = await this.userRepository.findById(id);
    if (!user) {
      throw new NotFoundError('User not found');
    }

    if (data.email && data.email !== user.email) {
      const existingUser = await this.userRepository.findByEmail(data.email);
      if (existingUser) {
        throw new ValidationError('Email already exists');
      }
    }

    const updateData: { email?: string; name?: string } = {};
    if (data.email) updateData.email = data.email;
    if (data.name) updateData.name = data.name;

    await this.userRepository.update(id, updateData);

    if (data.roleIds !== undefined) {
      await this.userRepository.assignRoles(id, data.roleIds);
    }

    await this.auditRepository.create({
      userId: updaterId,
      action: 'user:update',
      resource: 'users',
      details: `Updated user ${user.email}`,
      ipAddress,
      status: 'success',
    });

    return this.getUserById(id);
  }

  async deleteUser(id: string, deleterId: string, ipAddress?: string) {
    const user = await this.userRepository.findById(id);
    if (!user) {
      throw new NotFoundError('User not found');
    }

    await this.userRepository.delete(id);

    await this.auditRepository.create({
      userId: deleterId,
      action: 'user:delete',
      resource: 'users',
      details: `Deleted user ${user.email}`,
      ipAddress,
      status: 'success',
    });
  }

  private sanitizeUser(user: any) {
    return {
      id: user.id,
      email: user.email,
      name: user.name,
      createdAt: user.createdAt,
      lastLoginAt: user.lastLoginAt,
      roles: user.userRoles?.map((ur: any) => ({
        id: ur.role.id,
        name: ur.role.name,
      })) || [],
    };
  }
}
