import type { ReactNode } from 'react';
import { Info } from 'lucide-react';

export function Tooltip({ label, children }: { label: string; children?: ReactNode }) {
  return (
    <span className="group relative inline-flex items-center gap-1">
      {children}
      <button type="button" aria-label={`Подсказка: ${label}`} className="rounded-full text-slate-400 hover:text-accent-500">
        <Info className="h-4 w-4" aria-hidden="true" />
      </button>
      <span
        role="tooltip"
        className="pointer-events-none absolute bottom-full left-0 z-30 mb-2 w-64 max-w-[calc(100vw-2rem)] rounded-md border border-white/10 bg-surface-850 p-3 text-xs leading-relaxed text-slate-100 opacity-0 shadow-panel transition group-hover:opacity-100 group-focus-within:opacity-100 sm:left-1/2 sm:-translate-x-1/2"
      >
        {label}
      </span>
    </span>
  );
}
