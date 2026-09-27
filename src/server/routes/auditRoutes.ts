import { Router, Response } from 'express';
import { db } from '../db.js';
import { authenticateToken, AuthenticatedRequest } from '../auth.js';

const router = Router();

/**
 * GET /api/audit-logs
 * Query immutable audit trail
 */
router.get('/', authenticateToken, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { action, search, userEmail } = req.query;

    // Normal users only see their own audit records; admins can inspect all audit logs
    const emailFilter = req.user!.role === 'ADMIN'
      ? (userEmail as string)
      : req.user!.email;

    const logs = await db.getAuditLogs({
      action: action as string,
      search: search as string,
      userEmail: emailFilter,
    });

    res.json({
      total: logs.length,
      logs,
    });
  } catch (err) {
    res.status(500).json({ error: 'SERVER_ERROR', message: 'Failed to retrieve audit trail records.' });
  }
});

export default router;
