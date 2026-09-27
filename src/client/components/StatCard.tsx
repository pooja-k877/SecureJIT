import React, { ReactNode } from 'react';

interface StatCardProps {
  title: string;
  value: string | number;
  subtext?: string;
  icon: ReactNode;
  variant?: 'default' | 'warning' | 'alert' | 'success';
}

export const StatCard: React.FC<StatCardProps> = ({
  title,
  value,
  subtext,
  icon,
  variant = 'default',
}) => {
  let borderStyle = 'border-slate-800 bg-slate-900/60';
  let iconStyle = 'text-sky-400 bg-sky-950/40 border-sky-800/40';

  if (variant === 'warning') {
    borderStyle = 'border-amber-900/40 bg-slate-900/60';
    iconStyle = 'text-amber-400 bg-amber-950/40 border-amber-800/40';
  } else if (variant === 'alert') {
    borderStyle = 'border-rose-900/40 bg-slate-900/60';
    iconStyle = 'text-rose-400 bg-rose-950/40 border-rose-800/40';
  } else if (variant === 'success') {
    borderStyle = 'border-emerald-900/40 bg-slate-900/60';
    iconStyle = 'text-emerald-400 bg-emerald-950/40 border-emerald-800/40';
  }

  return (
    <div className={`p-4 rounded-lg border ${borderStyle} flex items-start justify-between gap-4`}>
      <div className="flex flex-col">
        <span className="text-xs font-medium text-slate-400 uppercase tracking-wider">{title}</span>
        <span className="text-2xl font-bold font-mono text-slate-100 mt-1">{value}</span>
        {subtext && <span className="text-xs text-slate-500 mt-1">{subtext}</span>}
      </div>
      <div className={`p-2.5 rounded border ${iconStyle} shrink-0`}>
        {icon}
      </div>
    </div>
  );
};
