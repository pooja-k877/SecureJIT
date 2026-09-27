import { query, initDatabaseConnection } from './config/database.js';

export interface UserRecord {
  id: string;
  name: string;
  email: string;
  password_hash: string;
  role: 'USER' | 'ADMIN';
  department: string;
  status: 'ACTIVE' | 'DISABLED';
  created_at: string;
  last_login?: string;
  last_login_at?: string;
}

export interface AccessRequestRecord {
  id: string;
  user_id: string;
  user_name: string;
  user_email: string;
  resource: string;
  role: string;
  duration_minutes: number;
  reason: string;
  ticket_id?: string;
  is_emergency: boolean;
  risk_level: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  risk_score: number;
  risk_reason?: string;
  risk_reasons: string[];
  status: 'PENDING' | 'APPROVED' | 'REJECTED' | 'ACTIVE' | 'EXPIRED' | 'REVOKED';
  approved_by?: string;
  approved_at?: string;
  rejection_reason?: string;
  reviewer_id?: string;
  reviewer_name?: string;
  review_comment?: string;
  requested_at: string;
  reviewed_at?: string;
  started_at?: string;
  expires_at?: string;
}

export interface ActiveAccessRecord {
  id: string;
  request_id: string;
  user_id: string;
  user_name: string;
  user_email: string;
  resource: string;
  role: string;
  access_type: 'JIT' | 'EMERGENCY';
  started_at: string;
  expires_at: string;
  status: 'ACTIVE' | 'REVOKED' | 'EXPIRED';
  revoked_at?: string;
  revoked_by?: string;
}

export interface AuditLogRecord {
  id: string;
  user_id?: string;
  user_name: string;
  user_email: string;
  action: string;
  resource?: string;
  role?: string;
  details: string;
  ip_address?: string;
  created_at?: string;
  timestamp: string;
}

export interface NotificationRecord {
  id: string;
  user_id: string;
  title: string;
  message: string;
  type: 'INFO' | 'SUCCESS' | 'WARNING' | 'ALERT';
  request_id?: string;
  is_read: boolean;
  created_at: string;
}

export interface SystemPolicy {
  emergencyAccessMode: 'IMMEDIATE_AUTO_APPROVAL' | 'REQUIRE_ADMIN_APPROVAL';
  maxJitDurationMinutes: number;
  requireTicketNumber: boolean;
}

function parseRiskReasons(raw: any): string[] {
  if (Array.isArray(raw)) return raw;
  if (typeof raw === 'string') {
    try {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) return parsed;
    } catch {
      return [raw];
    }
  }
  return [];
}

function normalizeTimestamp(val: any): string {
  if (!val) return '';
  if (val instanceof Date) return val.toISOString();
  return String(val);
}

function mapAccessRequest(row: any): AccessRequestRecord {
  return {
    id: row.id,
    user_id: row.user_id,
    user_name: row.user_name,
    user_email: row.user_email,
    resource: row.resource,
    role: row.role,
    duration_minutes: Number(row.duration_minutes),
    reason: row.reason,
    ticket_id: row.ticket_id || undefined,
    is_emergency: Boolean(row.is_emergency),
    risk_level: row.risk_level,
    risk_score: Number(row.risk_score),
    risk_reason: row.risk_reason || (row.risk_reasons ? parseRiskReasons(row.risk_reasons)[0] : undefined),
    risk_reasons: parseRiskReasons(row.risk_reasons),
    status: row.status,
    approved_by: row.approved_by || row.reviewer_name || undefined,
    approved_at: row.approved_at ? normalizeTimestamp(row.approved_at) : (row.reviewed_at ? normalizeTimestamp(row.reviewed_at) : undefined),
    rejection_reason: row.rejection_reason || row.review_comment || undefined,
    reviewer_id: row.reviewer_id || undefined,
    reviewer_name: row.reviewer_name || row.approved_by || undefined,
    review_comment: row.review_comment || row.rejection_reason || undefined,
    requested_at: normalizeTimestamp(row.requested_at),
    reviewed_at: row.reviewed_at ? normalizeTimestamp(row.reviewed_at) : undefined,
    started_at: row.started_at ? normalizeTimestamp(row.started_at) : undefined,
    expires_at: row.expires_at ? normalizeTimestamp(row.expires_at) : undefined,
  };
}

