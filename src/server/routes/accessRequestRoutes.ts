import { Router, Response } from 'express';
import { db } from '../db.js';
import { authenticateToken, requireAdmin, AuthenticatedRequest } from '../auth.js';
import { evaluateRisk } from '../riskEngine.js';
import { azurePimService } from '../services/azurePimService.js';

const router = Router();

/**
 * POST /api/access-requests
 * Submit a new Just-In-Time access request
 */
router.post('/', authenticateToken, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { resource, role, durationMinutes, reason, ticketId } = req.body;
    const clientIp = req.ip || req.socket.remoteAddress || '127.0.0.1';

    if (!resource || !role || !durationMinutes || !reason) {
      res.status(400).json({
        error: 'VALIDATION_ERROR',
        message: 'Resource, role, duration, and business justification are required fields.'
      });
      return;
    }

    const durationNum = parseInt(durationMinutes, 10);
    if (isNaN(durationNum) || durationNum <= 0 || durationNum > 240) {
      res.status(400).json({
        error: 'INVALID_DURATION',
        message: 'Duration must be a valid duration between 15 and 240 minutes.'
      });
      return;
    }

    if (reason.trim().length < 10) {
      res.status(400).json({
        error: 'INVALID_JUSTIFICATION',
        message: 'Please provide a meaningful business justification (at least 10 characters).'
      });
      return;
    }

    // Evaluate Risk using deterministic security engine
    const risk = evaluateRisk({
      resource,
      role,
      durationMinutes: durationNum,
      isEmergency: false,
    });

    const newRequest = await db.createRequest({
      user_id: req.user!.id,
      user_name: req.user!.name,
      user_email: req.user!.email,
      resource,
      role,
      duration_minutes: durationNum,
      reason: reason.trim(),
      ticket_id: ticketId ? ticketId.trim() : undefined,
      is_emergency: false,
      risk_level: risk.level,
      risk_score: risk.score,
      risk_reasons: risk.reasons,
      status: 'PENDING',
    });

    // Create Audit Log
    await db.createAuditLog({
      user_id: req.user!.id,
      user_name: req.user!.name,
      user_email: req.user!.email,
      action: 'REQUEST_CREATED',
      resource,
      role,
      details: `Submitted access request ${newRequest.id} for ${role} on ${resource} (${durationNum}m). Risk Tier: ${risk.level}. Justification: "${reason.trim()}"`,
      ip_address: clientIp,
    });

    // If High or Critical risk, alert admins
    if (risk.level === 'HIGH' || risk.level === 'CRITICAL') {
      const allUsers = await db.getUsers();
      const adminUsers = allUsers.filter(u => u.role === 'ADMIN');
      for (const admin of adminUsers) {
        await db.createNotification({
          user_id: admin.id,
          title: `New ${risk.level} Risk Request`,
          message: `${req.user!.name} requested ${role} on ${resource}. Risk score: ${risk.score}/100. Review required.`,
          type: 'WARNING',
          request_id: newRequest.id,
        });
      }
    }

    res.status(201).json({
      success: true,
      message: 'Access request submitted successfully.',
      request: newRequest,
      riskEvaluation: risk,
    });
  } catch (err: any) {
    res.status(500).json({ error: 'SERVER_ERROR', message: 'Failed to submit access request.' });
  }
});

/**
 * GET /api/access-requests
 * Retrieve list of access requests
 */
router.get('/', authenticateToken, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { status, riskLevel, isEmergency } = req.query;

    // Normal users only see their own requests unless admin
    const userIdFilter = req.user!.role === 'ADMIN' ? undefined : req.user!.id;

    const requests = await db.getRequests({
      userId: userIdFilter,
      status: status as string,
      riskLevel: riskLevel as string,
      isEmergency: isEmergency !== undefined ? isEmergency === 'true' : undefined,
    });

    res.json({ requests });
  } catch (err: any) {
    res.status(500).json({ error: 'SERVER_ERROR', message: 'Failed to retrieve access requests.' });
  }
});

/**
 * GET /api/access-requests/:id
 * Retrieve request details with user previous access history
 */
router.get('/:id', authenticateToken, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const request = await db.getRequestById(req.params.id);

    if (!request) {
      res.status(404).json({ error: 'NOT_FOUND', message: 'Access request not found.' });
      return;
    }

    // Role check: users can only see their own requests
    if (req.user!.role !== 'ADMIN' && request.user_id !== req.user!.id) {
      res.status(403).json({ error: 'ACCESS_DENIED', message: 'You are not authorized to view this request.' });
      return;
    }

    // Fetch previous request history for context
    const allUserRequests = await db.getRequests({ userId: request.user_id });
    const previousHistory = allUserRequests
      .filter(r => r.id !== request.id)
      .slice(0, 5);

    res.json({
      request,
      history: previousHistory,
    });
  } catch (err) {
    res.status(500).json({ error: 'SERVER_ERROR', message: 'Failed to load request details.' });
  }
});

/**
 * POST /api/access-requests/:id/approve
 * Admin approves pending request -> ACTIVATES temporary access
 */
