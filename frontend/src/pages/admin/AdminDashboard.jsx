import { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../../api.js';
import { useAuth } from '../../context/AuthContext.jsx';
import { Alert, Badge, CompletionChart, Empty, Icon, ProgressBar, Ring, Spinner } from '../../components/ui.jsx';
import { fmtDate, greeting, isOverdue, pct } from '../../utils.js';
import AssignmentForm from './AssignmentForm.jsx';

export default function AdminDashboard() {
  const { user } = useAuth();
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
  const tiles = [['Students', counts.students], ['Groups', counts.groups], ['Assignments', counts.assignments]];

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-sm font-semibold text-slate-500">{greeting()}, {user.name.split(' ').slice(0, 2).join(' ')}</p>
          <h1 className="text-3xl font-extrabold sm:text-4xl">Course overview</h1>
        </div>
        <button className="btn-primary" onClick={() => setForm({})}><Icon name="plus" className="h-4 w-4" /> New assignment</button>
      </div>
      <Alert>{error}</Alert>

      <section className="grid gap-4 lg:grid-cols-3">
        <div className="card flex items-center gap-6 lg:flex-col lg:items-start lg:justify-between">
          <div>
            <p className="tile-title">Overall completion</p>
            <p className="mt-1 text-sm text-slate-500">{counts.confirmations} group confirmations so far</p>
          </div>
          <Ring value={analytics.overallCompletion} size={132} stroke={13}>
            <span className="text-3xl font-extrabold">{analytics.overallCompletion}%</span>
          </Ring>
        </div>

        <div className="grid gap-4 lg:col-span-2">
          <div className="grid grid-cols-3 gap-4">
            {tiles.map(([l, v]) => (
              <div key={l} className="card !p-4 sm:!p-5">
                <p className="tile-title">{l}</p>
                <p className="mt-1 text-3xl font-extrabold">{v}</p>
              </div>
            ))}
          </div>
          <div className="card">
            <h2 className="mb-4 font-bold">Completion by assignment</h2>
            <CompletionChart rows={analytics.perAssignment.map((a) => ({ label: a.title, done: a.confirmed, total: a.total }))} emptyText="Create an assignment to see completion here." />
          </div>
        </div>
      </section>

      <section className="card">
        <h2 className="mb-4 font-bold">Group performance</h2>
        <CompletionChart cols rows={analytics.perGroup.map((g) => ({ label: g.name, done: g.confirmed, total: g.total }))} emptyText="Groups appear here once students create them." />
      </section>

      <section>
        <h2 className="mb-3 text-xl font-bold">Assignments</h2>
        {assignments.length === 0 ? (
          <Empty title="No assignments yet">Create your first assignment and students will see it right away.</Empty>
        ) : (
          <ul className="space-y-3">
            {assignments.map((a) => {
              const p = pct(a.confirmedGroups, a.totalGroups);
              return (
                <li key={a.id} className="card flex flex-col gap-4 !p-5 md:flex-row md:items-center">
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <Link to={`/admin/assignments/${a.id}`} className="font-bold hover:text-brand-600">{a.title}</Link>
                      {isOverdue(a.dueDate) && <Badge tone="slate">Past due</Badge>}
                      <Badge tone="indigo" dot={false}>{a.assignTo === 'all' ? 'All students' : `${a.totalGroups} group${a.totalGroups !== 1 ? 's' : ''}`}</Badge>
                    </div>
                    <p className="mt-1 text-xs font-medium text-slate-500">Due {fmtDate(a.dueDate)}</p>
                  </div>
                  <div className="w-full md:w-52">
                    <ProgressBar value={p} size="sm" />
                    <p className="mt-1.5 text-xs font-medium text-slate-500">{a.confirmedGroups} of {a.totalGroups} groups confirmed</p>
                  </div>
                  <div className="flex shrink-0 gap-1">
                    <Link to={`/admin/assignments/${a.id}`} className="btn-secondary !px-3.5 !py-2">View</Link>
                    <button className="btn-ghost !px-2.5 !py-2" onClick={() => setForm(a)} aria-label={`Edit ${a.title}`}><Icon name="edit" className="h-4 w-4" /></button>
                    <button className="btn-ghost !px-2.5 !py-2 text-red-600 hover:bg-red-50" onClick={() => remove(a)} aria-label={`Delete ${a.title}`}><Icon name="trash" className="h-4 w-4" /></button>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </section>

      {form && <AssignmentForm assignment={form.id ? form : null} onClose={() => setForm(null)} onSaved={() => { setForm(null); load(); }} />}
    </div>
  );
}
