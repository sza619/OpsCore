import { Router } from 'express';
import { AnalyticsController } from '../controllers/analytics.controller.js';
import { authenticate } from '../middleware/auth.middleware.js';
import { requirePermission } from '../middleware/permission.middleware.js';

const router = Router();
const analyticsController = new AnalyticsController();

router.use(authenticate);
router.use(requirePermission('analytics:view'));

router.get('/dashboard', analyticsController.getDashboardData.bind(analyticsController));
router.get('/requests', analyticsController.getRequestsByEndpoint.bind(analyticsController));
router.get('/roles', analyticsController.getRoleDistribution.bind(analyticsController));
router.get('/users', analyticsController.getUserActivitySummary.bind(analyticsController));
router.get('/stats', analyticsController.getSystemStats.bind(analyticsController));

export default router;