router.post('/:id/approve', authenticateToken, requireAdmin, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { comment } = req.body;
    const clientIp = req.ip || req.socket.remoteAddress || '127.0.0.1';

    const request = await db.getRequestById(req.params.id);
    if (!request) {
      res.status(404).json({ error: 'NOT_FOUND', message: 'Request not found.' });
      return;
    }

    if (request.status !== 'PENDING') {
      res.status(400).json({
        error: 'INVALID_STATE',
        message: `Request cannot be approved because it is currently ${request.status}.`
      });
      return;
    }

    const now = new Date();
    const expiresAt = new Date(now.getTime() + request.duration_minutes * 60000);

    // Call Azure PIM Service abstraction
    const pimResult = await azurePimService.activatePrivilegedAccess({
      requestId: request.id,
      userPrincipalName: request.user_email,
      resourceId: request.resource,
      roleDefinitionName: request.role,
      durationMinutes: request.duration_minutes,
      ticketId: request.ticket_id,
      justification: request.reason,
    });

    // Update request state
    const updatedRequest = await db.updateRequest(request.id, {
      status: 'ACTIVE',
      reviewer_id: req.user!.id,
      reviewer_name: req.user!.name,
      review_comment: comment ? comment.trim() : 'Approved by administrator.',
      reviewed_at: now.toISOString(),
      started_at: now.toISOString(),
      expires_at: expiresAt.toISOString(),
    });

    // Create Active Access record
    const activeSession = await db.createActiveAccess({
      request_id: request.id,
      user_id: request.user_id,
      user_name: request.user_name,
      user_email: request.user_email,
      resource: request.resource,
      role: request.role,
      access_type: request.is_emergency ? 'EMERGENCY' : 'JIT',
      started_at: now.toISOString(),
      expires_at: expiresAt.toISOString(),
    });

    // Create Audit Log: REQUEST_APPROVED
    await db.createAuditLog({
      user_id: req.user!.id,
      user_name: req.user!.name,
      user_email: req.user!.email,
      action: 'REQUEST_APPROVED',
      resource: request.resource,
      role: request.role,
      details: `Administrator ${req.user!.name} approved request ${request.id}. Comment: "${comment || 'Approved'}"`,
      ip_address: clientIp,
    });

    // Create Audit Log: ACCESS_ACTIVATED
    await db.createAuditLog({
      user_id: request.user_id,
      user_name: request.user_name,
      user_email: request.user_email,
      action: 'ACCESS_ACTIVATED',
      resource: request.resource,
      role: request.role,
      details: `Temporary privileged elevation activated on ${request.resource} as ${request.role} for ${request.duration_minutes}m (Expires: ${expiresAt.toLocaleTimeString()}). Azure Ref: ${pimResult.azureAssignmentId}`,
      ip_address: clientIp,
    });

    // Notify requester
    await db.createNotification({
      user_id: request.user_id,
      title: 'Access Request Approved & Active',
      message: `Your request for ${request.role} on ${request.resource} has been approved and is now ACTIVE for ${request.duration_minutes} minutes.`,
      type: 'SUCCESS',
      request_id: request.id,
    });

    res.json({
      success: true,
      message: 'Request approved and privileged access activated.',
      request: updatedRequest,
      activeSession,
    });
  } catch (err) {
    res.status(500).json({ error: 'SERVER_ERROR', message: 'Failed to approve access request.' });
  }
});

/**
 * POST /api/access-requests/:id/reject
 * Admin rejects pending request with mandatory reason
 */
router.post('/:id/reject', authenticateToken, requireAdmin, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { reason } = req.body;
    const clientIp = req.ip || req.socket.remoteAddress || '127.0.0.1';

    if (!reason || reason.trim().length === 0) {
      res.status(400).json({
        error: 'VALIDATION_ERROR',
        message: 'A rejection reason is required to explain the security decision.'
      });
      return;
    }

    const request = await db.getRequestById(req.params.id);
    if (!request) {
      res.status(404).json({ error: 'NOT_FOUND', message: 'Request not found.' });
      return;
    }

    if (request.status !== 'PENDING') {
      res.status(400).json({
        error: 'INVALID_STATE',
        message: `Request cannot be rejected because it is currently ${request.status}.`
      });
      return;
    }

    const updatedRequest = await db.updateRequest(request.id, {
      status: 'REJECTED',
      reviewer_id: req.user!.id,
      reviewer_name: req.user!.name,
      review_comment: reason.trim(),
      reviewed_at: new Date().toISOString(),
    });

    // Audit log
    await db.createAuditLog({
      user_id: req.user!.id,
      user_name: req.user!.name,
      user_email: req.user!.email,
      action: 'REQUEST_REJECTED',
      resource: request.resource,
      role: request.role,
      details: `Administrator ${req.user!.name} rejected request ${request.id}. Reason: "${reason.trim()}"`,
      ip_address: clientIp,
    });

    // Notify user
    await db.createNotification({
      user_id: request.user_id,
      title: 'Access Request Rejected',
      message: `Your request for ${request.role} on ${request.resource} was rejected. Reason: ${reason.trim()}`,
      type: 'ALERT',
      request_id: request.id,
    });

    res.json({
      success: true,
      message: 'Access request has been rejected.',
      request: updatedRequest,
    });
  } catch (err) {
    res.status(500).json({ error: 'SERVER_ERROR', message: 'Failed to reject access request.' });
  }
});

export default router;
