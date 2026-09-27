import React, { useState, useEffect } from 'react';
import { api } from '../../services/api.js';
import { useNotifications } from '../../context/NotificationContext.js';
import { useAuth } from '../../context/AuthContext.js';
import { User } from '../../types.js';
import { ConfirmModal } from '../../components/ConfirmModal.js';
import { EmptyState } from '../../components/EmptyState.js';
import {
  Users,
  Search,
  Shield,
  RotateCcw,
  UserCheck,
  UserX,
  Lock,
  CheckCircle,
  AlertCircle
} from 'lucide-react';

export const UserManagementPage: React.FC = () => {
  const { user: currentUser } = useAuth();
  const { showToast } = useNotifications();

  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  // Toggle status state
  const [targetUser, setTargetUser] = useState<User | null>(null);
  const [toggling, setToggling] = useState(false);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const res = await api.getAdminUsers();
      setUsers(res.users);
    } catch (err: any) {
      showToast('Failed to load user directory.', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const handleToggleConfirm = async () => {
    if (!targetUser) return;
    setToggling(true);
    try {
      const res = await api.toggleUserStatus(targetUser.id);
      showToast(res.message, 'success');
      setTargetUser(null);
      await fetchUsers();
    } catch (err: any) {
      showToast(err.message || 'Failed to update user status.', 'error');
    } finally {
      setToggling(false);
    }
  };

  const filteredUsers = users.filter((u) => {
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      return (
        u.name.toLowerCase().includes(q) ||
        u.email.toLowerCase().includes(q) ||
        u.department?.toLowerCase().includes(q) ||
        u.role.toLowerCase().includes(q)
      );
    }
    return true;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-2 border-b border-slate-800">
        <div>
          <h1 className="text-lg font-bold font-mono text-slate-100 flex items-center gap-2">
            <Users className="w-5 h-5 text-sky-400" />
            Corporate Directory & Identity Accounts
          </h1>
          <p className="text-xs text-slate-400 mt-0.5">
            Directory of identity principals subject to Just-In-Time access management and security policies.
          </p>
        </div>

        <button
          onClick={fetchUsers}
          disabled={loading}
          className="px-3 py-1.5 text-xs text-slate-400 hover:text-slate-200 border border-slate-800 bg-slate-900 rounded transition-colors flex items-center gap-1.5 focus:outline-none"
        >
          <RotateCcw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          <span>Refresh Directory</span>
        </button>
      </div>

      {/* Search Bar */}
      <div className="p-3.5 bg-slate-900 border border-slate-800 rounded-lg flex items-center justify-between">
        <div className="relative w-full max-w-md">
          <Search className="w-3.5 h-3.5 text-slate-500 absolute left-3 top-2.5" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by principal name, email, role, or department..."
            className="w-full bg-slate-950 border border-slate-700 rounded pl-8 pr-3 py-1.5 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-sky-500"
          />
        </div>
        <span className="text-2xs font-mono text-slate-400">
          Total Users: {users.length}
        </span>
      </div>

      {/* Directory Table */}
      <div className="bg-slate-900 border border-slate-800 rounded-lg overflow-hidden">
        {loading && users.length === 0 ? (
          <div className="p-12 text-center text-xs text-slate-400">
            Loading directory identities...
          </div>
        ) : filteredUsers.length === 0 ? (
          <EmptyState
            title="No Users Found"
            description="No directory principals matched your search criteria."
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-950/80 border-b border-slate-800 text-2xs uppercase tracking-wider text-slate-400 font-mono">
                <tr>
                  <th className="px-4 py-3">Principal Name</th>
                  <th className="px-4 py-3">Corporate Email</th>
                  <th className="px-4 py-3">Department</th>
                  <th className="px-4 py-3">Role</th>
                  <th className="px-4 py-3">Account Status</th>
                  <th className="px-4 py-3">Created</th>
                  <th className="px-4 py-3">Last Active</th>
                  <th className="px-4 py-3 text-right">Access Controls</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {filteredUsers.map((u) => {
                  const isProtected = u.id === 'USR-001' || u.id === currentUser?.id;
                  const isActive = u.status === 'ACTIVE';

                  return (
                    <tr key={u.id} className="hover:bg-slate-800/40 transition-colors">
                      <td className="px-4 py-3 whitespace-nowrap">
                        <div className="flex items-center gap-2.5">
                          <div className="w-7 h-7 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center font-mono font-bold text-sky-400 text-xs">
                            {u.name.charAt(0)}
                          </div>
                          <div>
                            <span className="font-medium text-slate-200">{u.name}</span>
                            <span className="text-3xs font-mono text-slate-500 block">{u.id}</span>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3 font-mono text-slate-300 whitespace-nowrap">{u.email}</td>
                      <td className="px-4 py-3 text-slate-400 whitespace-nowrap">{u.department || 'Engineering'}</td>
                      <td className="px-4 py-3 whitespace-nowrap">
                        <span
                          className={`font-mono text-2xs font-semibold px-2 py-0.5 rounded border ${
                            u.role === 'ADMIN'
                              ? 'text-sky-300 bg-sky-950/60 border-sky-800'
                              : 'text-slate-300 bg-slate-800 border-slate-700'
                          }`}
                        >
                          {u.role}
                        </span>
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap">
                        <span
                          className={`inline-flex items-center gap-1.5 font-mono text-2xs font-medium ${
                            isActive ? 'text-emerald-400' : 'text-rose-400'
                          }`}
                        >
                          <span
                            className={`w-1.5 h-1.5 rounded-full ${
                              isActive ? 'bg-emerald-400' : 'bg-rose-500'
                            }`}
                          />
                          <span>{u.status}</span>
                        </span>
                      </td>
                      <td className="px-4 py-3 text-slate-500 font-mono text-2xs whitespace-nowrap">
                        {new Date(u.created_at).toLocaleDateString()}
                      </td>
                      <td className="px-4 py-3 text-slate-500 font-mono text-2xs whitespace-nowrap">
                        {u.last_login_at
                          ? new Date(u.last_login_at).toLocaleDateString()
                          : 'Never'}
                      </td>
                      <td className="px-4 py-3 text-right whitespace-nowrap">
                        {isProtected ? (
                          <span
                            className="text-3xs font-mono text-slate-500 border border-slate-800 px-2 py-1 rounded"
                            title="Protected root account cannot be disabled."
                          >
                            Protected Root
                          </span>
                        ) : (
                          <button
                            onClick={() => setTargetUser(u)}
                            className={`px-2.5 py-1 text-2xs font-medium rounded border transition-colors inline-flex items-center gap-1 ${
                              isActive
                                ? 'text-rose-400 hover:text-white hover:bg-rose-600 border-rose-900/60'
                                : 'text-emerald-400 hover:text-white hover:bg-emerald-600 border-emerald-900/60'
                            }`}
                          >
                            {isActive ? (
                              <>
                                <UserX className="w-3 h-3" />
                                <span>Disable Account</span>
                              </>
                            ) : (
                              <>
                                <UserCheck className="w-3 h-3" />
                                <span>Enable Account</span>
                              </>
                            )}
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Confirmation Modal */}
      <ConfirmModal
        isOpen={Boolean(targetUser)}
        onClose={() => setTargetUser(null)}
        onConfirm={handleToggleConfirm}
        title={targetUser?.status === 'ACTIVE' ? 'Deactivate User Account' : 'Reactivate User Account'}
        message={`Are you sure you want to change the status of ${targetUser?.name} (${targetUser?.email}) to ${
          targetUser?.status === 'ACTIVE' ? 'DISABLED' : 'ACTIVE'
        }? ${
          targetUser?.status === 'ACTIVE'
            ? 'This principal will be prevented from authenticating or requesting privileged JIT access.'
            : 'This principal will be restored to normal access.'
        }`}
        confirmLabel={targetUser?.status === 'ACTIVE' ? 'Disable Account' : 'Enable Account'}
        variant={targetUser?.status === 'ACTIVE' ? 'danger' : 'success'}
        loading={toggling}
      />
    </div>
  );
};
