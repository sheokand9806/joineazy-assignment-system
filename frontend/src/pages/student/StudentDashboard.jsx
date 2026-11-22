import { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../../api.js';
import { useAuth } from '../../context/AuthContext.jsx';
import { Alert, Badge, Empty, Icon, Modal, Ring, SegTabs, Spinner } from '../../components/ui.jsx';
import { fmtDate, fmtShort, greeting, isOverdue, pct, relDue } from '../../utils.js';

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
      setToken(d.confirmToken); setStep(2);
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
    <Modal title={step === 1 ? 'Did you submit?' : 'Confirm for your group'} onClose={onClose}>
      <div className="space-y-5">
        <Alert>{error}</Alert>
        <div className="rounded-2xl bg-slate-50 px-4 py-3">
          <p className="text-xs font-medium text-slate-500">Assignment</p>
          <p className="font-bold">{assignment.title}</p>
        </div>
        {step === 1 ? (
          <>
            <p className="text-sm text-slate-600">Make sure your group's work is uploaded to the OneDrive link before you continue.</p>
            <div className="flex justify-end gap-2">
              <button className="btn-secondary" onClick={onClose}>Not yet</button>
              <button className="btn-primary" onClick={start} disabled={busy}>Yes, I submitted</button>
            </div>
          </>
        ) : (
          <>
            <div className="rounded-2xl bg-amber-50 px-4 py-3 text-sm font-medium text-amber-800">
              This marks the assignment as submitted for everyone in your group. You can't undo it.
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

function StatusBadge({ a }) {
  if (a.confirmed) return <Badge tone="green">Submitted</Badge>;
  if (isOverdue(a.dueDate)) return <Badge tone="red">Overdue</Badge>;
  return <Badge tone="amber">Pending</Badge>;
}

export default function StudentDashboard() {
  const { user } = useAuth();
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
  const next = assignments.find((a) => !a.confirmed);
  const shown = assignments.filter((a) => (filter === 'all' ? true : filter === 'done' ? a.confirmed : !a.confirmed));

  return (
    <div className="space-y-6">
      <div>
        <p className="text-sm font-semibold text-slate-500">{greeting()}</p>
        <h1 className="text-3xl font-extrabold sm:text-4xl">{user.name.split(' ')[0]}'s assignments</h1>
      </div>

      {!groupId && (
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl bg-amber-50 px-5 py-4 text-sm font-medium text-amber-900 ring-1 ring-amber-100">
          <span>You're not in a group yet, so you can't confirm submissions.</span>
          <Link className="btn bg-amber-900 text-white hover:bg-amber-950" to="/student/group">Create a group</Link>
        </div>
      )}

      {/* hero: progress + what's next */}
      <section className="grid gap-4 md:grid-cols-5">
        <div className="card flex items-center gap-6 md:col-span-2">
          <Ring value={progress} size={128} stroke={12}>
            <span className="text-3xl font-extrabold">{progress}%</span>
          </Ring>
          <div>
            <p className="tile-title">Group progress</p>
            <p className="mt-1 text-lg font-bold leading-snug">{done} of {assignments.length} confirmed</p>
          </div>
        </div>

        <div className="relative overflow-hidden rounded-2xl bg-ink p-6 text-white shadow-card md:col-span-3">
          <div className="absolute -right-10 -top-10 h-40 w-40 rounded-full bg-brand-600/60 blur-3xl" />
          {next ? (
            <div className="relative flex h-full flex-col justify-between gap-6">
              <div>
                <p className="text-sm font-semibold text-white/60">Up next</p>
                <h2 className="mt-1 text-2xl font-extrabold leading-tight">{next.title}</h2>
                <p className={`mt-2 text-sm font-semibold ${isOverdue(next.dueDate) ? 'text-red-300' : 'text-amber-300'}`}>
                  {relDue(next.dueDate)} · {fmtShort(next.dueDate)}
                </p>
              </div>
              <div className="flex flex-wrap gap-2">
                <a href={next.onedriveLink} target="_blank" rel="noopener noreferrer" className="btn bg-white/10 text-white ring-1 ring-inset ring-white/20 hover:bg-white/20">
                  Open OneDrive <Icon name="link" className="h-4 w-4" />
                </a>
                <button className="btn bg-white text-ink hover:bg-slate-100" disabled={!groupId} onClick={() => setTarget(next)}>Confirm submission</button>
              </div>
            </div>
          ) : (
            <div className="relative flex h-full flex-col justify-center">
              <p className="text-2xl font-extrabold">You're all caught up</p>
              <p className="mt-1 text-sm text-white/60">Every assignment is confirmed for your group.</p>
            </div>
          )}
        </div>
      </section>

      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-xl font-bold">All assignments</h2>
        <SegTabs value={filter} onChange={setFilter} options={[['all', 'All'], ['pending', 'Pending'], ['done', 'Submitted']]} />
      </div>

      {shown.length === 0 ? (
        <Empty title="Nothing here">Assignments from your professor will show up in this list.</Empty>
      ) : (
        <ul className="space-y-3">
          {shown.map((a) => (
            <li key={a.id} className="card flex flex-col gap-4 !p-5 sm:flex-row sm:items-center">
              <div className="flex min-w-0 flex-1 items-start gap-4 sm:items-center">
              <span className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl ${a.confirmed ? 'bg-emerald-50 text-emerald-600' : isOverdue(a.dueDate) ? 'bg-red-50 text-red-600' : 'bg-brand-50 text-brand-600'}`}>
                <Icon name={a.confirmed ? 'check' : 'clock'} />
              </span>
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <h3 className="font-bold">{a.title}</h3>
                  <StatusBadge a={a} />
                  {a.assignTo === 'groups' && <Badge tone="indigo" dot={false}>Your group only</Badge>}
                </div>
                <p className="mt-1 line-clamp-2 text-sm text-slate-500">{a.description || 'No description.'}</p>
                <p className="mt-1.5 text-xs font-medium text-slate-500">
                  {a.confirmed ? `Confirmed by ${a.confirmedByName} on ${fmtDate(a.confirmedAt)}` : `${relDue(a.dueDate)} · ${fmtDate(a.dueDate)}`}
                </p>
              </div>
              </div>
              <div className="flex shrink-0 gap-2">
                <a href={a.onedriveLink} target="_blank" rel="noopener noreferrer" className="btn-secondary !px-3.5" aria-label={`Open OneDrive for ${a.title}`}>
                  OneDrive <Icon name="link" className="h-4 w-4" />
                </a>
                {!a.confirmed && (
                  <button className="btn-primary" disabled={!groupId} onClick={() => setTarget(a)}>Confirm</button>
                )}
              </div>
            </li>
          ))}
        </ul>
      )}

      {target && <ConfirmModal assignment={target} onClose={() => setTarget(null)} onDone={() => { setTarget(null); load(); }} />}
    </div>
  );
}
