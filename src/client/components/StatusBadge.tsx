import React from 'react';
import { RequestStatus } from '../types.js';

interface StatusBadgeProps {
  status: RequestStatus | string;
  size?: 'sm' | 'md';
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({ status, size = 'md' }) => {
  const normalized = status.toUpperCase();

  let dotColor = 'bg-slate-400';
  let textColor = 'text-slate-300';

  switch (normalized) {
    case 'ACTIVE':
      dotColor = 'bg-emerald-400 shadow-xs shadow-emerald-400/50 animate-pulse';
      textColor = 'text-emerald-400';
      break;
    case 'PENDING':
      dotColor = 'bg-amber-400 shadow-xs shadow-amber-400/50';
      textColor = 'text-amber-400';
      break;
    case 'APPROVED':
      dotColor = 'bg-sky-400';
      textColor = 'text-sky-400';
      break;
    case 'REJECTED':
      dotColor = 'bg-rose-400';
      textColor = 'text-rose-400';
      break;
    case 'EXPIRED':
      dotColor = 'bg-slate-500';
      textColor = 'text-slate-400';
      break;
    case 'REVOKED':
      dotColor = 'bg-zinc-400';
      textColor = 'text-zinc-400';
      break;
    default:
      dotColor = 'bg-slate-400';
      textColor = 'text-slate-300';
  }

  const textSize = size === 'sm' ? 'text-xs' : 'text-xs tracking-wider';

  return (
    <span className={`inline-flex items-center gap-1.5 font-mono font-medium uppercase ${textSize} ${textColor}`}>
      <span className={`inline-block w-1.5 h-1.5 rounded-full ${dotColor}`} aria-hidden="true" />
      <span>{normalized}</span>
    </span>
  );
};
