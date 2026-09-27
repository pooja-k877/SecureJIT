import React, { useState, useEffect } from 'react';
import { api } from '../services/api.js';
import { useNotifications } from '../context/NotificationContext.js';
import { AccessRequest } from '../types.js';
import { StatusBadge } from '../components/StatusBadge.js';
import { RiskBadge } from '../components/RiskBadge.js';
import { RequestDetailModal } from '../components/RequestDetailModal.js';
import { EmptyState } from '../components/EmptyState.js';
import {
  FileCheck2,
  Search,
  Filter,
  RotateCcw,
  KeyRound,
  ExternalLink
} from 'lucide-react';

interface MyRequestsPageProps {
  onNavigate: (page: string) => void;
}

export const MyRequestsPage: React.FC<MyRequestsPageProps> = ({ onNavigate }) => {
  const { showToast } = useNotifications();

  const [requests, setRequests] = useState<AccessRequest[]>([]);
  const [loading, setLoading] = useState(true);

  // Filters
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [riskFilter, setRiskFilter] = useState('ALL');
  const [searchQuery, setSearchQuery] = useState('');

  // Detail Modal state
  const [selectedRequest, setSelectedRequest] = useState<AccessRequest | null>(null);
  const [requestHistory, setRequestHistory] = useState<AccessRequest[]>([]);
  const [detailModalOpen, setDetailModalOpen] = useState(false);

  const fetchRequests = async () => {
    try {
      setLoading(true);
      const res = await api.getAccessRequests();
      setRequests(res.requests);
    } catch (err: any) {
      showToast('Failed to load access requests.', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRequests();
  }, []);

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

  // Filter requests
  const filteredRequests = requests.filter((r) => {
    if (statusFilter !== 'ALL' && r.status !== statusFilter) return false;
    if (riskFilter !== 'ALL' && r.risk_level !== riskFilter) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const match =
        r.id.toLowerCase().includes(q) ||
        r.resource.toLowerCase().includes(q) ||
        r.role.toLowerCase().includes(q) ||
        r.reason.toLowerCase().includes(q) ||
        (r.ticket_id && r.ticket_id.toLowerCase().includes(q));
      if (!match) return false;
    }
    return true;
  });

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-2 border-b border-slate-800">
        <div>
          <h1 className="text-lg font-bold font-mono text-slate-100 flex items-center gap-2">
            <FileCheck2 className="w-5 h-5 text-sky-400" />
            My Privileged Access Requests
          </h1>
          <p className="text-xs text-slate-400 mt-0.5">
            Full history of your Just-In-Time role requests, approval decisions, and status lifecycle.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={fetchRequests}
            disabled={loading}
            className="px-3 py-1.5 text-xs text-slate-400 hover:text-slate-200 border border-slate-800 hover:border-slate-700 bg-slate-900 rounded transition-colors flex items-center gap-1.5 focus:outline-none"
          >
            <RotateCcw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            <span>Refresh</span>
          </button>
          <button
            onClick={() => onNavigate('request-access')}
            className="px-3.5 py-1.5 text-xs font-semibold text-white bg-sky-600 hover:bg-sky-500 rounded transition-colors flex items-center gap-1.5 shadow-sm focus:outline-none"
          >
            <KeyRound className="w-3.5 h-3.5" />
            <span>New Request</span>
          </button>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="p-3.5 bg-slate-900 border border-slate-800 rounded-lg flex flex-col md:flex-row items-center justify-between gap-3">
        <div className="relative w-full md:w-72">
          <Search className="w-3.5 h-3.5 text-slate-500 absolute left-3 top-2.5" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by ID, resource, role, or ticket..."
            className="w-full bg-slate-950 border border-slate-700 rounded pl-8 pr-3 py-1.5 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-sky-500"
          />
        </div>

        <div className="flex items-center gap-2.5 w-full md:w-auto">
          <div className="flex items-center gap-1.5 text-2xs font-mono text-slate-400">
            <Filter className="w-3.5 h-3.5 text-slate-500" />
            <span>Status:</span>
          </div>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="bg-slate-950 border border-slate-700 rounded px-2.5 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-sky-500"
          >
            <option value="ALL">All Statuses</option>
            <option value="PENDING">PENDING</option>
            <option value="ACTIVE">ACTIVE</option>
            <option value="APPROVED">APPROVED</option>
            <option value="REJECTED">REJECTED</option>
            <option value="EXPIRED">EXPIRED</option>
            <option value="REVOKED">REVOKED</option>
          </select>

          <div className="flex items-center gap-1.5 text-2xs font-mono text-slate-400 ml-2">
            <span>Risk:</span>
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

      {/* Requests Table */}
      <div className="bg-slate-900 border border-slate-800 rounded-lg overflow-hidden">
        {loading && requests.length === 0 ? (
          <div className="p-12 text-center text-xs text-slate-400">
            Loading your access requests...
          </div>
        ) : filteredRequests.length === 0 ? (
          <EmptyState
            title="No Matching Access Requests"
            description={
              requests.length === 0
                ? "No privileged access requests yet. Submit your first Just-In-Time elevation request."
                : "No requests match your current search and filter criteria."
            }
            action={
              requests.length === 0
                ? {
                    label: 'Create Request',
                    onClick: () => onNavigate('request-access'),
                  }
                : undefined
            }
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-950/80 border-b border-slate-800 text-2xs uppercase tracking-wider text-slate-400 font-mono">
                <tr>
                  <th className="px-4 py-3">Request ID</th>
                  <th className="px-4 py-3">Resource</th>
                  <th className="px-4 py-3">Role</th>
                  <th className="px-4 py-3">Duration</th>
                  <th className="px-4 py-3">Justification</th>
                  <th className="px-4 py-3">Risk Tier</th>
                  <th className="px-4 py-3">Requested At</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {filteredRequests.map((req) => (
                  <tr key={req.id} className="hover:bg-slate-800/40 transition-colors">
                    <td className="px-4 py-3 font-mono font-medium text-slate-300 whitespace-nowrap">
                      {req.id}
                      {req.is_emergency && (
                        <span className="block text-3xs font-mono text-rose-400 mt-0.5">
                          BREAK-GLASS
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3 font-medium text-slate-200 whitespace-nowrap">{req.resource}</td>
                    <td className="px-4 py-3 font-mono text-slate-400 whitespace-nowrap">{req.role}</td>
                    <td className="px-4 py-3 text-slate-400 whitespace-nowrap">{req.duration_minutes}m</td>
                    <td className="px-4 py-3 max-w-xs truncate text-slate-400" title={req.reason}>
                      {req.reason}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      <RiskBadge level={req.risk_level} score={req.risk_score} />
                    </td>
                    <td className="px-4 py-3 text-slate-500 font-mono text-2xs whitespace-nowrap">
                      {new Date(req.requested_at).toLocaleDateString()}{' '}
                      {new Date(req.requested_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      <StatusBadge status={req.status} size="sm" />
                    </td>
                    <td className="px-4 py-3 text-right whitespace-nowrap">
                      <button
                        onClick={() => handleOpenDetail(req)}
                        className="text-xs text-sky-400 hover:text-sky-300 font-medium inline-flex items-center gap-1 transition-colors"
                      >
                        <span>View</span>
                        <ExternalLink className="w-3 h-3" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

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
