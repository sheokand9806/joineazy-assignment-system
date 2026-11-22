import { useEffect, useState } from 'react';
import { api } from '../../api.js';
import { Alert, Avatar, Empty, Spinner } from '../../components/ui.jsx';

export default function AdminGroups() {
  const [groups, setGroups] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    api.get('/groups').then((d) => setGroups(d.groups)).catch((e) => setError(e.message));
  }, []);

  if (error) return <Alert>{error}</Alert>;
  if (!groups) return <Spinner />;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-extrabold sm:text-4xl">Groups</h1>
        <p className="mt-2 text-slate-500">{groups.length} group{groups.length !== 1 && 's'} created by students.</p>
      </div>
      {groups.length === 0 ? (
        <Empty title="No groups yet">Groups appear here as soon as students create them.</Empty>
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {groups.map((g) => (
            <div key={g.id} className="card">
              <h3 className="text-lg font-bold">{g.name}</h3>
              <p className="mb-4 text-xs font-medium text-slate-500">Owner: {g.ownerName}</p>
              <ul className="space-y-2.5">
                {g.members.map((m) => (
                  <li key={m.id} className="flex items-center gap-3">
                    <Avatar name={m.name} size="sm" />
                    <span className="flex-1 text-sm font-semibold">{m.name}</span>
                    <span className="truncate text-xs text-slate-500">{m.studentId || m.email}</span>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
