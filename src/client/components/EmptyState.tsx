import React, { ReactNode } from 'react';
import { ShieldAlert } from 'lucide-react';

interface EmptyStateProps {
  title: string;
  description: string;
  icon?: ReactNode;
  action?: {
    label: string;
    onClick: () => void;
  };
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  title,
  description,
  icon,
  action,
}) => {
  return (
    <div className="flex flex-col items-center justify-center p-8 text-center rounded-lg border border-slate-800/80 bg-slate-900/30 my-4">
      <div className="p-3 rounded-full bg-slate-800/60 text-slate-400 mb-3 border border-slate-700/50">
        {icon || <ShieldAlert className="w-6 h-6 text-slate-400" />}
      </div>
      <h3 className="text-sm font-semibold text-slate-200">{title}</h3>
      <p className="text-xs text-slate-400 max-w-sm mt-1">{description}</p>
      {action && (
        <button
          onClick={action.onClick}
          className="mt-4 px-3.5 py-1.5 text-xs font-medium text-slate-100 bg-sky-600 hover:bg-sky-500 rounded transition-colors focus:ring-2 focus:ring-sky-400 focus:outline-none"
        >
          {action.label}
        </button>
      )}
    </div>
  );
};
