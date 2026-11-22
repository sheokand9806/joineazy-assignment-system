import { useEffect, useState } from 'react';
import { initials } from '../utils.js';

/* ---------- icons (inline, 20px, stroke) ---------- */
const PATHS = {
  tasks: 'M9 11l3 3L22 4M21 12v7a2 2 0 01-2 2H5a2 2 0 01-2-2V5a2 2 0 012-2h11',
  users: 'M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2M9 11a4 4 0 100-8 4 4 0 000 8zM23 21v-2a4 4 0 00-3-3.87M16 3.13a4 4 0 010 7.75',
  grid: 'M3 3h7v7H3zM14 3h7v7h-7zM14 14h7v7h-7zM3 14h7v7H3z',
  logout: 'M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4M16 17l5-5-5-5M21 12H9',
  plus: 'M12 5v14M5 12h14',
  link: 'M18 13v6a2 2 0 01-2 2H5a2 2 0 01-2-2V8a2 2 0 012-2h6M15 3h6v6M10 14L21 3',
  check: 'M20 6L9 17l-5-5',
  clock: 'M12 22a10 10 0 100-20 10 10 0 000 20zM12 6v6l4 2',
  x: 'M18 6L6 18M6 6l12 12',
  chevron: 'M9 18l6-6-6-6',
  arrowLeft: 'M19 12H5M12 19l-7-7 7-7',
  edit: 'M12 20h9M16.5 3.5a2.1 2.1 0 013 3L7 19l-4 1 1-4z',
  trash: 'M3 6h18M8 6V4a2 2 0 012-2h4a2 2 0 012 2v2M19 6l-1 14a2 2 0 01-2 2H8a2 2 0 01-2-2L5 6',
};
export function Icon({ name, className = 'h-5 w-5' }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden="true">
      <path d={PATHS[name]} />
    </svg>
  );
}

export function Avatar({ name, size = 'md' }) {
  const palette = ['bg-brand-100 text-brand-700', 'bg-emerald-100 text-emerald-700', 'bg-amber-100 text-amber-800', 'bg-rose-100 text-rose-700', 'bg-violet-100 text-violet-700'];
  const color = palette[(name?.charCodeAt(0) || 0) % palette.length];
  const sz = size === 'sm' ? 'h-7 w-7 text-[11px]' : 'h-9 w-9 text-xs';
  return <span className={`inline-flex shrink-0 items-center justify-center rounded-full font-bold ${sz} ${color}`}>{initials(name)}</span>;
}

/* ---------- progress ---------- */
const tone = (v) => (v >= 100 ? 'bg-emerald-500' : v >= 50 ? 'bg-brand-500' : 'bg-amber-400');

export function ProgressBar({ value, label, size = 'md' }) {
  const [w, setW] = useState(0);
  useEffect(() => { const t = requestAnimationFrame(() => setW(value)); return () => cancelAnimationFrame(t); }, [value]);
  return (
    <div>
      {label && (
        <div className="mb-2 flex justify-between text-sm">
          <span className="font-medium text-slate-600">{label}</span>
          <span className="font-bold">{value}%</span>
        </div>
      )}
      <div className={`w-full overflow-hidden rounded-full bg-slate-100 ${size === 'sm' ? 'h-1.5' : 'h-2.5'}`} role="progressbar" aria-valuenow={value} aria-valuemin={0} aria-valuemax={100}>
        <div className={`h-full rounded-full transition-[width] duration-700 ease-out ${tone(value)}`} style={{ width: `${w}%` }} />
      </div>
    </div>
  );
}

export function Ring({ value, size = 140, stroke = 12, children, track = 'stroke-slate-100', arc = 'stroke-brand-600' }) {
  const [v, setV] = useState(0);
  useEffect(() => { const t = requestAnimationFrame(() => setV(value)); return () => cancelAnimationFrame(t); }, [value]);
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  return (
    <div className="relative shrink-0" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90" role="img" aria-label={`${value}% complete`}>
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" strokeWidth={stroke} className={track} />
        <circle
          cx={size / 2} cy={size / 2} r={r} fill="none" strokeWidth={stroke} strokeLinecap="round"
          className={`${arc} transition-[stroke-dashoffset] duration-1000 ease-out`}
          strokeDasharray={c} strokeDashoffset={c - (c * v) / 100}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">{children}</div>
    </div>
  );
}

