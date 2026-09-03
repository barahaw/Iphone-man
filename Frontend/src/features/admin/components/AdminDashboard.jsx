import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  DollarSign,
  ShoppingBag,
  TrendingUp,
  AlertTriangle,
  ArrowUpRight,
  RefreshCw,
} from 'lucide-react';
import { useTranslation } from '../../../shared/i18n/useTranslation';
import { useAdminStore } from '../../../shared/stores/useAdminStore';
import { fetchAnalyticsOverview } from '../../../shared/api/adminApi';

const ORDER_STATUS_COLORS = {
  pending: 'bg-warning-50 text-warning-600',
  processing: 'bg-blue-50 text-blue-600',
  shipped: 'bg-indigo-50 text-indigo-600',
  delivered: 'bg-success-50 text-success-600',
  cancelled: 'bg-error-50 text-error-500',
  refunded: 'bg-gray-100 text-gray-500',
};

function StatusBadge({ status }) {
  const { t } = useTranslation();
  const cls = ORDER_STATUS_COLORS[status] || 'bg-background-primary text-text-secondary';
  return (
    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full inline-block ${cls}`}>
      {t(`admin.status.${status}`) || status}
    </span>
  );
}

function MetricCard({ icon: Icon, label, value, iconBg }) {
  const { t } = useTranslation();
  return (
    <div className="p-6 rounded-2xl bg-background-secondary border border-border-default space-y-3 shadow-xs">
      <div className="flex items-center justify-between">
        <span className="inline-flex items-center gap-1 text-xs font-bold text-success-600 bg-success-50 px-2.5 py-0.5 rounded-full">
          <ArrowUpRight className="w-3 h-3" />
          {t('admin.thisMonth')}
        </span>
        <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${iconBg}`}>
          <Icon className="w-5 h-5" />
        </div>
      </div>
      <div>
        <p className="text-xs font-bold text-text-secondary">{label}</p>
        <p className="text-2xl font-bold text-text-primary mt-0.5">
          <bdi>{value}</bdi>
        </p>
      </div>
    </div>
  );
}

function SkeletonCard() {
  return (
    <div className="p-6 rounded-2xl bg-background-secondary border border-border-default space-y-3 shadow-xs animate-pulse">
      <div className="h-5 bg-background-primary rounded w-24" />
      <div className="h-8 bg-background-primary rounded w-32" />
    </div>
  );
}

