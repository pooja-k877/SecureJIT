import React from 'react';
import { AccessRequest } from '../types.js';
import { StatusBadge } from './StatusBadge.js';
import { RiskBadge } from './RiskBadge.js';
import { X, CheckCircle, ShieldAlert, Clock, UserCheck, Key, Ticket, FileText } from 'lucide-react';

interface RequestDetailModalProps {
  request: AccessRequest | null;
  history?: AccessRequest[];
  isOpen: boolean;
  onClose: () => void;
  onApprove?: (req: AccessRequest) => void;
  onReject?: (req: AccessRequest) => void;
  isAdmin?: boolean;
}

export const RequestDetailModal: React.FC<RequestDetailModalProps> = ({
  request,
  history = [],
  isOpen,
  onClose,
  onApprove,
  onReject,
  isAdmin = false,
}) => {
  if (!isOpen || !request) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-xs">
      <div className="bg-slate-900 border border-slate-800 rounded-lg max-w-2xl w-full shadow-2xl max-h-[90vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-950/40">
          <div className="flex items-center gap-3">
            <span className="font-mono text-sm font-bold text-sky-400">{request.id}</span>
            <StatusBadge status={request.status} />
            {request.is_emergency && (
              <span className="text-2xs font-mono font-bold uppercase tracking-wider text-rose-400 bg-rose-950/60 border border-rose-800/80 px-2 py-0.5 rounded">
                Break-Glass Emergency
              </span>
            )}
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-200 p-1 rounded focus:outline-none"
            aria-label="Close modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6 overflow-y-auto space-y-6 text-xs text-slate-300">
          {/* Top Grid: Key Parameters */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 p-4 rounded-lg bg-slate-950/70 border border-slate-800">
            <div>
              <span className="text-2xs uppercase tracking-wider text-slate-500 font-medium">Requester</span>
              <p className="text-slate-200 font-medium mt-0.5 truncate">{request.user_name}</p>
              <p className="text-slate-500 text-2xs truncate">{request.user_email}</p>
            </div>
            <div>
              <span className="text-2xs uppercase tracking-wider text-slate-500 font-medium">Target Resource</span>
              <p className="text-slate-200 font-medium mt-0.5 flex items-center gap-1">
                <Key className="w-3.5 h-3.5 text-sky-400 shrink-0" />
                <span className="truncate">{request.resource}</span>
              </p>
            </div>
            <div>
              <span className="text-2xs uppercase tracking-wider text-slate-500 font-medium">Role Requested</span>
              <p className="text-slate-200 font-medium mt-0.5 truncate">{request.role}</p>
            </div>
            <div>
              <span className="text-2xs uppercase tracking-wider text-slate-500 font-medium">Duration</span>
              <p className="text-slate-200 font-medium mt-0.5 flex items-center gap-1">
                <Clock className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                <span>{request.duration_minutes} minutes</span>
              </p>
            </div>
          </div>

          {/* Business Justification */}
          <div>
            <h4 className="text-2xs uppercase tracking-wider font-semibold text-slate-400 flex items-center gap-1.5 mb-2">
              <FileText className="w-3.5 h-3.5 text-slate-400" />
              Business Justification
            </h4>
            <div className="p-3.5 bg-slate-950/50 rounded border border-slate-800 text-slate-200 leading-relaxed font-sans">
              {request.reason}
            </div>
            {request.ticket_id && (
              <div className="mt-2 flex items-center gap-1.5 text-slate-400 text-2xs">
                <Ticket className="w-3.5 h-3.5 text-slate-500" />
                <span>Reference Ticket ID:</span>
                <span className="font-mono text-slate-200 font-semibold">{request.ticket_id}</span>
              </div>
            )}
          </div>

          {/* Risk Evaluation Engine Breakdown */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <h4 className="text-2xs uppercase tracking-wider font-semibold text-slate-400 flex items-center gap-1.5">
                <ShieldAlert className="w-3.5 h-3.5 text-slate-400" />
                Risk Evaluation Analysis
              </h4>
              <RiskBadge level={request.risk_level} score={request.risk_score} showScore />
            </div>

            <div className="p-3.5 bg-slate-950/50 rounded border border-slate-800 space-y-2">
              <div className="text-2xs text-slate-400 font-medium">
                Deterministic security rules triggered for this request:
              </div>
              <ul className="space-y-1.5 pl-4 list-disc text-slate-300 text-2xs">
                {request.risk_reasons && request.risk_reasons.length > 0 ? (
                  request.risk_reasons.map((reason, idx) => (
                    <li key={idx} className="leading-normal">{reason}</li>
                  ))
                ) : (
                  <li>Standard baseline security profile applied.</li>
                )}
              </ul>
            </div>
          </div>

          {/* Review Decision Details (if reviewed) */}
          {request.reviewed_at && (
            <div className="p-4 rounded-lg bg-slate-950/60 border border-slate-800 space-y-2">
              <h4 className="text-2xs uppercase tracking-wider font-semibold text-slate-400 flex items-center gap-1.5">
                <UserCheck className="w-3.5 h-3.5 text-sky-400" />
                Review Decision Audit
              </h4>
              <div className="grid grid-cols-2 gap-3 text-2xs">
                <div>
                  <span className="text-slate-500">Reviewed By:</span>
                  <p className="text-slate-200 font-medium">{request.reviewer_name || 'System'}</p>
                </div>
                <div>
                  <span className="text-slate-500">Decision Date:</span>
                  <p className="text-slate-200 font-mono">{new Date(request.reviewed_at).toLocaleString()}</p>
                </div>
              </div>
              {request.review_comment && (
                <div className="mt-2 pt-2 border-t border-slate-800/80">
                  <span className="text-slate-500 text-2xs">Reviewer Notes:</span>
                  <p className="text-slate-200 text-2xs mt-0.5 italic">"{request.review_comment}"</p>
                </div>
              )}
            </div>
          )}

          {/* User's Previous Access History */}
          {history.length > 0 && (
            <div>
              <h4 className="text-2xs uppercase tracking-wider font-semibold text-slate-400 mb-2">
                Previous Access Requests by this User ({history.length})
              </h4>
              <div className="border border-slate-800 rounded overflow-hidden">
                <table className="w-full text-left text-2xs">
                  <thead className="bg-slate-950/80 border-b border-slate-800 text-slate-400">
                    <tr>
                      <th className="px-3 py-2 font-mono">ID</th>
                      <th className="px-3 py-2">Resource</th>
                      <th className="px-3 py-2">Role</th>
                      <th className="px-3 py-2">Status</th>
                      <th className="px-3 py-2">Date</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60">
                    {history.map((h) => (
                      <tr key={h.id} className="hover:bg-slate-800/30">
                        <td className="px-3 py-2 font-mono text-slate-400">{h.id}</td>
                        <td className="px-3 py-2 text-slate-300">{h.resource}</td>
                        <td className="px-3 py-2 text-slate-400">{h.role}</td>
                        <td className="px-3 py-2">
                          <StatusBadge status={h.status} size="sm" />
                        </td>
                        <td className="px-3 py-2 text-slate-500 font-mono">
                          {new Date(h.requested_at).toLocaleDateString()}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="flex items-center justify-between px-6 py-4 bg-slate-950 border-t border-slate-800">
          <div className="text-2xs text-slate-500">
            Requested: {new Date(request.requested_at).toLocaleString()}
          </div>
          <div className="flex items-center gap-2">
            {isAdmin && request.status === 'PENDING' && (
              <>
                <button
                  onClick={() => onReject?.(request)}
                  className="px-3.5 py-1.5 text-xs font-medium text-rose-400 hover:text-white hover:bg-rose-600 border border-rose-800/80 rounded transition-colors"
                >
                  Reject Request
                </button>
                <button
                  onClick={() => onApprove?.(request)}
                  className="px-4 py-1.5 text-xs font-medium text-white bg-sky-600 hover:bg-sky-500 rounded transition-colors flex items-center gap-1.5 shadow-sm"
                >
                  <CheckCircle className="w-3.5 h-3.5" />
                  Approve Access
                </button>
              </>
            )}
            <button
              onClick={onClose}
              className="px-3.5 py-1.5 text-xs font-medium text-slate-400 hover:text-slate-200 hover:bg-slate-800 rounded transition-colors"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