function mapActiveAccess(row: any): ActiveAccessRecord {
  return {
    id: row.id,
    request_id: row.request_id,
    user_id: row.user_id,
    user_name: row.user_name,
    user_email: row.user_email,
    resource: row.resource,
    role: row.role,
    access_type: row.access_type || 'JIT',
    started_at: normalizeTimestamp(row.started_at),
    expires_at: normalizeTimestamp(row.expires_at),
    status: row.status,
    revoked_at: row.revoked_at ? normalizeTimestamp(row.revoked_at) : undefined,
    revoked_by: row.revoked_by || undefined,
  };
}

function mapAuditLog(row: any): AuditLogRecord {
  return {
    id: row.id,
    user_id: row.user_id || undefined,
    user_name: row.user_name,
    user_email: row.user_email,
    action: row.action,
    resource: row.resource || undefined,
    role: row.role || undefined,
    details: row.details,
    ip_address: row.ip_address || undefined,
    created_at: row.created_at ? normalizeTimestamp(row.created_at) : normalizeTimestamp(row.timestamp),
    timestamp: normalizeTimestamp(row.timestamp || row.created_at),
  };
}

function mapNotification(row: any): NotificationRecord {
  return {
    id: row.id,
    user_id: row.user_id,
    title: row.title,
    message: row.message,
    type: row.type,
    request_id: row.request_id || undefined,
    is_read: Boolean(row.is_read),
    created_at: normalizeTimestamp(row.created_at),
  };
}

function mapUser(row: any): UserRecord {
  return {
    id: row.id,
    name: row.name,
    email: row.email,
    password_hash: row.password_hash,
    role: row.role,
    department: row.department || '',
    status: row.status,
    created_at: normalizeTimestamp(row.created_at),
    last_login: row.last_login ? normalizeTimestamp(row.last_login) : (row.last_login_at ? normalizeTimestamp(row.last_login_at) : undefined),
    last_login_at: row.last_login_at ? normalizeTimestamp(row.last_login_at) : (row.last_login ? normalizeTimestamp(row.last_login) : undefined),
  };
}

class SecureJitDatabase {
  private policy: SystemPolicy = {
    emergencyAccessMode: (process.env.EMERGENCY_POLICY as any) || 'IMMEDIATE_AUTO_APPROVAL',
    maxJitDurationMinutes: 240,
    requireTicketNumber: false,
  };

  /**
   * Auto-expire background monitor running directly against PostgreSQL
   */
  public async checkAndExpireSessions(): Promise<void> {
    try {
      // Find active sessions that have passed their expiration timestamp
      const expiredQuery = await query(`
        SELECT * FROM active_access 
        WHERE status = 'ACTIVE' 
        AND expires_at <= NOW();
      `);

      for (const session of expiredQuery.rows) {
        // Mark session as EXPIRED in PostgreSQL
        await query(
          `UPDATE active_access SET status = 'EXPIRED' WHERE id = $1;`,
          [session.id]
        );

        // Update corresponding request in PostgreSQL
        await query(
          `UPDATE access_requests SET status = 'EXPIRED' WHERE id = $1 AND status = 'ACTIVE';`,
          [session.request_id]
        );

        const isEmergency = session.access_type === 'EMERGENCY';
        const actionType = isEmergency ? 'EMERGENCY_EXPIRED' : 'ACCESS_EXPIRED';
        const auditId = `AUD-${Math.floor(1000 + Math.random() * 9000)}`;

        // Insert audit log in PostgreSQL
        await query(
          `INSERT INTO audit_logs (id, user_id, user_name, user_email, action, resource, role, details, ip_address, created_at, timestamp)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, NOW(), NOW());`,
          [
            auditId,
            session.user_id,
            session.user_name,
            session.user_email,
            actionType,
            session.resource,
            session.role,
            `Temporary privileged access on ${session.resource} has expired automatically. Privileges de-provisioned.`,
            'SYSTEM_DAEMON',
          ]
        );

        // Insert notification in PostgreSQL
        const notifId = `NOTIF-${Math.floor(1000 + Math.random() * 9000)}`;
        await query(
          `INSERT INTO notifications (id, user_id, title, message, type, request_id, is_read, created_at)
           VALUES ($1, $2, $3, $4, $5, $6, FALSE, NOW());`,
          [
            notifId,
            session.user_id,
            'Privileged Access Expired',
            `Your temporary privileged session on ${session.resource} (${session.role}) has expired.`,
            'INFO',
            session.request_id,
          ]
        );

        console.log(`[AutoExpire] Privileged session ${session.id} on ${session.resource} expired in PostgreSQL.`);
      }
    } catch (err: any) {
      console.error('[AutoExpire Error] Failed during auto-expire check:', err.message);
    }
  }

  // --- Users Table Operations in PostgreSQL ---
  public async getUsers(): Promise<UserRecord[]> {
    const res = await query('SELECT * FROM users ORDER BY created_at ASC;');
    return res.rows.map(mapUser);
  }

