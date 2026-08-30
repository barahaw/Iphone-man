import { Link, useLocation } from 'react-router-dom';

export default function AdminNavButton({ to, children }) {
  const { pathname } = useLocation();
  const active = to === '/admin' ? pathname === '/admin' : pathname.startsWith(to);

  return (
    <Link
      to={to}
      className={`flex items-center gap-3 min-h-[3.25rem] px-5 rounded-xl text-start text-sm font-bold transition-colors duration-fast ${
        active
          ? 'text-text-inverse bg-interactive-primary shadow-sm'
          : 'text-text-secondary hover:text-text-primary hover:bg-background-primary'
      }`}
    >
      {children}
    </Link>
  );
}