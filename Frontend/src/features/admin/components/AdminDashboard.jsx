import { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  DollarSign,
  ShoppingBag,
  Users,
  Box,
  AlertTriangle,
  ArrowUpRight,
  ArrowDownRight,
} from 'lucide-react';
import { useTranslation } from '../../../shared/i18n/useTranslation';

/* Demo display data for the admin dashboard. Product/brand names, prices, and
   the admin email below are demo content, not UI copy — brand names and emails
   are intentionally kept in English across all locales (product names are not
   translated; see INSTRUCTIONS.md §19). */
const RECENT_ORDERS = [
  {
    id: '#ORD-5542',
    product: 'iPhone 15 Pro',
    price: '5,499 ₪',
    statusKey: 'admin.completed',
    statusBg: 'bg-success-50/80 text-success-600',
    image: 'https://images.unsplash.com/photo-1695048133142-1a20484d2569?w=100&auto=format&fit=crop&q=80',
  },
  {
    id: '#ORD-5541',
    product: 'AirPods Max',
    price: '999 ₪',
    statusKey: 'admin.inProgress',
    statusBg: 'bg-warning-50/80 text-warning-600',
    image: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=100&auto=format&fit=crop&q=80',
  },
  {
    id: '#ORD-5540',
    product: 'Apple Watch Ultra 2',
    price: '1,850 ₪',
    statusKey: 'admin.completed',
    statusBg: 'bg-success-50/80 text-success-600',
    image: 'https://images.unsplash.com/photo-1579586337278-3befd40fd17a?w=100&auto=format&fit=crop&q=80',
  },
];

