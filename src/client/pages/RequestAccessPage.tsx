import React, { useState, useMemo } from 'react';
import { api } from '../services/api.js';
import { useNotifications } from '../context/NotificationContext.js';
import { evaluateRisk } from '../../server/riskEngine.js';
import { RiskBadge } from '../components/RiskBadge.js';
import { ConfirmModal } from '../components/ConfirmModal.js';
import {
  KeyRound,
  ShieldAlert,
  Clock,
  Database,
  Server,
  Cloud,
  HardDrive,
  Cpu,
  Ticket,
  AlertCircle,
  CheckCircle2,
  HelpCircle
} from 'lucide-react';

const RESOURCES = [
  { id: 'Azure VM 01', label: 'Azure VM 01 (Compute - Web App Host)', icon: <Server className="w-4 h-4 text-sky-400" /> },
  { id: 'Azure VM 02', label: 'Azure VM 02 (Compute - Worker Daemon)', icon: <Cpu className="w-4 h-4 text-sky-400" /> },
  { id: 'Production Database', label: 'Production Database (PostgreSQL Tier 1)', icon: <Database className="w-4 h-4 text-rose-400" /> },
  { id: 'Storage Account', label: 'Storage Account (Blob & Diagnostic Archives)', icon: <HardDrive className="w-4 h-4 text-amber-400" /> },
  { id: 'Application Server', label: 'Application Server (Node.js API Ingress)', icon: <Cloud className="w-4 h-4 text-sky-400" /> },
  { id: 'Kubernetes Cluster', label: 'Kubernetes Cluster (Production AKS)', icon: <Server className="w-4 h-4 text-rose-400" /> },
];

const ROLES = [
  { id: 'Reader', label: 'Reader (Read-Only Inspection)', riskHint: 'Least privilege' },
  { id: 'Virtual Machine Contributor', label: 'Virtual Machine Contributor (Manage VMs & Diagnostics)', riskHint: 'Medium impact' },
  { id: 'Contributor', label: 'Contributor (Create & Manage all resources)', riskHint: 'Elevated modifications' },
  { id: 'Storage Blob Data Contributor', label: 'Storage Blob Data Contributor (Read/Write Object Data)', riskHint: 'Data plane modification' },
  { id: 'Administrator', label: 'Administrator (Privileged service & user admin)', riskHint: 'High privilege' },
  { id: 'Owner', label: 'Owner (Full unrestricted control & IAM delegations)', riskHint: 'Critical privilege' },
];

const DURATIONS = [
  { minutes: 15, label: '15 Minutes (Hotfix / Quick Inspection)' },
  { minutes: 30, label: '30 Minutes (Standard Diagnostics)' },
  { minutes: 60, label: '60 Minutes (Standard Maintenance)' },
  { minutes: 120, label: '120 Minutes (Extended Migration)' },
  { minutes: 240, label: '240 Minutes (Maximum Permitted Window)' },
];

interface RequestAccessPageProps {
  onNavigate: (page: string) => void;
}