  public async getUserByEmail(email: string): Promise<UserRecord | undefined> {
    const res = await query('SELECT * FROM users WHERE LOWER(email) = LOWER($1);', [email]);
    if (res.rows.length === 0) return undefined;
    return mapUser(res.rows[0]);
  }

  public async getUserById(id: string): Promise<UserRecord | undefined> {
    const res = await query('SELECT * FROM users WHERE id = $1;', [id]);
    if (res.rows.length === 0) return undefined;
    return mapUser(res.rows[0]);
  }

  public async createUser(data: Omit<UserRecord, 'id' | 'created_at'>): Promise<UserRecord> {
    const id = `USR-${Math.floor(100 + Math.random() * 900)}`;
    const res = await query(
      `INSERT INTO users (id, name, email, password_hash, role, department, status, created_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, NOW())
       RETURNING *;`,
      [id, data.name, data.email, data.password_hash, data.role, data.department, data.status]
    );
    return mapUser(res.rows[0]);
  }

  public async updateUserStatus(id: string, status: 'ACTIVE' | 'DISABLED'): Promise<UserRecord | null> {
    const res = await query(
      `UPDATE users SET status = $1 WHERE id = $2 RETURNING *;`,
      [status, id]
    );
    if (res.rows.length === 0) return null;
    return mapUser(res.rows[0]);
  }

  public async updateUserLastLogin(id: string): Promise<void> {
    await query(
      `UPDATE users SET last_login = NOW(), last_login_at = NOW() WHERE id = $1;`,
      [id]
    );
  }

  public async updateUserPassword(id: string, newPasswordHash: string): Promise<boolean> {
    const res = await query(
      `UPDATE users SET password_hash = $1 WHERE id = $2 RETURNING id;`,
      [newPasswordHash, id]
    );
    return res.rows.length > 0;
  }

  // --- Access Requests Table Operations in PostgreSQL ---
  public async getRequests(filters?: {
    userId?: string;
    status?: string;
    isEmergency?: boolean;
    riskLevel?: string;
  }): Promise<AccessRequestRecord[]> {
    await this.checkAndExpireSessions();

    const conditions: string[] = [];
    const params: any[] = [];
    let paramIndex = 1;

    if (filters?.userId) {
      conditions.push(`user_id = $${paramIndex++}`);
      params.push(filters.userId);
    }
    if (filters?.status && filters.status !== 'ALL') {
      conditions.push(`status = $${paramIndex++}`);
      params.push(filters.status);
    }
    if (filters?.isEmergency !== undefined) {
      conditions.push(`is_emergency = $${paramIndex++}`);
      params.push(filters.isEmergency);
    }
    if (filters?.riskLevel && filters.riskLevel !== 'ALL') {
      conditions.push(`risk_level = $${paramIndex++}`);
      params.push(filters.riskLevel);
    }

    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';
    const sql = `SELECT * FROM access_requests ${whereClause} ORDER BY requested_at DESC;`;

    const res = await query(sql, params);
    return res.rows.map(mapAccessRequest);
  }

  public async getRequestById(id: string): Promise<AccessRequestRecord | undefined> {
    await this.checkAndExpireSessions();
    const res = await query('SELECT * FROM access_requests WHERE id = $1;', [id]);
    if (res.rows.length === 0) return undefined;
    return mapAccessRequest(res.rows[0]);
  }

  public async createRequest(data: Omit<AccessRequestRecord, 'id' | 'requested_at' | 'status'> & { status?: AccessRequestRecord['status'] }): Promise<AccessRequestRecord> {
    const id = `REQ-${new Date().getFullYear()}-${Math.floor(100 + Math.random() * 900)}`;
    const status = data.status || 'PENDING';
    const riskReasonsJson = JSON.stringify(data.risk_reasons || []);
    const primaryRiskReason = data.risk_reason || (data.risk_reasons && data.risk_reasons[0]) || '';

    const res = await query(
      `INSERT INTO access_requests 
       (id, user_id, user_name, user_email, resource, role, duration_minutes, reason, ticket_id, is_emergency, risk_level, risk_score, risk_reason, risk_reasons, status, approved_by, approved_at, rejection_reason, reviewer_id, reviewer_name, review_comment, requested_at, reviewed_at, started_at, expires_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21, NOW(), $22, $23, $24)
       RETURNING *;`,
      [
        id,
        data.user_id,
        data.user_name,
        data.user_email,
        data.resource,
        data.role,
        data.duration_minutes,
        data.reason,
        data.ticket_id || null,
        data.is_emergency,
        data.risk_level,
        data.risk_score,
        primaryRiskReason,
        riskReasonsJson,
        status,
        data.approved_by || (status === 'ACTIVE' ? data.reviewer_name : null),
        data.approved_at || (status === 'ACTIVE' ? data.reviewed_at : null),
        data.rejection_reason || (status === 'REJECTED' ? data.review_comment : null),
        data.reviewer_id || null,
        data.reviewer_name || null,
        data.review_comment || null,
        data.reviewed_at || null,
        data.started_at || null,
        data.expires_at || null,
      ]
    );

    return mapAccessRequest(res.rows[0]);
  }

