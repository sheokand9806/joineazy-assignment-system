import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { api } from '../../api.js';
import { Alert, Badge, ProgressBar, Spinner, Stat } from '../../components/ui.jsx';
import { fmtDate, pct } from '../../utils.js';

export default function AssignmentDetail() {
  const { id } = useParams();
  const [data, setData] = useState(null);
  const [error, setError] = useState('');
  const [tab, setTab] = useState('groups');

  useEffect(() => {
    api.get(`/assignments/${id}`).then(setData).catch((e) => setError(e.message));
  }, [id]);

  if (error) return <Alert>{error}</Alert>;
  if (!data) return <Spinner />;
  const { assignment: a, summary: s, groups, students } = data;

  return (
    <div className="space-y-6">
      <Link to="/admin" className="text-sm text-brand-600 hover:underline">← Back to dashboard</Link>
      <div>
        <h1 className="text-2xl font-bold">{a.title}</h1>
        <p className="mt-1 text-sm text-slate-600">{a.description}</p>
        <p className="mt-2 text-xs text-slate-500">
          Due {fmtDate(a.dueDate)} · {a.assignTo === 'all' ? 'All students' : 'Selected groups'} ·{' '}
          <a href={a.onedriveLink} target="_blank" rel="noopener noreferrer" className="text-brand-600 hover:underline">OneDrive link ↗</a>
        </p>
      </div>

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <Stat label="Groups confirmed" value={`${s.confirmedGroups}/${s.totalGroups}`} />
        <Stat label="Group completion" value={`${pct(s.confirmedGroups, s.totalGroups)}%`} />
        <Stat label="Students covered" value={`${s.confirmedStudents}/${s.totalStudents}`} />
        <Stat label="Student completion" value={`${pct(s.confirmedStudents, s.totalStudents)}%`} />
      </div>

      <div className="flex gap-1 rounded-lg bg-slate-200 p-1 text-sm sm:w-fit">
        {[['groups', 'Group-wise'], ['students', 'Student-wise']].map(([k, l]) => (
          <button key={k} onClick={() => setTab(k)} className={`flex-1 rounded-md px-4 py-1.5 ${tab === k ? 'bg-white shadow-sm' : 'text-slate-600'}`}>{l}</button>
        ))}
      </div>

      {tab === 'groups' ? (
        groups.length === 0 ? <p className="text-sm text-slate-500">No groups are targeted by this assignment.</p> : (
          <div className="grid gap-4 md:grid-cols-2">
            {groups.map((g) => (
              <div key={g.id} className="card">
                <div className="mb-2 flex items-center justify-between">
                  <h3 className="font-semibold">{g.name}</h3>
                  {g.confirmed ? <Badge tone="green">✓ Confirmed</Badge> : <Badge tone="amber">Pending</Badge>}
                </div>
                <ProgressBar value={g.confirmed ? 100 : 0} size="sm" />
                <p className="mt-2 text-xs text-slate-500">
                  {g.confirmed ? `By ${g.confirmedByName} on ${fmtDate(g.confirmedAt)}` : 'Not confirmed yet'}
                </p>
                <p className="mt-2 text-xs text-slate-600">Members: {g.members.map((m) => m.name).join(', ') || '—'}</p>
              </div>
            ))}
          </div>
        )
      ) : (
        <div className="card overflow-x-auto p-0">
          <table className="w-full min-w-[560px] text-left text-sm">
            <thead className="bg-slate-50 text-xs uppercase text-slate-500">
              <tr><th className="px-5 py-2">Student</th><th className="px-3 py-2">Group</th><th className="px-3 py-2">Status</th><th className="px-3 py-2">Confirmed at</th></tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {students.length === 0 && <tr><td colSpan={4} className="p-6 text-center text-slate-500">No students in targeted groups.</td></tr>}
              {students.map((st) => (
                <tr key={`${st.groupId}-${st.id}`}>
                  <td className="px-5 py-2.5">
                    <div className="font-medium">{st.name}</div>
                    <div className="text-xs text-slate-500">{st.email}{st.studentId ? ` · ${st.studentId}` : ''}</div>
                  </td>
                  <td className="px-3 py-2.5">{st.groupName}</td>
                  <td className="px-3 py-2.5">
                    {st.confirmed ? <Badge tone="green">{st.confirmedByThisStudent ? '✓ Confirmed by them' : '✓ Via group'}</Badge> : <Badge tone="amber">Pending</Badge>}
                  </td>
                  <td className="px-3 py-2.5 text-slate-600">{st.confirmedAt ? fmtDate(st.confirmedAt) : '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
