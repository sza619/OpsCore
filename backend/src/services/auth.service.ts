import bcrypt from 'bcrypt';
import { UserRepository } from '../repositories/user.repository.js';
import { AuditRepository } from '../repositories/audit.repository.js';
import { RoleRepository } from '../repositories/role.repository.js';
import { generateAccessToken, generateRefreshToken, verifyRefreshToken } from '../utils/jwt.js';
import { UnauthorizedError, ValidationError } from '../utils/errors.js';

export class AuthService {
  private userRepository = new UserRepository();
  private auditRepository = new AuditRepository();
  private roleRepository = new RoleRepository();

  async register(data: { email: string; password: string; name: string }, ipAddress?: string) {
    const existingUser = await this.userRepository.findByEmail(data.email);
    if (existingUser) {
      throw new ValidationError('Email already exists');
    }

    const hashedPassword = await bcrypt.hash(data.password, 10);
    const user = await this.userRepository.create({
      ...data,
      password: hashedPassword,
    });

    const viewerRole = await this.roleRepository.findByName('Viewer');
    if (viewerRole) {
      await this.userRepository.assignRoles(user.id, [viewerRole.id]);
    }

    await this.auditRepository.create({
      userId: user.id,
      action: 'user:register',
      resource: 'auth',
      details: `User ${user.email} registered`,
      ipAddress,
      status: 'success',
    });

    const userWithRoles = await this.userRepository.findById(user.id);
    const accessToken = generateAccessToken({ userId: user.id, email: user.email });
    const refreshToken = generateRefreshToken({ userId: user.id, email: user.email });

    await this.userRepository.updateRefreshToken(user.id, refreshToken);

    return {
      user: this.sanitizeUser(userWithRoles!),
      accessToken,
      refreshToken,
    };
  }

  async login(email: string, password: string, ipAddress?: string, userAgent?: string) {
    const user = await this.userRepository.findByEmail(email);
    if (!user) {
      await this.auditRepository.create({
        action: 'user:login',
        resource: 'auth',
        details: `Failed login attempt for ${email}`,
        ipAddress,
        userAgent,
        status: 'failure',
      });
      throw new UnauthorizedError('Invalid credentials');
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      await this.auditRepository.create({
        userId: user.id,
        action: 'user:login',
        resource: 'auth',
        details: `Invalid password for ${email}`,
        ipAddress,
        userAgent,
        status: 'failure',
      });
      throw new UnauthorizedError('Invalid credentials');
    }

    await this.userRepository.updateLastLogin(user.id);

    const accessToken = generateAccessToken({ userId: user.id, email: user.email });
    const refreshToken = generateRefreshToken({ userId: user.id, email: user.email });

    await this.userRepository.updateRefreshToken(user.id, refreshToken);

    await this.auditRepository.create({
      userId: user.id,
      action: 'user:login',
      resource: 'auth',
      details: `User ${email} logged in`,
      ipAddress,
      userAgent,
      status: 'success',
    });

    return {
      user: this.sanitizeUser(user),
      accessToken,
      refreshToken,
    };
  }

  async refreshTokens(token: string) {
    try {
      const payload = verifyRefreshToken(token);
      const user = await this.userRepository.findById(payload.userId);

      if (!user || user.refreshToken !== token) {
        throw new UnauthorizedError('Invalid refresh token');
      }

      const accessToken = generateAccessToken({ userId: user.id, email: user.email });
      const refreshToken = generateRefreshToken({ userId: user.id, email: user.email });

      await this.userRepository.updateRefreshToken(user.id, refreshToken);

      return {
        user: this.sanitizeUser(user),
        accessToken,
        refreshToken,
      };
    } catch (error) {
      throw new UnauthorizedError('Invalid refresh token');
    }
  }

  async logout(userId: string, ipAddress?: string) {
    await this.userRepository.updateRefreshToken(userId, null);
    await this.auditRepository.create({
      userId,
      action: 'user:logout',
      resource: 'auth',
      details: 'User logged out',
      ipAddress,
      status: 'success',
    });
  }

  private sanitizeUser(user: any) {
    const permissions = new Set<string>();
    user.userRoles?.forEach((userRole: any) => {
      userRole.role.rolePermissions?.forEach((rolePermission: any) => {
        permissions.add(rolePermission.permission.name);
      });
    });

    return {
      id: user.id,
      email: user.email,
      name: user.name,
      roles: user.userRoles?.map((ur: any) => ({
        id: ur.role.id,
        name: ur.role.name,
      })) || [],
      permissions: Array.from(permissions),
    };
  }
}
