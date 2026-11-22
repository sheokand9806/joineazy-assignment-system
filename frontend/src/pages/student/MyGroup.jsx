import { useCallback, useEffect, useState } from 'react';
import { api } from '../../api.js';
import { useAuth } from '../../context/AuthContext.jsx';
import { Alert, Badge, Spinner } from '../../components/ui.jsx';

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
      if (d.skipped.length) setNotice('Some members were skipped: ' + d.skipped.map((s) => `${s.identifier} (${s.reason})`).join(', '));
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
      <div className="mx-auto max-w-lg space-y-4">
        <h1 className="text-2xl font-bold">Create your group</h1>
        <p className="text-sm text-slate-500">You can add teammates now or later using their email or student ID. Each student can belong to one group.</p>
        <Alert>{error}</Alert>
        <form onSubmit={create} className="card space-y-4">
          <div>
            <label className="label" htmlFor="gname">Group name</label>
            <input id="gname" required className="input" value={name} onChange={(e) => setName(e.target.value)} />
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
    <div className="mx-auto max-w-2xl space-y-4">
      <div>
        <h1 className="text-2xl font-bold">{group.name}</h1>
        <p className="text-sm text-slate-500">Owner: {group.ownerName} · {group.members.length} member{group.members.length !== 1 && 's'}</p>
      </div>
      <Alert>{error}</Alert>
      <Alert tone="green">{notice}</Alert>

      <div className="card">
        <h2 className="mb-3 font-semibold">Members</h2>
        <ul className="divide-y divide-slate-100">
          {group.members.map((m) => (
            <li key={m.id} className="flex items-center justify-between gap-3 py-2.5">
              <div className="min-w-0">
                <div className="truncate font-medium">
                  {m.name} {m.id === group.ownerId && <Badge tone="indigo">Owner</Badge>} {m.id === user.id && <Badge>You</Badge>}
                </div>
                <div className="truncate text-xs text-slate-500">{m.email}{m.studentId ? ` · ${m.studentId}` : ''}</div>
              </div>
              {(isOwner || m.id === user.id) && (
                <button className="text-sm text-red-600 hover:underline" disabled={busy} onClick={() => remove(m)}>
                  {m.id === user.id ? 'Leave' : 'Remove'}
                </button>
              )}
            </li>
          ))}
        </ul>
      </div>

      {isOwner ? (
        <form onSubmit={add} className="card">
          <label className="label" htmlFor="ident">Add a member</label>
          <div className="flex flex-col gap-2 sm:flex-row">
            <input id="ident" required className="input" placeholder="Student email or ID" value={ident} onChange={(e) => setIdent(e.target.value)} />
            <button className="btn-primary" disabled={busy}>Add</button>
          </div>
        </form>
      ) : (
        <p className="text-sm text-slate-500">Only the group owner can add or remove members.</p>
      )}
    </div>
  );
}
