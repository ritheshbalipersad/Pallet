import { Outlet, NavLink } from 'react-router-dom';
import { useAuth } from '../auth/useAuth';

const nav = [
  { to: '/', label: 'Home' },
  { to: '/scan', label: 'Scan' },
  { to: '/reports', label: 'Reports' },
  { to: '/exports', label: 'Exports' },
];
const adminNav = [
  { to: '/admin/areas', label: 'Areas' },
  { to: '/admin/users', label: 'Users' },
  { to: '/admin/audit', label: 'Audit' },
];

export default function Layout() {
  const { user, logout } = useAuth();
  const isAdmin = user?.role?.name === 'Admin';

  return (
    <div className="flex min-h-screen flex-col safe-bottom">
      <header className="sticky top-0 z-10 border-b border-slate-700 bg-slate-800 px-4 py-3">
        <div className="mx-auto flex max-w-4xl items-center justify-between">
          <span className="font-semibold text-primary-400">PalletMS</span>
          <div className="flex items-center gap-2">
            <span className="text-sm text-slate-400">{user?.displayName || user?.username}</span>
            <button
              type="button"
              onClick={logout}
              className="rounded bg-slate-600 px-2 py-1 text-sm text-slate-200 hover:bg-slate-500"
            >
              Logout
            </button>
          </div>
        </div>
      </header>
      <nav className="flex gap-1 overflow-x-auto border-b border-slate-700 bg-slate-800/80 px-2 py-2">
        {nav.map(({ to, label }) => (
          <NavLink
            key={to}
            to={to}
            className={({ isActive }) =>
              `whitespace-nowrap rounded px-3 py-1.5 text-sm ${isActive ? 'bg-primary-600 text-white' : 'text-slate-300 hover:bg-slate-700'}`
            }
          >
            {label}
          </NavLink>
        ))}
        {isAdmin && adminNav.map(({ to, label }) => (
          <NavLink
            key={to}
            to={to}
            className={({ isActive }) =>
              `whitespace-nowrap rounded px-3 py-1.5 text-sm ${isActive ? 'bg-amber-600 text-white' : 'text-slate-300 hover:bg-slate-700'}`
            }
          >
            {label}
          </NavLink>
        ))}
      </nav>
      <main className="flex-1 overflow-auto p-4">
        <Outlet />
      </main>
    </div>
  );
}
