import { Router, Response } from 'express';
import { db } from '../db.js';
import { authenticateToken, requireAdmin, AuthenticatedRequest } from '../auth.js';

const router = Router();

// Apply auth and admin check to all admin routes
router.use(authenticateToken);
router.use(requireAdmin);

/**
 * GET /api/admin/statistics
 * Aggregate real-time operational security metrics
 */
router.get('/statistics', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const allRequests = await db.getRequests();
    const activeSessions = await db.getActiveAccess();
    const auditLogs = await db.getAuditLogs();
    const users = await db.getUsers();

    const pendingRequests = allRequests.filter(r => r.status === 'PENDING').length;
    const activeSessionsCount = activeSessions.length;
    const highRiskRequests = allRequests.filter(r => r.risk_level === 'HIGH' || r.risk_level === 'CRITICAL').length;
    const emergencySessions = activeSessions.filter(a => a.access_type === 'EMERGENCY').length;
    const expiredSessions = allRequests.filter(r => r.status === 'EXPIRED').length;

    // Today's access events (audit logs from last 24h)
    const oneDayAgo = new Date(Date.now() - 24 * 3600000);
    const todayAccessEvents = auditLogs.filter(a => new Date(a.timestamp) >= oneDayAgo).length;

    res.json({
      pendingRequests,
      activeSessions: activeSessionsCount,
      highRiskRequests,
      emergencySessions,
      todayAccessEvents,
      expiredSessions,
      totalRequests: allRequests.length,
      totalUsers: users.length,
      activeUsers: users.filter(u => u.status === 'ACTIVE').length,
    });
  } catch (err) {
    res.status(500).json({ error: 'SERVER_ERROR', message: 'Failed to compute administrative statistics.' });
  }
});

/**
 * GET /api/admin/users
 * List all provisioned users
 */
router.get('/users', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const users = await db.getUsers();
    const sanitized = users.map(u => ({
      id: u.id,
      name: u.name,
      email: u.email,
      role: u.role,
      department: u.department,
      status: u.status,
      created_at: u.created_at,
      last_login_at: u.last_login_at,
    }));
    res.json({ users: sanitized });
  } catch (err) {
    res.status(500).json({ error: 'SERVER_ERROR', message: 'Failed to retrieve user accounts.' });
  }
});

/**
 * POST /api/admin/users/:id/toggle-status
 * Enable or disable a user account
 */
router.post('/users/:id/toggle-status', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { id } = req.params;
    const clientIp = req.ip || req.socket.remoteAddress || '127.0.0.1';

    const targetUser = await db.getUserById(id);
    if (!targetUser) {
      res.status(404).json({ error: 'NOT_FOUND', message: 'User account not found.' });
      return;
    }

    // Safety: Protect primary admin and self
    if (targetUser.id === 'USR-001') {
      res.status(400).json({
        error: 'RESTRICTED_ACTION',
        message: 'Primary Root Security Administrator account cannot be disabled.'
      });
      return;
    }

    if (targetUser.id === req.user!.id) {
      res.status(400).json({
        error: 'RESTRICTED_ACTION',
        message: 'You cannot disable your own active administrative session.'
      });
      return;
    }

    const nextStatus = targetUser.status === 'ACTIVE' ? 'DISABLED' : 'ACTIVE';
    const updated = await db.updateUserStatus(id, nextStatus);

    await db.createAuditLog({
      user_id: req.user!.id,
      user_name: req.user!.name,
      user_email: req.user!.email,
      action: 'USER_STATUS_TOGGLED',
      details: `Administrator ${req.user!.name} changed account status of ${targetUser.email} to ${nextStatus}.`,
      ip_address: clientIp,
    });

    res.json({
      success: true,
      message: `User account is now ${nextStatus}.`,
      user: {
        id: updated!.id,
        name: updated!.name,
        email: updated!.email,
        role: updated!.role,
        status: updated!.status,
      }
    });
  } catch (err) {
    res.status(500).json({ error: 'SERVER_ERROR', message: 'Failed to update user status.' });
  }
});

/**
 * GET /api/admin/security-monitor
 * Application-level security posture & elevated risks
 */
router.get('/security-monitor', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const allRequests = await db.getRequests();
    const activeSessions = await db.getActiveAccess();
    const auditLogs = await db.getAuditLogs();

    const highRiskRequests = allRequests.filter(r => r.risk_level === 'HIGH' || r.risk_level === 'CRITICAL');
    const emergencyRequests = allRequests.filter(r => r.is_emergency);
    const longDurationRequests = allRequests.filter(r => r.duration_minutes >= 120);
    const adminRoleRequests = allRequests.filter(r => r.role === 'Administrator');
    const ownerRoleRequests = allRequests.filter(r => r.role === 'Owner');
    const failedLogins = auditLogs.filter(a => a.action === 'LOGIN_FAILED');

    res.json({
      highRiskRequests,
      emergencyRequests,
      longDurationRequests,
      adminRoleRequests,
      ownerRoleRequests,
      failedLogins,
      activeSessions,
      metrics: {
        totalHighRisk: highRiskRequests.length,
        totalEmergency: emergencyRequests.length,
        totalLongDuration: longDurationRequests.length,
        totalOwnerRequests: ownerRoleRequests.length,
        failedLoginCount: failedLogins.length,
      }
    });
  } catch (err) {
    res.status(500).json({ error: 'SERVER_ERROR', message: 'Failed to fetch security monitoring data.' });
  }
});

/**
 * GET /api/admin/emergency-requests
 */
router.get('/emergency-requests', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const requests = await db.getRequests({ isEmergency: true });
    const policy = db.getPolicy();
    res.json({ requests, policy });
  } catch (err) {
    res.status(500).json({ error: 'SERVER_ERROR', message: 'Failed to retrieve emergency requests.' });
  }
});

/**
 * GET /api/admin/policy
 */
router.get('/policy', async (req: AuthenticatedRequest, res: Response) => {
  res.json({ policy: db.getPolicy() });
});

/**
 * PUT /api/admin/policy
 */
router.put('/policy', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { emergencyAccessMode, maxJitDurationMinutes, requireTicketNumber } = req.body;
    const clientIp = req.ip || req.socket.remoteAddress || '127.0.0.1';

    const updated = db.updatePolicy({
      emergencyAccessMode,
      maxJitDurationMinutes,
      requireTicketNumber,
    });

    await db.createAuditLog({
      user_id: req.user!.id,
      user_name: req.user!.name,
      user_email: req.user!.email,
      action: 'POLICY_UPDATED',
      details: `Administrator ${req.user!.name} updated system emergency policy to ${emergencyAccessMode}.`,
      ip_address: clientIp,
    });

    res.json({ success: true, policy: updated });
  } catch (err) {
    res.status(500).json({ error: 'SERVER_ERROR', message: 'Failed to update system policy.' });
  }
});

export default router;
