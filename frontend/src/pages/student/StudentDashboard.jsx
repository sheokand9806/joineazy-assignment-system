import { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../../api.js';
import { Alert, Badge, Modal, ProgressBar, Spinner } from '../../components/ui.jsx';
import { fmtDate, isOverdue, pct } from '../../utils.js';

// Two-step confirmation: step 1 "Yes, I have submitted" -> step 2 final confirm.
function ConfirmModal({ assignment, onClose, onDone }) {
  const [step, setStep] = useState(1);
  const [token, setToken] = useState(null);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  const start = async () => {
    setBusy(true); setError('');
    try {
      const d = await api.post(`/assignments/${assignment.id}/submission/initiate`);
      setToken(d.confirmToken);
      setStep(2);
    } catch (e) { setError(e.message); } finally { setBusy(false); }
  };

  const confirm = async () => {
    setBusy(true); setError('');
    try {
      await api.post(`/assignments/${assignment.id}/submission/confirm`, { confirmToken: token });
      onDone();
    } catch (e) { setError(e.message); setStep(1); } finally { setBusy(false); }
  };

  return (
    <Modal title="Confirm submission" onClose={onClose}>
      <div className="space-y-4">
        <Alert>{error}</Alert>
        <p className="text-sm text-slate-600">
          Assignment: <span className="font-medium text-slate-900">{assignment.title}</span>
        </p>
        {step === 1 ? (
          <>
            <p className="text-sm">Have you uploaded your group's work to the OneDrive link?</p>
            <div className="flex justify-end gap-2">
              <button className="btn-secondary" onClick={onClose}>Not yet</button>
              <button className="btn-primary" onClick={start} disabled={busy}>Yes, I have submitted</button>
            </div>
          </>
        ) : (
          <>
            <div className="rounded-lg bg-amber-50 p-3 text-sm text-amber-800">
              This confirms the submission for your <strong>whole group</strong> and cannot be undone. Are you sure?
            </div>
            <div className="flex justify-end gap-2">
              <button className="btn-secondary" onClick={() => setStep(1)}>Back</button>
              <button className="btn-primary" onClick={confirm} disabled={busy}>{busy ? 'Confirming…' : 'Confirm submission'}</button>
            </div>
          </>
        )}
      </div>
    </Modal>
  );
}

export default function StudentDashboard() {
  const [data, setData] = useState(null);
  const [error, setError] = useState('');
  const [target, setTarget] = useState(null);
  const [filter, setFilter] = useState('all');

  const load = useCallback(() => {
    api.get('/assignments').then(setData).catch((e) => setError(e.message));
  }, []);
  useEffect(load, [load]);

  if (error) return <Alert>{error}</Alert>;
  if (!data) return <Spinner />;

  const { assignments, groupId } = data;
  const done = assignments.filter((a) => a.confirmed).length;
  const progress = pct(done, assignments.length);
  const shown = assignments.filter((a) =>
    filter === 'all' ? true : filter === 'done' ? a.confirmed : !a.confirmed
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold">Assignments</h1>
          <p className="text-sm text-slate-500">Submit via the OneDrive link, then confirm for your group.</p>
        </div>
        <div className="flex gap-1 rounded-lg bg-slate-200 p-1 text-sm">
          {[['all', 'All'], ['pending', 'Pending'], ['done', 'Confirmed']].map(([k, l]) => (
            <button key={k} onClick={() => setFilter(k)} className={`rounded-md px-3 py-1 ${filter === k ? 'bg-white shadow-sm' : 'text-slate-600'}`}>{l}</button>
          ))}
        </div>
      </div>

      {!groupId && (
        <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800">
          You're not in a group yet. <Link className="font-semibold underline" to="/student/group">Create a group</Link> to confirm submissions.
        </div>
      )}

      <div className="card">
        <ProgressBar value={progress} label={`Group progress — ${done} of ${assignments.length} assignments confirmed`} />
      </div>

      {shown.length === 0 ? (
        <p className="py-10 text-center text-slate-500">Nothing to show here.</p>
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {shown.map((a) => {
            const overdue = !a.confirmed && isOverdue(a.dueDate);
            return (
              <div key={a.id} className="card flex flex-col">
                <div className="mb-2 flex items-start justify-between gap-2">
                  <h3 className="font-semibold">{a.title}</h3>
                  {a.confirmed ? <Badge tone="green">✓ Submitted</Badge> : overdue ? <Badge tone="red">Overdue</Badge> : <Badge tone="amber">Pending</Badge>}
                </div>
                <p className="mb-3 flex-1 text-sm text-slate-600">{a.description || 'No description.'}</p>
                <div className="mb-3 text-xs text-slate-500">
                  Due {fmtDate(a.dueDate)}
                  {a.assignTo === 'groups' && <span className="ml-2"><Badge tone="indigo">Targeted</Badge></span>}
                </div>
                {a.confirmed && (
                  <p className="mb-3 text-xs text-emerald-700">
                    Confirmed by {a.confirmedByName} on {fmtDate(a.confirmedAt)}
                  </p>
                )}
                <div className="flex flex-wrap gap-2">
                  <a href={a.onedriveLink} target="_blank" rel="noopener noreferrer" className="btn-secondary">Open OneDrive ↗</a>
                  {!a.confirmed && (
                    <button className="btn-primary" disabled={!groupId} onClick={() => setTarget(a)}>Confirm submission</button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {target && (
        <ConfirmModal
          assignment={target}
          onClose={() => setTarget(null)}
          onDone={() => { setTarget(null); load(); }}
        />
      )}
    </div>
  );
}
