import React from 'react';
import { AuditLog } from '../types.js';
import { X, ShieldCheck, Clock, MapPin, User, Terminal } from 'lucide-react';

interface AuditDetailModalProps {
  log: AuditLog | null;
  isOpen: boolean;
  onClose: () => void;
}

export const AuditDetailModal: React.FC<AuditDetailModalProps> = ({ log, isOpen, onClose }) => {
  if (!isOpen || !log) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-xs">
      <div className="bg-slate-900 border border-slate-800 rounded-lg max-w-lg w-full shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-800 bg-slate-950/40">
          <div className="flex items-center gap-2.5">
            <ShieldCheck className="w-5 h-5 text-sky-400" />
            <div className="flex items-center gap-2">
              <span className="font-mono text-sm font-semibold text-slate-100">{log.id}</span>
              <span className="text-2xs font-mono font-medium uppercase px-2 py-0.5 rounded bg-slate-800 text-slate-300 border border-slate-700">
                {log.action}
              </span>
            </div>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-200 p-1 rounded">
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-5 space-y-4 text-xs">
          <div className="grid grid-cols-2 gap-3 p-3 bg-slate-950/60 rounded border border-slate-800">
            <div>
              <span className="text-2xs uppercase text-slate-500 font-medium flex items-center gap-1">
                <User className="w-3 h-3" /> Actor
              </span>
              <p className="text-slate-200 font-medium mt-0.5">{log.user_name}</p>
              <p className="text-slate-500 text-2xs truncate">{log.user_email}</p>
            </div>
            <div>
              <span className="text-2xs uppercase text-slate-500 font-medium flex items-center gap-1">
                <Clock className="w-3 h-3" /> Timestamp
              </span>
              <p className="text-slate-200 font-mono mt-0.5">{new Date(log.timestamp).toLocaleString()}</p>
              <p className="text-slate-500 text-2xs flex items-center gap-1 mt-0.5">
                <MapPin className="w-3 h-3" /> {log.ip_address || 'Internal/System'}
              </p>
            </div>
          </div>

          {(log.resource || log.role) && (
            <div className="grid grid-cols-2 gap-3 p-3 bg-slate-950/40 rounded border border-slate-800">
              {log.resource && (
                <div>
                  <span className="text-2xs uppercase text-slate-500 font-medium">Resource Scope</span>
                  <p className="text-slate-200 font-medium mt-0.5">{log.resource}</p>
                </div>
              )}
              {log.role && (
                <div>
                  <span className="text-2xs uppercase text-slate-500 font-medium">Elevated Role</span>
                  <p className="text-slate-200 font-medium mt-0.5">{log.role}</p>
                </div>
              )}
            </div>
          )}

          <div>
            <span className="text-2xs uppercase text-slate-500 font-medium flex items-center gap-1 mb-1.5">
              <Terminal className="w-3 h-3" /> Audit Record Details & Telemetry
            </span>
            <div className="p-3 bg-slate-950 rounded border border-slate-800 font-mono text-2xs text-slate-300 leading-relaxed break-words whitespace-pre-wrap">
              {log.details}
            </div>
          </div>
        </div>

        <div className="flex justify-end px-5 py-3 bg-slate-950 border-t border-slate-800">
          <button
            onClick={onClose}
            className="px-4 py-1.5 text-xs font-medium text-slate-300 bg-slate-800 hover:bg-slate-700 rounded transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
