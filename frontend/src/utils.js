export const fmtDate = (d) =>
  new Date(d).toLocaleString(undefined, { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });

export const fmtShort = (d) => new Date(d).toLocaleDateString(undefined, { day: 'numeric', month: 'short' });

export const isOverdue = (d) => new Date(d) < new Date();

// ISO string -> value for <input type="datetime-local"> (local time)
export const toInputDateTime = (iso) => {
  const d = new Date(iso);
  const pad = (n) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
};

export const pct = (done, total) => (total ? Math.round((done / total) * 100) : 0);

// "Due in 3 days" / "Due today" / "2 days overdue"
export function relDue(d) {
  const ms = new Date(d) - new Date();
  const days = Math.round(Math.abs(ms) / 86400000);
  const hours = Math.max(1, Math.round(Math.abs(ms) / 3600000));
  if (ms < 0) return days >= 1 ? `${days} day${days > 1 ? 's' : ''} overdue` : `${hours}h overdue`;
  if (days >= 1) return `Due in ${days} day${days > 1 ? 's' : ''}`;
  return `Due in ${hours}h`;
}

export const greeting = () => {
  const h = new Date().getHours();
  return h < 12 ? 'Good morning' : h < 18 ? 'Good afternoon' : 'Good evening';
};

export const initials = (name = '') =>
  name.split(' ').filter(Boolean).slice(0, 2).map((s) => s[0].toUpperCase()).join('');
