import React, { useState, useEffect } from 'react';
import { api } from '../../services/api.js';
import { useNotifications } from '../../context/NotificationContext.js';
import { AccessRequest } from '../../types.js';
import { RiskBadge } from '../../components/RiskBadge.js';
import { RequestDetailModal } from '../../components/RequestDetailModal.js';
import { ConfirmModal } from '../../components/ConfirmModal.js';
import { EmptyState } from '../../components/EmptyState.js';
import {
  FileCheck2,
  CheckCircle,
  XCircle,
  RotateCcw,
  Search,
  Filter,
  Eye,
  ShieldAlert
} from 'lucide-react';

export const PendingRequestsPage: React.FC = () => {
  const { showToast } = useNotifications();

  const [requests, setRequests] = useState<AccessRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [riskFilter, setRiskFilter] = useState('ALL');

  // Modals
  const [selectedReq, setSelectedReq] = useState<AccessRequest | null>(null);
  const [history, setHistory] = useState<AccessRequest[]>([]);
  const [detailOpen, setDetailOpen] = useState(false);

  const [approveReq, setApproveReq] = useState<AccessRequest | null>(null);
  const [rejectReq, setRejectReq] = useState<AccessRequest | null>(null);
  const [actionLoading, setActionLoading] = useState(false);

  const fetchPending = async () => {
    try {
      setLoading(true);
      const res = await api.getAccessRequests({ status: 'PENDING' });
      setRequests(res.requests);
    } catch (err: any) {
      showToast('Failed to load pending requests.', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPending();
  }, []);

  const handleOpenDetail = async (req: AccessRequest) => {
    try {
      const res = await api.getAccessRequestById(req.id);
      setSelectedReq(res.request);
      setHistory(res.history);
      setDetailOpen(true);
    } catch (e) {
      setSelectedReq(req);
      setHistory([]);
      setDetailOpen(true);
    }
  };

  const handleApprove = async (comment?: string) => {
    if (!approveReq) return;
    setActionLoading(true);
    try {
      await api.approveAccessRequest(approveReq.id, comment);
      showToast(`Request ${approveReq.id} approved. Access is now ACTIVE.`, 'success');
      setApproveReq(null);
      setDetailOpen(false);
      await fetchPending();
    } catch (err: any) {
      showToast(err.message || 'Failed to approve request.', 'error');
    } finally {
      setActionLoading(false);
    }
  };

  const handleReject = async (reason?: string) => {
    if (!rejectReq || !reason) return;
    setActionLoading(true);
    try {
      await api.rejectAccessRequest(rejectReq.id, reason);
      showToast(`Request ${rejectReq.id} rejected. Audit event created.`, 'info');
      setRejectReq(null);
      setDetailOpen(false);
      await fetchPending();
    } catch (err: any) {
      showToast(err.message || 'Failed to reject request.', 'error');
    } finally {
      setActionLoading(false);
    }
  };

  const filteredRequests = requests.filter((r) => {
    if (riskFilter !== 'ALL' && r.risk_level !== riskFilter) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const match =
        r.id.toLowerCase().includes(q) ||
        r.user_name.toLowerCase().includes(q) ||
        r.user_email.toLowerCase().includes(q) ||
        r.resource.toLowerCase().includes(q) ||
        r.role.toLowerCase().includes(q) ||
        r.reason.toLowerCase().includes(q);
      if (!match) return false;
    }
    return true;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-2 border-b border-slate-800">
        <div>
          <h1 className="text-lg font-bold font-mono text-slate-100 flex items-center gap-2">
            <FileCheck2 className="w-5 h-5 text-amber-400" />
            Pending Authorization Requests
          </h1>
          <p className="text-xs text-slate-400 mt-0.5">
            Security officer review queue for temporary cloud privileged elevations.
          </p>
        </div>

        <button
          onClick={fetchPending}
          disabled={loading}
          className="px-3 py-1.5 text-xs text-slate-400 hover:text-slate-200 border border-slate-800 bg-slate-900 rounded transition-colors flex items-center gap-1.5 focus:outline-none"
        >
          <RotateCcw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          <span>Refresh Queue</span>
        </button>
      </div>

      {/* Filter and Search Bar */}
      <div className="p-3.5 bg-slate-900 border border-slate-800 rounded-lg flex flex-col md:flex-row items-center justify-between gap-3">
        <div className="relative w-full md:w-80">
          <Search className="w-3.5 h-3.5 text-slate-500 absolute left-3 top-2.5" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search requester, resource, role..."
            className="w-full bg-slate-950 border border-slate-700 rounded pl-8 pr-3 py-1.5 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-sky-500"
          />
        </div>

        <div className="flex items-center gap-2 w-full md:w-auto">
          <div className="flex items-center gap-1.5 text-2xs font-mono text-slate-400">
            <Filter className="w-3.5 h-3.5 text-slate-500" />
            <span>Filter Risk:</span>
          </div>
          <select
            value={riskFilter}
            onChange={(e) => setRiskFilter(e.target.value)}
            className="bg-slate-950 border border-slate-700 rounded px-2.5 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-sky-500"
          >
            <option value="ALL">All Risk Tiers</option>
            <option value="LOW">LOW</option>
            <option value="MEDIUM">MEDIUM</option>
            <option value="HIGH">HIGH</option>
            <option value="CRITICAL">CRITICAL</option>
          </select>
        </div>
      </div>

      {/* Table */}
      <div className="bg-slate-900 border border-slate-800 rounded-lg overflow-hidden">
        {loading && requests.length === 0 ? (
          <div className="p-12 text-center text-xs text-slate-400">
            Loading authorization requests...
          </div>
        ) : filteredRequests.length === 0 ? (
          <EmptyState
            title="No Pending Requests"
            description="The security authorization queue is currently clear. No pending requests require administrator review."
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-950/80 border-b border-slate-800 text-2xs uppercase tracking-wider text-slate-400 font-mono">
                <tr>
                  <th className="px-4 py-3">Request ID</th>
                  <th className="px-4 py-3">Requester</th>
                  <th className="px-4 py-3">Target Resource</th>
                  <th className="px-4 py-3">Role</th>
                  <th className="px-4 py-3">Duration</th>
                  <th className="px-4 py-3">Risk Assessment</th>
                  <th className="px-4 py-3">Business Reason</th>
                  <th className="px-4 py-3">Requested Time</th>
                  <th className="px-4 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {filteredRequests.map((req) => (
                  <tr key={req.id} className="hover:bg-slate-800/40 transition-colors">
                    <td className="px-4 py-3 font-mono font-medium text-slate-300 whitespace-nowrap">
                      {req.id}
                      {req.is_emergency && (
                        <span className="block text-3xs font-mono text-rose-400 font-bold">
                          BREAK-GLASS
                        </span>
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
                    <td className="px-4 py-3 text-slate-500 font-mono text-2xs whitespace-nowrap">
                      {new Date(req.requested_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </td>
                    <td className="px-4 py-3 text-right whitespace-nowrap">
                      <div className="inline-flex items-center gap-1.5">
                        <button
                          onClick={() => handleOpenDetail(req)}
                          className="px-2 py-1 text-2xs font-medium text-slate-300 hover:text-white bg-slate-800 hover:bg-slate-700 rounded transition-colors inline-flex items-center gap-1"
                        >
                          <Eye className="w-3 h-3 text-slate-400" />
                          <span>View</span>
                        </button>
                        <button
                          onClick={() => setApproveReq(req)}
                          className="px-2.5 py-1 text-2xs font-medium text-white bg-sky-600 hover:bg-sky-500 rounded transition-colors flex items-center gap-1"
                        >
                          <CheckCircle className="w-3 h-3" />
                          <span>Approve</span>
                        </button>
                        <button
                          onClick={() => setRejectReq(req)}
                          className="px-2.5 py-1 text-2xs font-medium text-rose-400 hover:text-white hover:bg-rose-600 border border-rose-900/60 rounded transition-colors flex items-center gap-1"
                        >
                          <XCircle className="w-3 h-3" />
                          <span>Reject</span>
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

      {/* Details Modal */}
      <RequestDetailModal
        isOpen={detailOpen}
        request={selectedReq}
        history={history}
        isAdmin={true}
        onClose={() => setDetailOpen(false)}
        onApprove={(r) => setApproveReq(r)}
        onReject={(r) => setRejectReq(r)}
      />

      {/* Approval Confirmation */}
      <ConfirmModal
        isOpen={Boolean(approveReq)}
        onClose={() => setApproveReq(null)}
        onConfirm={handleApprove}
        title="Approve Privileged Elevation"
        message={`Approve ${approveReq?.duration_minutes}-minute temporary privileged elevation for ${approveReq?.user_name} on ${approveReq?.resource} as ${approveReq?.role}?`}
        confirmLabel="Approve & Activate"
        variant="primary"
        requiresInput
        inputLabel="Approval Audit Comment (Optional)"
        inputPlaceholder="e.g. Verified change ticket scope..."
        loading={actionLoading}
      />

      {/* Rejection Confirmation */}
      <ConfirmModal
        isOpen={Boolean(rejectReq)}
        onClose={() => setRejectReq(null)}
        onConfirm={handleReject}
        title="Reject Privileged Request"
        message={`Reject request ${rejectReq?.id} for ${rejectReq?.user_name}? A security rejection reason is mandatory.`}
        confirmLabel="Confirm Rejection"
        variant="danger"
        requiresInput
        inputLabel="Security Rejection Justification"
        inputPlaceholder="State why this elevation violates least privilege policy..."
        inputRequired
        loading={actionLoading}
      />
    </div>
  );
};
