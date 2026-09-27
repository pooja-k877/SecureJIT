import { Router, Response } from 'express';
import { db } from '../db.js';
import { authenticateToken, AuthenticatedRequest } from '../auth.js';
import { evaluateRisk } from '../riskEngine.js';
import { azurePimService } from '../services/azurePimService.js';

const router = Router();

/**
 * POST /api/emergency-access
 * Submit emergency break-glass access request.
 *
 * Emergency requests are NOT auto-approved.
 * They remain PENDING until the administrator approves them.
 */
router.post('/', authenticateToken, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const {
      resource,
      role,
      durationMinutes,
      emergencyReason,
      incidentTicketId,
      termsAccepted
    } = req.body;

    const clientIp =
      req.ip ||
      req.socket.remoteAddress ||
      '127.0.0.1';

    // --------------------------------------------------
    // 1. Terms acknowledgement
    // --------------------------------------------------
    if (!termsAccepted) {
      res.status(400).json({
        error: 'TERMS_NOT_ACCEPTED',
        message:
          'You must acknowledge that emergency break-glass access is fully audited and time-bound.'
      });
      return;
    }

    // --------------------------------------------------
    // 2. Required field validation
    // --------------------------------------------------
    if (
      !resource ||
      !role ||
      !durationMinutes ||
      !emergencyReason ||
      !incidentTicketId
    ) {
      res.status(400).json({
        error: 'VALIDATION_ERROR',
        message:
          'Resource, role, duration, incident ticket ID, and emergency justification are mandatory.'
      });
      return;
    }

    // --------------------------------------------------
    // 3. Emergency duration validation
    // --------------------------------------------------
    const durationNum = parseInt(durationMinutes, 10);

    if (![10, 15, 30].includes(durationNum)) {
      res.status(400).json({
        error: 'INVALID_EMERGENCY_DURATION',
        message:
          'Emergency access duration is restricted to 10, 15, or 30 minutes.'
      });
      return;
    }

    // --------------------------------------------------
    // 4. Evaluate risk
    // --------------------------------------------------
    const risk = evaluateRisk({
      resource,
      role,
      durationMinutes: durationNum,
      isEmergency: true,
    });

    // --------------------------------------------------
    // 5. IMPORTANT:
    // Emergency requests MUST go to ADMIN for approval.
    // No automatic approval.
    // --------------------------------------------------
    const policy = db.getPolicy();

    const isAutoApprove = false;

    const now = new Date();

    // This is only calculated for the future approval flow.
    const expiresAt = new Date(
      now.getTime() + durationNum * 60000
    );

    // --------------------------------------------------
    // 6. Create emergency request as PENDING
    // --------------------------------------------------
    const request = await db.createRequest({
      user_id: req.user!.id,
      user_name: req.user!.name,
      user_email: req.user!.email,

      resource,
      role,

      duration_minutes: durationNum,

      reason:
        `[EMERGENCY BREAK-GLASS] ${emergencyReason.trim()}`,

      ticket_id: incidentTicketId.trim(),

      is_emergency: true,

      risk_level: risk.level,
      risk_score: risk.score,
      risk_reasons: risk.reasons,

      // IMPORTANT:
      // The admin must approve this request.
      status: 'PENDING',

      reviewer_id: undefined,
      reviewer_name: undefined,
      review_comment: undefined,
      reviewed_at: undefined,
      started_at: undefined,
      expires_at: undefined,
    });

    // --------------------------------------------------
    // 7. Audit: emergency request submitted
    // --------------------------------------------------
    await db.createAuditLog({
      user_id: req.user!.id,
      user_name: req.user!.name,
      user_email: req.user!.email,

      action: 'EMERGENCY_REQUESTED',

      resource,
      role,

      details:
        `Emergency break-glass requested for ${incidentTicketId} by ${req.user!.name}. ` +
        `Justification: "${emergencyReason.trim()}". ` +
        `Policy mode: ${policy.emergencyAccessMode}`,

      ip_address: clientIp,
    });

    // --------------------------------------------------
    // 8. NO immediate activation
    //
    // The admin will approve this later.
    // Therefore:
    // activeSession = null
    // --------------------------------------------------
    const activeSession = null;

    // --------------------------------------------------
    // 9. Notify ALL administrators
    // --------------------------------------------------
    const users = await db.getUsers();

    const adminUsers = users.filter(
      user => user.role === 'ADMIN'
    );

    for (const admin of adminUsers) {
      await db.createNotification({
        user_id: admin.id,

        title: 'EMERGENCY BREAK-GLASS ALERT',

        message:
          `${req.user!.name} submitted an emergency access request ` +
          `for ${resource} (${role}). ` +
          `Incident: ${incidentTicketId}. ` +
          `Status: PENDING ADMIN APPROVAL.`,

        type: 'ALERT',

        request_id: request.id,
      });
    }

    // --------------------------------------------------
    // 10. Return successful response to USER
    // --------------------------------------------------
    res.status(201).json({
      success: true,

      message:
        'Emergency access request submitted successfully and is waiting for administrator approval.',

      isImmediate: false,

      request,

      activeSession,
    });

  } catch (err) {

    // --------------------------------------------------
    // IMPORTANT:
    // Print the REAL error in the backend terminal.
    // --------------------------------------------------
    console.error(
      'EMERGENCY ACCESS ERROR:',
      err
    );

    res.status(500).json({
      error: 'SERVER_ERROR',

      message:
        err instanceof Error
          ? err.message
          : 'Failed to process emergency access request.'
    });
  }
});

export default router;