export const RequestAccessPage: React.FC<RequestAccessPageProps> = ({ onNavigate }) => {
  const { showToast } = useNotifications();

  const [resource, setResource] = useState('Azure VM 01');
  const [role, setRole] = useState('Contributor');
  const [durationMinutes, setDurationMinutes] = useState(30);
  const [reason, setReason] = useState('');
  const [ticketId, setTicketId] = useState('');

  const [validationError, setValidationError] = useState('');
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // Real-time calculation of transparent rule-based risk
  const liveRisk = useMemo(() => {
    return evaluateRisk({
      resource,
      role,
      durationMinutes,
      isEmergency: false,
    });
  }, [resource, role, durationMinutes]);

  const handleSubmitClick = (e: React.FormEvent) => {
    e.preventDefault();
    setValidationError('');

    if (!resource || !role) {
      setValidationError('Please select both a target resource and desired role.');
      return;
    }

    if (!reason.trim() || reason.trim().length < 10) {
      setValidationError('Please provide a substantive business justification (minimum 10 characters).');
      return;
    }

    setShowConfirmModal(true);
  };

  const handleConfirmedSubmit = async () => {
    setSubmitting(true);
    try {
      await api.submitAccessRequest({
        resource,
        role,
        durationMinutes,
        reason: reason.trim(),
        ticketId: ticketId.trim() || undefined,
      });

      showToast('Access request submitted successfully.', 'success');
      setShowConfirmModal(false);
      onNavigate('my-requests');
    } catch (err: any) {
      showToast(err.message || 'Failed to submit access request.', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="pb-2 border-b border-slate-800">
        <h1 className="text-lg font-bold font-mono text-slate-100 flex items-center gap-2">
          <KeyRound className="w-5 h-5 text-sky-400" />
          Request Just-In-Time Privileged Access
        </h1>
        <p className="text-xs text-slate-400 mt-0.5">
          Temporary privilege elevation enforces least-privilege principles. All access is time-bounded and logged in the immutable audit trail.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Request Form */}
        <div className="lg:col-span-2 space-y-5 bg-slate-900 border border-slate-800 p-5 rounded-lg shadow-sm">
          {validationError && (
            <div className="p-3 rounded bg-rose-950/50 border border-rose-800/80 text-rose-300 text-xs flex items-start gap-2">
              <AlertCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
              <span>{validationError}</span>
            </div>
          )}

          <form onSubmit={handleSubmitClick} className="space-y-4">
            {/* Target Azure Resource */}
            <div>
              <label className="block text-2xs font-mono uppercase tracking-wider text-slate-400 font-semibold mb-1.5">
                Target Azure Resource <span className="text-rose-400">*</span>
              </label>
              <select
                value={resource}
                onChange={(e) => setResource(e.target.value)}
                className="w-full bg-slate-950 border border-slate-700 rounded px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-sky-500 focus:ring-1 focus:ring-sky-500 font-medium"
              >
                {RESOURCES.map((res) => (
                  <option key={res.id} value={res.id}>
                    {res.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Requested Role */}
            <div>
              <label className="block text-2xs font-mono uppercase tracking-wider text-slate-400 font-semibold mb-1.5">
                Privileged Role Definition <span className="text-rose-400">*</span>
              </label>
              <select
                value={role}
                onChange={(e) => setRole(e.target.value)}
                className="w-full bg-slate-950 border border-slate-700 rounded px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-sky-500 focus:ring-1 focus:ring-sky-500 font-medium"
              >
                {ROLES.map((r) => (
                  <option key={r.id} value={r.id}>
                    {r.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Duration Window */}
            <div>
              <label className="block text-2xs font-mono uppercase tracking-wider text-slate-400 font-semibold mb-1.5">
                Elevation Duration Window <span className="text-rose-400">*</span>
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {DURATIONS.map((dur) => {
                  const isSelected = durationMinutes === dur.minutes;
                  return (
                    <button
                      type="button"
                      key={dur.minutes}
                      onClick={() => setDurationMinutes(dur.minutes)}
                      className={`p-2 rounded text-left border transition-all text-xs focus:outline-none ${
                        isSelected
                          ? 'border-sky-500 bg-sky-950/50 text-sky-200 font-semibold ring-1 ring-sky-500'
                          : 'border-slate-800 bg-slate-950/60 text-slate-400 hover:border-slate-700 hover:text-slate-200'
                      }`}
                    >
                      <div className="flex items-center gap-1.5 font-mono">
                        <Clock className="w-3 h-3 text-sky-400" />
                        <span>{dur.minutes} min</span>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Business Justification */}
            <div>
              <label className="block text-2xs font-mono uppercase tracking-wider text-slate-400 font-semibold mb-1.5">
                Business Justification & Scope <span className="text-rose-400">*</span>
              </label>
              <textarea
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                placeholder="Describe why privileged elevation is required, what maintenance commands will be executed, and the expected blast radius..."
                rows={3}
                className="w-full bg-slate-950 border border-slate-700 rounded p-3 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-sky-500 focus:ring-1 focus:ring-sky-500 resize-none font-sans"
              />
              <span className="text-3xs text-slate-500 mt-1 block">
                Must be at least 10 characters. Enters the permanent compliance record.
              </span>
            </div>

            {/* Ticket / Reference Number */}
            <div>
              <label className="block text-2xs font-mono uppercase tracking-wider text-slate-400 font-semibold mb-1.5">
                Change Ticket / Incident Reference
              </label>
              <div className="relative">
                <Ticket className="w-3.5 h-3.5 text-slate-500 absolute left-3 top-2.5" />
                <input
                  type="text"
                  value={ticketId}
                  onChange={(e) => setTicketId(e.target.value)}
                  placeholder="e.g. INC-84920 or CHG-10294"
                  className="w-full bg-slate-950 border border-slate-700 rounded pl-8 pr-3 py-2 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-sky-500 focus:ring-1 focus:ring-sky-500 font-mono"
                />
              </div>
            </div>

            {/* Action Bar */}
            <div className="pt-3 border-t border-slate-800 flex items-center justify-between">
              <button
                type="button"
                onClick={() => onNavigate('dashboard')}
                className="px-3.5 py-1.5 text-xs font-medium text-slate-400 hover:text-slate-200 hover:bg-slate-800 rounded transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-5 py-2 text-xs font-medium text-white bg-sky-600 hover:bg-sky-500 rounded transition-colors shadow-md flex items-center gap-1.5 focus:outline-none focus:ring-2 focus:ring-sky-400"
              >
                <CheckCircle2 className="w-3.5 h-3.5" />
                Submit Request
              </button>
            </div>
          </form>
        </div>

        {/* Live Risk Evaluation Panel */}
        <div className="space-y-4">
          <div className="bg-slate-900 border border-slate-800 p-4 rounded-lg space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5">
                <ShieldAlert className="w-4 h-4 text-sky-400" />
                <h3 className="text-xs font-mono uppercase tracking-wider font-semibold text-slate-200">
                  Risk Engine Evaluation
                </h3>
              </div>
              <RiskBadge level={liveRisk.level} score={liveRisk.score} showScore />
            </div>

            <p className="text-2xs text-slate-400">
              Evaluated in real-time by the SecureJIT deterministic security policy matrix before submission.
            </p>

            <div className="p-3 rounded bg-slate-950/70 border border-slate-800 space-y-2">
              <span className="text-3xs uppercase font-mono tracking-wider text-slate-500 font-bold block">
                Rule Triggers & Rationale:
              </span>
              <ul className="space-y-1.5 text-2xs text-slate-300 list-disc pl-4">
                {liveRisk.reasons.map((r, i) => (
                  <li key={i} className="leading-snug">{r}</li>
                ))}
              </ul>
            </div>

            <div className="text-3xs text-slate-500 pt-2 border-t border-slate-800 flex items-center gap-1">
              <HelpCircle className="w-3 h-3 text-slate-400 shrink-0" />
              <span>Requests rated High or Critical require explicit administrator review.</span>
            </div>
          </div>

          {/* Quick Summary Card */}
          <div className="p-4 rounded-lg bg-slate-900/50 border border-slate-800/80 text-2xs text-slate-400 space-y-1.5">
            <div className="text-slate-300 font-medium font-mono uppercase tracking-wider">
              Access Governance SLA
            </div>
            <p>• Requests are reviewed by certified Security Officers.</p>
            <p>• Automatic credential de-provisioning occurs strictly upon expiration.</p>
            <p>• You may manually revoke your temporary privileges early at any time.</p>
          </div>
        </div>
      </div>

      {/* Confirmation Dialog before Submitting */}
      <ConfirmModal
        isOpen={showConfirmModal}
        onClose={() => setShowConfirmModal(false)}
        onConfirm={handleConfirmedSubmit}
        title="Confirm Privileged Access Submission"
        message="Please verify your access request parameters before submitting for security review:"
        confirmLabel="Confirm & Submit"
        cancelLabel="Edit Request"
        loading={submitting}
      >
        <div className="p-3 bg-slate-950 rounded border border-slate-800 space-y-2 text-2xs">
          <div className="flex justify-between">
            <span className="text-slate-500">Resource:</span>
            <span className="text-slate-200 font-semibold">{resource}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-slate-500">Role:</span>
            <span className="text-sky-400 font-mono font-semibold">{role}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-slate-500">Duration:</span>
            <span className="text-amber-400 font-mono font-semibold">{durationMinutes} minutes</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-slate-500">Calculated Risk:</span>
            <RiskBadge level={liveRisk.level} score={liveRisk.score} showScore />
          </div>
          {ticketId && (
            <div className="flex justify-between">
              <span className="text-slate-500">Reference:</span>
              <span className="text-slate-300 font-mono">{ticketId}</span>
            </div>
          )}
          <div className="pt-2 border-t border-slate-800/80 text-slate-400 italic">
            "{reason}"
          </div>
        </div>
      </ConfirmModal>
    </div>
  );
};
