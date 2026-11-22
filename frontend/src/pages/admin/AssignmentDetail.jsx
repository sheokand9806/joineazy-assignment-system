import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { api } from '../../api.js';
import { Alert, Avatar, Badge, Icon, ProgressBar, SegTabs, Spinner } from '../../components/ui.jsx';
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

  const stats = [
    ['Groups confirmed', `${s.confirmedGroups}/${s.totalGroups}`, pct(s.confirmedGroups, s.totalGroups)],
    ['Students covered', `${s.confirmedStudents}/${s.totalStudents}`, pct(s.confirmedStudents, s.totalStudents)],
  ];

  return (
    <div className="space-y-6">
      <Link to="/admin" className="inline-flex items-center gap-1.5 text-sm font-semibold text-slate-500 hover:text-ink">
        <Icon name="arrowLeft" className="h-4 w-4" /> Overview
      </Link>
      <div>
        <h1 className="text-3xl font-extrabold sm:text-4xl">{a.title}</h1>
        {a.description && <p className="mt-2 max-w-2xl text-slate-600">{a.description}</p>}
        <div className="mt-3 flex flex-wrap items-center gap-3 text-sm font-medium text-slate-500">
          <span>Due {fmtDate(a.dueDate)}</span>
          <Badge tone="indigo" dot={false}>{a.assignTo === 'all' ? 'All students' : 'Selected groups'}</Badge>
          <a href={a.onedriveLink} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 font-semibold text-brand-600 hover:underline">
            OneDrive link <Icon name="link" className="h-3.5 w-3.5" />
          </a>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        {stats.map(([l, v, p]) => (
          <div key={l} className="card">
            <div className="flex items-baseline justify-between">
              <p className="tile-title">{l}</p>
              <p className="text-3xl font-extrabold">{v}</p>
            </div>
            <div className="mt-4"><ProgressBar value={p} /></div>
          </div>
        ))}
      </div>

      <SegTabs value={tab} onChange={setTab} options={[['groups', 'By group'], ['students', 'By student']]} />

      {tab === 'groups' ? (
        groups.length === 0 ? <p className="text-sm text-slate-500">No groups are targeted by this assignment.</p> : (
          <div className="grid gap-4 md:grid-cols-2">
            {groups.map((g) => (
              <div key={g.id} className="card">
                <div className="mb-3 flex items-center justify-between gap-2">
                  <h3 className="font-bold">{g.name}</h3>
                  {g.confirmed ? <Badge tone="green">Confirmed</Badge> : <Badge tone="amber">Pending</Badge>}
                </div>
                <p className="mb-4 text-xs font-medium text-slate-500">
                  {g.confirmed ? `By ${g.confirmedByName} on ${fmtDate(g.confirmedAt)}` : 'Not confirmed yet'}
                </p>
                <div className="flex -space-x-2">
                  {g.members.map((m) => <span key={m.id} className="rounded-full ring-2 ring-white" title={m.name}><Avatar name={m.name} size="sm" /></span>)}
                </div>
              </div>
            ))}
          </div>
        )
      ) : (
        <div className="card !p-2 sm:!p-3">
          {students.length === 0 && <p className="p-6 text-center text-sm text-slate-500">No students in the targeted groups.</p>}
          <ul className="divide-y divide-slate-100">
            {students.map((st) => (
              <li key={`${st.groupId}-${st.id}`} className="flex flex-wrap items-center gap-3 px-3 py-3">
                <Avatar name={st.name} />
                <div className="min-w-0 flex-1">
                  <div className="font-semibold">{st.name}</div>
                  <div className="truncate text-xs text-slate-500">{st.groupName} · {st.studentId || st.email}</div>
                </div>
                <div className="text-right">
                  {st.confirmed
                    ? <Badge tone="green">{st.confirmedByThisStudent ? 'Confirmed by them' : 'Confirmed by group'}</Badge>
                    : <Badge tone="amber">Pending</Badge>}
                  {st.confirmedAt && <div className="mt-1 text-xs text-slate-500">{fmtDate(st.confirmedAt)}</div>}
                </div>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
