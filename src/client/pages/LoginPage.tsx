import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext.js';
import { Shield, KeyRound, AlertCircle, CheckCircle, ArrowRight, UserCheck, Lock } from 'lucide-react';
import { api } from '../services/api.js';

export const LoginPage: React.FC = () => {
  const { login } = useAuth();
  const [isRegister, setIsRegister] = useState(false);
  const [email, setEmail] = useState('admin@securejit.local');
  const [password, setPassword] = useState('Admin@123');
  const [name, setName] = useState('');
  const [department, setDepartment] = useState('Engineering');
  const [role, setRole] = useState<'USER' | 'ADMIN'>('USER');

  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');
    setSuccessMessage('');

    if (!email.trim() || !password.trim()) {
      setErrorMessage('Email and password are required.');
      return;
    }

    setLoading(true);
    try {
      if (isRegister) {
        if (!name.trim()) {
          setErrorMessage('Full name is required for registration.');
          setLoading(false);
          return;
        }
        await api.register({
          name: name.trim(),
          email: email.trim(),
          password,
          department,
          role,
        });
        setSuccessMessage('Account registered successfully. Signing in...');
        await login(email.trim(), password);
      } else {
        await login(email.trim(), password);
      }
    } catch (err: any) {
      setErrorMessage(err.message || 'Authentication failed. Please verify credentials.');
    } finally {
      setLoading(false);
    }
  };

  const fillAdmin = () => {
    setIsRegister(false);
    setEmail('admin@securejit.local');
    setPassword('Admin@123');
    setErrorMessage('');
  };

  const fillUser = () => {
    setIsRegister(false);
    setEmail('user@securejit.local');
    setPassword('User@123');
    setErrorMessage('');
  };

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col justify-center py-12 sm:px-6 lg:px-8 text-slate-100">
      {/* Top Header & Branding */}
      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center">
        <div className="inline-flex items-center justify-center w-12 h-12 rounded-lg bg-gradient-to-br from-sky-500 to-indigo-700 shadow-xl border border-sky-400/40 mb-3">
          <svg className="w-6 h-6 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
            <path d="M12 8v4" />
            <path d="M12 16h.01" />
          </svg>
        </div>
        <h1 className="text-xl font-bold font-mono tracking-tight text-white">SecureJIT</h1>
        <p className="mt-1 text-xs text-slate-400">
          Azure Privileged Identity Management · Just-In-Time Access Workflow
        </p>
      </div>

      {/* Main Form Container */}
      <div className="mt-6 sm:mx-auto sm:w-full sm:max-w-md px-4">
        <div className="bg-slate-900/90 border border-slate-800 py-6 px-6 sm:px-8 rounded-lg shadow-2xl">
          {/* Demo Account Quick-Fill Card */}
          <div className="mb-5 p-3 rounded bg-slate-950/70 border border-slate-800 text-xs">
            <div className="flex items-center justify-between mb-2">
              <span className="font-mono text-2xs uppercase tracking-wider text-slate-400 font-semibold">
                Demo Accounts for Testing
              </span>
              <span className="text-3xs font-mono text-emerald-400">1-Click Auto Fill</span>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={fillAdmin}
                className="px-2.5 py-1.5 text-left rounded bg-slate-800/80 hover:bg-slate-750 border border-slate-700/80 transition-colors group focus:outline-none"
              >
                <div className="text-2xs font-mono font-semibold text-sky-400 group-hover:text-sky-300">
                  ADMIN Role
                </div>
                <div className="text-3xs text-slate-400 truncate">admin@securejit.local</div>
              </button>
              <button
                type="button"
                onClick={fillUser}
                className="px-2.5 py-1.5 text-left rounded bg-slate-800/80 hover:bg-slate-750 border border-slate-700/80 transition-colors group focus:outline-none"
              >
                <div className="text-2xs font-mono font-semibold text-emerald-400 group-hover:text-emerald-300">
                  USER Role
                </div>
                <div className="text-3xs text-slate-400 truncate">user@securejit.local</div>
              </button>
            </div>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            {errorMessage && (
              <div className="p-3 rounded bg-rose-950/50 border border-rose-800/80 text-rose-300 text-xs flex flex-col gap-2">
                <div className="flex items-start gap-2">
                  <AlertCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
                  <span className="flex-1 leading-relaxed">{errorMessage}</span>
                </div>
                {errorMessage.includes('unavailable') && (
                  <button
                    type="button"
                    onClick={(e) => handleSubmit(e)}
                    className="self-end px-2.5 py-1 text-2xs font-medium rounded bg-rose-900/60 hover:bg-rose-800/80 text-rose-200 border border-rose-700/60 transition-colors cursor-pointer"
                  >
                    Retry Connection
                  </button>
                )}
              </div>
            )}

            {successMessage && (
              <div className="p-3 rounded bg-emerald-950/50 border border-emerald-800/80 text-emerald-300 text-xs flex items-start gap-2">
                <CheckCircle className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                <span>{successMessage}</span>
              </div>
            )}

            {isRegister && (
              <>
                <div>
                  <label className="block text-2xs font-medium uppercase tracking-wider text-slate-400 mb-1">
                    Full Name <span className="text-rose-400">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="e.g. Elena Rostova"
                    className="w-full bg-slate-950 border border-slate-700 rounded px-3 py-2 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-sky-500 focus:ring-1 focus:ring-sky-500"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-2xs font-medium uppercase tracking-wider text-slate-400 mb-1">
                      Department
                    </label>
                    <input
                      type="text"
                      value={department}
                      onChange={(e) => setDepartment(e.target.value)}
                      placeholder="e.g. DevOps"
                      className="w-full bg-slate-950 border border-slate-700 rounded px-3 py-2 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-sky-500"
                    />
                  </div>
                  <div>
                    <label className="block text-2xs font-medium uppercase tracking-wider text-slate-400 mb-1">
                      Account Role
                    </label>
                    <select
                      value={role}
                      onChange={(e) => setRole(e.target.value as 'USER' | 'ADMIN')}
                      className="w-full bg-slate-950 border border-slate-700 rounded px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-sky-500"
                    >
                      <option value="USER">USER (Requester)</option>
                      <option value="ADMIN">ADMIN (Reviewer)</option>
                    </select>
                  </div>
                </div>
              </>
            )}

            <div>
              <label className="block text-2xs font-medium uppercase tracking-wider text-slate-400 mb-1">
                Corporate Email Address <span className="text-rose-400">*</span>
              </label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="name@securejit.local"
                className="w-full bg-slate-950 border border-slate-700 rounded px-3 py-2 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-sky-500 focus:ring-1 focus:ring-sky-500 font-mono"
              />
            </div>

            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="block text-2xs font-medium uppercase tracking-wider text-slate-400">
                  Password <span className="text-rose-400">*</span>
                </label>
              </div>
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••••••"
                className="w-full bg-slate-950 border border-slate-700 rounded px-3 py-2 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-sky-500 focus:ring-1 focus:ring-sky-500 font-mono"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full mt-2 py-2 px-4 rounded bg-sky-600 hover:bg-sky-500 text-white font-medium text-xs shadow-md transition-colors flex items-center justify-center gap-1.5 focus:outline-none focus:ring-2 focus:ring-sky-400 focus:ring-offset-2 focus:ring-offset-slate-900 disabled:opacity-50"
            >
              {loading ? (
                'Authenticating with Security Realm...'
              ) : isRegister ? (
                <>Register & Sign In <ArrowRight className="w-3.5 h-3.5" /></>
              ) : (
                <>Sign In to Console <ArrowRight className="w-3.5 h-3.5" /></>
              )}
            </button>
          </form>

          {/* Toggle Register/Login */}
          <div className="mt-4 pt-4 border-t border-slate-800 text-center">
            <button
              type="button"
              onClick={() => {
                setIsRegister(!isRegister);
                setErrorMessage('');
                setSuccessMessage('');
              }}
              className="text-2xs text-slate-400 hover:text-sky-400 transition-colors"
            >
              {isRegister
                ? 'Already have an account? Sign in with existing credentials'
                : 'Need to provision a new user for evaluation? Register here'}
            </button>
          </div>
        </div>

        {/* Security Posture Note */}
        <div className="mt-6 text-center text-3xs text-slate-500 space-y-1">
          <p>Enforcing Least-Privilege & Just-In-Time Elevation Principles</p>
          <p className="font-mono">Audit Standard: ISO 27001 · SOC 2 Type II Compliant Workflow</p>
        </div>
      </div>
    </div>
  );
};
