import { Router, Response } from 'express';
import { db } from '../db.js';
import { authenticateToken, AuthenticatedRequest } from '../auth.js';
import { azurePimService } from '../services/azurePimService.js';

const router = Router();

/**
 * GET /api/active-access
 * Retrieve active privileged access sessions
 */
router.get('/', authenticateToken, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const isUserAdmin = req.user!.role === 'ADMIN';
    const userIdFilter = isUserAdmin ? undefined : req.user!.id;

    const sessions = await db.getActiveAccess(userIdFilter);

    res.json({ sessions });
  } catch (err) {
    res.status(500).json({ error: 'SERVER_ERROR', message: 'Failed to fetch active access sessions.' });
  }
});

/**
 * POST /api/active-access/:id/revoke
 * Revoke active privileged access session early
 */
router.post('/:id/revoke', authenticateToken, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const clientIp = req.ip || req.socket.remoteAddress || '127.0.0.1';
    const session = await db.getActiveAccessById(req.params.id);

    if (!session) {
      res.status(404).json({ error: 'NOT_FOUND', message: 'Active session not found.' });
      return;
    }

    // Authorization: User can revoke their own access; Admins can revoke anyone's access
    if (req.user!.role !== 'ADMIN' && session.user_id !== req.user!.id) {
      res.status(403).json({ error: 'ACCESS_DENIED', message: 'You are not authorized to revoke this session.' });
      return;
    }

    if (session.status !== 'ACTIVE') {
      res.status(400).json({
        error: 'INVALID_STATE',
        message: `Session is not active (current status: ${session.status}).`
      });
      return;
    }

    // Call Azure PIM Revocation simulation
    await azurePimService.revokePrivilegedAccess({
      requestId: session.request_id,
      userPrincipalName: session.user_email,
      resourceId: session.resource,
      roleDefinitionName: session.role,
      revokedBy: req.user!.name,
    });

    const revokedSession = await db.revokeActiveAccess(session.id, req.user!.name);

    // Audit Log
    await db.createAuditLog({
      user_id: req.user!.id,
      user_name: req.user!.name,
      user_email: req.user!.email,
      action: 'ACCESS_REVOKED',
      resource: session.resource,
      role: session.role,
      details: `Active privileged access ${session.id} on ${session.resource} (${session.role}) revoked by ${req.user!.name}.`,
      ip_address: clientIp,
    });

    // Notify user if revoked by an administrator
    if (req.user!.id !== session.user_id) {
      await db.createNotification({
        user_id: session.user_id,
        title: 'Privileged Access Revoked by Admin',
        message: `Your access on ${session.resource} was revoked early by administrator ${req.user!.name}.`,
        type: 'WARNING',
        request_id: session.request_id,
      });
    }

    res.json({
      success: true,
      message: 'Privileged access revoked successfully.',
      session: revokedSession,
    });
  } catch (err) {
    res.status(500).json({ error: 'SERVER_ERROR', message: 'Failed to revoke access session.' });
  }
});

export default router;
