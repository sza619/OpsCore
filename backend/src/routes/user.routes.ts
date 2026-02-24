import { Router } from 'express';
import { UserController } from '../controllers/user.controller.js';
import { authenticate } from '../middleware/auth.middleware.js';
import { requirePermission } from '../middleware/permission.middleware.js';

const router = Router();
const userController = new UserController();

router.use(authenticate);

router.get('/', requirePermission('users:read'), userController.getUsers.bind(userController));
router.get('/:id', requirePermission('users:read'), userController.getUserById.bind(userController));
router.post('/', requirePermission('users:create'), userController.createUser.bind(userController));
router.put('/:id', requirePermission('users:update'), userController.updateUser.bind(userController));
router.delete('/:id', requirePermission('users:delete'), userController.deleteUser.bind(userController));

export default router;
