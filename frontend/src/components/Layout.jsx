import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import { Avatar, Icon } from './ui.jsx';

const NAV = {
  student: [
    { to: '/student', label: 'Assignments', icon: 'tasks', end: true },
    { to: '/student/group', label: 'My group', icon: 'users' },
  ],
  admin: [
    { to: '/admin', label: 'Overview', icon: 'grid', end: true },
    { to: '/admin/groups', label: 'Groups', icon: 'users' },
  ],
};

function Logo() {
  return (
    <div className="flex items-center gap-2.5">
      <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-brand-600 text-lg font-extrabold text-white shadow-glow">J</span>
      <span className="text-lg font-extrabold tracking-tight">Joineazy</span>
    </div>
  );
}

export default function Layout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const items = NAV[user.role];
  const signOut = () => { logout(); navigate('/login'); };

  const sideLink = ({ isActive }) =>
    `flex items-center gap-3 rounded-xl px-3.5 py-2.5 text-sm font-semibold transition ${
      isActive ? 'bg-ink text-white shadow-sm' : 'text-slate-600 hover:bg-white hover:text-ink'}`;
  const tabLink = ({ isActive }) =>
    `flex flex-1 flex-col items-center gap-1 py-2.5 text-[11px] font-semibold ${isActive ? 'text-brand-600' : 'text-slate-500'}`;

  return (
    <div className="min-h-screen lg:pl-64">
      {/* desktop sidebar */}
      <aside className="fixed inset-y-0 left-0 hidden w-64 flex-col justify-between p-4 lg:flex">
        <div>
          <div className="px-2 py-3"><Logo /></div>
          <nav className="mt-6 space-y-1" aria-label="Main">
            {items.map((i) => (
              <NavLink key={i.to} to={i.to} end={i.end} className={sideLink}>
                <Icon name={i.icon} className="h-[18px] w-[18px]" /> {i.label}
              </NavLink>
            ))}
          </nav>
        </div>
        <div className="rounded-2xl bg-white p-3 shadow-card ring-1 ring-slate-900/[.04]">
          <div className="flex items-center gap-3">
            <Avatar name={user.name} />
            <div className="min-w-0">
              <div className="truncate text-sm font-bold">{user.name}</div>
              <div className="text-xs text-slate-500">{user.role === 'admin' ? 'Professor' : 'Student'}</div>
            </div>
          </div>
          <button onClick={signOut} className="btn-ghost mt-3 w-full justify-start !px-3 !py-2 text-slate-500">
            <Icon name="logout" className="h-4 w-4" /> Log out
          </button>
        </div>
      </aside>

      {/* mobile top bar */}
      <header className="sticky top-0 z-30 flex items-center justify-between bg-canvas/85 px-4 py-3 backdrop-blur lg:hidden">
        <Logo />
        <button onClick={signOut} className="flex items-center gap-2 rounded-full bg-white py-1 pl-1 pr-3 text-xs font-semibold shadow-card" aria-label="Log out">
          <Avatar name={user.name} size="sm" /> Log out
        </button>
      </header>

      <main className="mx-auto max-w-5xl px-4 pb-28 pt-4 lg:px-8 lg:pb-12 lg:pt-10">
        <Outlet />
      </main>

      {/* mobile tab bar */}
      <nav className="fixed inset-x-3 bottom-3 z-30 flex rounded-2xl bg-white/90 shadow-pop ring-1 ring-slate-900/5 backdrop-blur lg:hidden" aria-label="Main">
        {items.map((i) => (
          <NavLink key={i.to} to={i.to} end={i.end} className={tabLink}>
            <Icon name={i.icon} className="h-5 w-5" /> {i.label}
          </NavLink>
        ))}
      </nav>
    </div>
  );
}
