import React, { useState, useEffect } from 'react';
import { api } from '../services/api.js';
import { useNotifications } from '../context/NotificationContext.js';
import { AuditLog } from '../types.js';
import { AuditDetailModal } from '../components/AuditDetailModal.js';
import { EmptyState } from '../components/EmptyState.js';
import {
  History,
  Search,
  Filter,
  RotateCcw,
  ShieldCheck,
  Download,
  Terminal,
  ExternalLink
} from 'lucide-react';

const ACTIONS = [
  'ALL',
  'LOGIN_SUCCESS',
  'LOGIN_FAILED',
  'REQUEST_CREATED',
  'REQUEST_APPROVED',
  'REQUEST_REJECTED',
  'ACCESS_ACTIVATED',
  'ACCESS_REVOKED',
  'ACCESS_EXPIRED',
  'EMERGENCY_REQUESTED',
  'EMERGENCY_ACTIVATED',
  'EMERGENCY_EXPIRED',
  'USER_STATUS_TOGGLED',
  'POLICY_UPDATED',
  'PASSWORD_CHANGED',
];

export const AuditLogsPage: React.FC = () => {
  const { showToast } = useNotifications();

  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [loading, setLoading] = useState(true);

  // Filters
  const [actionFilter, setActionFilter] = useState('ALL');
  const [searchQuery, setSearchQuery] = useState('');

  // Selected Log Modal
  const [selectedLog, setSelectedLog] = useState<AuditLog | null>(null);
  const [detailOpen, setDetailOpen] = useState(false);

  const fetchLogs = async () => {
    try {
      setLoading(true);
      const res = await api.getAuditLogs({
        action: actionFilter !== 'ALL' ? actionFilter : undefined,
        search: searchQuery.trim() || undefined,
      });
      setLogs(res.logs);
      setTotalCount(res.total);
    } catch (err: any) {
      showToast('Failed to load audit logs.', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs();
  }, [actionFilter]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    fetchLogs();
  };

  const handleExportCSV = () => {
    if (logs.length === 0) return;
    const headerStr = 'ID,User,Email,Action,Resource,Role,Details,IP,Timestamp\n';
    const rows = logs.map(l =>
      `"${l.id}","${l.user_name}","${l.user_email}","${l.action}","${l.resource || ''}","${l.role || ''}","${l.details.replace(/"/g, '""')}","${l.ip_address || ''}","${l.timestamp}"`
    );
    const csvContent = headerStr + rows.join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `securejit-audit-trail-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    showToast('Audit trail exported successfully.', 'success');
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-2 border-b border-slate-800">
        <div>
          <h1 className="text-lg font-bold font-mono text-slate-100 flex items-center gap-2">
            <History className="w-5 h-5 text-sky-400" />
            Security & Identity Audit Trail
          </h1>
          <p className="text-xs text-slate-400 mt-0.5">
            Immutable, append-only security events recording all authorization requests, elevation decisions, and credential states.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleExportCSV}
            className="px-3 py-1.5 text-xs text-slate-300 hover:text-white bg-slate-900 hover:bg-slate-800 border border-slate-800 rounded transition-colors flex items-center gap-1.5 focus:outline-none"
          >
            <Download className="w-3.5 h-3.5 text-sky-400" />
            <span>Export CSV</span>
          </button>
          <button
            onClick={fetchLogs}
            disabled={loading}
            className="px-3 py-1.5 text-xs text-slate-400 hover:text-slate-200 border border-slate-800 bg-slate-900 rounded transition-colors flex items-center gap-1.5 focus:outline-none"
          >
            <RotateCcw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            <span>Refresh</span>
          </button>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <form onSubmit={handleSearchSubmit} className="p-3.5 bg-slate-900 border border-slate-800 rounded-lg flex flex-col md:flex-row items-center justify-between gap-3">
        <div className="relative w-full md:w-80">
          <Search className="w-3.5 h-3.5 text-slate-500 absolute left-3 top-2.5" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search details, actor, resource, or IP..."
            className="w-full bg-slate-950 border border-slate-700 rounded pl-8 pr-3 py-1.5 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-sky-500"
          />
        </div>

        <div className="flex items-center gap-2 w-full md:w-auto">
          <div className="flex items-center gap-1.5 text-2xs font-mono text-slate-400">
            <Filter className="w-3.5 h-3.5 text-slate-500" />
            <span>Action Event:</span>
          </div>
          <select
            value={actionFilter}
            onChange={(e) => setActionFilter(e.target.value)}
            className="bg-slate-950 border border-slate-700 rounded px-2.5 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-sky-500 font-mono text-2xs"
          >
            {ACTIONS.map((act) => (
              <option key={act} value={act}>{act}</option>
            ))}
          </select>
          <button
            type="submit"
            className="px-3 py-1.5 text-xs font-medium text-white bg-sky-600 hover:bg-sky-500 rounded transition-colors"
          >
            Search
          </button>
        </div>
      </form>

      {/* Audit Logs Table */}
      <div className="bg-slate-900 border border-slate-800 rounded-lg overflow-hidden">
        {loading && logs.length === 0 ? (
          <div className="p-12 text-center text-xs text-slate-400">
            Loading security audit records...
          </div>
        ) : logs.length === 0 ? (
          <EmptyState
            title="No Audit Records Found"
            description="No audit events matched your search query or action filter."
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-950/80 border-b border-slate-800 text-2xs uppercase tracking-wider text-slate-400 font-mono">
                <tr>
                  <th className="px-4 py-3">Audit ID</th>
                  <th className="px-4 py-3">Action</th>
                  <th className="px-4 py-3">Actor</th>
                  <th className="px-4 py-3">Resource / Scope</th>
                  <th className="px-4 py-3">Event Summary</th>
                  <th className="px-4 py-3">IP Address</th>
                  <th className="px-4 py-3">Timestamp</th>
                  <th className="px-4 py-3 text-right">Details</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 font-mono text-2xs">
                {logs.map((log) => {
                  let actionBadge = 'text-slate-300 bg-slate-800 border-slate-700';
                  if (log.action.includes('APPROVED') || log.action.includes('ACTIVATED') || log.action.includes('SUCCESS')) {
                    actionBadge = 'text-emerald-300 bg-emerald-950/50 border-emerald-800/60';
                  } else if (log.action.includes('REJECTED') || log.action.includes('REVOKED') || log.action.includes('FAILED')) {
                    actionBadge = 'text-rose-300 bg-rose-950/50 border-rose-800/60';
                  } else if (log.action.includes('EMERGENCY')) {
                    actionBadge = 'text-amber-300 bg-amber-950/50 border-amber-800/60';
                  }

                  return (
                    <tr key={log.id} className="hover:bg-slate-800/40 transition-colors">
                      <td className="px-4 py-3 text-slate-400 font-semibold">{log.id}</td>
                      <td className="px-4 py-3 whitespace-nowrap">
                        <span className={`px-2 py-0.5 rounded border text-3xs font-semibold ${actionBadge}`}>
                          {log.action}
                        </span>
                      </td>
                      <td className="px-4 py-3 font-sans text-slate-200 whitespace-nowrap">
                        <div>{log.user_name}</div>
                        <div className="text-3xs text-slate-500 font-mono">{log.user_email}</div>
                      </td>
                      <td className="px-4 py-3 font-sans text-slate-300 whitespace-nowrap">
                        {log.resource ? (
                          <div>
                            <span>{log.resource}</span>
                            {log.role && <span className="text-3xs text-sky-400 font-mono block">{log.role}</span>}
                          </div>
                        ) : (
                          <span className="text-slate-600">—</span>
                        )}
                      </td>
                      <td className="px-4 py-3 max-w-sm truncate text-slate-400 font-sans" title={log.details}>
                        {log.details}
                      </td>
                      <td className="px-4 py-3 text-slate-500 whitespace-nowrap">
                        {log.ip_address || '127.0.0.1'}
                      </td>
                      <td className="px-4 py-3 text-slate-500 whitespace-nowrap">
                        {new Date(log.timestamp).toLocaleDateString()}{' '}
                        {new Date(log.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                      </td>
                      <td className="px-4 py-3 text-right whitespace-nowrap">
                        <button
                          onClick={() => {
                            setSelectedLog(log);
                            setDetailOpen(true);
                          }}
                          className="text-sky-400 hover:text-sky-300 font-medium inline-flex items-center gap-1 font-sans text-xs transition-colors"
                        >
                          <span>Inspect</span>
                          <ExternalLink className="w-3 h-3" />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Audit Detail Modal */}
      <AuditDetailModal
        isOpen={detailOpen}
        log={selectedLog}
        onClose={() => setDetailOpen(false)}
      />
    </div>
  );
};