export function AdminDashboard() {
  const { t, locale } = useTranslation();
  const [timeFilter, setTimeFilter] = useState('month');

  // Localize month labels via the standard Intl API per the active locale.
  const formatMonth = (monthIndex) =>
    new Intl.DateTimeFormat(locale, { month: 'short' }).format(new Date(2026, monthIndex, 1));

  return (
    <div className="space-y-8 pb-16 text-start">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border-default pb-6">
        <div>
          <h1 className="text-3xl font-bold text-text-primary">{t('admin.overview')}</h1>
          <p className="text-xs text-text-secondary font-medium mt-1">
            {t('admin.welcomeSummary')}
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex items-center gap-3 px-4 py-2 rounded-2xl bg-background-secondary border border-border-default">
            <div className="w-8 h-8 rounded-full bg-interactive-primary/10 text-interactive-primary font-bold text-xs flex items-center justify-center">
              {t('admin.avatarInitial')}
            </div>
            <div className="text-xs">
              <p className="font-bold text-text-primary">{t('admin.superAdmin')}</p>
              <p className="text-[10px] text-text-secondary">admin@iphoneman.com</p>
            </div>
          </div>
        </div>
      </div>

      {/* 4 Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="p-6 rounded-2xl bg-background-secondary border border-border-default space-y-3 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="inline-flex items-center gap-1 text-xs font-bold text-success-600 bg-success-50 px-2.5 py-0.5 rounded-full">
              <ArrowUpRight className="w-3 h-3" /> +12%
            </span>
            <div className="w-10 h-10 rounded-xl bg-interactive-primary/10 text-interactive-primary flex items-center justify-center">
              <DollarSign className="w-5 h-5" />
            </div>
          </div>
          <div>
            <p className="text-xs font-bold text-text-secondary">{t('admin.totalSales')}</p>
            <p className="text-2xl font-bold text-text-primary mt-0.5"><bdi>45,230 ₪</bdi></p>
          </div>
        </div>

        <div className="p-6 rounded-2xl bg-background-secondary border border-border-default space-y-3 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="inline-flex items-center gap-1 text-xs font-bold text-success-600 bg-success-50 px-2.5 py-0.5 rounded-full">
              <ArrowUpRight className="w-3 h-3" /> +5%
            </span>
            <div className="w-10 h-10 rounded-xl bg-interactive-primary/10 text-interactive-primary flex items-center justify-center">
              <ShoppingBag className="w-5 h-5" />
            </div>
          </div>
          <div>
            <p className="text-xs font-bold text-text-secondary">{t('admin.newOrders')}</p>
            <p className="text-2xl font-bold text-text-primary mt-0.5"><bdi>128</bdi></p>
          </div>
        </div>

        <div className="p-6 rounded-2xl bg-background-secondary border border-border-default space-y-3 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="inline-flex items-center gap-1 text-xs font-bold text-error-500 bg-error-50 px-2.5 py-0.5 rounded-full">
              <ArrowDownRight className="w-3 h-3" /> -2%
            </span>
            <div className="w-10 h-10 rounded-xl bg-error-50 text-error-500 flex items-center justify-center">
              <Users className="w-5 h-5" />
            </div>
          </div>
          <div>
            <p className="text-xs font-bold text-text-secondary">{t('admin.activeVisitors')}</p>
            <p className="text-2xl font-bold text-text-primary mt-0.5"><bdi>1,042</bdi></p>
          </div>
        </div>

        <div className="p-6 rounded-2xl bg-background-secondary border border-border-default space-y-3 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="inline-flex text-xs font-bold text-text-secondary bg-background-primary px-2.5 py-0.5 rounded-full border border-border-default">
              {t('admin.stable')}
            </span>
            <div className="w-10 h-10 rounded-xl bg-interactive-primary/10 text-interactive-primary flex items-center justify-center">
              <Box className="w-5 h-5" />
            </div>
          </div>
          <div>
            <p className="text-xs font-bold text-text-secondary">{t('admin.availableProducts')}</p>
            <p className="text-2xl font-bold text-text-primary mt-0.5"><bdi>854</bdi></p>
          </div>
        </div>
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 p-6 rounded-2xl bg-background-secondary border border-border-default space-y-6 shadow-xs">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold text-text-primary">{t('admin.revenueAnalysis')}</h2>
            <div className="flex items-center gap-1 bg-background-primary p-1 rounded-xl border border-border-default text-xs font-bold">
              {['week', 'month', 'year'].map((filterKey) => (
                <button
                  key={filterKey}
                  onClick={() => setTimeFilter(filterKey)}
                  className={`px-3 py-1 rounded-lg transition-colors ${
                    timeFilter === filterKey ? 'bg-interactive-primary text-text-inverse' : 'text-text-secondary'
                  }`}
                >
                  {t(`admin.${filterKey}`)}
                </button>
              ))}
            </div>
          </div>

          <div className="h-64 flex items-end justify-between gap-4 pt-8 px-4">
            {[
              { monthIndex: 3, val: 35 },
              { monthIndex: 4, val: 75 },
              { monthIndex: 5, val: 50 },
              { monthIndex: 6, val: 85 },
              { monthIndex: 7, val: 60 },
              { monthIndex: 8, val: 65 },
              { monthIndex: 9, val: 30 },
            ].map((bar) => (
              <div key={bar.monthIndex} className="flex-1 flex flex-col items-center gap-2 h-full justify-end">
                <div
                  className="w-full rounded-t-xl bg-interactive-primary transition-all hover:opacity-90"
                  style={{ height: `${bar.val}%` }}
                />
                <span className="text-[11px] font-bold text-text-secondary">{formatMonth(bar.monthIndex)}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="p-6 rounded-2xl bg-background-secondary border border-border-default space-y-6 shadow-xs">
          <div className="flex items-center justify-between border-b border-border-default pb-3">
            <h2 className="text-lg font-bold text-text-primary">{t('admin.recentOrders')}</h2>
          </div>

          <div className="space-y-4">
            {RECENT_ORDERS.map((ord) => (
              <div key={ord.id} className="flex items-center justify-between p-3 rounded-xl bg-background-primary border border-border-default">
                <div className="flex items-center gap-3">
                  <img src={ord.image} alt={ord.product} className="w-10 h-10 object-cover rounded-lg" />
                  <div>
                    <h4 className="font-bold text-xs text-text-primary">{ord.product}</h4>
                    <span className="text-[10px] text-text-secondary font-mono">{ord.id}</span>
                  </div>
                </div>
                <div className="text-end space-y-1">
                  <p className="font-bold text-xs text-text-brand"><bdi>{ord.price}</bdi></p>
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full inline-block ${ord.statusBg}`}>
                    {t(ord.statusKey)}
                  </span>
                </div>
              </div>
            ))}
          </div>

          <Link to="/admin" className="block text-center text-xs font-bold text-text-brand hover:underline pt-2">
            {t('admin.viewAllOrders')}
          </Link>
        </div>
      </div>

      {/* Bottom Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <div className="p-6 rounded-2xl bg-background-secondary border border-border-default space-y-4 shadow-xs">
          <div className="flex items-center gap-2 text-warning-600 font-bold text-base border-b border-border-default pb-3">
            <AlertTriangle className="w-5 h-5 text-warning-600" />
            <span>{t('admin.inventoryAlerts')}</span>
          </div>

          <div className="space-y-3">
            <div className="p-3.5 rounded-xl bg-error-50 text-error-600 text-xs font-bold flex justify-between items-center">
              <span>MagSafe Fast Charger 20W</span>
              <span className="bg-error-500 text-white px-2.5 py-0.5 rounded-full">
                {t('admin.remainingOnly').replace('{count}', '5')}
              </span>
            </div>
            <div className="p-3.5 rounded-xl bg-background-primary border border-border-default text-xs font-bold text-text-primary flex justify-between items-center">
              <span>Clear MagSafe Case</span>
              <span className="text-text-secondary">
                {t('admin.remainingOnly').replace('{count}', '12')}
              </span>
            </div>
          </div>
        </div>

        <div className="p-6 rounded-2xl bg-background-secondary border border-border-default space-y-4 shadow-xs">
          <h2 className="text-base font-bold text-text-primary border-b border-border-default pb-3">
            {t('admin.topCategories')}
          </h2>
          <div className="space-y-4 text-xs font-bold">
            <div className="space-y-1.5">
              <div className="flex justify-between text-text-primary">
                <span>{t('nav.smartphones')}</span>
                <span>70%</span>
              </div>
              <div className="w-full bg-background-primary rounded-full h-2 overflow-hidden">
                <div className="bg-interactive-primary h-full rounded-full w-[70%]" />
              </div>
            </div>

            <div className="space-y-1.5">
              <div className="flex justify-between text-text-primary">
                <span>{t('nav.accessories')}</span>
                <span>20%</span>
              </div>
              <div className="w-full bg-background-primary rounded-full h-2 overflow-hidden">
                <div className="bg-interactive-primary/60 h-full rounded-full w-[20%]" />
              </div>
            </div>

            <div className="space-y-1.5">
              <div className="flex justify-between text-text-primary">
                <span>{t('nav.smartwatches')}</span>
                <span>10%</span>
              </div>
              <div className="w-full bg-background-primary rounded-full h-2 overflow-hidden">
                <div className="bg-text-secondary h-full rounded-full w-[10%]" />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default AdminDashboard;
