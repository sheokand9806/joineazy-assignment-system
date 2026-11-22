import { useEffect } from 'react';

export function ProgressBar({ value, label, size = 'md' }) {
  const color = value >= 100 ? 'bg-emerald-500' : value >= 50 ? 'bg-brand-500' : 'bg-amber-500';
  return (
    <div>
      {label && (
        <div className="mb-1 flex justify-between text-xs text-slate-600">
          <span>{label}</span>
          <span className="font-semibold">{value}%</span>
        </div>
      )}
      <div
        className={`w-full overflow-hidden rounded-full bg-slate-200 ${size === 'sm' ? 'h-1.5' : 'h-2.5'}`}
        role="progressbar"
        aria-valuenow={value}
        aria-valuemin={0}
        aria-valuemax={100}
      >
        <div className={`h-full rounded-full transition-all duration-500 ${color}`} style={{ width: `${value}%` }} />
      </div>
    </div>
  );
}

const BADGE = {
  green: 'bg-emerald-100 text-emerald-700',
  amber: 'bg-amber-100 text-amber-800',
  red: 'bg-red-100 text-red-700',
  slate: 'bg-slate-100 text-slate-600',
  indigo: 'bg-brand-100 text-brand-700',
};
export function Badge({ tone = 'slate', children }) {
  return <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${BADGE[tone]}`}>{children}</span>;
}

export function Modal({ title, onClose, children, wide }) {
  useEffect(() => {
    const onKey = (e) => e.key === 'Escape' && onClose();
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-slate-900/50 p-0 sm:items-center sm:p-4" onMouseDown={onClose}>
      <div
        role="dialog"
        aria-modal="true"
        className={`max-h-[92vh] w-full overflow-y-auto rounded-t-2xl bg-white p-6 shadow-xl sm:rounded-2xl ${wide ? 'sm:max-w-2xl' : 'sm:max-w-md'}`}
        onMouseDown={(e) => e.stopPropagation()}
      >
        <div className="mb-4 flex items-start justify-between gap-4">
          <h2 className="text-lg font-semibold">{title}</h2>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600" aria-label="Close">✕</button>
        </div>
        {children}
      </div>
    </div>
  );
}

export function Alert({ children, tone = 'red' }) {
  if (!children) return null;
  const cls = tone === 'red' ? 'border-red-200 bg-red-50 text-red-700' : 'border-emerald-200 bg-emerald-50 text-emerald-700';
  return <div className={`rounded-lg border px-3 py-2 text-sm ${cls}`} role="alert">{children}</div>;
}

export function Spinner() {
  return <div className="py-16 text-center text-sm text-slate-500">Loading…</div>;
}

export function Stat({ label, value, hint }) {
  return (
    <div className="card">
      <div className="text-xs font-medium uppercase tracking-wide text-slate-500">{label}</div>
      <div className="mt-1 text-3xl font-bold text-slate-900">{value}</div>
      {hint && <div className="mt-1 text-xs text-slate-500">{hint}</div>}
    </div>
  );
}

// Simple horizontal bar chart (no chart library needed): rows = [{label, done, total}]
export function CompletionChart({ rows, emptyText = 'No data yet' }) {
  if (!rows.length) return <p className="text-sm text-slate-500">{emptyText}</p>;
  return (
    <ul className="space-y-3">
      {rows.map((r) => {
        const p = r.total ? Math.round((r.done / r.total) * 100) : 0;
        return (
          <li key={r.label}>
            <div className="mb-1 flex justify-between gap-2 text-sm">
              <span className="truncate font-medium text-slate-700">{r.label}</span>
              <span className="shrink-0 text-slate-500">{r.done}/{r.total} · {p}%</span>
            </div>
            <ProgressBar value={p} size="sm" />
          </li>
        );
      })}
    </ul>
  );
}
