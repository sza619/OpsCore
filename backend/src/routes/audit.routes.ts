import { Router } from 'express';
import { AuditController } from '../controllers/audit.controller.js';
import { authenticate } from '../middleware/auth.middleware.js';
import { requirePermission } from '../middleware/permission.middleware.js';

const router = Router();
const auditController = new AuditController();

router.use(authenticate);

router.get('/', requirePermission('logs:read'), auditController.getAuditLogs.bind(auditController));
router.get('/recent', requirePermission('logs:read'), auditController.getRecentLogs.bind(auditController));

export default router;
