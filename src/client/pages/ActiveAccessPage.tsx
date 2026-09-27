import React, { useState, useEffect } from 'react';
import { api } from '../services/api.js';
import { useNotifications } from '../context/NotificationContext.js';
import { ActiveAccess } from '../types.js';
import { StatusBadge } from '../components/StatusBadge.js';
import { CountdownTimer } from '../components/CountdownTimer.js';
import { ConfirmModal } from '../components/ConfirmModal.js';
import { EmptyState } from '../components/EmptyState.js';
import { Clock, Key, RotateCcw, AlertTriangle, ShieldCheck, Flame } from 'lucide-react';

interface ActiveAccessPageProps {
  onNavigate: (page: string) => void;
}

export const ActiveAccessPage: React.FC<ActiveAccessPageProps> = ({ onNavigate }) => {
  const { showToast } = useNotifications();
  const [sessions, setSessions] = useState<ActiveAccess[]>([]);
  const [loading, setLoading] = useState(true);

  const [sessionToRevoke, setSessionToRevoke] = useState<ActiveAccess | null>(null);
  const [revoking, setRevoking] = useState(false);

  const loadSessions = async () => {
    try {
      setLoading(true);
      const res = await api.getActiveAccess();
      setSessions(res.sessions);
    } catch (err: any) {
      showToast('Failed to load active access sessions.', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadSessions();
    const interval = setInterval(loadSessions, 6000);
    return () => clearInterval(interval);
  }, []);

  const handleRevokeConfirm = async () => {
    if (!sessionToRevoke) return;
    setRevoking(true);
    try {
      await api.revokeActiveAccess(sessionToRevoke.id);
      showToast(`Privileged access on ${sessionToRevoke.resource} revoked.`, 'info');
      setSessionToRevoke(null);
      await loadSessions();
    } catch (err: any) {
      showToast(err.message || 'Failed to revoke access.', 'error');
    } finally {
      setRevoking(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-2 border-b border-slate-800">
        <div>
          <h1 className="text-lg font-bold font-mono text-slate-100 flex items-center gap-2">
            <Clock className="w-5 h-5 text-emerald-400" />
            Active Privileged Sessions
          </h1>
          <p className="text-xs text-slate-400 mt-0.5">
            Real-time monitoring of currently elevated Azure role assignments and time-remaining countdowns.
          </p>
        </div>

        <button
          onClick={loadSessions}
          disabled={loading}
          className="px-3 py-1.5 text-xs text-slate-400 hover:text-slate-200 border border-slate-800 hover:border-slate-700 bg-slate-900 rounded transition-colors flex items-center gap-1.5 focus:outline-none"
        >
          <RotateCcw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          <span>Refresh Sessions</span>
        </button>
      </div>

      {sessions.length === 0 ? (
        <EmptyState
          title="No Active Privileged Access"
          description="You currently have no active role assignments on any Azure cloud resources. Submit a Just-In-Time access request when elevation is required."
          action={{
            label: 'Request Access Now',
            onClick: () => onNavigate('request-access'),
          }}
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {sessions.map((session) => (
            <div
              key={session.id}
              className="p-5 rounded-lg bg-slate-900 border border-slate-800 shadow-md flex flex-col justify-between space-y-4 relative overflow-hidden"
            >
              {/* Highlight bar */}
              <div
                className={`absolute top-0 left-0 right-0 h-1 ${
                  session.access_type === 'EMERGENCY' ? 'bg-rose-500' : 'bg-emerald-500'
                }`}
              />

              {/* Header Info */}
              <div className="flex items-start justify-between gap-4 pt-1">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-xs font-bold text-slate-300">{session.id}</span>
                    <StatusBadge status={session.status} />
                    {session.access_type === 'EMERGENCY' && (
                      <span className="text-2xs font-mono text-rose-400 bg-rose-950/70 border border-rose-800 px-1.5 py-0.2 rounded flex items-center gap-1">
                        <Flame className="w-2.5 h-2.5" /> BREAK-GLASS
                      </span>
                    )}
                  </div>
                  <h3 className="text-base font-semibold text-slate-100 mt-2 flex items-center gap-1.5">
                    <Key className="w-4 h-4 text-sky-400" />
                    {session.resource}
                  </h3>
                  <p className="text-xs font-mono text-sky-400 mt-0.5">{session.role}</p>
                </div>

                <button
                  onClick={() => setSessionToRevoke(session)}
                  className="px-3 py-1.5 text-xs font-medium text-rose-400 hover:text-white hover:bg-rose-600 border border-rose-800/80 rounded transition-colors focus:outline-none shrink-0"
                >
                  Revoke Early
                </button>
              </div>

              {/* Timing Metadata */}
              <div className="grid grid-cols-2 gap-3 p-3 bg-slate-950/60 rounded border border-slate-800 text-2xs">
                <div>
                  <span className="text-slate-500">Elevation Began:</span>
                  <p className="text-slate-300 font-mono mt-0.5">
                    {new Date(session.started_at).toLocaleTimeString()}
                  </p>
                </div>
                <div>
                  <span className="text-slate-500">De-provision At:</span>
                  <p className="text-slate-300 font-mono mt-0.5">
                    {new Date(session.expires_at).toLocaleTimeString()}
                  </p>
                </div>
              </div>

              {/* Real Ticking Countdown Timer */}
              <div className="pt-2 border-t border-slate-800/80">
                <CountdownTimer
                  expiresAt={session.expires_at}
                  startedAt={session.started_at}
                  showProgress
                  onExpire={() => {
                    showToast(`Session ${session.id} has expired. Access de-provisioned.`, 'info');
                    loadSessions();
                  }}
                />
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Revocation Modal */}
      <ConfirmModal
        isOpen={Boolean(sessionToRevoke)}
        onClose={() => setSessionToRevoke(null)}
        onConfirm={handleRevokeConfirm}
        title="Revoke Privileged Access Early"
        message={`Are you sure you want to revoke your privileged access for ${sessionToRevoke?.role} on ${sessionToRevoke?.resource}? This will immediately de-provision your credentials and record the revocation in the compliance audit trail.`}
        confirmLabel="Revoke Access Now"
        variant="danger"
        loading={revoking}
      />
    </div>
  );
};
