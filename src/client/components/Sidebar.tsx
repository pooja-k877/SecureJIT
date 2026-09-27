import React from 'react';
import { useAuth } from '../context/AuthContext.js';
import {
  LayoutDashboard,
  KeyRound,
  FileCheck2,
  Clock,
  ShieldAlert,
  History,
  UserCheck,
  ShieldCheck,
  Users,
  Activity,
  AlertOctagon,
  LogOut,
  ChevronRight
} from 'lucide-react';

interface SidebarProps {
  currentPage: string;
  onNavigate: (page: string) => void;
  pendingRequestsCount?: number;
}

export const Sidebar: React.FC<SidebarProps> = ({
  currentPage,
  onNavigate,
  pendingRequestsCount = 0,
}) => {
  const { isAdmin, logout } = useAuth();

  const userNavItems = [
    { id: 'dashboard', label: 'Dashboard', icon: <LayoutDashboard className="w-4 h-4" /> },
    { id: 'request-access', label: 'Request Access', icon: <KeyRound className="w-4 h-4" /> },
    { id: 'my-requests', label: 'My Requests', icon: <FileCheck2 className="w-4 h-4" /> },
    { id: 'active-access', label: 'Active Access', icon: <Clock className="w-4 h-4" /> },
    { id: 'emergency-access', label: 'Emergency Access', icon: <ShieldAlert className="w-4 h-4" />, highlight: true },
    { id: 'audit-logs', label: 'Audit Activity', icon: <History className="w-4 h-4" /> },
    { id: 'profile', label: 'Profile', icon: <UserCheck className="w-4 h-4" /> },
  ];

  const adminNavItems = [
    { id: 'admin-overview', label: 'Overview', icon: <ShieldCheck className="w-4 h-4" /> },
    {
      id: 'admin-pending',
      label: 'Pending Requests',
      icon: <FileCheck2 className="w-4 h-4" />,
      badge: pendingRequestsCount > 0 ? pendingRequestsCount : undefined,
    },
    { id: 'admin-users', label: 'User Directory', icon: <Users className="w-4 h-4" /> },
    { id: 'admin-security', label: 'Security Monitor', icon: <Activity className="w-4 h-4" /> },
    { id: 'admin-emergency', label: 'Emergency Controls', icon: <AlertOctagon className="w-4 h-4" /> },
  ];

  return (
    <aside className="w-64 bg-slate-900/90 border-r border-slate-800 flex flex-col shrink-0 select-none">
      <div className="p-4 flex-1 overflow-y-auto space-y-6">
        {/* User Navigation Group */}
        <div>
          <span className="px-3 text-2xs font-mono font-semibold uppercase tracking-wider text-slate-500 block mb-2">
            Privileged Access Portal
          </span>
          <nav className="space-y-1">
            {userNavItems.map((item) => {
              const isActive = currentPage === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => onNavigate(item.id)}
                  className={`w-full flex items-center justify-between px-3 py-2 text-xs font-medium rounded transition-all group ${
                    isActive
                      ? 'bg-sky-500/10 text-sky-400 border-l-2 border-sky-400 font-semibold'
                      : item.highlight
                      ? 'text-amber-300/90 hover:bg-amber-950/20 hover:text-amber-200'
                      : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <span className={isActive ? 'text-sky-400' : item.highlight ? 'text-amber-400' : 'text-slate-400 group-hover:text-slate-200'}>
                      {item.icon}
                    </span>
                    <span>{item.label}</span>
                  </div>
                  {isActive && <ChevronRight className="w-3.5 h-3.5 text-sky-400" />}
                </button>
              );
            })}
          </nav>
        </div>

        {/* Administrator Security Control Center (Visible if Admin) */}
        {isAdmin && (
          <div className="pt-2 border-t border-slate-800/80">
            <span className="px-3 text-2xs font-mono font-semibold uppercase tracking-wider text-sky-400/90 block mb-2 flex items-center gap-1.5">
              <ShieldCheck className="w-3.5 h-3.5" />
              Security Governance
            </span>
            <nav className="space-y-1">
              {adminNavItems.map((item) => {
                const isActive = currentPage === item.id;
                return (
                  <button
                    key={item.id}
                    onClick={() => onNavigate(item.id)}
                    className={`w-full flex items-center justify-between px-3 py-2 text-xs font-medium rounded transition-all group ${
                      isActive
                        ? 'bg-sky-500/10 text-sky-400 border-l-2 border-sky-400 font-semibold'
                        : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
                    }`}
                  >
                    <div className="flex items-center gap-2.5">
                      <span className={isActive ? 'text-sky-400' : 'text-slate-400 group-hover:text-slate-200'}>
                        {item.icon}
                      </span>
                      <span>{item.label}</span>
                    </div>
                    {item.badge !== undefined && (
                      <span className="font-mono text-2xs font-bold px-1.5 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30">
                        {item.badge}
                      </span>
                    )}
                  </button>
                );
              })}
            </nav>
          </div>
        )}
      </div>

      {/* Footer System Status & Logout */}
      <div className="p-3.5 border-t border-slate-800 bg-slate-950/60 space-y-2">
        <div className="px-2 py-1.5 rounded bg-slate-900/80 border border-slate-800 text-2xs text-slate-400">
          <div className="flex items-center justify-between font-mono">
            <span>AZURE_TENANT</span>
            <span className="text-emerald-400 font-semibold">ONLINE</span>
          </div>
          <p className="text-slate-500 font-mono mt-0.5 text-3xs truncate">PIM-JIT: v1.0.0-hackathon</p>
        </div>

        <button
          onClick={logout}
          className="w-full flex items-center gap-2 px-3 py-2 text-xs font-medium text-slate-400 hover:text-rose-400 hover:bg-rose-950/20 rounded transition-colors"
        >
          <LogOut className="w-3.5 h-3.5" />
          <span>Sign Out</span>
        </button>
      </div>
    </aside>
  );
};
