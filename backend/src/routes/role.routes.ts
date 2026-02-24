import { Router } from 'express';
import { RoleController } from '../controllers/role.controller.js';
import { authenticate } from '../middleware/auth.middleware.js';
import { requirePermission } from '../middleware/permission.middleware.js';

const router = Router();
const roleController = new RoleController();

router.use(authenticate);

router.get('/permissions', requirePermission('roles:read'), roleController.getPermissions.bind(roleController));
router.get('/', requirePermission('roles:read'), roleController.getRoles.bind(roleController));
router.get('/:id', requirePermission('roles:read'), roleController.getRoleById.bind(roleController));
router.post('/', requirePermission('roles:manage'), roleController.createRole.bind(roleController));
router.put('/:id', requirePermission('roles:manage'), roleController.updateRole.bind(roleController));
router.delete('/:id', requirePermission('roles:manage'), roleController.deleteRole.bind(roleController));

export default router;
