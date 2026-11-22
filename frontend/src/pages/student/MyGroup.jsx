import { useCallback, useEffect, useState } from 'react';
import { api } from '../../api.js';
import { useAuth } from '../../context/AuthContext.jsx';
import { Alert, Avatar, Badge, Spinner } from '../../components/ui.jsx';

export default function MyGroup() {
  const { user } = useAuth();
  const [group, setGroup] = useState(undefined); // undefined = loading, null = none
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [name, setName] = useState('');
  const [initial, setInitial] = useState('');
  const [ident, setIdent] = useState('');
  const [busy, setBusy] = useState(false);

  const load = useCallback(() => {
    api.get('/groups/mine').then((d) => setGroup(d.group)).catch((e) => setError(e.message));
  }, []);
  useEffect(load, [load]);

  const run = async (fn) => {
    setError(''); setNotice(''); setBusy(true);
    try { await fn(); } catch (e) { setError(e.message); } finally { setBusy(false); }
  };

  const create = (e) => {
    e.preventDefault();
    run(async () => {
      const members = initial.split(/[\n,]+/).map((s) => s.trim()).filter(Boolean);
      const d = await api.post('/groups', { name, members });
      setGroup(d.group);
      if (d.skipped.length) setNotice('Some teammates were skipped: ' + d.skipped.map((s) => `${s.identifier} (${s.reason})`).join(', '));
    });
  };
  const add = (e) => {
    e.preventDefault();
    run(async () => {
      const d = await api.post(`/groups/${group.id}/members`, { identifier: ident });
      setGroup(d.group); setIdent('');
    });
  };
  const remove = (m) => {
    const leaving = m.id === user.id;
    if (!window.confirm(leaving ? 'Leave this group?' : `Remove ${m.name} from the group?`)) return;
    run(async () => {
      const d = await api.del(`/groups/${group.id}/members/${m.id}`);
      setGroup(d.group);
    });
  };

  if (group === undefined) return error ? <Alert>{error}</Alert> : <Spinner />;

  if (!group) {
    return (
      <div className="mx-auto max-w-lg space-y-6">
        <div>
          <h1 className="text-3xl font-extrabold sm:text-4xl">Create your group</h1>
          <p className="mt-2 text-slate-500">Add teammates now or later with their email or student ID. Each student can be in one group.</p>
        </div>
        <Alert>{error}</Alert>
        <form onSubmit={create} className="card space-y-5">
          <div>
            <label className="label" htmlFor="gname">Group name</label>
            <input id="gname" required className="input" placeholder="For example, Team Alpha" value={name} onChange={(e) => setName(e.target.value)} />
          </div>
          <div>
            <label className="label" htmlFor="members">Teammates (optional)</label>
            <textarea id="members" rows={3} className="input" placeholder="Emails or student IDs, separated by commas or new lines" value={initial} onChange={(e) => setInitial(e.target.value)} />
          </div>
          <button className="btn-primary" disabled={busy}>Create group</button>
        </form>
      </div>
    );
  }

  const isOwner = group.ownerId === user.id;
  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div>
        <h1 className="text-3xl font-extrabold sm:text-4xl">{group.name}</h1>
        <p className="mt-2 text-slate-500">{group.members.length} member{group.members.length !== 1 && 's'} · owned by {group.ownerName}</p>
      </div>
      <Alert>{error}</Alert>
      <Alert tone="green">{notice}</Alert>

      <div className="card !p-2 sm:!p-3">
        <ul className="divide-y divide-slate-100">
          {group.members.map((m) => (
            <li key={m.id} className="flex items-center gap-3 px-3 py-3">
              <Avatar name={m.name} />
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2 font-semibold">
                  {m.name}
                  {m.id === group.ownerId && <Badge tone="indigo" dot={false}>Owner</Badge>}
                  {m.id === user.id && <Badge dot={false}>You</Badge>}
                </div>
                <div className="truncate text-xs text-slate-500">{m.email}{m.studentId ? ` · ${m.studentId}` : ''}</div>
              </div>
              {(isOwner || m.id === user.id) && (
                <button className="rounded-lg px-3 py-1.5 text-sm font-semibold text-red-600 hover:bg-red-50" disabled={busy} onClick={() => remove(m)}>
                  {m.id === user.id ? 'Leave' : 'Remove'}
                </button>
              )}
            </li>
          ))}
        </ul>
      </div>

      {isOwner ? (
        <form onSubmit={add} className="card">
          <label className="label" htmlFor="ident">Add a teammate</label>
          <div className="flex flex-col gap-2 sm:flex-row">
            <input id="ident" required className="input" placeholder="Student email or ID" value={ident} onChange={(e) => setIdent(e.target.value)} />
            <button className="btn-primary" disabled={busy}>Add</button>
          </div>
        </form>
      ) : (
        <p className="text-sm text-slate-500">Only the group owner can add or remove teammates.</p>
      )}
    </div>
  );
}
