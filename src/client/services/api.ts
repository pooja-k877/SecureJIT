import {
  User,
  AccessRequest,
  ActiveAccess,
  AuditLog,
  NotificationItem,
  AdminStatistics,
  SecurityMonitorData,
  SystemPolicy
} from '../types.js';

class ApiService {
  private getHeaders(): HeadersInit {
    const token = localStorage.getItem('securejit_auth_token');
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
    };
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }
    return headers;
  }

  private async request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    const url = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;
    const headers = {
      ...this.getHeaders(),
      ...(options.headers || {}),
    };

    let response: Response;
    try {
      response = await fetch(url, {
        ...options,
        headers,
      });
    } catch (networkErr: any) {
      const isConnError =
        networkErr?.name === 'TypeError' ||
        networkErr?.message?.includes('fetch') ||
        networkErr?.message?.includes('Failed') ||
        networkErr?.message?.includes('Network') ||
        networkErr?.message?.includes('refused');

      if (isConnError) {
        const customErr = new Error('SecureJIT server is unavailable. Please make sure the backend and database are running.') as any;
        customErr.isServerUnavailable = true;
        customErr.status = 503;
        throw customErr;
      }
      throw networkErr;
    }

    const data = await response.json().catch(() => ({}));

    if (!response.ok) {
      if (response.status === 503) {
        const customErr = new Error(data.message || 'SecureJIT server is unavailable. Please make sure the backend and database are running.') as any;
        customErr.isServerUnavailable = true;
        customErr.status = 503;
        throw customErr;
      }
      const errorMessage = data.message || `Request failed with status ${response.status}`;
      const err = new Error(errorMessage) as any;
      err.status = response.status;
      err.code = data.error;
      throw err;
    }

    return data as T;
  }

  // --- Auth Endpoints ---
  async login(credentials: { email: string; password: string }): Promise<{ token: string; user: User }> {
    return this.request('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify(credentials),
    });
  }

  async register(data: { name: string; email: string; password: string; department?: string; role?: string }): Promise<{ token: string; user: User }> {
    return this.request('/api/auth/register', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async getMe(): Promise<{ user: User }> {
    return this.request('/api/auth/me');
  }

  async logout(): Promise<void> {
    try {
      await this.request('/api/auth/logout', { method: 'POST' });
    } catch (e) {
      // Continue client cleanup even if network fails
    }
  }

  async changePassword(data: { currentPassword: string; newPassword: string }): Promise<{ success: boolean; message: string }> {
    return this.request('/api/auth/change-password', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  // --- Access Requests ---
  async getAccessRequests(filters?: { status?: string; riskLevel?: string; isEmergency?: boolean }): Promise<{ requests: AccessRequest[] }> {
    const params = new URLSearchParams();
    if (filters?.status) params.append('status', filters.status);
    if (filters?.riskLevel) params.append('riskLevel', filters.riskLevel);
    if (filters?.isEmergency !== undefined) params.append('isEmergency', String(filters.isEmergency));

    const qs = params.toString() ? `?${params.toString()}` : '';
    return this.request(`/api/access-requests${qs}`);
  }

  async getAccessRequestById(id: string): Promise<{ request: AccessRequest; history: AccessRequest[] }> {
    return this.request(`/api/access-requests/${id}`);
  }

  async submitAccessRequest(data: {
    resource: string;
    role: string;
    durationMinutes: number;
    reason: string;
    ticketId?: string;
  }): Promise<{ success: boolean; message: string; request: AccessRequest }> {
    return this.request('/api/access-requests', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async approveAccessRequest(id: string, comment?: string): Promise<{ success: boolean; message: string; request: AccessRequest }> {
    return this.request(`/api/access-requests/${id}/approve`, {
      method: 'POST',
      body: JSON.stringify({ comment }),
    });
  }

  async rejectAccessRequest(id: string, reason: string): Promise<{ success: boolean; message: string; request: AccessRequest }> {
    return this.request(`/api/access-requests/${id}/reject`, {
      method: 'POST',
      body: JSON.stringify({ reason }),
    });
  }

  // --- Active Access ---
  async getActiveAccess(): Promise<{ sessions: ActiveAccess[] }> {
    return this.request('/api/active-access');
  }

  async revokeActiveAccess(id: string): Promise<{ success: boolean; message: string; session: ActiveAccess }> {
    return this.request(`/api/active-access/${id}/revoke`, {
      method: 'POST',
    });
  }

  // --- Emergency Access ---
  async submitEmergencyAccess(data: {
    resource: string;
    role: string;
    durationMinutes: number;
    emergencyReason: string;
    incidentTicketId: string;
    termsAccepted: boolean;
  }): Promise<{ success: boolean; message: string; isImmediate: boolean; request: AccessRequest; activeSession?: ActiveAccess }> {
    return this.request('/api/emergency-access', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  // --- Audit Logs ---
  async getAuditLogs(filters?: { action?: string; search?: string; userEmail?: string }): Promise<{ total: number; logs: AuditLog[] }> {
    const params = new URLSearchParams();
    if (filters?.action) params.append('action', filters.action);
    if (filters?.search) params.append('search', filters.search);
    if (filters?.userEmail) params.append('userEmail', filters.userEmail);

    const qs = params.toString() ? `?${params.toString()}` : '';
    return this.request(`/api/audit-logs${qs}`);
  }

  // --- Notifications ---
  async getNotifications(): Promise<{ notifications: NotificationItem[]; unreadCount: number }> {
    return this.request('/api/notifications');
  }

  async markNotificationRead(id: string): Promise<{ success: boolean }> {
    return this.request(`/api/notifications/${id}/read`, { method: 'POST' });
  }

  async markAllNotificationsRead(): Promise<{ success: boolean; count: number }> {
    return this.request('/api/notifications/read-all', { method: 'POST' });
  }

  // --- Admin Endpoints ---
  async getAdminStatistics(): Promise<AdminStatistics> {
    return this.request('/api/admin/statistics');
  }

  async getAdminUsers(): Promise<{ users: User[] }> {
    return this.request('/api/admin/users');
  }

  async toggleUserStatus(userId: string): Promise<{ success: boolean; message: string; user: User }> {
    return this.request(`/api/admin/users/${userId}/toggle-status`, { method: 'POST' });
  }

  async getSecurityMonitor(): Promise<SecurityMonitorData> {
    return this.request('/api/admin/security-monitor');
  }

  async getEmergencyRequests(): Promise<{ requests: AccessRequest[]; policy: SystemPolicy }> {
    return this.request('/api/admin/emergency-requests');
  }

  async updateSystemPolicy(policy: Partial<SystemPolicy>): Promise<{ success: boolean; policy: SystemPolicy }> {
    return this.request('/api/admin/policy', {
      method: 'PUT',
      body: JSON.stringify(policy),
    });
  }
}

export const api = new ApiService();
