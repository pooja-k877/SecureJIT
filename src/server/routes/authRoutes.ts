import { Router, Response } from 'express';
import { db } from '../db.js';
import { generateAuthToken, comparePassword, hashPassword, authenticateToken, AuthenticatedRequest } from '../auth.js';

const router = Router();

/**
 * POST /api/auth/login
 */
router.post('/login', async (req, res: Response) => {
  try {
    const { email, password } = req.body;
    const clientIp = req.ip || req.socket.remoteAddress || '127.0.0.1';

    if (!email || !password) {
      res.status(400).json({
        error: 'VALIDATION_ERROR',
        message: 'Email and password are required.'
      });
      return;
    }

    const user = await db.getUserByEmail(email);

    if (!user) {
      await db.createAuditLog({
        user_name: email,
        user_email: email,
        action: 'LOGIN_FAILED',
        details: `Failed authentication attempt: Account not found for email ${email}.`,
        ip_address: clientIp,
      });

      res.status(401).json({
        error: 'INVALID_CREDENTIALS',
        message: 'Invalid email or password.'
      });
      return;
    }

    if (user.status === 'DISABLED') {
      await db.createAuditLog({
        user_id: user.id,
        user_name: user.name,
        user_email: user.email,
        action: 'LOGIN_FAILED',
        details: `Login blocked: Account ${user.email} is currently disabled by administrator.`,
        ip_address: clientIp,
      });

      res.status(403).json({
        error: 'ACCOUNT_DISABLED',
        message: 'Your account has been deactivated. Please contact your security administrator.'
      });
      return;
    }

    const isMatch = await comparePassword(password, user.password_hash);
    if (!isMatch) {
      await db.createAuditLog({
        user_id: user.id,
        user_name: user.name,
        user_email: user.email,
        action: 'LOGIN_FAILED',
        details: `Failed password verification attempt for user ${user.email}.`,
        ip_address: clientIp,
      });

      res.status(401).json({
        error: 'INVALID_CREDENTIALS',
        message: 'Invalid email or password.'
      });
      return;
    }

    // Success
    await db.updateUserLastLogin(user.id);
    await db.createAuditLog({
      user_id: user.id,
      user_name: user.name,
      user_email: user.email,
      action: 'LOGIN_SUCCESS',
      details: `User ${user.name} (${user.role}) authenticated successfully.`,
      ip_address: clientIp,
    });

    const token = generateAuthToken({
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      department: user.department,
    });

    res.json({
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        department: user.department,
        status: user.status,
        created_at: user.created_at,
        last_login_at: user.last_login_at,
      }
    });
  } catch (err: any) {
    res.status(500).json({ error: 'SERVER_ERROR', message: 'An unexpected authentication error occurred.' });
  }
});

/**
 * POST /api/auth/register
 */
router.post('/register', async (req, res: Response) => {
  try {
    const { name, email, password, department, role } = req.body;
    const clientIp = req.ip || req.socket.remoteAddress || '127.0.0.1';

    if (!name || !email || !password) {
      res.status(400).json({
        error: 'VALIDATION_ERROR',
        message: 'Name, email, and password are required.'
      });
      return;
    }

    if (password.length < 6) {
      res.status(400).json({
        error: 'VALIDATION_ERROR',
        message: 'Password must be at least 6 characters long.'
      });
      return;
    }

    const existing = await db.getUserByEmail(email);
    if (existing) {
      res.status(409).json({
        error: 'EMAIL_EXISTS',
        message: 'A user account with this email address already exists.'
      });
      return;
    }

    const password_hash = await hashPassword(password);
    const assignedRole = role === 'ADMIN' ? 'ADMIN' : 'USER';

    const newUser = await db.createUser({
      name,
      email,
      password_hash,
      role: assignedRole,
      department: department || 'Engineering',
      status: 'ACTIVE',
    });

    await db.createAuditLog({
      user_id: newUser.id,
      user_name: newUser.name,
      user_email: newUser.email,
      action: 'USER_REGISTERED',
      details: `New ${assignedRole} account created for ${newUser.name} (${newUser.email}).`,
      ip_address: clientIp,
    });

    const token = generateAuthToken({
      id: newUser.id,
      name: newUser.name,
      email: newUser.email,
      role: newUser.role,
      department: newUser.department,
    });

    res.status(201).json({
      token,
      user: {
        id: newUser.id,
        name: newUser.name,
        email: newUser.email,
        role: newUser.role,
        department: newUser.department,
        status: newUser.status,
        created_at: newUser.created_at,
      }
    });
  } catch (err: any) {
    res.status(500).json({ error: 'SERVER_ERROR', message: 'Failed to create user account.' });
  }
});

/**
 * GET /api/auth/me
 */
router.get('/me', authenticateToken, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const user = await db.getUserById(req.user!.id);
    if (!user) {
      res.status(404).json({ error: 'USER_NOT_FOUND', message: 'User profile not found.' });
      return;
    }

    res.json({
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        department: user.department,
        status: user.status,
        created_at: user.created_at,
        last_login_at: user.last_login_at,
      }
    });
  } catch (err) {
    res.status(500).json({ error: 'SERVER_ERROR', message: 'Could not fetch current profile.' });
  }
});

/**
 * POST /api/auth/logout
 */
router.post('/logout', authenticateToken, async (req: AuthenticatedRequest, res: Response) => {
  const clientIp = req.ip || req.socket.remoteAddress || '127.0.0.1';
  await db.createAuditLog({
    user_id: req.user!.id,
    user_name: req.user!.name,
    user_email: req.user!.email,
    action: 'LOGOUT',
    details: `User ${req.user!.name} logged out securely.`,
    ip_address: clientIp,
  });

  res.json({ success: true, message: 'Logged out successfully.' });
});

/**
 * POST /api/auth/change-password
 */
router.post('/change-password', authenticateToken, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { currentPassword, newPassword } = req.body;
    const clientIp = req.ip || req.socket.remoteAddress || '127.0.0.1';

    if (!currentPassword || !newPassword) {
      res.status(400).json({
        error: 'VALIDATION_ERROR',
        message: 'Current password and new password are required.'
      });
      return;
    }

    if (newPassword.length < 6) {
      res.status(400).json({
        error: 'VALIDATION_ERROR',
        message: 'New password must be at least 6 characters long.'
      });
      return;
    }

    const user = await db.getUserById(req.user!.id);
    if (!user) {
      res.status(404).json({ error: 'USER_NOT_FOUND', message: 'User not found.' });
      return;
    }

    const isMatch = await comparePassword(currentPassword, user.password_hash);
    if (!isMatch) {
      res.status(400).json({
        error: 'INVALID_PASSWORD',
        message: 'Current password does not match records.'
      });
      return;
    }

    const newHash = await hashPassword(newPassword);
    await db.updateUserPassword(user.id, newHash);

    await db.createAuditLog({
      user_id: user.id,
      user_name: user.name,
      user_email: user.email,
      action: 'PASSWORD_CHANGED',
      details: `Password changed successfully for user ${user.email}.`,
      ip_address: clientIp,
    });

    res.json({ success: true, message: 'Password updated successfully.' });
  } catch (err) {
    res.status(500).json({ error: 'SERVER_ERROR', message: 'Failed to update password.' });
  }
});

export default router;
