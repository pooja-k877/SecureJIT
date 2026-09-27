import React, { useState } from 'react';
import { AlertTriangle, CheckCircle, X, ShieldAlert } from 'lucide-react';

interface ConfirmModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (inputText?: string) => void;
  title: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  variant?: 'danger' | 'warning' | 'primary' | 'success';
  requiresInput?: boolean;
  inputLabel?: string;
  inputPlaceholder?: string;
  inputRequired?: boolean;
  loading?: boolean;
  children?: React.ReactNode;
}

export const ConfirmModal: React.FC<ConfirmModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  confirmLabel = 'Confirm',
  cancelLabel = 'Cancel',
  variant = 'primary',
  requiresInput = false,
  inputLabel = 'Comment or Reason',
  inputPlaceholder = 'Enter details...',
  inputRequired = false,
  loading = false,
  children,
}) => {
  const [inputValue, setInputValue] = useState('');
  const [error, setError] = useState('');

  if (!isOpen) return null;

  const handleConfirm = () => {
    if (requiresInput && inputRequired && !inputValue.trim()) {
      setError(`${inputLabel} is required.`);
      return;
    }
    setError('');
    onConfirm(inputValue);
  };

  let confirmBtnStyle = 'bg-sky-600 hover:bg-sky-500 text-white';
  let icon = <CheckCircle className="w-5 h-5 text-sky-400" />;

  if (variant === 'danger') {
    confirmBtnStyle = 'bg-rose-600 hover:bg-rose-500 text-white';
    icon = <AlertTriangle className="w-5 h-5 text-rose-400" />;
  } else if (variant === 'warning') {
    confirmBtnStyle = 'bg-amber-600 hover:bg-amber-500 text-white';
    icon = <ShieldAlert className="w-5 h-5 text-amber-400" />;
  } else if (variant === 'success') {
    confirmBtnStyle = 'bg-emerald-600 hover:bg-emerald-500 text-white';
    icon = <CheckCircle className="w-5 h-5 text-emerald-400" />;
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-xs">
      <div className="bg-slate-900 border border-slate-800 rounded-lg max-w-md w-full shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-800">
          <div className="flex items-center gap-2.5">
            {icon}
            <h3 className="text-sm font-semibold text-slate-100">{title}</h3>
          </div>
          <button
            onClick={onClose}
            disabled={loading}
            className="text-slate-400 hover:text-slate-200 p-1 rounded focus:outline-none"
            aria-label="Close dialog"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Body */}
        <div className="p-5 text-xs text-slate-300 space-y-4">
          <p className="leading-relaxed text-slate-300">{message}</p>

          {children}

          {requiresInput && (
            <div className="space-y-1.5 pt-1">
              <label className="block text-2xs font-medium uppercase tracking-wider text-slate-400">
                {inputLabel} {inputRequired && <span className="text-rose-400">*</span>}
              </label>
              <textarea
                value={inputValue}
                onChange={(e) => {
                  setInputValue(e.target.value);
                  if (error) setError('');
                }}
                placeholder={inputPlaceholder}
                rows={3}
                className="w-full bg-slate-950 border border-slate-700 rounded p-2.5 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-sky-500 focus:ring-1 focus:ring-sky-500 resize-none"
              />
              {error && <p className="text-2xs text-rose-400 font-medium">{error}</p>}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-2.5 px-5 py-3.5 bg-slate-950/60 border-t border-slate-800">
          <button
            onClick={onClose}
            disabled={loading}
            className="px-3.5 py-1.5 text-xs font-medium text-slate-400 hover:text-slate-200 hover:bg-slate-800 rounded transition-colors focus:outline-none"
          >
            {cancelLabel}
          </button>
          <button
            onClick={handleConfirm}
            disabled={loading}
            className={`px-4 py-1.5 text-xs font-medium rounded transition-colors focus:ring-2 focus:ring-offset-2 focus:ring-offset-slate-900 focus:outline-none ${confirmBtnStyle} flex items-center gap-1.5 disabled:opacity-50`}
          >
            {loading ? 'Processing...' : confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
};
