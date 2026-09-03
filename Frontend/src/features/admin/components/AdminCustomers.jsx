import { useEffect, useState } from 'react';
import { Loader2, RefreshCw, Users } from 'lucide-react';
import { useTranslation } from '../../../shared/i18n/useTranslation';
import { useAdminStore } from '../../../shared/stores/useAdminStore';
import { fetchAdminCustomers } from '../../../shared/api/adminApi';

export function AdminCustomers() {
  const { t, locale } = useTranslation();
  const { accessToken } = useAdminStore();

  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const load = () => {
    if (!accessToken) return;
    setLoading(true);
    setError(null);
    fetchAdminCustomers(accessToken, { page: 1, limit: 100 })
      .then((json) => {
        const data = Array.isArray(json?.data) ? json.data : [];
        setCustomers(data);
      })
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    Promise.resolve().then(() => load());
  }, [accessToken]);

  const fmt = (n) =>
    new Intl.NumberFormat(locale, { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(n);

  const fmtDate = (d) => {
    if (!d) return '—';
    return new Intl.DateTimeFormat(locale, { day: 'numeric', month: 'short', year: 'numeric' }).format(new Date(d));
  };

  return (
    <div className="space-y-6 pb-16 text-start">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border-default pb-6">
        <div>
          <h1 className="text-3xl font-bold text-text-primary flex items-center gap-2">
            <Users className="w-7 h-7 text-text-brand" />
            <span>{t('admin.customers')}</span>
          </h1>
          <p className="text-xs text-text-secondary font-medium mt-1">
            {t('admin.customersSubtitle')}
          </p>
        </div>
        <button
          onClick={load}
          disabled={loading}
          className="flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold text-text-secondary border border-border-default hover:bg-background-secondary transition-colors disabled:opacity-50"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          {t('admin.refresh')}
        </button>
      </div>

      {error && (
        <div className="p-4 rounded-xl bg-error-50 border border-error-200 text-error-600 text-sm font-medium">
          {error}
        </div>
      )}

      {/* Table */}
      <div className="rounded-2xl bg-background-secondary border border-border-default overflow-hidden shadow-xs">
        {loading ? (
          <div className="flex items-center justify-center py-16">
            <Loader2 className="w-6 h-6 text-text-brand animate-spin" />
          </div>
        ) : customers.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 gap-2">
            <p className="text-sm font-bold text-text-secondary">{t('admin.noCustomers')}</p>
            <p className="text-xs text-text-tertiary">{t('admin.noCustomersHint')}</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className="border-b border-border-default bg-background-primary">
                  <th className="px-4 py-3 text-start font-bold text-text-secondary">{t('admin.customerNameCol')}</th>
                  <th className="px-4 py-3 text-start font-bold text-text-secondary">{t('admin.customerEmailCol')}</th>
                  <th className="px-4 py-3 text-start font-bold text-text-secondary">{t('admin.customerPhoneCol')}</th>
                  <th className="px-4 py-3 text-start font-bold text-text-secondary">{t('admin.ordersCol')}</th>
                  <th className="px-4 py-3 text-start font-bold text-text-secondary">{t('admin.totalSpentCol')}</th>
                  <th className="px-4 py-3 text-start font-bold text-text-secondary">{t('admin.lastOrderCol')}</th>
                </tr>
              </thead>
              <tbody>
                {customers.map((c) => (
                  <tr
                    key={c.customer_email}
                    className="border-b border-border-default last:border-0 hover:bg-background-primary transition-colors"
                  >
                    <td className="px-4 py-3 font-bold text-text-primary">{c.customer_name || '—'}</td>
                    <td className="px-4 py-3 text-text-secondary">{c.customer_email}</td>
                    <td className="px-4 py-3 text-text-secondary">{c.customer_phone || '—'}</td>
                    <td className="px-4 py-3 font-bold text-text-primary">{c.order_count}</td>
                    <td className="px-4 py-3 font-bold text-text-brand">
                      <bdi>{fmt(c.total_spent)} ₪</bdi>
                    </td>
                    <td className="px-4 py-3 text-text-secondary">{fmtDate(c.last_order_at)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

export default AdminCustomers;
