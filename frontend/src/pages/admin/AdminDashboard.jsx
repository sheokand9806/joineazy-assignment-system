import { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../../api.js';
import { Alert, Badge, CompletionChart, ProgressBar, Spinner, Stat } from '../../components/ui.jsx';
import { fmtDate, isOverdue, pct } from '../../utils.js';
import AssignmentForm from './AssignmentForm.jsx';

export default function AdminDashboard() {
  const [assignments, setAssignments] = useState(null);
  const [analytics, setAnalytics] = useState(null);
  const [error, setError] = useState('');
  const [form, setForm] = useState(null); // null | {} (new) | assignment (edit)

  const load = useCallback(() => {
    Promise.all([api.get('/assignments'), api.get('/analytics')])
      .then(([a, s]) => { setAssignments(a.assignments); setAnalytics(s); })
      .catch((e) => setError(e.message));
  }, []);
  useEffect(load, [load]);

  const remove = async (a) => {
    if (!window.confirm(`Delete "${a.title}"? All confirmations for it will be removed.`)) return;
    try { await api.del(`/assignments/${a.id}`); load(); } catch (e) { setError(e.message); }
  };

  if (error && !analytics) return <Alert>{error}</Alert>;
  if (!assignments || !analytics) return <Spinner />;

  const { counts } = analytics;
  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-bold">Professor dashboard</h1>
        <button className="btn-primary" onClick={() => setForm({})}>+ New assignment</button>
      </div>
      <Alert>{error}</Alert>

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <Stat label="Students" value={counts.students} />
        <Stat label="Groups" value={counts.groups} />
        <Stat label="Assignments" value={counts.assignments} />
        <Stat label="Overall completion" value={`${analytics.overallCompletion}%`} hint={`${counts.confirmations} confirmations`} />
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <div className="card">
          <h2 className="mb-4 font-semibold">Completion by assignment</h2>
          <CompletionChart rows={analytics.perAssignment.map((a) => ({ label: a.title, done: a.confirmed, total: a.total }))} emptyText="No assignments yet" />
        </div>
        <div className="card">
          <h2 className="mb-4 font-semibold">Group performance</h2>
          <CompletionChart rows={analytics.perGroup.map((g) => ({ label: g.name, done: g.confirmed, total: g.total }))} emptyText="No groups yet" />
        </div>
      </div>

      <div className="card overflow-x-auto p-0">
        <div className="border-b border-slate-200 px-5 py-3 font-semibold">Assignments</div>
        {assignments.length === 0 ? (
          <p className="p-6 text-center text-sm text-slate-500">No assignments yet. Create the first one.</p>
        ) : (
          <table className="w-full min-w-[640px] text-left text-sm">
            <thead className="bg-slate-50 text-xs uppercase text-slate-500">
              <tr>
                <th className="px-5 py-2">Title</th><th className="px-3 py-2">Due</th><th className="px-3 py-2">Audience</th>
                <th className="w-48 px-3 py-2">Confirmed</th><th className="px-5 py-2 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {assignments.map((a) => {
                const p = pct(a.confirmedGroups, a.totalGroups);
                return (
                  <tr key={a.id}>
                    <td className="px-5 py-3 font-medium">
                      <Link to={`/admin/assignments/${a.id}`} className="text-brand-700 hover:underline">{a.title}</Link>
                    </td>
                    <td className="px-3 py-3 text-slate-600">
                      {fmtDate(a.dueDate)} {isOverdue(a.dueDate) && <Badge tone="red">Past</Badge>}
                    </td>
                    <td className="px-3 py-3">{a.assignTo === 'all' ? 'All students' : `${a.totalGroups} group(s)`}</td>
                    <td className="px-3 py-3">
                      <ProgressBar value={p} size="sm" />
                      <div className="mt-1 text-xs text-slate-500">{a.confirmedGroups}/{a.totalGroups} groups</div>
                    </td>
                    <td className="space-x-3 px-5 py-3 text-right">
                      <Link to={`/admin/assignments/${a.id}`} className="text-brand-600 hover:underline">View</Link>
                      <button className="text-slate-600 hover:underline" onClick={() => setForm(a)}>Edit</button>
                      <button className="text-red-600 hover:underline" onClick={() => remove(a)}>Delete</button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>

      {form && (
        <AssignmentForm
          assignment={form.id ? form : null}
          onClose={() => setForm(null)}
          onSaved={() => { setForm(null); load(); }}
        />
      )}
    </div>
  );
}
