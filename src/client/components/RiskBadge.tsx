import React from 'react';
import { RiskLevel } from '../types.js';

interface RiskBadgeProps {
  level: RiskLevel;
  score?: number;
  showScore?: boolean;
}

export const RiskBadge: React.FC<RiskBadgeProps> = ({ level, score, showScore = false }) => {
  let colorStyles = 'text-slate-300 border-slate-700 bg-slate-800/40';
  let indicator = 'bg-slate-400';

  switch (level) {
    case 'CRITICAL':
      colorStyles = 'text-rose-300 border-rose-800/60 bg-rose-950/40';
      indicator = 'bg-rose-500';
      break;
    case 'HIGH':
      colorStyles = 'text-orange-300 border-orange-800/60 bg-orange-950/40';
      indicator = 'bg-orange-500';
      break;
    case 'MEDIUM':
      colorStyles = 'text-amber-300 border-amber-800/60 bg-amber-950/40';
      indicator = 'bg-amber-500';
      break;
    case 'LOW':
    default:
      colorStyles = 'text-emerald-300 border-emerald-800/60 bg-emerald-950/40';
      indicator = 'bg-emerald-500';
      break;
  }

  return (
    <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-xs font-mono font-medium border ${colorStyles}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${indicator}`} aria-hidden="true" />
      <span>{level}</span>
      {showScore && score !== undefined && (
        <span className="text-slate-400 text-2xs font-sans">({score}/100)</span>
      )}
    </span>
  );
};
