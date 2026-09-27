import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';

const JWT_SECRET = process.env.JWT_SECRET || 'securejit_hackathon_jwt_secret_key_2026_azure_pim';

export interface AuthUserPayload {
  id: string;
  name: string;
  email: string;
  role: 'USER' | 'ADMIN';
  department?: string;
}

export interface AuthenticatedRequest extends Request {
  user?: AuthUserPayload;
}

/**
 * Sign JWT token for authenticated session
 */
export function generateAuthToken(user: AuthUserPayload): string {
  return jwt.sign(
    {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      department: user.department,
    },
    JWT_SECRET,
    { expiresIn: '12h' }
  );
}

/**
 * Hash raw password with bcrypt
 */
export async function hashPassword(plainText: string): Promise<string> {
  const salt = await bcrypt.genSalt(10);
  return bcrypt.hash(plainText, salt);
}

/**
 * Compare raw password with hashed password
 */
export async function comparePassword(plainText: string, hash: string): Promise<boolean> {
  return bcrypt.compare(plainText, hash);
}

/**
 * Middleware: Verify JWT Bearer token
 */
export function authenticateToken(req: AuthenticatedRequest, res: Response, next: NextFunction): void {
  const authHeader = req.headers.authorization;
  const token = authHeader && authHeader.startsWith('Bearer ') ? authHeader.substring(7) : null;

  if (!token) {
    res.status(401).json({
      error: 'AUTHENTICATION_REQUIRED',
      message: 'Session expired or authentication token missing. Please log in again.'
    });
    return;
  }

  jwt.verify(token, JWT_SECRET, (err, decoded) => {
    if (err || !decoded) {
      res.status(401).json({
        error: 'INVALID_TOKEN',
        message: 'Your session has expired. Please log in again.'
      });
      return;
    }
    req.user = decoded as AuthUserPayload;
    next();
  });
}

/**
 * Middleware: Enforce Administrator role
 */
export function requireAdmin(req: AuthenticatedRequest, res: Response, next: NextFunction): void {
  if (!req.user || req.user.role !== 'ADMIN') {
    res.status(403).json({
      error: 'ACCESS_DENIED',
      message: 'Access denied: Administrative privileges required to perform this action.'
    });
    return;
  }
  next();
}
