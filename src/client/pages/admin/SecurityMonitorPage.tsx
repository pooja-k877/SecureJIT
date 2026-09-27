import React, { useState, useEffect } from 'react';
import { api } from '../../services/api.js';
import { useNotifications } from '../../context/NotificationContext.js';
import { SecurityMonitorData, SystemPolicy } from '../../types.js';
import { RiskBadge } from '../../components/RiskBadge.js';
import { StatusBadge } from '../../components/StatusBadge.js';
import {
  Activity,
  ShieldAlert,
  Flame,
  Clock,
  KeyRound,
  AlertTriangle,
  RotateCcw,
  Sliders,
  CheckCircle,
  FileWarning
} from 'lucide-react';

export const SecurityMonitorPage: React.FC = () => {
  const { showToast } = useNotifications();

  const [data, setData] = useState<SecurityMonitorData | null>(null);
  const [policy, setPolicy] = useState<SystemPolicy | null>(null);
  const [loading, setLoading] = useState(true);
  const [savingPolicy, setSavingPolicy] = useState(false);

  const loadSecurityData = async () => {
    try {
      setLoading(true);
      const [monitorRes, policyRes] = await Promise.all([
        api.getSecurityMonitor(),
        api.getEmergencyRequests(),
      ]);

      setData(monitorRes);
      setPolicy(policyRes.policy);
    } catch (err: any) {
      showToast('Failed to load security monitoring metrics.', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadSecurityData();
    const interval = setInterval(loadSecurityData, 10000);
    return () => clearInterval(interval);
  }, []);

  const handlePolicyChange = async (newMode: 'IMMEDIATE_AUTO_APPROVAL' | 'REQUIRE_ADMIN_APPROVAL') => {
    if (!policy) return;
    setSavingPolicy(true);
    try {
      const res = await api.updateSystemPolicy({ emergencyAccessMode: newMode });
      setPolicy(res.policy);
      showToast(`Emergency Break-Glass Policy updated to: ${newMode}`, 'success');
    } catch (err: any) {
      showToast('Failed to update system security policy.', 'error');
    } finally {
      setSavingPolicy(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-2 border-b border-slate-800">
        <div>
          <h1 className="text-lg font-bold font-mono text-slate-100 flex items-center gap-2">
            <Activity className="w-5 h-5 text-sky-400" />
            Application Security Monitor & Risk Posture
          </h1>
          <p className="text-xs text-slate-400 mt-0.5">
            Internal telemetry tracking high-privilege elevations, break-glass events, and anomalous authorization requests.
          </p>
        </div>

        <button
          onClick={loadSecurityData}
          disabled={loading}
          className="px-3 py-1.5 text-xs text-slate-400 hover:text-slate-200 border border-slate-800 bg-slate-900 rounded transition-colors flex items-center gap-1.5 focus:outline-none"
        >
          <RotateCcw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          <span>Refresh Telemetry</span>
        </button>
      </div>

      {/* Break-Glass Emergency Policy Configuration */}
      <div className="p-4 rounded-lg bg-slate-900 border border-slate-800 space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Sliders className="w-4 h-4 text-sky-400" />
            <h3 className="text-xs font-mono uppercase tracking-wider font-semibold text-slate-200">
              Break-Glass Emergency Protocol Governance
            </h3>
          </div>
          <span className="text-2xs font-mono text-sky-400 bg-sky-950/70 border border-sky-800 px-2 py-0.5 rounded">
            Configurable Governance Policy
          </span>
        </div>

        <p className="text-2xs text-slate-400 leading-relaxed">
          Configure whether emergency break-glass requests bypass standard administrative SLA queues for immediate temporary activation or mandate expedited officer review.
        </p>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-1">
          <button
            type="button"
            onClick={() => handlePolicyChange('IMMEDIATE_AUTO_APPROVAL')}
            disabled={savingPolicy}
            className={`p-3 rounded text-left border transition-all text-xs focus:outline-none ${
              policy?.emergencyAccessMode === 'IMMEDIATE_AUTO_APPROVAL'
                ? 'border-sky-500 bg-sky-950/60 ring-1 ring-sky-500'
                : 'border-slate-800 bg-slate-950/80 hover:border-slate-700'
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="font-mono font-semibold text-slate-100 flex items-center gap-1.5">
                <Flame className="w-3.5 h-3.5 text-rose-400" />
                Immediate Temporary Activation
              </span>
              {policy?.emergencyAccessMode === 'IMMEDIATE_AUTO_APPROVAL' && (
                <CheckCircle className="w-4 h-4 text-sky-400" />
              )}
            </div>
            <p className="text-2xs text-slate-400 mt-1">
              Break-glass requests activate immediately for 10-30m with high-priority admin broadcast & forensic audit. Standard industry incident response pattern.
            </p>
          </button>

          <button
            type="button"
            onClick={() => handlePolicyChange('REQUIRE_ADMIN_APPROVAL')}
            disabled={savingPolicy}
            className={`p-3 rounded text-left border transition-all text-xs focus:outline-none ${
              policy?.emergencyAccessMode === 'REQUIRE_ADMIN_APPROVAL'
                ? 'border-sky-500 bg-sky-950/60 ring-1 ring-sky-500'
                : 'border-slate-800 bg-slate-950/80 hover:border-slate-700'
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="font-mono font-semibold text-slate-100 flex items-center gap-1.5">
                <ShieldAlert className="w-3.5 h-3.5 text-amber-400" />
                Require Expedited Administrator Review
              </span>
              {policy?.emergencyAccessMode === 'REQUIRE_ADMIN_APPROVAL' && (
                <CheckCircle className="w-4 h-4 text-sky-400" />
              )}
            </div>
            <p className="text-2xs text-slate-400 mt-1">
              Break-glass requests flag as critical in the queue and require an explicit security officer confirmation before granting temporary credentials.
            </p>
          </button>
        </div>
      </div>

      {/* Security Threat Signals Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5">
        <div className="p-3.5 bg-slate-900 border border-orange-900/50 rounded-lg">
          <div className="flex items-center justify-between">
            <span className="text-2xs uppercase tracking-wider text-slate-400 font-semibold">High Risk Requests</span>
            <ShieldAlert className="w-4 h-4 text-orange-400" />
          </div>
          <span className="text-2xl font-bold font-mono text-orange-400 mt-1 block">
            {data?.metrics.totalHighRisk ?? 0}
          </span>
          <span className="text-3xs text-slate-500 mt-0.5 block">High & Critical score tiers</span>
        </div>

        <div className="p-3.5 bg-slate-900 border border-rose-900/50 rounded-lg">
          <div className="flex items-center justify-between">
            <span className="text-2xs uppercase tracking-wider text-slate-400 font-semibold">Emergency Access</span>
            <Flame className="w-4 h-4 text-rose-400" />
          </div>
          <span className="text-2xl font-bold font-mono text-rose-400 mt-1 block">
            {data?.metrics.totalEmergency ?? 0}
          </span>
          <span className="text-3xs text-slate-500 mt-0.5 block">Break-glass incidents</span>
        </div>

        <div className="p-3.5 bg-slate-900 border border-amber-900/50 rounded-lg">
          <div className="flex items-center justify-between">
            <span className="text-2xs uppercase tracking-wider text-slate-400 font-semibold">Extended Durations</span>
            <Clock className="w-4 h-4 text-amber-400" />
          </div>
          <span className="text-2xl font-bold font-mono text-amber-400 mt-1 block">
            {data?.metrics.totalLongDuration ?? 0}
          </span>
          <span className="text-3xs text-slate-500 mt-0.5 block">≥ 120 minutes window</span>
        </div>

        <div className="p-3.5 bg-slate-900 border border-rose-900/50 rounded-lg">
          <div className="flex items-center justify-between">
            <span className="text-2xs uppercase tracking-wider text-slate-400 font-semibold">Auth Failures</span>
            <AlertTriangle className="w-4 h-4 text-rose-400" />
          </div>
          <span className="text-2xl font-bold font-mono text-rose-400 mt-1 block">
            {data?.metrics.failedLoginCount ?? 0}
          </span>
          <span className="text-3xs text-slate-500 mt-0.5 block">Failed login events</span>
        </div>
      </div>

      {/* High-Risk Privileged Elevation Requests */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <ShieldAlert className="w-4 h-4 text-orange-400" />
            <h3 className="text-xs font-mono uppercase tracking-wider font-semibold text-slate-200">
              High & Critical Risk Request Signals
            </h3>
          </div>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-lg overflow-hidden">
          {data?.highRiskRequests.length === 0 ? (
            <div className="p-6 text-center text-xs text-slate-400">
              No high risk elevation requests detected.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-950/80 border-b border-slate-800 text-2xs uppercase tracking-wider text-slate-400 font-mono">
                  <tr>
                    <th className="px-4 py-3">ID</th>
                    <th className="px-4 py-3">Requester</th>
                    <th className="px-4 py-3">Resource</th>
                    <th className="px-4 py-3">Role</th>
                    <th className="px-4 py-3">Risk Tier</th>
                    <th className="px-4 py-3">Status</th>
                    <th className="px-4 py-3">Security Trigger Reasons</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60">
                  {data?.highRiskRequests.map((req) => (
                    <tr key={req.id} className="hover:bg-slate-800/40">
                      <td className="px-4 py-3 font-mono font-medium text-slate-300">{req.id}</td>
                      <td className="px-4 py-3">
                        <div className="text-slate-200 font-medium">{req.user_name}</div>
                        <div className="text-3xs text-slate-500 font-mono">{req.user_email}</div>
                      </td>
                      <td className="px-4 py-3 text-slate-200 font-medium">{req.resource}</td>
                      <td className="px-4 py-3 font-mono text-slate-300">{req.role}</td>
                      <td className="px-4 py-3">
                        <RiskBadge level={req.risk_level} score={req.risk_score} showScore />
                      </td>
                      <td className="px-4 py-3">
                        <StatusBadge status={req.status} size="sm" />
                      </td>
                      <td className="px-4 py-3 text-2xs text-slate-400 max-w-sm">
                        <ul className="list-disc pl-3 space-y-0.5">
                          {req.risk_reasons?.map((r, i) => (
                            <li key={i}>{r}</li>
                          ))}
                        </ul>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* Failed Login Audit Monitor */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-rose-400" />
            <h3 className="text-xs font-mono uppercase tracking-wider font-semibold text-slate-200">
              Authentication Anomalies & Failed Logins
            </h3>
          </div>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-lg overflow-hidden">
          {data?.failedLogins.length === 0 ? (
            <div className="p-6 text-center text-xs text-slate-400">
              No failed authentication events recorded in recent audit window.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs font-mono text-2xs">
                <thead className="bg-slate-950/80 border-b border-slate-800 text-slate-400">
                  <tr>
                    <th className="px-4 py-2.5">Audit ID</th>
                    <th className="px-4 py-2.5">Attempted Target</th>
                    <th className="px-4 py-2.5">IP Address</th>
                    <th className="px-4 py-2.5">Telemetry Message</th>
                    <th className="px-4 py-2.5">Timestamp</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60">
                  {data?.failedLogins.map((fail) => (
                    <tr key={fail.id} className="hover:bg-slate-800/40">
                      <td className="px-4 py-2.5 text-slate-400 font-semibold">{fail.id}</td>
                      <td className="px-4 py-2.5 text-rose-300 font-sans">{fail.user_email}</td>
                      <td className="px-4 py-2.5 text-slate-400">{fail.ip_address || '127.0.0.1'}</td>
                      <td className="px-4 py-2.5 text-slate-400 font-sans">{fail.details}</td>
                      <td className="px-4 py-2.5 text-slate-500">
                        {new Date(fail.timestamp).toLocaleTimeString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
