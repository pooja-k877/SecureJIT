import React from 'react';
import { useNotifications } from '../context/NotificationContext.js';
import { X, CheckCheck, Bell, ShieldAlert, CheckCircle, Info, AlertTriangle } from 'lucide-react';

interface NotificationDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  onViewRequest?: (requestId: string) => void;
}

export const NotificationDrawer: React.FC<NotificationDrawerProps> = ({ isOpen, onClose, onViewRequest }) => {
  const { notifications, unreadCount, markAsRead, markAllAsRead } = useNotifications();

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-hidden bg-black/60 backdrop-blur-xs">
      <div className="absolute inset-y-0 right-0 max-w-full flex pl-10">
        <div className="w-screen max-w-md bg-slate-900 border-l border-slate-800 shadow-2xl flex flex-col animate-in slide-in-from-right duration-200">
          {/* Header */}
          <div className="px-5 py-4 border-b border-slate-800 bg-slate-950/60 flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <Bell className="w-4 h-4 text-sky-400" />
              <h3 className="text-sm font-semibold text-slate-100">Security Notifications</h3>
              {unreadCount > 0 && (
                <span className="font-mono text-2xs px-2 py-0.5 rounded-full bg-sky-950 border border-sky-800 text-sky-400 font-semibold">
                  {unreadCount} unread
                </span>
              )}
            </div>
            <div className="flex items-center gap-2">
              {unreadCount > 0 && (
                <button
                  onClick={markAllAsRead}
                  className="text-2xs text-sky-400 hover:text-sky-300 flex items-center gap-1 font-medium transition-colors"
                >
                  <CheckCheck className="w-3.5 h-3.5" /> Mark all read
                </button>
              )}
              <button
                onClick={onClose}
                className="text-slate-400 hover:text-slate-200 p-1 rounded focus:outline-none"
                aria-label="Close notifications panel"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* List */}
          <div className="flex-1 overflow-y-auto divide-y divide-slate-800/60">
            {notifications.length === 0 ? (
              <div className="flex flex-col items-center justify-center p-12 text-center text-slate-400">
                <Bell className="w-8 h-8 text-slate-600 mb-2" />
                <p className="text-xs font-medium text-slate-300">No notifications yet</p>
                <p className="text-2xs text-slate-500 mt-1">Audit and workflow alerts will appear here in real-time.</p>
              </div>
            ) : (
              notifications.map((notif) => {
                let icon = <Info className="w-4 h-4 text-sky-400 shrink-0" />;
                if (notif.type === 'SUCCESS') icon = <CheckCircle className="w-4 h-4 text-emerald-400 shrink-0" />;
                if (notif.type === 'WARNING') icon = <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0" />;
                if (notif.type === 'ALERT') icon = <ShieldAlert className="w-4 h-4 text-rose-400 shrink-0" />;

                return (
                  <div
                    key={notif.id}
                    className={`p-4 transition-colors flex items-start gap-3 ${
                      notif.is_read ? 'bg-slate-900/40 opacity-75' : 'bg-slate-850/90'
                    }`}
                  >
                    <div className="mt-0.5">{icon}</div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2">
                        <h4 className="text-xs font-semibold text-slate-200 truncate">{notif.title}</h4>
                        <span className="text-2xs text-slate-500 whitespace-nowrap font-mono">
                          {new Date(notif.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>
                      <p className="text-2xs text-slate-400 mt-1 leading-relaxed">{notif.message}</p>

                      <div className="flex items-center gap-3 mt-2.5">
                        {notif.request_id && onViewRequest && (
                          <button
                            onClick={() => {
                              onViewRequest(notif.request_id!);
                              onClose();
                            }}
                            className="text-2xs text-sky-400 hover:text-sky-300 font-medium font-mono"
                          >
                            Inspect {notif.request_id} →
                          </button>
                        )}
                        {!notif.is_read && (
                          <button
                            onClick={() => markAsRead(notif.id)}
                            className="text-2xs text-slate-500 hover:text-slate-300 transition-colors ml-auto"
                          >
                            Dismiss
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
