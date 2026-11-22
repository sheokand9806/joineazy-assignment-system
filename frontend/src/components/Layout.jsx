import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';

const linkCls = ({ isActive }) =>
  `rounded-lg px-3 py-1.5 text-sm font-medium ${isActive ? 'bg-brand-50 text-brand-700' : 'text-slate-600 hover:bg-slate-100'}`;

export default function Layout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  return (
    <div className="min-h-screen">
      <header className="sticky top-0 z-40 border-b border-slate-200 bg-white/90 backdrop-blur">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-3 px-4 py-3">
          <div className="flex items-center gap-4">
            <span className="text-lg font-bold text-brand-600">Joineazy</span>
            <nav className="flex gap-1">
              {user.role === 'student' ? (
                <>
                  <NavLink to="/student" end className={linkCls}>Assignments</NavLink>
                  <NavLink to="/student/group" className={linkCls}>My Group</NavLink>
                </>
              ) : (
                <>
                  <NavLink to="/admin" end className={linkCls}>Dashboard</NavLink>
                  <NavLink to="/admin/groups" className={linkCls}>Groups</NavLink>
                </>
              )}
            </nav>
          </div>
          <div className="flex items-center gap-3 text-sm">
            <span className="hidden text-slate-600 sm:inline">
              {user.name} <span className="ml-1 rounded bg-slate-100 px-1.5 py-0.5 text-xs uppercase">{user.role === 'admin' ? 'Professor' : 'Student'}</span>
            </span>
            <button className="btn-secondary" onClick={() => { logout(); navigate('/login'); }}>Log out</button>
          </div>
        </div>
      </header>
      <main className="mx-auto max-w-6xl px-4 py-6">
        <Outlet />
      </main>
    </div>
  );
}
