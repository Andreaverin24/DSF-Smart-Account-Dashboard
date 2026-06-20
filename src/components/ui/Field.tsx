import type { ReactNode } from 'react';

export function Field({ label, children, hint }: { label: string; children: ReactNode; hint?: string }) {
  return (
    <label className="block">
      <span className="mb-2 block text-sm font-medium text-slate-200">{label}</span>
      {children}
      {hint && <span className="mt-1 block text-xs text-muted">{hint}</span>}
    </label>
  );
}

export const inputClass =
  'min-h-10 w-full rounded-md border border-white/10 bg-white/8 px-3 py-2 text-sm text-slate-100 placeholder:text-slate-500 focus:border-accent-500';
