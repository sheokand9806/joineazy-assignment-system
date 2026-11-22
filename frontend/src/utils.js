export const fmtDate = (d) =>
  new Date(d).toLocaleString(undefined, { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });

export const isOverdue = (d) => new Date(d) < new Date();

// ISO string -> value for <input type="datetime-local"> (local time)
export const toInputDateTime = (iso) => {
  const d = new Date(iso);
  const pad = (n) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
};

export const pct = (done, total) => (total ? Math.round((done / total) * 100) : 0);
