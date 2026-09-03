import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Loader2, RefreshCw, ChevronLeft, ChevronRight } from 'lucide-react';
import { useTranslation } from '../../../shared/i18n/useTranslation';
import { useAdminStore } from '../../../shared/stores/useAdminStore';
import { fetchAdminOrders } from '../../../shared/api/adminApi';

const ALL_STATUSES = ['pending', 'processing', 'shipped', 'delivered', 'cancelled', 'refunded'];

const STATUS_BADGE = {
  pending: 'bg-warning-50 text-warning-600',
  processing: 'bg-blue-50 text-blue-600',
  shipped: 'bg-indigo-50 text-indigo-600',
  delivered: 'bg-success-50 text-success-600',
  cancelled: 'bg-error-50 text-error-500',
  refunded: 'bg-gray-100 text-gray-500',
};

export function AdminOrders() {
  const { t, locale } = useTranslation();
  const navigate = useNavigate();
  const { accessToken } = useAdminStore();

  const [orders, setOrders] = useState([]);
  const [meta, setMeta] = useState({ page: 1, total: 0, limit: 20, hasMore: false });
  const [status, setStatus] = useState('');
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const load = (pg = page, st = status) => {
    if (!accessToken) return;
    setLoading(true);
    setError(null);
    fetchAdminOrders(accessToken, { status: st || undefined, page: pg, limit: 20 })
      .then((json) => {
        setOrders(json.data);
        setMeta(json.meta);
      })
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    Promise.resolve().then(() => {
      load(1, status);
      setPage(1);
    });
  }, [status, accessToken]);

  const fmtDate = (d) =>
    new Intl.DateTimeFormat(locale, { day: 'numeric', month: 'short', year: 'numeric' }).format(new Date(d));

  const fmt = (n) =>
    new Intl.NumberFormat(locale, { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(n);

  const goPage = (pg) => {
    setPage(pg);
    load(pg, status);
  };

  return (
    <div className="space-y-6 pb-16 text-start">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border-default pb-6">
        <div>
          <h1 className="text-3xl font-bold text-text-primary">{t('admin.orders')}</h1>
          <p className="text-xs text-text-secondary font-medium mt-1">
            {t('admin.ordersSubtitle')}
          </p>
        </div>
        <button
          onClick={() => load(page, status)}
          disabled={loading}
          className="flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold text-text-secondary border border-border-default hover:bg-background-secondary transition-colors disabled:opacity-50"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          {t('admin.refresh')}
        </button>
      </div>

      {/* Status Filter Tabs */}
      <div className="flex items-center gap-1 flex-wrap">
        <button
          onClick={() => setStatus('')}
          className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors ${
            status === ''
              ? 'bg-interactive-primary text-text-inverse'
              : 'bg-background-secondary border border-border-default text-text-secondary hover:text-text-primary'
          }`}
        >
          {t('common.all')} {status === '' && meta.total > 0 && `(${meta.total})`}
        </button>
        {ALL_STATUSES.map((s) => (
          <button
            key={s}
            onClick={() => setStatus(s)}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors ${
              status === s
                ? 'bg-interactive-primary text-text-inverse'
                : 'bg-background-secondary border border-border-default text-text-secondary hover:text-text-primary'
            }`}
          >
            {t(`admin.status.${s}`)}
          </button>
        ))}
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
        ) : orders.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 gap-2">
            <p className="text-sm font-bold text-text-secondary">{t('admin.noOrders')}</p>
            <p className="text-xs text-text-tertiary">{t('admin.noOrdersHint')}</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className="border-b border-border-default bg-background-primary">
                  <th className="px-4 py-3 text-start font-bold text-text-secondary">{t('admin.orderIdCol')}</th>
                  <th className="px-4 py-3 text-start font-bold text-text-secondary">{t('admin.customerCol')}</th>
                  <th className="px-4 py-3 text-start font-bold text-text-secondary">{t('admin.dateCol')}</th>
                  <th className="px-4 py-3 text-start font-bold text-text-secondary">{t('admin.totalCol')}</th>
                  <th className="px-4 py-3 text-start font-bold text-text-secondary">{t('admin.statusCol')}</th>
                </tr>
              </thead>
              <tbody>
                {orders.map((ord) => (
                  <tr
                    key={ord.id}
                    onClick={() => navigate(`/admin/orders/${ord.id}`)}
                    className="border-b border-border-default last:border-0 hover:bg-background-primary cursor-pointer transition-colors"
                  >
                    <td className="px-4 py-3 font-mono font-bold text-text-brand">#{ord.id}</td>
                    <td className="px-4 py-3">
                      <p className="font-bold text-text-primary">{ord.customer_name}</p>
                      <p className="text-text-secondary text-[10px]">{ord.customer_email}</p>
                    </td>
                    <td className="px-4 py-3 text-text-secondary">{fmtDate(ord.created_at)}</td>
                    <td className="px-4 py-3 font-bold text-text-primary">
                      <bdi>{fmt(ord.total)} ₪</bdi>
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`px-2 py-0.5 rounded-full font-bold ${STATUS_BADGE[ord.status] || 'bg-background-primary text-text-secondary'}`}
                      >
                        {t(`admin.status.${ord.status}`)}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Pagination */}
      {!loading && meta.total > meta.limit && (
        <div className="flex items-center justify-between text-xs font-bold">
          <span className="text-text-secondary">
            {t('admin.showingPage')
              .replace('{page}', meta.page)
              .replace('{total}', Math.ceil(meta.total / meta.limit))}
          </span>
          <div className="flex items-center gap-2">
            <button
              onClick={() => goPage(page - 1)}
              disabled={page === 1}
              className="flex items-center gap-1 px-3 py-1.5 rounded-lg border border-border-default text-text-secondary hover:text-text-primary hover:bg-background-secondary disabled:opacity-40 transition-colors"
            >
              <ChevronLeft className="w-3.5 h-3.5" />
              {t('common.prevPage')}
            </button>
            <button
              onClick={() => goPage(page + 1)}
              disabled={!meta.hasMore}
              className="flex items-center gap-1 px-3 py-1.5 rounded-lg border border-border-default text-text-secondary hover:text-text-primary hover:bg-background-secondary disabled:opacity-40 transition-colors"
            >
              {t('common.nextPage')}
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default AdminOrders;