export function AdminDashboard() {
  const { t, locale } = useTranslation();
  const { accessToken } = useAdminStore();

  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const load = () => {
    setLoading(true);
    setError(null);
    fetchAnalyticsOverview(accessToken)
      .then((json) => setData(json.data))
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    if (accessToken) Promise.resolve().then(() => load());
  }, [accessToken]);

  const fmt = (n) =>
    new Intl.NumberFormat(locale, { minimumFractionDigits: 0, maximumFractionDigits: 2 }).format(n);

  const fmtDate = (d) =>
    new Intl.DateTimeFormat(locale, { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' }).format(
      new Date(d)
    );

  return (
    <div className="space-y-8 pb-16 text-start">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border-default pb-6">
        <div>
          <h1 className="text-3xl font-bold text-text-primary">{t('admin.overview')}</h1>
          <p className="text-xs text-text-secondary font-medium mt-1">{t('admin.welcomeSummary')}</p>
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

      {/* 4 Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {loading ? (
          Array.from({ length: 4 }).map((_, i) => <SkeletonCard key={i} />)
        ) : data ? (
          <>
            <MetricCard
              icon={DollarSign}
              label={t('admin.totalRevenue')}
              value={`${fmt(data.revenue.thisMonth)} ₪`}
              iconBg="bg-interactive-primary/10 text-interactive-primary"
            />
            <MetricCard
              icon={ShoppingBag}
              label={t('admin.newOrders')}
              value={fmt(data.orderVolume.thisMonth)}
              iconBg="bg-interactive-primary/10 text-interactive-primary"
            />
            <MetricCard
              icon={TrendingUp}
              label={t('admin.weekRevenue')}
              value={`${fmt(data.revenue.thisWeek)} ₪`}
              iconBg="bg-success-50 text-success-600"
            />
            <MetricCard
              icon={AlertTriangle}
              label={t('admin.lowStockCount')}
              value={data.lowStock.length}
              iconBg="bg-warning-50 text-warning-600"
            />
          </>
        ) : null}
      </div>

      {/* Main Grid: Recent Orders + Top Products */}
      {!loading && data && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Recent Orders */}
          <div className="lg:col-span-2 p-6 rounded-2xl bg-background-secondary border border-border-default space-y-4 shadow-xs">
            <div className="flex items-center justify-between border-b border-border-default pb-3">
              <h2 className="text-lg font-bold text-text-primary">{t('admin.recentOrders')}</h2>
              <Link
                to="/admin/orders"
                className="text-xs font-bold text-text-brand hover:underline"
              >
                {t('admin.viewAllOrders')}
              </Link>
            </div>

            {data.recentOrders.length === 0 ? (
              <p className="text-sm text-text-secondary py-4 text-center">{t('admin.noOrders')}</p>
            ) : (
              <div className="space-y-3">
                {data.recentOrders.map((ord) => (
                  <Link
                    key={ord.id}
                    to={`/admin/orders/${ord.id}`}
                    className="flex items-center justify-between p-3 rounded-xl bg-background-primary border border-border-default hover:border-interactive-primary/40 transition-colors"
                  >
                    <div>
                      <h4 className="font-bold text-xs text-text-primary">{ord.customer_name}</h4>
                      <span className="text-[10px] text-text-secondary font-mono">
                        #{ord.id} · {fmtDate(ord.created_at)}
                      </span>
                    </div>
                    <div className="text-end space-y-1">
                      <p className="font-bold text-xs text-text-brand">
                        <bdi>{fmt(ord.total)} ₪</bdi>
                      </p>
                      <StatusBadge status={ord.status} />
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </div>

          {/* Top Products */}
          <div className="p-6 rounded-2xl bg-background-secondary border border-border-default space-y-4 shadow-xs">
            <h2 className="text-lg font-bold text-text-primary border-b border-border-default pb-3">
              {t('admin.topProducts')}
            </h2>
            {data.topProducts.length === 0 ? (
              <p className="text-sm text-text-secondary py-4 text-center">{t('admin.noData')}</p>
            ) : (
              <div className="space-y-3">
                {data.topProducts.map((p, idx) => (
                  <div key={p.id} className="flex items-center gap-3">
                    <span className="w-5 h-5 rounded-full bg-interactive-primary/10 text-interactive-primary text-[10px] font-bold flex items-center justify-center shrink-0">
                      {idx + 1}
                    </span>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-bold text-text-primary truncate">{p.name}</p>
                      <p className="text-[10px] text-text-secondary">
                        {p.units_sold} {t('admin.unitsSold')} · {fmt(p.revenue)} ₪
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Low Stock Alerts */}
      {!loading && data && data.lowStock.length > 0 && (
        <div className="p-6 rounded-2xl bg-background-secondary border border-border-default space-y-4 shadow-xs">
          <div className="flex items-center gap-2 text-warning-600 font-bold text-base border-b border-border-default pb-3">
            <AlertTriangle className="w-5 h-5" />
            <span>{t('admin.inventoryAlerts')}</span>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {data.lowStock.map((item) => (
              <div
                key={item.id}
                className={`p-3.5 rounded-xl text-xs font-bold flex justify-between items-center ${
                  item.stock_quantity <= 3
                    ? 'bg-error-50 text-error-600'
                    : 'bg-background-primary border border-border-default text-text-primary'
                }`}
              >
                <span className="truncate me-2">{item.name}</span>
                <span
                  className={`shrink-0 px-2.5 py-0.5 rounded-full ${
                    item.stock_quantity <= 3 ? 'bg-error-500 text-white' : 'text-text-secondary'
                  }`}
                >
                  {t('admin.remainingOnly').replace('{count}', item.stock_quantity)}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

export default AdminDashboard;
