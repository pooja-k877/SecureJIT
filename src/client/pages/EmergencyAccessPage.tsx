import React, { useState } from 'react';
import { api } from '../services/api.js';
import { useNotifications } from '../context/NotificationContext.js';
import {
  Flame,
  AlertTriangle,
  ShieldAlert,
  Clock,
  Key,
  Ticket,
  CheckCircle,
  FileWarning,
  Lock
} from 'lucide-react';

const EMERGENCY_RESOURCES = [
  'Production Database',
  'Kubernetes Cluster',
  'Application Server',
  'Azure VM 01',
  'Azure VM 02',
  'Storage Account',
];

const EMERGENCY_ROLES = [
  'Administrator',
  'Contributor',
  'Virtual Machine Contributor',
  'Storage Blob Data Contributor',
  'Owner',
];

interface EmergencyAccessPageProps {
  onNavigate: (page: string) => void;
}

export const EmergencyAccessPage: React.FC<EmergencyAccessPageProps> = ({ onNavigate }) => {
  const { showToast } = useNotifications();

  const [resource, setResource] = useState('Production Database');
  const [role, setRole] = useState('Administrator');
  const [durationMinutes, setDurationMinutes] = useState(15);
  const [emergencyReason, setEmergencyReason] = useState('');
  const [incidentTicketId, setIncidentTicketId] = useState('');
  const [termsAccepted, setTermsAccepted] = useState(false);

  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const handleEmergencySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');

    if (!termsAccepted) {
      setErrorMsg('You must check the compliance acknowledgment box before proceeding.');
      return;
    }

    if (!incidentTicketId.trim()) {
      setErrorMsg('Incident / Sev-1 Reference Ticket ID is strictly required for break-glass protocol.');
      return;
    }

    if (!emergencyReason.trim() || emergencyReason.trim().length < 15) {
      setErrorMsg('Please specify a detailed incident description (at least 15 characters).');
      return;
    }

    setSubmitting(true);
    try {
      const res = await api.submitEmergencyAccess({
        resource,
        role,
        durationMinutes,
        emergencyReason: emergencyReason.trim(),
        incidentTicketId: incidentTicketId.trim(),
        termsAccepted,
      });

      if (res.isImmediate) {
        showToast('BREAK-GLASS ACTIVATED: Emergency access granted and active.', 'warning');
        onNavigate('active-access');
      } else {
        showToast('Emergency request dispatched to Security Lead with Priority 1 SLA.', 'info');
        onNavigate('my-requests');
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to engage emergency access protocol.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      {/* Critical Banner */}
      <div className="p-4 rounded-lg bg-rose-950/60 border border-rose-800/80 shadow-lg space-y-2">
        <div className="flex items-center gap-2 text-rose-300 font-bold font-mono text-sm tracking-wide">
          <Flame className="w-5 h-5 text-rose-400 animate-pulse" />
          <span>EMERGENCY BREAK-GLASS PROTOCOL (P1 / SEV-1)</span>
        </div>
        <p className="text-xs text-rose-200/90 leading-relaxed">
          Emergency access is intended exclusively for critical production incidents where awaiting standard approval could cause severe service outage or data loss. Emergency access is tightly time-limited and permanently recorded in forensic audit logs.
        </p>
      </div>

      {/* Main Form */}
      <div className="bg-slate-900 border border-slate-800 p-6 rounded-lg shadow-sm space-y-5">
        {errorMsg && (
          <div className="p-3 rounded bg-rose-950/70 border border-rose-800 text-rose-300 text-xs flex items-start gap-2">
            <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
            <span>{errorMsg}</span>
          </div>
        )}

        <form onSubmit={handleEmergencySubmit} className="space-y-4 text-xs">
          {/* Target Resource */}
          <div>
            <label className="block text-2xs font-mono uppercase tracking-wider text-slate-400 font-semibold mb-1">
              Target Critical Resource <span className="text-rose-400">*</span>
            </label>
            <select
              value={resource}
              onChange={(e) => setResource(e.target.value)}
              className="w-full bg-slate-950 border border-slate-700 rounded px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-rose-500 font-medium"
            >
              {EMERGENCY_RESOURCES.map((res) => (
                <option key={res} value={res}>{res}</option>
              ))}
            </select>
          </div>

          {/* Role */}
          <div>
            <label className="block text-2xs font-mono uppercase tracking-wider text-slate-400 font-semibold mb-1">
              Required Emergency Role <span className="text-rose-400">*</span>
            </label>
            <select
              value={role}
              onChange={(e) => setRole(e.target.value)}
              className="w-full bg-slate-950 border border-slate-700 rounded px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-rose-500 font-medium"
            >
              {EMERGENCY_ROLES.map((r) => (
                <option key={r} value={r}>{r}</option>
              ))}
            </select>
          </div>

          {/* Duration (Restricted: 10, 15, 30m) */}
          <div>
            <label className="block text-2xs font-mono uppercase tracking-wider text-slate-400 font-semibold mb-1">
              Emergency Time Window <span className="text-rose-400">*</span>
            </label>
            <div className="grid grid-cols-3 gap-3">
              {[10, 15, 30].map((mins) => (
                <button
                  type="button"
                  key={mins}
                  onClick={() => setDurationMinutes(mins)}
                  className={`p-2.5 rounded text-center border transition-all text-xs font-mono font-medium focus:outline-none ${
                    durationMinutes === mins
                      ? 'border-rose-500 bg-rose-950/60 text-rose-300 ring-1 ring-rose-500'
                      : 'border-slate-800 bg-slate-950 text-slate-400 hover:border-slate-700'
                  }`}
                >
                  <Clock className="w-3.5 h-3.5 mx-auto mb-1 text-rose-400" />
                  <span>{mins} Minutes</span>
                </button>
              ))}
            </div>
            <span className="text-3xs text-slate-500 mt-1 block">
              Emergency durations are strictly limited to minimize blast exposure.
            </span>
          </div>

          {/* Incident ID */}
          <div>
            <label className="block text-2xs font-mono uppercase tracking-wider text-slate-400 font-semibold mb-1">
              Sev-1 / Incident Management Reference <span className="text-rose-400">*</span>
            </label>
            <div className="relative">
              <Ticket className="w-3.5 h-3.5 text-slate-500 absolute left-3 top-2.5" />
              <input
                type="text"
                required
                value={incidentTicketId}
                onChange={(e) => setIncidentTicketId(e.target.value)}
                placeholder="e.g. SEV1-OUTAGE-2026-991"
                className="w-full bg-slate-950 border border-slate-700 rounded pl-8 pr-3 py-2 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-rose-500 font-mono"
              />
            </div>
          </div>

          {/* Emergency Justification */}
          <div>
            <label className="block text-2xs font-mono uppercase tracking-wider text-slate-400 font-semibold mb-1">
              Incident Situation & Remediation Plan <span className="text-rose-400">*</span>
            </label>
            <textarea
              required
              rows={3}
              value={emergencyReason}
              onChange={(e) => setEmergencyReason(e.target.value)}
              placeholder="State the root cause, immediate outage impact, and exact remediation commands to be executed..."
              className="w-full bg-slate-950 border border-slate-700 rounded p-3 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-rose-500 resize-none font-sans"
            />
          </div>

          {/* Mandatory Checkbox */}
          <div className="p-3.5 bg-slate-950/80 rounded border border-slate-800 space-y-2">
            <label className="flex items-start gap-2.5 cursor-pointer">
              <input
                type="checkbox"
                checked={termsAccepted}
                onChange={(e) => setTermsAccepted(e.target.checked)}
                className="mt-0.5 w-4 h-4 rounded border-slate-700 bg-slate-900 text-rose-600 focus:ring-rose-500"
              />
              <span className="text-2xs text-slate-300 leading-snug">
                I understand that emergency break-glass access is fully audited, broadcasts high-priority alerts to Security Officers, and automatically revokes upon expiry. Misuse is subject to disciplinary compliance action.
              </span>
            </label>
          </div>

          {/* Submit */}
          <div className="pt-2 flex items-center justify-between">
            <button
              type="button"
              onClick={() => onNavigate('dashboard')}
              className="px-3.5 py-1.5 text-xs text-slate-400 hover:text-slate-200"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting || !termsAccepted}
              className="px-5 py-2 text-xs font-semibold text-white bg-rose-600 hover:bg-rose-500 rounded transition-colors shadow-lg shadow-rose-950 flex items-center gap-1.5 disabled:opacity-50 focus:outline-none focus:ring-2 focus:ring-rose-500"
            >
              <Flame className="w-3.5 h-3.5" />
              <span>{submitting ? 'Initiating Protocol...' : 'Request Emergency Access'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
