import React, { useState, useEffect } from 'react';
import { Clock } from 'lucide-react';

interface CountdownTimerProps {
  expiresAt: string;
  startedAt?: string;
  onExpire?: () => void;
  showProgress?: boolean;
  compact?: boolean;
}

export const CountdownTimer: React.FC<CountdownTimerProps> = ({
  expiresAt,
  startedAt,
  onExpire,
  showProgress = false,
  compact = false,
}) => {
  const calculateSecondsLeft = () => {
    const expiry = new Date(expiresAt).getTime();
    const now = Date.now();
    return Math.max(0, Math.floor((expiry - now) / 1000));
  };

  const [secondsLeft, setSecondsLeft] = useState<number>(calculateSecondsLeft());

  useEffect(() => {
    // Recalculate immediately on prop changes
    setSecondsLeft(calculateSecondsLeft());

    const interval = setInterval(() => {
      const remaining = calculateSecondsLeft();
      setSecondsLeft(remaining);

      if (remaining <= 0) {
        clearInterval(interval);
        if (onExpire) {
          onExpire();
        }
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [expiresAt]);

  const hours = Math.floor(secondsLeft / 3600);
  const minutes = Math.floor((secondsLeft % 3600) / 60);
  const seconds = secondsLeft % 60;

  const pad = (num: number) => num.toString().padStart(2, '0');

  const formattedTime = hours > 0
    ? `${pad(hours)}:${pad(minutes)}:${pad(seconds)}`
    : `${pad(minutes)}:${pad(seconds)}`;

  const isExpired = secondsLeft <= 0;
  const isUrgent = secondsLeft > 0 && secondsLeft <= 300; // Less than 5 minutes

  // Calculate percentage of duration elapsed if startedAt is provided
  let percentRemaining = 100;
  if (startedAt) {
    const totalMs = new Date(expiresAt).getTime() - new Date(startedAt).getTime();
    if (totalMs > 0) {
      const currentMs = new Date(expiresAt).getTime() - Date.now();
      percentRemaining = Math.max(0, Math.min(100, Math.round((currentMs / totalMs) * 100)));
    }
  }

  if (compact) {
    return (
      <span
        className={`font-mono text-xs font-semibold inline-flex items-center gap-1.5 ${
          isExpired
            ? 'text-slate-500'
            : isUrgent
            ? 'text-rose-400 animate-pulse'
            : 'text-emerald-400'
        }`}
      >
        <Clock className="w-3.5 h-3.5" />
        {isExpired ? 'EXPIRED' : formattedTime}
      </span>
    );
  }

  return (
    <div className="flex flex-col gap-1.5">
      <div className="flex items-center justify-between gap-3">
        <span className="text-xs text-slate-400 flex items-center gap-1.5">
          <Clock className="w-3.5 h-3.5 text-slate-400" />
          Time Remaining
        </span>
        <span
          className={`font-mono text-sm font-bold tracking-wider ${
            isExpired
              ? 'text-slate-500'
              : isUrgent
              ? 'text-rose-400 animate-pulse'
              : 'text-emerald-400'
          }`}
        >
          {isExpired ? '00:00 (EXPIRED)' : formattedTime}
        </span>
      </div>

      {showProgress && (
        <div className="w-full bg-slate-800 rounded-full h-1.5 overflow-hidden">
          <div
            className={`h-full transition-all duration-1000 ${
              isExpired
                ? 'bg-slate-600'
                : isUrgent
                ? 'bg-rose-500'
                : percentRemaining > 50
                ? 'bg-emerald-500'
                : 'bg-amber-500'
            }`}
            style={{ width: `${isExpired ? 0 : percentRemaining}%` }}
          />
        </div>
      )}
    </div>
  );
};
