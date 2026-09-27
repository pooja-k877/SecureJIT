import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext.js';
import { useNotifications } from '../context/NotificationContext.js';
import { api } from '../services/api.js';
import { AccessRequest, ActiveAccess } from '../types.js';
import { StatCard } from '../components/StatCard.js';
import { StatusBadge } from '../components/StatusBadge.js';
import { RiskBadge } from '../components/RiskBadge.js';
import { CountdownTimer } from '../components/CountdownTimer.js';
import { ConfirmModal } from '../components/ConfirmModal.js';
import { RequestDetailModal } from '../components/RequestDetailModal.js';
import { EmptyState } from '../components/EmptyState.js';
import {
  Clock,
  KeyRound,
  ShieldCheck,
  FileCheck2,
  AlertTriangle,
  Flame,
  ArrowRight,
  ShieldAlert,
  RotateCcw
} from 'lucide-react';

interface DashboardPageProps {
  onNavigate: (page: string) => void;
  onSelectRequest?: (req: AccessRequest) => void;
}

export const DashboardPage: React.FC<DashboardPageProps> = ({ onNavigate }) => {
  const { user } = useAuth();
  const { showToast } = useNotifications();

  const [activeSessions, setActiveSessions] = useState<ActiveAccess[]>([]);
  const [requests, setRequests] = useState<AccessRequest[]>([]);
  const [loading, setLoading] = useState(true);

  // Revoke state
  const [sessionToRevoke, setSessionToRevoke] = useState<ActiveAccess | null>(null);
  const [revokeLoading, setRevokeLoading] = useState(false);

  // Selected request detail modal
  const [selectedRequest, setSelectedRequest] = useState<AccessRequest | null>(null);
  const [requestHistory, setRequestHistory] = useState<AccessRequest[]>([]);
  const [detailModalOpen, setDetailModalOpen] = useState(false);

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      const [sessionsRes, requestsRes] = await Promise.all([
        api.getActiveAccess(),
        api.getAccessRequests(),
      ]);

      setActiveSessions(sessionsRes.sessions);
      setRequests(requestsRes.requests);
    } catch (err: any) {
      showToast('Failed to load dashboard data.', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDashboardData();
    const interval = setInterval(loadDashboardData, 10000);
    return () => clearInterval(interval);
  }, []);

  // Handle early revocation
  const handleRevokeConfirm = async () => {
    if (!sessionToRevoke) return;
    setRevokeLoading(true);
    try {
      await api.revokeActiveAccess(sessionToRevoke.id);
      showToast(`Privileged access on ${sessionToRevoke.resource} revoked.`, 'info');
      setSessionToRevoke(null);
      await loadDashboardData();
    } catch (err: any) {
      showToast(err.message || 'Failed to revoke access.', 'error');
    } finally {
      setRevokeLoading(false);
    }
  };

  const handleOpenDetail = async (req: AccessRequest) => {
    try {
      const res = await api.getAccessRequestById(req.id);
      setSelectedRequest(res.request);
      setRequestHistory(res.history);
      setDetailModalOpen(true);
    } catch (err) {
      setSelectedRequest(req);
      setRequestHistory([]);
      setDetailModalOpen(true);
    }
  };

  // Compute live statistics from real backend data
  const pendingCount = requests.filter(r => r.status === 'PENDING').length;
  const activeCount = activeSessions.length;
  const expiringSoonCount = activeSessions.filter(s => {
    const msLeft = new Date(s.expires_at).getTime() - Date.now();
    return msLeft > 0 && msLeft <= 15 * 60000;
  }).length;
  const totalCount = requests.length;

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-2 border-b border-slate-800">
        <div>
          <h1 className="text-lg font-bold font-mono text-slate-100 flex items-center gap-2">
            <span>Identity Governance Dashboard</span>
            <span className="text-2xs font-mono text-slate-400 font-normal">({user?.email})</span>
          </h1>
          <p className="text-xs text-slate-400 mt-0.5">
            Active Just-In-Time role elevations and recent privileged credential audits.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={() => onNavigate('emergency-access')}
            className="px-3 py-1.5 text-xs font-semibold text-rose-300 bg-rose-950/40 hover:bg-rose-900/60 border border-rose-800/80 rounded transition-colors flex items-center gap-1.5 focus:outline-none"
          >
            <Flame className="w-3.5 h-3.5 text-rose-400" />
            <span>Emergency Break-Glass</span>
          </button>
          <button
            onClick={() => onNavigate('request-access')}
            className="px-3.5 py-1.5 text-xs font-semibold text-white bg-sky-600 hover:bg-sky-500 rounded transition-colors flex items-center gap-1.5 shadow-sm focus:outline-none"
          >
            <KeyRound className="w-3.5 h-3.5" />
            <span>Request JIT Access</span>
          </button>
        </div>
      </div>

      {/* Real Statistics Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Active Access"
          value={activeCount}
          subtext="Elevated role assignments"
          icon={<Clock className="w-5 h-5" />}
          variant={activeCount > 0 ? 'success' : 'default'}
        />
        <StatCard
          title="Pending Requests"
          value={pendingCount}
          subtext="Awaiting admin approval"
          icon={<FileCheck2 className="w-5 h-5" />}
          variant={pendingCount > 0 ? 'warning' : 'default'}
        />
        <StatCard
          title="Expiring Soon"
          value={expiringSoonCount}
          subtext="Under 15 minutes remaining"
          icon={<AlertTriangle className="w-5 h-5" />}
          variant={expiringSoonCount > 0 ? 'alert' : 'default'}
        />
        <StatCard
          title="Total Requests"
          value={totalCount}
          subtext="All historical requests"
          icon={<ShieldCheck className="w-5 h-5" />}
        />
      </div>

      {/* Active Privileged Access Section with Real Countdown Timers */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <h2 className="text-xs font-semibold font-mono uppercase tracking-wider text-slate-300">
              Active Privileged Access Sessions
            </h2>
            <span className="text-2xs font-mono font-medium px-1.5 py-0.2 rounded bg-emerald-950/80 text-emerald-400 border border-emerald-800">
              {activeSessions.length} Active
            </span>
          </div>
          <button
            onClick={loadDashboardData}
            className="text-2xs text-slate-400 hover:text-slate-200 flex items-center gap-1 transition-colors"
          >
            <RotateCcw className="w-3 h-3" /> Refresh
          </button>
        </div>

        {activeSessions.length === 0 ? (
          <EmptyState
            title="No Active Privileged Access"
            description="You do not currently possess active administrator or contributor elevations. Submit a request to obtain Just-In-Time access."
            action={{
              label: 'Request Access Now',
              onClick: () => onNavigate('request-access'),
            }}
          />
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {activeSessions.map((session) => (
              <div
                key={session.id}
                className="p-4 rounded-lg bg-slate-900 border border-slate-800 space-y-3 relative overflow-hidden"
              >
                {/* Left color bar */}
                <div
                  className={`absolute left-0 top-0 bottom-0 w-1 ${
                    session.access_type === 'EMERGENCY' ? 'bg-rose-500' : 'bg-emerald-500'
                  }`}
                />

                <div className="flex items-start justify-between gap-3 pl-1">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-2xs font-semibold text-slate-400">{session.id}</span>
                      <StatusBadge status={session.status} size="sm" />
                      {session.access_type === 'EMERGENCY' && (
                        <span className="text-3xs font-mono text-rose-400 bg-rose-950/60 border border-rose-800 px-1.5 py-0.2 rounded">
                          EMERGENCY
                        </span>
                      )}
                    </div>
                    <h3 className="text-sm font-semibold text-slate-100 mt-1">{session.resource}</h3>
                    <p className="text-xs text-sky-400 font-mono mt-0.5">{session.role}</p>
                  </div>

                  <button
                    onClick={() => setSessionToRevoke(session)}
                    className="px-2.5 py-1 text-2xs font-medium text-rose-400 hover:text-white hover:bg-rose-600 border border-rose-900/60 rounded transition-colors focus:outline-none shrink-0"
                  >
                    Revoke Early
                  </button>
                </div>

                {/* Real-time Ticking Countdown with Progress */}
                <div className="pl-1 pt-2 border-t border-slate-800/80">
                  <CountdownTimer
                    expiresAt={session.expires_at}
                    startedAt={session.started_at}
                    showProgress
                    onExpire={() => {
                      showToast(`Session ${session.id} on ${session.resource} has expired.`, 'info');
                      loadDashboardData();
                    }}
                  />
                  <div className="flex items-center justify-between text-3xs text-slate-500 mt-2 font-mono">
                    <span>Started: {new Date(session.started_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                    <span>Expires: {new Date(session.expires_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Recent Access Requests */}
      <div className="space-y-3 pt-2">
        <div className="flex items-center justify-between">
          <h2 className="text-xs font-semibold font-mono uppercase tracking-wider text-slate-300">
            Recent Elevation Requests
          </h2>
          <button
            onClick={() => onNavigate('my-requests')}
            className="text-2xs text-sky-400 hover:text-sky-300 flex items-center gap-1 transition-colors"
          >
            <span>View all requests</span>
            <ArrowRight className="w-3 h-3" />
          </button>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-lg overflow-hidden">
          {requests.length === 0 ? (
            <div className="p-8 text-center text-xs text-slate-400">
              No privileged access requests found.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-950/70 border-b border-slate-800 text-2xs uppercase tracking-wider text-slate-400 font-mono">
                  <tr>
                    <th className="px-4 py-3">Request ID</th>
                    <th className="px-4 py-3">Resource</th>
                    <th className="px-4 py-3">Role</th>
                    <th className="px-4 py-3">Duration</th>
                    <th className="px-4 py-3">Risk Tier</th>
                    <th className="px-4 py-3">Status</th>
                    <th className="px-4 py-3 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60">
                  {requests.slice(0, 5).map((req) => (
                    <tr key={req.id} className="hover:bg-slate-800/40 transition-colors">
                      <td className="px-4 py-3 font-mono font-medium text-slate-300">
                        {req.id}
                        {req.is_emergency && (
                          <span className="ml-1.5 text-3xs font-mono text-rose-400 bg-rose-950 px-1 py-0.2 rounded border border-rose-900">
                            EMERGENCY
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-3 font-medium text-slate-200">{req.resource}</td>
                      <td className="px-4 py-3 font-mono text-slate-400">{req.role}</td>
                      <td className="px-4 py-3 text-slate-400">{req.duration_minutes}m</td>
                      <td className="px-4 py-3">
                        <RiskBadge level={req.risk_level} score={req.risk_score} />
                      </td>
                      <td className="px-4 py-3">
                        <StatusBadge status={req.status} size="sm" />
                      </td>
                      <td className="px-4 py-3 text-right">
                        <button
                          onClick={() => handleOpenDetail(req)}
                          className="text-xs text-sky-400 hover:text-sky-300 font-medium transition-colors"
                        >
                          View Details
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* Revocation Confirmation Dialog */}
      <ConfirmModal
        isOpen={Boolean(sessionToRevoke)}
        onClose={() => setSessionToRevoke(null)}
        onConfirm={handleRevokeConfirm}
        title="Revoke Privileged Access Early"
        message={`Are you sure you want to revoke your privileged access for ${sessionToRevoke?.role} on ${sessionToRevoke?.resource}? This will immediately de-provision your Azure credentials and log an audit event.`}
        confirmLabel="Revoke Access Now"
        variant="danger"
        loading={revokeLoading}
      />

      {/* Request Detail Modal */}
      <RequestDetailModal
        isOpen={detailModalOpen}
        request={selectedRequest}
        history={requestHistory}
        onClose={() => setDetailModalOpen(false)}
      />
    </div>
  );
};
