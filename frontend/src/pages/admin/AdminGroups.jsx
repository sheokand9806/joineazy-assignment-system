import { useEffect, useState } from 'react';
import { api } from '../../api.js';
import { Alert, Spinner } from '../../components/ui.jsx';

export default function AdminGroups() {
  const [groups, setGroups] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    api.get('/groups').then((d) => setGroups(d.groups)).catch((e) => setError(e.message));
  }, []);

  if (error) return <Alert>{error}</Alert>;
  if (!groups) return <Spinner />;

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold">Groups</h1>
      {groups.length === 0 ? (
        <p className="text-sm text-slate-500">No groups have been created yet.</p>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {groups.map((g) => (
            <div key={g.id} className="card">
              <h3 className="font-semibold">{g.name}</h3>
              <p className="mb-2 text-xs text-slate-500">Owner: {g.ownerName}</p>
              <ul className="space-y-1 text-sm">
                {g.members.map((m) => (
                  <li key={m.id} className="flex justify-between gap-2">
                    <span>{m.name}</span>
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
