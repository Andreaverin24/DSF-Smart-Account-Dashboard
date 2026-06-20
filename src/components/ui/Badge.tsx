import type { RiskLevel } from '../../domain/types';

const riskClasses: Record<RiskLevel, string> = {
  NONE: 'border-slate-500/40 bg-slate-500/10 text-slate-300',
  LOW: 'border-signal-green/40 bg-signal-green/10 text-signal-green',
  MEDIUM: 'border-signal-blue/40 bg-signal-blue/10 text-signal-blue',
  HIGH: 'border-signal-amber/50 bg-signal-amber/10 text-signal-amber',
  CRITICAL: 'border-signal-red/50 bg-signal-red/10 text-signal-red',
};

const labels: Record<RiskLevel, string> = {
  NONE: 'Нет риска',
  LOW: 'Низкий',
  MEDIUM: 'Средний',
  HIGH: 'Высокий',
  CRITICAL: 'Критический',
};

export function RiskBadge({ risk }: { risk: RiskLevel }) {
  return (
    <span className={`inline-flex items-center rounded-full border px-2.5 py-1 text-xs font-semibold ${riskClasses[risk]}`}>
      {labels[risk]}
    </span>
  );
}

export function StatusBadge({ children, tone = 'neutral' }: { children: string; tone?: 'good' | 'warn' | 'bad' | 'neutral' }) {
  const classes = {
    good: 'border-signal-green/40 bg-signal-green/10 text-signal-green',
    warn: 'border-signal-amber/50 bg-signal-amber/10 text-signal-amber',
    bad: 'border-signal-red/50 bg-signal-red/10 text-signal-red',
    neutral: 'border-white/10 bg-white/8 text-slate-300',
  };

  return <span className={`inline-flex rounded-full border px-2.5 py-1 text-xs font-semibold ${classes[tone]}`}>{children}</span>;
}
