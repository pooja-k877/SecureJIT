import React, { useState, useEffect } from 'react';
import { api } from '../../services/api.js';
import { useNotifications } from '../../context/NotificationContext.js';
import { AdminStatistics, AccessRequest, ActiveAccess } from '../../types.js';
import { StatCard } from '../../components/StatCard.js';
import { StatusBadge } from '../../components/StatusBadge.js';
import { RiskBadge } from '../../components/RiskBadge.js';
import { CountdownTimer } from '../../components/CountdownTimer.js';
import { RequestDetailModal } from '../../components/RequestDetailModal.js';
import { ConfirmModal } from '../../components/ConfirmModal.js';
import {
  ShieldCheck,
  FileCheck2,
  Clock,
  ShieldAlert,
  Flame,
  Activity,
  ArrowRight,
  RotateCcw,
  CheckCircle,
  AlertTriangle,
  Users
} from 'lucide-react';

interface AdminDashboardPageProps {
  onNavigate: (page: string) => void;
}

export const AdminDashboardPage: React.FC<AdminDashboardPageProps> = ({ onNavigate }) => {
  const { showToast } = useNotifications();

  const [stats, setStats] = useState<AdminStatistics | null>(null);
  const [pendingRequests, setPendingRequests] = useState<AccessRequest[]>([]);
  const [activeSessions, setActiveSessions] = useState<ActiveAccess[]>([]);
  const [loading, setLoading] = useState(true);

  // Modal actions
  const [selectedReq, setSelectedReq] = useState<AccessRequest | null>(null);
  const [detailOpen, setDetailOpen] = useState(false);
  const [approveReq, setApproveReq] = useState<AccessRequest | null>(null);
  const [rejectReq, setRejectReq] = useState<AccessRequest | null>(null);
  const [actionLoading, setActionLoading] = useState(false);

  const loadAdminData = async () => {
    try {
      setLoading(true);
      const [statsRes, requestsRes, sessionsRes] = await Promise.all([
        api.getAdminStatistics(),
        api.getAccessRequests({ status: 'PENDING' }),
        api.getActiveAccess(),
      ]);

      setStats(statsRes);
      setPendingRequests(requestsRes.requests);
      setActiveSessions(sessionsRes.sessions);
    } catch (err: any) {
      showToast('Failed to load administrative overview data.', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAdminData();
    const interval = setInterval(loadAdminData, 8000);
    return () => clearInterval(interval);
  }, []);

  const handleApprove = async (comment?: string) => {
    if (!approveReq) return;
    setActionLoading(true);
    try {
      await api.approveAccessRequest(approveReq.id, comment);
      showToast(`Request ${approveReq.id} approved. Access activated on Azure.`, 'success');
      setApproveReq(null);
      setDetailOpen(false);
      await loadAdminData();
    } catch (err: any) {
      showToast(err.message || 'Approval failed.', 'error');
    } finally {
      setActionLoading(false);
    }
  };

  const handleReject = async (reason?: string) => {
    if (!rejectReq || !reason) return;
    setActionLoading(true);
    try {
      await api.rejectAccessRequest(rejectReq.id, reason);
      showToast(`Request ${rejectReq.id} rejected. Requester notified.`, 'info');
      setRejectReq(null);
      setDetailOpen(false);
      await loadAdminData();
    } catch (err: any) {
      showToast(err.message || 'Rejection failed.', 'error');
    } finally {
      setActionLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-2 border-b border-slate-800">
        <div>
          <h1 className="text-lg font-bold font-mono text-slate-100 flex items-center gap-2">
            <ShieldCheck className="w-5 h-5 text-sky-400" />
            Security Administration Console
          </h1>
          <p className="text-xs text-slate-400 mt-0.5">
            Cloud Privileged Identity Governance · Review queue & real-time security posture.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={loadAdminData}
            disabled={loading}
            className="px-3 py-1.5 text-xs text-slate-400 hover:text-slate-200 border border-slate-800 bg-slate-900 rounded transition-colors flex items-center gap-1.5 focus:outline-none"
          >
            <RotateCcw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            <span>Sync Control Plane</span>
          </button>
        </div>
      </div>

      {/* Admin Real Statistics */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-3.5">
        <StatCard
          title="Pending Requests"
          value={stats?.pendingRequests ?? 0}
          subtext="Requires approval"
          icon={<FileCheck2 className="w-5 h-5" />}
          variant={(stats?.pendingRequests ?? 0) > 0 ? 'warning' : 'default'}
        />
        <StatCard
          title="Active Sessions"
          value={stats?.activeSessions ?? 0}
          subtext="Current JIT elevations"
          icon={<Clock className="w-5 h-5" />}
          variant={(stats?.activeSessions ?? 0) > 0 ? 'success' : 'default'}
        />
        <StatCard
          title="High Risk Requests"
          value={stats?.highRiskRequests ?? 0}
          subtext="High / Critical score"
          icon={<ShieldAlert className="w-5 h-5" />}
          variant={(stats?.highRiskRequests ?? 0) > 0 ? 'alert' : 'default'}
        />
        <StatCard
          title="Emergency Sessions"
          value={stats?.emergencySessions ?? 0}
          subtext="Break-glass active"
          icon={<Flame className="w-5 h-5" />}
          variant={(stats?.emergencySessions ?? 0) > 0 ? 'alert' : 'default'}
        />
        <StatCard
          title="24h Access Events"
          value={stats?.todayAccessEvents ?? 0}
          subtext="Recorded audit entries"
          icon={<Activity className="w-5 h-5" />}
        />
      </div>

      {/* Security Posture Radar */}
      <div className="p-4 rounded-lg bg-slate-900 border border-slate-800 space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Activity className="w-4 h-4 text-sky-400" />
            <h3 className="text-xs font-mono uppercase tracking-wider font-semibold text-slate-200">
              Application Security Posture
            </h3>
          </div>
          <span className="text-2xs font-mono text-emerald-400 bg-emerald-950/70 border border-emerald-800 px-2 py-0.5 rounded">
            JIT Hygiene: Optimal
          </span>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-2xs">
          <div className="p-3 bg-slate-950/60 rounded border border-slate-800">
            <span className="text-slate-500">Auto-Expired Sessions</span>
            <p className="font-mono text-slate-200 text-sm font-semibold mt-0.5">{stats?.expiredSessions ?? 0}</p>
          </div>
          <div className="p-3 bg-slate-950/60 rounded border border-slate-800">
            <span className="text-slate-500">Directory Accounts</span>
            <p className="font-mono text-slate-200 text-sm font-semibold mt-0.5">{stats?.totalUsers ?? 0}</p>
          </div>
          <div className="p-3 bg-slate-950/60 rounded border border-slate-800">
            <span className="text-slate-500">Active Accounts</span>
            <p className="font-mono text-emerald-400 text-sm font-semibold mt-0.5">{stats?.activeUsers ?? 0}</p>
          </div>
          <div className="p-3 bg-slate-950/60 rounded border border-slate-800">
            <span className="text-slate-500">Total Lifecycle Requests</span>
            <p className="font-mono text-slate-200 text-sm font-semibold mt-0.5">{stats?.totalRequests ?? 0}</p>
          </div>
        </div>
      </div>

      {/* Priority Pending Reviews */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <h2 className="text-xs font-semibold font-mono uppercase tracking-wider text-slate-300">
              Pending Authorization Queue
            </h2>
            <span className="text-2xs font-mono font-medium px-2 py-0.5 rounded-full bg-amber-950/80 text-amber-400 border border-amber-800">
              {pendingRequests.length} Waiting Review
            </span>
          </div>
          <button
            onClick={() => onNavigate('admin-pending')}
            className="text-2xs text-sky-400 hover:text-sky-300 flex items-center gap-1 transition-colors"
          >
            <span>Full Review Queue</span>
            <ArrowRight className="w-3 h-3" />
          </button>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-lg overflow-hidden">
          {pendingRequests.length === 0 ? (
            <div className="p-8 text-center text-xs text-slate-400">
              All access requests have been reviewed. No pending approvals in queue.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-950/80 border-b border-slate-800 text-2xs uppercase tracking-wider text-slate-400 font-mono">
                  <tr>
                    <th className="px-4 py-3">Request ID</th>
                    <th className="px-4 py-3">Requester</th>
                    <th className="px-4 py-3">Resource</th>
                    <th className="px-4 py-3">Role</th>
                    <th className="px-4 py-3">Duration</th>
                    <th className="px-4 py-3">Risk Tier</th>
                    <th className="px-4 py-3">Justification</th>
                    <th className="px-4 py-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60">
                  {pendingRequests.map((req) => (
                    <tr key={req.id} className="hover:bg-slate-800/40 transition-colors">
                      <td className="px-4 py-3 font-mono font-medium text-slate-300 whitespace-nowrap">
                        {req.id}
                        {req.is_emergency && (
                          <span className="block text-3xs font-mono text-rose-400">BREAK-GLASS</span>
                        )}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap">
                        <div className="font-medium text-slate-200">{req.user_name}</div>
                        <div className="text-3xs text-slate-500 font-mono">{req.user_email}</div>
                      </td>
                      <td className="px-4 py-3 font-medium text-slate-200 whitespace-nowrap">{req.resource}</td>
                      <td className="px-4 py-3 font-mono text-slate-300 whitespace-nowrap">{req.role}</td>
                      <td className="px-4 py-3 text-slate-400 whitespace-nowrap">{req.duration_minutes}m</td>
                      <td className="px-4 py-3 whitespace-nowrap">
                        <RiskBadge level={req.risk_level} score={req.risk_score} showScore />
                      </td>
                      <td className="px-4 py-3 max-w-xs truncate text-slate-400" title={req.reason}>
                        {req.reason}
                      </td>
                      <td className="px-4 py-3 text-right whitespace-nowrap">
                        <div className="inline-flex items-center gap-1.5">
                          <button
                            onClick={() => {
                              setSelectedReq(req);
                              setDetailOpen(true);
                            }}
                            className="px-2 py-1 text-2xs font-medium text-slate-300 hover:text-white bg-slate-800 hover:bg-slate-700 rounded transition-colors"
                          >
                            Inspect
                          </button>
                          <button
                            onClick={() => setApproveReq(req)}
                            className="px-2.5 py-1 text-2xs font-medium text-white bg-sky-600 hover:bg-sky-500 rounded transition-colors"
                          >
                            Approve
                          </button>
                          <button
                            onClick={() => setRejectReq(req)}
                            className="px-2.5 py-1 text-2xs font-medium text-rose-400 hover:text-white hover:bg-rose-600 border border-rose-900/60 rounded transition-colors"
                          >
                            Reject
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* Modals */}
      <RequestDetailModal
        isOpen={detailOpen}
        request={selectedReq}
        isAdmin={true}
        onClose={() => setDetailOpen(false)}
        onApprove={(r) => setApproveReq(r)}
        onReject={(r) => setRejectReq(r)}
      />

      {/* Approve Dialog with optional comment */}
      <ConfirmModal
        isOpen={Boolean(approveReq)}
        onClose={() => setApproveReq(null)}
        onConfirm={handleApprove}
        title="Approve Privileged Access Request"
        message={`Authorize temporary Just-In-Time role elevation for ${approveReq?.user_name} on ${approveReq?.resource} as ${approveReq?.role} (${approveReq?.duration_minutes}m)?`}
        confirmLabel="Approve & Activate"
        variant="primary"
        requiresInput
        inputLabel="Administrative Approval Note (Optional)"
        inputPlaceholder="e.g. Approved per ticket change schedule..."
        loading={actionLoading}
      />

      {/* Reject Dialog with mandatory reason */}
      <ConfirmModal
        isOpen={Boolean(rejectReq)}
        onClose={() => setRejectReq(null)}
        onConfirm={handleReject}
        title="Reject Privileged Access Request"
        message={`Are you sure you want to reject request ${rejectReq?.id} for ${rejectReq?.user_name}? A justification is required to explain the security denial.`}
        confirmLabel="Reject Request"
        variant="danger"
        requiresInput
        inputLabel="Mandatory Rejection Justification"
        inputPlaceholder="e.g. Role requested exceeds least-privilege bounds; request Reader role instead."
        inputRequired
        loading={actionLoading}
      />
    </div>
  );
};
