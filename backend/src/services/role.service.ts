import { RoleRepository } from '../repositories/role.repository.js';
import { PermissionRepository } from '../repositories/permission.repository.js';
import { AuditRepository } from '../repositories/audit.repository.js';
import { ValidationError, NotFoundError } from '../utils/errors.js';

export class RoleService {
  private roleRepository = new RoleRepository();
  private permissionRepository = new PermissionRepository();
  private auditRepository = new AuditRepository();

  async getRoles() {
    return this.roleRepository.findAll();
  }

  async getRoleById(id: string) {
    const role = await this.roleRepository.findById(id);
    if (!role) {
      throw new NotFoundError('Role not found');
    }
    return role;
  }

  async createRole(
    data: { name: string; description?: string; permissionIds?: string[] },
    creatorId: string,
    ipAddress?: string
  ) {
    const existingRole = await this.roleRepository.findByName(data.name);
    if (existingRole) {
      throw new ValidationError('Role name already exists');
    }

    const role = await this.roleRepository.create({
      name: data.name,
      description: data.description,
    });

    if (data.permissionIds && data.permissionIds.length > 0) {
      await this.roleRepository.assignPermissions(role.id, data.permissionIds);
    }

    await this.auditRepository.create({
      userId: creatorId,
      action: 'role:create',
      resource: 'roles',
      details: `Created role ${role.name}`,
      ipAddress,
      status: 'success',
    });

    return this.getRoleById(role.id);
  }

  async updateRole(
    id: string,
    data: { name?: string; description?: string; permissionIds?: string[] },
    updaterId: string,
    ipAddress?: string
  ) {
    const role = await this.roleRepository.findById(id);
    if (!role) {
      throw new NotFoundError('Role not found');
    }

    if (data.name && data.name !== role.name) {
      const existingRole = await this.roleRepository.findByName(data.name);
      if (existingRole) {
        throw new ValidationError('Role name already exists');
      }
    }

    const updateData: { name?: string; description?: string } = {};
    if (data.name) updateData.name = data.name;
    if (data.description !== undefined) updateData.description = data.description;

    await this.roleRepository.update(id, updateData);

    if (data.permissionIds !== undefined) {
      await this.roleRepository.assignPermissions(id, data.permissionIds);
    }

    await this.auditRepository.create({
      userId: updaterId,
      action: 'role:update',
      resource: 'roles',
      details: `Updated role ${role.name}`,
      ipAddress,
      status: 'success',
    });

    return this.getRoleById(id);
  }

  async deleteRole(id: string, deleterId: string, ipAddress?: string) {
    const role = await this.roleRepository.findById(id);
    if (!role) {
      throw new NotFoundError('Role not found');
    }

    if (['Admin', 'Manager', 'Viewer'].includes(role.name)) {
      throw new ValidationError('Cannot delete system roles');
    }

    await this.roleRepository.delete(id);

    await this.auditRepository.create({
      userId: deleterId,
      action: 'role:delete',
      resource: 'roles',
      details: `Deleted role ${role.name}`,
      ipAddress,
      status: 'success',
    });
  }

  async getPermissions() {
    return this.permissionRepository.findAll();
  }
}
