import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import { Alert, Ring } from '../components/ui.jsx';

// Static product preview shown beside the form (decorative)
function Preview() {
  const rows = [
    ['Database design project', 'Submitted', 'bg-emerald-400'],
    ['REST API case study', 'Due in 6 days', 'bg-amber-300'],
    ['Capstone proposal', 'Due in 2 weeks', 'bg-white/50'],
  ];
  return (
    <div className="relative w-full max-w-md" aria-hidden="true">
      <div className="rounded-3xl bg-white/10 p-5 ring-1 ring-white/20 backdrop-blur">
        <div className="flex items-center gap-5">
          <Ring value={67} size={96} stroke={10} track="stroke-white/20" arc="stroke-white">
            <span className="text-xl font-extrabold text-white">67%</span>
          </Ring>
          <div>
            <p className="text-sm text-white/70">Team Alpha</p>
            <p className="text-lg font-bold text-white">2 of 3 confirmed</p>
          </div>
        </div>
        <ul className="mt-5 space-y-2">
          {rows.map(([t, s, c]) => (
            <li key={t} className="flex items-center gap-3 rounded-2xl bg-white/10 px-4 py-3 text-sm text-white">
              <span className={`h-2.5 w-2.5 rounded-full ${c}`} />
              <span className="flex-1 font-semibold">{t}</span>
              <span className="text-xs text-white/70">{s}</span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}

export default function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ email: '', password: '' });
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    setError(''); setBusy(true);
    try {
      const u = await login(form.email, form.password);
      navigate(u.role === 'admin' ? '/admin' : '/student');
    } catch (err) { setError(err.message); } finally { setBusy(false); }
  };
  const fill = (email) => setForm({ email, password: 'password123' });

  return (
    <div className="grid min-h-screen lg:grid-cols-2">
      <div className="relative hidden flex-col justify-between overflow-hidden bg-brand-600 p-12 lg:flex">
        <div className="absolute -right-24 -top-24 h-96 w-96 rounded-full bg-brand-500 blur-3xl" />
        <div className="absolute -bottom-32 -left-16 h-96 w-96 rounded-full bg-[#1B2FB8] blur-3xl" />
        <div className="relative flex items-center gap-2.5 text-white">
          <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-white text-lg font-extrabold text-brand-600">J</span>
          <span className="text-lg font-extrabold">Joineazy</span>
        </div>
        <div className="relative flex flex-col gap-10">
          <h2 className="max-w-md text-4xl font-extrabold leading-[1.1] tracking-tight text-white">
            Your group's assignments, confirmed in two taps.
          </h2>
          <Preview />
        </div>
        <p className="relative text-sm text-white/60">Built for students and professors.</p>
      </div>

      <div className="flex items-center justify-center p-6">
        <div className="w-full max-w-sm">
          <h1 className="text-3xl font-extrabold">Welcome back</h1>
          <p className="mb-8 mt-2 text-slate-500">Sign in to see your assignments.</p>
          <form onSubmit={submit} className="space-y-4">
            <Alert>{error}</Alert>
            <div>
              <label className="label" htmlFor="email">Email</label>
              <input id="email" type="email" required autoComplete="email" className="input" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
            </div>
            <div>
              <label className="label" htmlFor="password">Password</label>
              <input id="password" type="password" required autoComplete="current-password" className="input" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} />
            </div>
            <button className="btn-primary w-full" disabled={busy}>{busy ? 'Signing in…' : 'Sign in'}</button>
          </form>
          <p className="mt-5 text-center text-sm text-slate-500">
            New student? <Link to="/register" className="font-semibold text-brand-600 hover:underline">Create an account</Link>
          </p>

          <div className="mt-8 rounded-2xl bg-white p-4 shadow-card ring-1 ring-slate-900/[.04]">
            <p className="mb-3 text-sm font-semibold">Try a demo account</p>
            <div className="flex flex-wrap gap-2">
              {[['Professor', 'professor@joineazy.com'], ['Student', 'aarav@student.com'], ['Student without group', 'sneha@student.com']].map(([l, e]) => (
                <button key={e} type="button" onClick={() => fill(e)} className="rounded-full bg-slate-100 px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-brand-50 hover:text-brand-700">{l}</button>
              ))}
            </div>
            <p className="mt-3 text-xs text-slate-500">Fills the form. Password is password123.</p>
          </div>
        </div>
      </div>
    </div>
  );
}
