import { Router, Response } from 'express';
import { db } from '../db.js';
import { authenticateToken, AuthenticatedRequest } from '../auth.js';

const router = Router();

/**
 * GET /api/notifications
 */
router.get('/', authenticateToken, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const list = await db.getNotifications(req.user!.id);
    const unreadCount = list.filter(n => !n.is_read).length;

    res.json({
      notifications: list,
      unreadCount,
    });
  } catch (err) {
    res.status(500).json({ error: 'SERVER_ERROR', message: 'Failed to retrieve notifications.' });
  }
});

/**
 * POST /api/notifications/:id/read
 */
router.post('/:id/read', authenticateToken, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const success = await db.markNotificationRead(req.params.id, req.user!.id);
    if (!success) {
      res.status(404).json({ error: 'NOT_FOUND', message: 'Notification not found.' });
      return;
    }
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: 'SERVER_ERROR', message: 'Failed to mark notification as read.' });
  }
});

/**
 * POST /api/notifications/read-all
 */
router.post('/read-all', authenticateToken, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const count = await db.markAllNotificationsRead(req.user!.id);
    res.json({ success: true, count });
  } catch (err) {
    res.status(500).json({ error: 'SERVER_ERROR', message: 'Failed to mark notifications read.' });
  }
});

export default router;
