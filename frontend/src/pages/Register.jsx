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
    setError('');
    setBusy(true);
    try {
      await register(form);
      navigate('/student');
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center p-4">
      <div className="w-full max-w-md">
        <h1 className="mb-6 text-center text-3xl font-bold text-brand-600">Create student account</h1>
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
            <input id="sid" className="input" placeholder="e.g. S2024" value={form.studentId} onChange={set('studentId')} />
            <p className="mt-1 text-xs text-slate-500">Teammates can add you using your email or student ID.</p>
          </div>
          <div>
            <label className="label" htmlFor="pw">Password</label>
            <input id="pw" type="password" required minLength={6} className="input" value={form.password} onChange={set('password')} />
          </div>
          <button className="btn-primary w-full" disabled={busy}>{busy ? 'Creating…' : 'Register'}</button>
          <p className="text-center text-sm text-slate-500">
            Already registered? <Link to="/login" className="font-medium text-brand-600 hover:underline">Sign in</Link>
          </p>
        </form>
      </div>
    </div>
  );
}