  public async updateRequest(id: string, updates: Partial<AccessRequestRecord>): Promise<AccessRequestRecord | null> {
    const current = await this.getRequestById(id);
    if (!current) return null;

    const fields: string[] = [];
    const values: any[] = [];
    let idx = 1;

    const mapping: Record<string, string> = {
      status: 'status',
      reviewer_id: 'reviewer_id',
      reviewer_name: 'reviewer_name',
      review_comment: 'review_comment',
      approved_by: 'approved_by',
      approved_at: 'approved_at',
      rejection_reason: 'rejection_reason',
      reviewed_at: 'reviewed_at',
      started_at: 'started_at',
      expires_at: 'expires_at',
    };

    // Keep approved_by and rejection_reason synchronized
    if (updates.status === 'ACTIVE' && updates.reviewer_name && !updates.approved_by) {
      updates.approved_by = updates.reviewer_name;
      updates.approved_at = updates.reviewed_at || new Date().toISOString();
    }
    if (updates.status === 'REJECTED' && updates.review_comment && !updates.rejection_reason) {
      updates.rejection_reason = updates.review_comment;
    }

    for (const [key, col] of Object.entries(mapping)) {
      if ((updates as any)[key] !== undefined) {
        fields.push(`${col} = $${idx++}`);
        values.push((updates as any)[key]);
      }
    }

    if (fields.length === 0) return current;

    values.push(id);
    const sql = `UPDATE access_requests SET ${fields.join(', ')} WHERE id = $${idx} RETURNING *;`;
    const res = await query(sql, values);
    if (res.rows.length === 0) return null;
    return mapAccessRequest(res.rows[0]);
  }

  // --- Active Access Table Operations in PostgreSQL ---
  public async getActiveAccess(userId?: string): Promise<ActiveAccessRecord[]> {
    await this.checkAndExpireSessions();

    const sql = userId
      ? `SELECT * FROM active_access WHERE status = 'ACTIVE' AND user_id = $1 ORDER BY expires_at ASC;`
      : `SELECT * FROM active_access WHERE status = 'ACTIVE' ORDER BY expires_at ASC;`;

    const params = userId ? [userId] : [];
    const res = await query(sql, params);
    return res.rows.map(mapActiveAccess);
  }

  public async getAllActiveAccess(): Promise<ActiveAccessRecord[]> {
    await this.checkAndExpireSessions();
    const res = await query(`SELECT * FROM active_access ORDER BY started_at DESC;`);
    return res.rows.map(mapActiveAccess);
  }

  public async getActiveAccessById(id: string): Promise<ActiveAccessRecord | undefined> {
    await this.checkAndExpireSessions();
    const res = await query(`SELECT * FROM active_access WHERE id = $1;`, [id]);
    if (res.rows.length === 0) return undefined;
    return mapActiveAccess(res.rows[0]);
  }

  public async createActiveAccess(data: Omit<ActiveAccessRecord, 'id' | 'status'>): Promise<ActiveAccessRecord> {
    const id = `ACT-${new Date().getFullYear()}-${Math.floor(100 + Math.random() * 900)}`;
    const res = await query(
      `INSERT INTO active_access (id, request_id, user_id, user_name, user_email, resource, role, access_type, started_at, expires_at, status)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, 'ACTIVE')
       RETURNING *;`,
      [
        id,
        data.request_id,
        data.user_id,
        data.user_name,
        data.user_email,
        data.resource,
        data.role,
        data.access_type || 'JIT',
        data.started_at,
        data.expires_at,
      ]
    );

    return mapActiveAccess(res.rows[0]);
  }

  public async revokeActiveAccess(id: string, revokedBy: string): Promise<ActiveAccessRecord | null> {
    await this.checkAndExpireSessions();

    const res = await query(
      `UPDATE active_access 
       SET status = 'REVOKED', revoked_at = NOW(), revoked_by = $1
       WHERE id = $2 AND status = 'ACTIVE'
       RETURNING *;`,
      [revokedBy, id]
    );

    if (res.rows.length === 0) return null;
    const session = mapActiveAccess(res.rows[0]);

    // Update corresponding request
    await query(
      `UPDATE access_requests SET status = 'REVOKED' WHERE id = $1;`,
      [session.request_id]
    );

    return session;
  }

