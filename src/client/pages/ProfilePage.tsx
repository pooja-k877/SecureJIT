import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext.js';
import { useNotifications } from '../context/NotificationContext.js';
import { api } from '../services/api.js';
import { UserCheck, Lock, Shield, CheckCircle, AlertCircle, Key } from 'lucide-react';

export const ProfilePage: React.FC = () => {
  const { user } = useAuth();
  const { showToast } = useNotifications();

  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  const handlePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setSuccessMsg('');

    if (!currentPassword || !newPassword) {
      setErrorMsg('Current password and new password are required.');
      return;
    }

    if (newPassword.length < 6) {
      setErrorMsg('New password must be at least 6 characters.');
      return;
    }

    if (newPassword !== confirmPassword) {
      setErrorMsg('New passwords do not match.');
      return;
    }

    setLoading(true);
    try {
      await api.changePassword({ currentPassword, newPassword });
      setSuccessMsg('Your security password has been updated successfully.');
      showToast('Password updated successfully.', 'success');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to update password.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      {/* Page Header */}
      <div className="pb-2 border-b border-slate-800">
        <h1 className="text-lg font-bold font-mono text-slate-100 flex items-center gap-2">
          <UserCheck className="w-5 h-5 text-sky-400" />
          Security Account Profile
        </h1>
        <p className="text-xs text-slate-400 mt-0.5">
          Enterprise identity attributes, RBAC role assignment, and credential rotation controls.
        </p>
      </div>

      {/* Profile Details Card */}
      <div className="p-5 rounded-lg bg-slate-900 border border-slate-800 space-y-4">
        <div className="flex items-center gap-3.5 pb-4 border-b border-slate-800">
          <div className="w-12 h-12 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center font-mono text-lg font-bold text-sky-400">
            {user?.name.charAt(0) || 'U'}
          </div>
          <div>
            <h2 className="text-sm font-semibold text-slate-100">{user?.name}</h2>
            <p className="text-xs text-slate-400 font-mono">{user?.email}</p>
          </div>
          <div className="ml-auto">
            <span className="font-mono text-2xs font-bold uppercase tracking-wider px-2.5 py-1 rounded bg-sky-950/80 border border-sky-800 text-sky-300">
              Role: {user?.role}
            </span>
          </div>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs">
          <div className="p-3 rounded bg-slate-950/60 border border-slate-800">
            <span className="text-2xs text-slate-500 font-medium uppercase tracking-wider">Account ID</span>
            <p className="font-mono font-medium text-slate-300 mt-0.5">{user?.id}</p>
          </div>
          <div className="p-3 rounded bg-slate-950/60 border border-slate-800">
            <span className="text-2xs text-slate-500 font-medium uppercase tracking-wider">Department</span>
            <p className="font-medium text-slate-300 mt-0.5">{user?.department || 'Engineering'}</p>
          </div>
          <div className="p-3 rounded bg-slate-950/60 border border-slate-800">
            <span className="text-2xs text-slate-500 font-medium uppercase tracking-wider">Status</span>
            <p className="font-mono font-semibold text-emerald-400 mt-0.5">{user?.status}</p>
          </div>
          <div className="p-3 rounded bg-slate-950/60 border border-slate-800">
            <span className="text-2xs text-slate-500 font-medium uppercase tracking-wider">Last Login</span>
            <p className="font-mono text-2xs text-slate-300 mt-0.5">
              {user?.last_login_at ? new Date(user.last_login_at).toLocaleDateString() : 'Active now'}
            </p>
          </div>
        </div>
      </div>

      {/* Change Password Form */}
      <div className="p-5 rounded-lg bg-slate-900 border border-slate-800 space-y-4">
        <div className="flex items-center gap-2 pb-3 border-b border-slate-800">
          <Lock className="w-4 h-4 text-sky-400" />
          <h3 className="text-xs font-mono uppercase tracking-wider font-semibold text-slate-200">
            Rotate Account Password
          </h3>
        </div>

        {errorMsg && (
          <div className="p-3 rounded bg-rose-950/50 border border-rose-800 text-rose-300 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        {successMsg && (
          <div className="p-3 rounded bg-emerald-950/50 border border-emerald-800 text-emerald-300 text-xs flex items-center gap-2">
            <CheckCircle className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>{successMsg}</span>
          </div>
        )}

        <form onSubmit={handlePasswordSubmit} className="space-y-3.5 text-xs">
          <div>
            <label className="block text-2xs font-mono uppercase tracking-wider text-slate-400 font-medium mb-1">
              Current Password <span className="text-rose-400">*</span>
            </label>
            <input
              type="password"
              required
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              placeholder="••••••••••••"
              className="w-full bg-slate-950 border border-slate-700 rounded px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-sky-500 font-mono"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-2xs font-mono uppercase tracking-wider text-slate-400 font-medium mb-1">
                New Password <span className="text-rose-400">*</span>
              </label>
              <input
                type="password"
                required
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="At least 6 characters"
                className="w-full bg-slate-950 border border-slate-700 rounded px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-sky-500 font-mono"
              />
            </div>
            <div>
              <label className="block text-2xs font-mono uppercase tracking-wider text-slate-400 font-medium mb-1">
                Confirm New Password <span className="text-rose-400">*</span>
              </label>
              <input
                type="password"
                required
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Repeat new password"
                className="w-full bg-slate-950 border border-slate-700 rounded px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-sky-500 font-mono"
              />
            </div>
          </div>

          <div className="pt-2 flex justify-end">
            <button
              type="submit"
              disabled={loading}
              className="px-4 py-2 text-xs font-semibold text-white bg-sky-600 hover:bg-sky-500 rounded transition-colors disabled:opacity-50 flex items-center gap-1.5 focus:outline-none focus:ring-2 focus:ring-sky-400"
            >
              <Key className="w-3.5 h-3.5" />
              <span>{loading ? 'Rotating Hash...' : 'Update Password'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
