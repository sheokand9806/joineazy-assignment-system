import { useEffect, useState } from 'react';
import { api } from '../../api.js';
import { Alert, Modal } from '../../components/ui.jsx';
import { toInputDateTime } from '../../utils.js';

// Create / edit assignment. `assignment` (from list API) is provided when editing.
export default function AssignmentForm({ assignment, onClose, onSaved }) {
  const editing = !!assignment;
  const [form, setForm] = useState({
    title: assignment?.title || '',
    description: assignment?.description || '',
    dueDate: assignment ? toInputDateTime(assignment.dueDate) : '',
    onedriveLink: assignment?.onedriveLink || '',
    assignTo: assignment?.assignTo || 'all',
    groupIds: assignment?.groupIds || [],
  });
  const [groups, setGroups] = useState([]);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    api.get('/groups').then((d) => setGroups(d.groups)).catch(() => {});
  }, []);

  const set = (k) => (e) => setForm({ ...form, [k]: e.target.value });
  const toggleGroup = (id) =>
    setForm({ ...form, groupIds: form.groupIds.includes(id) ? form.groupIds.filter((g) => g !== id) : [...form.groupIds, id] });

  const submit = async (e) => {
    e.preventDefault();
    setError(''); setBusy(true);
    try {
      const body = { ...form, dueDate: new Date(form.dueDate).toISOString() };
      if (editing) await api.put(`/assignments/${assignment.id}`, body);
      else await api.post('/assignments', body);
      onSaved();
    } catch (err) { setError(err.message); } finally { setBusy(false); }
  };

  return (
    <Modal title={editing ? 'Edit assignment' : 'New assignment'} onClose={onClose} wide>
      <form onSubmit={submit} className="space-y-4">
        <Alert>{error}</Alert>
        <div>
          <label className="label" htmlFor="title">Title</label>
          <input id="title" required className="input" value={form.title} onChange={set('title')} />
        </div>
        <div>
          <label className="label" htmlFor="desc">Description</label>
          <textarea id="desc" rows={3} className="input" value={form.description} onChange={set('description')} />
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className="label" htmlFor="due">Due date</label>
            <input id="due" type="datetime-local" required className="input" value={form.dueDate} onChange={set('dueDate')} />
          </div>
          <div>
            <label className="label" htmlFor="link">OneDrive submission link</label>
            <input id="link" type="url" required placeholder="https://onedrive.live.com/…" className="input" value={form.onedriveLink} onChange={set('onedriveLink')} />
          </div>
        </div>

        <fieldset>
          <legend className="label">Assign to</legend>
          <div className="flex flex-wrap gap-4 text-sm font-medium">
            <label className="flex items-center gap-2"><input type="radio" checked={form.assignTo === 'all'} onChange={() => setForm({ ...form, assignTo: 'all' })} /> All students</label>
            <label className="flex items-center gap-2"><input type="radio" checked={form.assignTo === 'groups'} onChange={() => setForm({ ...form, assignTo: 'groups' })} /> Specific groups</label>
          </div>
          {form.assignTo === 'groups' && (
            <div className="mt-3 max-h-40 space-y-2 overflow-y-auto rounded-xl bg-slate-50 p-3.5">
              {groups.length === 0 && <p className="text-sm text-slate-500">No groups exist yet.</p>}
              {groups.map((g) => (
                <label key={g.id} className="flex items-center gap-2 text-sm">
                  <input type="checkbox" checked={form.groupIds.includes(g.id)} onChange={() => toggleGroup(g.id)} />
                  {g.name} <span className="text-xs text-slate-500">({g.members.length} members)</span>
                </label>
              ))}
            </div>
          )}
        </fieldset>

        <div className="flex justify-end gap-2">
          <button type="button" className="btn-secondary" onClick={onClose}>Cancel</button>
          <button className="btn-primary" disabled={busy}>{busy ? 'Saving…' : editing ? 'Save changes' : 'Create assignment'}</button>
        </div>
      </form>
    </Modal>
  );
}