  // --- Audit Logs Table Operations in PostgreSQL ---
  public async getAuditLogs(filters?: {
    action?: string;
    search?: string;
    userEmail?: string;
  }): Promise<AuditLogRecord[]> {
    await this.checkAndExpireSessions();

    const conditions: string[] = [];
    const params: any[] = [];
    let idx = 1;

    if (filters?.action && filters.action !== 'ALL') {
      conditions.push(`action = $${idx++}`);
      params.push(filters.action);
    }
    if (filters?.userEmail) {
      conditions.push(`LOWER(user_email) LIKE LOWER($${idx++})`);
      params.push(`%${filters.userEmail}%`);
    }
    if (filters?.search) {
      conditions.push(`(
        LOWER(details) LIKE LOWER($${idx}) OR
        LOWER(user_name) LIKE LOWER($${idx}) OR
        LOWER(user_email) LIKE LOWER($${idx}) OR
        LOWER(COALESCE(resource, '')) LIKE LOWER($${idx}) OR
        LOWER(COALESCE(role, '')) LIKE LOWER($${idx}) OR
        LOWER(action) LIKE LOWER($${idx})
      )`);
      params.push(`%${filters.search}%`);
      idx++;
    }

    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';
    const sql = `SELECT * FROM audit_logs ${whereClause} ORDER BY timestamp DESC;`;

    const res = await query(sql, params);
    return res.rows.map(mapAuditLog);
  }

  public async createAuditLog(entry: Omit<AuditLogRecord, 'id' | 'timestamp'> & { timestamp?: string }): Promise<AuditLogRecord> {
    const id = `AUD-${Math.floor(1000 + Math.random() * 9000)}`;
    const res = await query(
      `INSERT INTO audit_logs (id, user_id, user_name, user_email, action, resource, role, details, ip_address, created_at, timestamp)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, NOW(), NOW())
       RETURNING *;`,
      [
        id,
        entry.user_id || null,
        entry.user_name,
        entry.user_email,
        entry.action,
        entry.resource || null,
        entry.role || null,
        entry.details,
        entry.ip_address || '127.0.0.1',
      ]
    );

    return mapAuditLog(res.rows[0]);
  }

  // --- Notifications Table Operations in PostgreSQL ---
  public async getNotifications(userId: string): Promise<NotificationRecord[]> {
    const res = await query(
      `SELECT * FROM notifications WHERE user_id = $1 ORDER BY created_at DESC;`,
      [userId]
    );
    return res.rows.map(mapNotification);
  }

  public async createNotification(entry: Omit<NotificationRecord, 'id' | 'created_at' | 'is_read'>): Promise<NotificationRecord> {
    const id = `NOTIF-${Math.floor(1000 + Math.random() * 9000)}`;
    const res = await query(
      `INSERT INTO notifications (id, user_id, title, message, type, request_id, is_read, created_at)
       VALUES ($1, $2, $3, $4, $5, $6, FALSE, NOW())
       RETURNING *;`,
      [
        id,
        entry.user_id,
        entry.title,
        entry.message,
        entry.type,
        entry.request_id || null,
      ]
    );

    return mapNotification(res.rows[0]);
  }

  public async markNotificationRead(id: string, userId: string): Promise<boolean> {
    const res = await query(
      `UPDATE notifications SET is_read = TRUE WHERE id = $1 AND user_id = $2 RETURNING id;`,
      [id, userId]
    );
    return res.rows.length > 0;
  }

  public async markAllNotificationsRead(userId: string): Promise<number> {
    const res = await query(
      `UPDATE notifications SET is_read = TRUE WHERE user_id = $1 AND is_read = FALSE;`,
      [userId]
    );
    return res.rowCount;
  }

  // --- Policy Settings ---
  public getPolicy(): SystemPolicy {
    return { ...this.policy };
  }

  public updatePolicy(newPolicy: Partial<SystemPolicy>): SystemPolicy {
    this.policy = { ...this.policy, ...newPolicy };
    return { ...this.policy };
  }
}

export const db = new SecureJitDatabase();

// Background auto-expiry interval running against PostgreSQL
setInterval(() => {
  db.checkAndExpireSessions().catch((err) => {
    console.error('[AutoExpire Interval Error]:', err.message);
  });
}, 4000);