/* ---------- badges, alerts ---------- */
const BADGE = {
  green: ['bg-emerald-50 text-emerald-700', 'bg-emerald-500'],
  amber: ['bg-amber-50 text-amber-800', 'bg-amber-400'],
  red: ['bg-red-50 text-red-700', 'bg-red-500'],
  slate: ['bg-slate-100 text-slate-600', 'bg-slate-400'],
  indigo: ['bg-brand-50 text-brand-700', 'bg-brand-500'],
};
export function Badge({ tone: t = 'slate', children, dot = true }) {
  const [cls, dotCls] = BADGE[t];
  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold ${cls}`}>
      {dot && <span className={`h-1.5 w-1.5 rounded-full ${dotCls}`} />}
      {children}
    </span>
  );
}

export function Alert({ children, tone: t = 'red' }) {
  if (!children) return null;
  const cls = t === 'red' ? 'bg-red-50 text-red-700 ring-red-100' : 'bg-emerald-50 text-emerald-700 ring-emerald-100';
  return <div className={`rounded-xl px-4 py-3 text-sm font-medium ring-1 ring-inset ${cls}`} role="alert">{children}</div>;
}

export function Spinner() {
  return (
    <div className="flex justify-center py-24" role="status" aria-label="Loading">
      <div className="h-8 w-8 animate-spin rounded-full border-[3px] border-slate-200 border-t-brand-600" />
    </div>
  );
}

export function Empty({ title, children }) {
  return (
    <div className="rounded-2xl border-2 border-dashed border-slate-200 px-6 py-14 text-center">
      <p className="font-semibold">{title}</p>
      {children && <p className="mx-auto mt-1 max-w-sm text-sm text-slate-500">{children}</p>}
    </div>
  );
}

/* ---------- modal ---------- */
export function Modal({ title, onClose, children, wide }) {
  useEffect(() => {
    const onKey = (e) => e.key === 'Escape' && onClose();
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  return (
    <div className="fixed inset-0 z-50 flex animate-fade items-end justify-center bg-ink/40 p-0 backdrop-blur-sm sm:items-center sm:p-4" onMouseDown={onClose}>
      <div
        role="dialog" aria-modal="true" aria-label={title}
        className={`max-h-[92vh] w-full animate-pop overflow-y-auto rounded-t-3xl bg-white p-6 shadow-pop sm:rounded-3xl sm:p-7 ${wide ? 'sm:max-w-2xl' : 'sm:max-w-md'}`}
        onMouseDown={(e) => e.stopPropagation()}
      >
        <div className="mb-5 flex items-start justify-between gap-4">
          <h2 className="text-xl font-bold">{title}</h2>
          <button onClick={onClose} className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-700" aria-label="Close">
            <Icon name="x" />
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}

/* ---------- data bits ---------- */
export function Stat({ label, value, hint }) {
  return (
    <div className="card">
      <div className="tile-title">{label}</div>
      <div className="mt-2 text-3xl font-extrabold tracking-tight">{value}</div>
      {hint && <div className="mt-1 text-xs text-slate-500">{hint}</div>}
    </div>
  );
}

export function SegTabs({ value, onChange, options }) {
  return (
    <div className="inline-flex rounded-xl bg-slate-200/60 p-1 text-sm font-semibold" role="tablist">
      {options.map(([k, l]) => (
        <button
          key={k} role="tab" aria-selected={value === k} onClick={() => onChange(k)}
          className={`rounded-lg px-3.5 py-1.5 transition ${value === k ? 'bg-white text-ink shadow-sm' : 'text-slate-500 hover:text-ink'}`}
        >
          {l}
        </button>
      ))}
    </div>
  );
}

// rows = [{label, done, total}]
export function CompletionChart({ rows, emptyText = 'No data yet', cols = false }) {
  if (!rows.length) return <p className="text-sm text-slate-500">{emptyText}</p>;
  return (
    <ul className={cols ? 'grid gap-x-10 gap-y-5 md:grid-cols-2' : 'space-y-4'}>
      {rows.map((r) => {
        const p = r.total ? Math.round((r.done / r.total) * 100) : 0;
        return (
          <li key={r.label}>
            <div className="mb-1.5 flex items-baseline justify-between gap-3 text-sm">
              <span className="truncate font-semibold">{r.label}</span>
              <span className="shrink-0 text-xs text-slate-500"><b className="text-sm text-ink">{p}%</b> · {r.done}/{r.total}</span>
            </div>
            <ProgressBar value={p} size="sm" />
          </li>
        );
      })}
    </ul>
  );
}
