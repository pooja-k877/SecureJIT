export type UserRole = 'USER' | 'ADMIN';
export type RequestStatus = 'PENDING' | 'APPROVED' | 'REJECTED' | 'ACTIVE' | 'EXPIRED' | 'REVOKED';
export type RiskLevel = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
export type AccessType = 'JIT' | 'EMERGENCY';

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  department: string;
  status: 'ACTIVE' | 'DISABLED';
  created_at: string;
  last_login_at?: string;
}

export interface AccessRequest {
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
  risk_level: RiskLevel;
  risk_score: number;
  risk_reasons: string[];
  status: RequestStatus;
  reviewer_id?: string;
  reviewer_name?: string;
  review_comment?: string;
  requested_at: string;
  reviewed_at?: string;
  started_at?: string;
  expires_at?: string;
}

export interface ActiveAccess {
  id: string;
  request_id: string;
  user_id: string;
  user_name: string;
  user_email: string;
  resource: string;
  role: string;
  access_type: AccessType;
  started_at: string;
  expires_at: string;
  status: 'ACTIVE' | 'REVOKED' | 'EXPIRED';
  revoked_at?: string;
  revoked_by?: string;
}

export interface AuditLog {
  id: string;
  user_id?: string;
  user_name: string;
  user_email: string;
  action: string;
  resource?: string;
  role?: string;
  details: string;
  ip_address?: string;
  timestamp: string;
}

export interface NotificationItem {
  id: string;
  user_id: string;
  title: string;
  message: string;
  type: 'INFO' | 'SUCCESS' | 'WARNING' | 'ALERT';
  request_id?: string;
  is_read: boolean;
  created_at: string;
}

export interface AdminStatistics {
  pendingRequests: number;
  activeSessions: number;
  highRiskRequests: number;
  emergencySessions: number;
  todayAccessEvents: number;
  expiredSessions: number;
  totalRequests: number;
  totalUsers: number;
  activeUsers: number;
}

export interface SecurityMonitorData {
  highRiskRequests: AccessRequest[];
  emergencyRequests: AccessRequest[];
  longDurationRequests: AccessRequest[];
  adminRoleRequests: AccessRequest[];
  ownerRoleRequests: AccessRequest[];
  failedLogins: AuditLog[];
  activeSessions: ActiveAccess[];
  metrics: {
    totalHighRisk: number;
    totalEmergency: number;
    totalLongDuration: number;
    totalOwnerRequests: number;
    failedLoginCount: number;
  };
}

export interface SystemPolicy {
  emergencyAccessMode: 'IMMEDIATE_AUTO_APPROVAL' | 'REQUIRE_ADMIN_APPROVAL';
  maxJitDurationMinutes: number;
  requireTicketNumber: boolean;
}
