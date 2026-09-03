import { useEffect, useState } from 'react';
import { Outlet, Navigate, Link, useNavigate, NavLink } from 'react-router-dom';
import {
  Home,
  LogOut,
  PackagePlus,
  Search,
  Settings,
  Smartphone,
  ShoppingBag,
  Users,
  Tag,
  Star,
  Loader2,
  Package,
} from 'lucide-react';
import Footer from '../components/Footer';
import { useTranslation } from '../i18n/useTranslation';
import { useAdminStore } from '../stores/useAdminStore';

export default function AdminLayout() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { admin, isAuthenticated, tryRefresh, logout } = useAdminStore();
  const [loading, setLoading] = useState(isAuthenticated === null);

  // On every mount (including page reload) try to silently refresh access token
  useEffect(() => {
    if (isAuthenticated === null) {
      tryRefresh().finally(() => setLoading(false));
    } else {
      Promise.resolve().then(() => setLoading(false));
    }
  }, [isAuthenticated, tryRefresh]);

  if (loading) {
    return (
      <div className="min-h-svh flex items-center justify-center bg-background-primary">
        <Loader2 className="w-7 h-7 text-text-brand animate-spin" />
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/admin/login" replace />;
  }

  const handleLogout = async () => {
    await logout();
    navigate('/admin/login');
  };

  const navLinkClass = ({ isActive }) =>
    `flex items-center gap-3 min-h-[2.75rem] px-5 rounded-xl text-xs font-bold transition-colors ${
      isActive
        ? 'bg-interactive-primary text-text-inverse'
        : 'text-text-secondary hover:text-text-primary hover:bg-background-primary'
    }`;

  return (
    <div className="grid grid-cols-1 lg:grid-cols-[minmax(14rem,17rem)_1fr] min-h-svh bg-background-primary">
      <aside className="static lg:sticky lg:top-0 flex flex-col gap-1 h-auto lg:h-svh py-8 px-4 bg-background-secondary lg:border-e lg:border-border-default overflow-y-auto">
        <div className="flex flex-col items-center gap-1 mb-6 text-text-primary">
          <strong className="font-display-ar text-xl">{t('brandName')}</strong>
          <span className="text-text-secondary text-xs">{t('admin.dashboard')}</span>
        </div>

        <NavLink to="/admin" end className={navLinkClass}>
          <Home className="w-4 h-4 shrink-0" strokeWidth={1.6} />
          <span>{t('admin.overview')}</span>
        </NavLink>

        <NavLink to="/admin/orders" className={navLinkClass}>
          <ShoppingBag className="w-4 h-4 shrink-0" strokeWidth={1.6} />
          <span>{t('admin.orders')}</span>
        </NavLink>

        <NavLink to="/admin/products" className={navLinkClass}>
          <Package className="w-4 h-4 shrink-0" strokeWidth={1.6} />
          <span>{t('nav.products')}</span>
        </NavLink>

        <NavLink to="/admin/add" className={navLinkClass}>
          <PackagePlus className="w-4 h-4 shrink-0" strokeWidth={1.6} />
          <span>{t('admin.addProduct')}</span>
        </NavLink>

        <NavLink to="/admin/customers" className={navLinkClass}>
          <Users className="w-4 h-4 shrink-0" strokeWidth={1.6} />
          <span>{t('admin.customers')}</span>
        </NavLink>

        <NavLink to="/admin/coupons" className={navLinkClass}>
          <Tag className="w-4 h-4 shrink-0" strokeWidth={1.6} />
          <span>{t('admin.coupons')}</span>
        </NavLink>

        <NavLink to="/admin/reviews" className={navLinkClass}>
          <Star className="w-4 h-4 shrink-0" strokeWidth={1.6} />
          <span>{t('admin.reviews')}</span>
        </NavLink>

        <NavLink to="/admin/settings" className={navLinkClass}>
          <Settings className="w-4 h-4 shrink-0" strokeWidth={1.6} />
          <span>{t('admin.settings')}</span>
        </NavLink>

        <div className="mt-auto pt-4 space-y-1 border-t border-border-default">
          <Link
            to="/"
            className="flex items-center gap-3 min-h-[2.75rem] px-5 rounded-xl text-xs font-bold text-text-secondary hover:text-text-primary hover:bg-background-primary transition-colors"
          >
            <Smartphone className="w-4 h-4" strokeWidth={1.6} />
            {t('admin.backToStore')}
          </Link>
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-3 min-h-[2.75rem] px-5 rounded-xl text-xs font-bold text-error-500 hover:bg-error-50 transition-colors"
          >
            <LogOut className="w-4 h-4" strokeWidth={1.6} />
            {t('admin.logout')}
          </button>
        </div>
      </aside>

      <div className="min-w-0">
        <header className="grid grid-cols-1 md:grid-cols-[auto_1fr_auto] gap-4 md:gap-8 items-center px-4 md:px-6 py-4 bg-background-primary border-b border-border-default">
          <div className="flex flex-col">
            <strong className="text-sm font-bold text-text-primary">
              {admin?.name || t('admin.superAdmin')}
            </strong>
            <span className="text-text-secondary text-xs">{admin?.email || ''}</span>
          </div>
          <label className="flex items-center gap-2 w-full max-w-3xl mx-auto px-3.5 py-2.5 text-text-secondary bg-background-secondary border border-border-default rounded-full cursor-text">
            <Search className="w-4 h-4" strokeWidth={1.6} />
            <input
              placeholder={t('admin.searchPlaceholder')}
              className="w-full bg-transparent border-0 outline-none text-sm text-text-primary placeholder:text-text-tertiary"
            />
          </label>
          <Link to="/" className="btn-secondary text-xs hidden md:block">
            {t('admin.backToStore')}
          </Link>
        </header>
        <main className="px-4 md:px-6 py-8">
          <Outlet />
        </main>
        <Footer />
      </div>
    </div>
  );
}