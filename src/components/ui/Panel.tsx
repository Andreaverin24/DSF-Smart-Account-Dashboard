import type { ReactNode } from 'react';

export function Panel({
  title,
  eyebrow,
  children,
  className = '',
}: {
  title?: string;
  eyebrow?: string;
  children: ReactNode;
  className?: string;
}) {
  return (
    <section className={`panel p-5 ${className}`}>
      {(title || eyebrow) && (
        <div className="mb-4">
          {eyebrow && <p className="mb-1 text-xs font-semibold uppercase tracking-[0.12em] text-accent-500">{eyebrow}</p>}
          {title && <h2 className="text-xl font-semibold text-slate-950 dark:text-white">{title}</h2>}
        </div>
      )}
      {children}
    </section>
  );
}
