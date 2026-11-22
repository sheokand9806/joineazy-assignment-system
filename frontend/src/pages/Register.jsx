import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import { Alert } from '../components/ui.jsx';

export default function Register() {
  const { register } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ name: '', email: '', studentId: '', password: '' });
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const set = (k) => (e) => setForm({ ...form, [k]: e.target.value });

  const submit = async (e) => {
    e.preventDefault();
    setError(''); setBusy(true);
    try { await register(form); navigate('/student'); }
    catch (err) { setError(err.message); } finally { setBusy(false); }
  };

  return (
    <div className="flex min-h-screen items-center justify-center p-6">
      <div className="w-full max-w-md">
        <div className="mb-8 flex items-center gap-2.5">
          <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-brand-600 text-lg font-extrabold text-white shadow-glow">J</span>
          <span className="text-lg font-extrabold">Joineazy</span>
        </div>
        <h1 className="text-3xl font-extrabold">Create your account</h1>
        <p className="mb-8 mt-2 text-slate-500">Teammates can add you to a group with your email or student ID.</p>
        <form onSubmit={submit} className="card space-y-4">
          <Alert>{error}</Alert>
          <div>
            <label className="label" htmlFor="name">Full name</label>
            <input id="name" required className="input" value={form.name} onChange={set('name')} />
          </div>
          <div>
            <label className="label" htmlFor="email">Email</label>
            <input id="email" type="email" required className="input" value={form.email} onChange={set('email')} />
          </div>
          <div>
            <label className="label" htmlFor="sid">Student ID</label>
            <input id="sid" className="input" placeholder="For example, S2024" value={form.studentId} onChange={set('studentId')} />
          </div>
          <div>
            <label className="label" htmlFor="pw">Password</label>
            <input id="pw" type="password" required minLength={6} className="input" value={form.password} onChange={set('password')} />
            <p className="mt-1.5 text-xs text-slate-500">At least 6 characters.</p>
          </div>
          <button className="btn-primary w-full" disabled={busy}>{busy ? 'Creating account…' : 'Create account'}</button>
        </form>
        <p className="mt-5 text-center text-sm text-slate-500">
          Already registered? <Link to="/login" className="font-semibold text-brand-600 hover:underline">Sign in</Link>
        </p>
      </div>
    </div>
  );
}
