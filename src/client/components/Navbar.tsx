import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext.js';
import { useNotifications } from '../context/NotificationContext.js';
import { Bell, User, LogOut, CheckCircle2 } from 'lucide-react';
interface NavbarProps {
  onOpenNotifications: () => void;
  onNavigate: (page: string) => void;
}

export const Navbar: React.FC<NavbarProps> = ({ onOpenNotifications, onNavigate }) => {
  const { user, isAdmin, logout } = useAuth();
 const { unreadCount } = useNotifications();
  const [dropdownOpen, setDropdownOpen] = useState(false);

  return (
    <header className="sticky top-0 z-40 w-full bg-slate-900/95 border-b border-slate-800 backdrop-blur-md">
      <div className="flex items-center justify-between px-4 sm:px-6 h-14">
        {/* Brand & Identity */}
        <div className="flex items-center gap-3.5">
          <div className="flex items-center gap-2.5 cursor-pointer" onClick={() => onNavigate(isAdmin ? 'admin-overview' : 'dashboard')}>
            {/* Custom Security Shield Logo */}
            <div className="w-8 h-8 rounded bg-gradient-to-br from-sky-500 to-indigo-700 flex items-center justify-center shadow-md shadow-sky-950 border border-sky-400/30">
              <svg className="w-4 h-4 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
                <path d="M12 8v4" />
                <path d="M12 16h.01" />
              </svg>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-mono text-base font-bold tracking-tight text-white">SecureJIT</span>
                <span className="hidden md:inline-flex items-center gap-1 text-2xs font-mono text-emerald-400 bg-emerald-950/60 border border-emerald-800/80 px-1.5 py-0.2 rounded" title="Azure PIM Integration (Simulator Mode)">
                  <CheckCircle2 className="w-2.5 h-2.5" /> Azure PIM (Simulator)
                </span>
              </div>
              <p className="text-2xs text-slate-400 font-medium hidden sm:block">Just-In-Time Privileged Access Manager</p>
            </div>
          </div>
        </div>

        {/* Right Section: Persona Switcher, Notifications & Profile */}
        <div className="flex items-center gap-2 sm:gap-3">
          

          {/* Notifications Button */}
          <button
            onClick={onOpenNotifications}
            className="relative p-2 text-slate-400 hover:text-slate-200 hover:bg-slate-800/60 rounded focus:outline-none"
            aria-label="Open notifications"
          >
            <Bell className="w-4 h-4" />
            {unreadCount > 0 && (
              <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-sky-400 ring-2 ring-slate-900 animate-pulse" />
            )}
          </button>

          {/* User Profile Dropdown */}
          <div className="relative">
            <button
              onClick={() => setDropdownOpen(!dropdownOpen)}
              className="flex items-center gap-2.5 p-1 pl-2 text-left rounded hover:bg-slate-800/60 transition-colors focus:outline-none border border-transparent hover:border-slate-800"
            >
              <div className="w-7 h-7 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center text-xs font-semibold text-sky-400 font-mono">
                {user?.name.charAt(0) || 'U'}
              </div>
              <div className="hidden lg:flex flex-col">
                <span className="text-xs font-medium text-slate-200 truncate max-w-[120px]">{user?.name}</span>
                <span className="text-2xs text-slate-400 uppercase font-mono tracking-wider">{user?.role}</span>
              </div>
            </button>

            {dropdownOpen && (
              <>
                <div className="fixed inset-0 z-30" onClick={() => setDropdownOpen(false)} />
                <div className="absolute right-0 mt-1.5 w-52 bg-slate-900 border border-slate-800 rounded-lg shadow-xl py-1 z-40 text-xs animate-in fade-in zoom-in-95 duration-100">
                  <div className="px-3.5 py-2.5 border-b border-slate-800">
                    <p className="font-medium text-slate-200 truncate">{user?.name}</p>
                    <p className="text-2xs text-slate-400 truncate mt-0.5">{user?.email}</p>
                    <span className="inline-block mt-1.5 text-2xs font-mono font-medium text-sky-400 px-1.5 py-0.5 rounded bg-sky-950 border border-sky-800">
                      Role: {user?.role}
                    </span>
                  </div>

                  <button
                    onClick={() => {
                      setDropdownOpen(false);
                      onNavigate('profile');
                    }}
                    className="w-full px-3.5 py-2 text-left text-slate-300 hover:text-white hover:bg-slate-800/80 flex items-center gap-2"
                  >
                    <User className="w-3.5 h-3.5 text-slate-400" />
                    Security Profile
                  </button>

                  <div className="border-t border-slate-800/80 my-1" />

                  <button
                    onClick={() => {
                      setDropdownOpen(false);
                      logout();
                    }}
                    className="w-full px-3.5 py-2 text-left text-rose-400 hover:text-rose-300 hover:bg-rose-950/30 flex items-center gap-2"
                  >
                    <LogOut className="w-3.5 h-3.5 text-rose-400" />
                    Sign Out
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};
