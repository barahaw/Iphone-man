import { Outlet, Navigate, Link, useNavigate } from 'react-router-dom';
import { Home, LogOut, PackagePlus, Search, Settings, Smartphone, Store } from 'lucide-react';
import AdminNavButton from '../../features/admin/components/AdminNavButton';
import Footer from '../components/Footer';
import { useTranslation } from '../i18n/useTranslation';

export default function AdminLayout() {
  const { t } = useTranslation();
  const navigate = useNavigate();

  if (!localStorage.getItem('adminToken')) {
    return <Navigate to="/admin/login" replace />;
  }

  const handleLogout = () => {
    localStorage.removeItem('adminToken');
    navigate('/admin/login');
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-[minmax(14rem,17rem)_1fr] min-h-svh bg-background-primary">
      <aside className="static lg:sticky lg:top-0 flex flex-col gap-2 h-auto lg:h-svh py-8 px-4 bg-background-secondary lg:border-e lg:border-border-default">
        <div className="flex flex-col items-center gap-1 mb-6 text-text-primary">
          <strong className="font-display-ar text-xl">{t('brandName')}</strong>
          <span className="text-text-secondary text-xs">{t('admin.dashboard')}</span>
        </div>

        <AdminNavButton to="/admin">
          <Home className="w-4 h-4" strokeWidth={1.6} />
          <span>{t('nav.home')}</span>
        </AdminNavButton>
        <AdminNavButton to="/products">
          <Store className="w-4 h-4" strokeWidth={1.6} />
          <span>{t('nav.products')}</span>
        </AdminNavButton>
        <AdminNavButton to="/admin/add">
          <PackagePlus className="w-4 h-4" strokeWidth={1.6} />
          <span>{t('admin.addProduct')}</span>
        </AdminNavButton>
        <AdminNavButton to="/admin/settings">
          <Settings className="w-4 h-4" strokeWidth={1.6} />
          <span>{t('admin.settings')}</span>
        </AdminNavButton>

        <div className="mt-auto pt-4 space-y-2">
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
            <strong className="text-sm font-bold text-text-primary">{t('admin.superAdmin')}</strong>
            <span className="text-text-secondary text-xs">admin@iphoneman.com</span>
          </div>
          <label className="flex items-center gap-2 w-full max-w-3xl mx-auto px-3.5 py-2.5 text-text-secondary bg-background-secondary border border-border-default rounded-full cursor-text">
            <Search className="w-4 h-4" strokeWidth={1.6} />
            <input
              placeholder={t('admin.searchPlaceholder')}
              className="w-full bg-transparent border-0 outline-none text-sm text-text-primary placeholder:text-text-tertiary"
            />
          </label>
          <Link to="/" className="btn-secondary text-xs">{t('admin.backToStore')}</Link>
        </header>
        <main className="px-4 md:px-6 py-8">
          <Outlet />
        </main>
        <Footer />
      </div>
    </div>
  );
}