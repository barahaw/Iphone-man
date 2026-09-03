import { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import {
  ArrowLeft,
  Loader2,
  RefreshCw,
  ChevronRight,
  MapPin,
  Mail,
  Phone,
  Package,
} from 'lucide-react';
import { useTranslation } from '../../../shared/i18n/useTranslation';
import { useAdminStore } from '../../../shared/stores/useAdminStore';
import { useToastStore } from '../../../shared/stores/useToastStore';
import { fetchAdminOrder, updateOrderStatus } from '../../../shared/api/adminApi';

const ORDER_STATUS_COLORS = {
  pending: 'bg-warning-50 text-warning-600',
  processing: 'bg-blue-50 text-blue-600',
  shipped: 'bg-indigo-50 text-indigo-600',
  delivered: 'bg-success-50 text-success-600',
  cancelled: 'bg-error-50 text-error-500',
  refunded: 'bg-gray-100 text-gray-500',
};

const ORDER_STATUS_TRANSITIONS = {
  pending: ['processing', 'cancelled', 'refunded'],
  processing: ['shipped', 'cancelled', 'refunded'],
  shipped: ['delivered', 'refunded'],
  delivered: ['refunded'],
  cancelled: [],
  refunded: [],
};

export function AdminOrderDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { t, locale } = useTranslation();
  const { accessToken } = useAdminStore();
  const toast = useToastStore();

  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [updating, setUpdating] = useState(false);

  const load = () => {
    if (!accessToken || !id) return;
    setLoading(true);
    setError(null);
    fetchAdminOrder(accessToken, id)
      .then((json) => setOrder(json.data))
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    Promise.resolve().then(() => load());
  }, [accessToken, id]);

  const handleStatusChange = async (newStatus) => {
    if (!order || updating) return;
    setUpdating(true);
    try {
      const json = await updateOrderStatus(accessToken, order.id, newStatus);
      setOrder(json.data);
      toast.success(t('admin.orderStatusUpdated'));
    } catch (err) {
      toast.error(err.message || t('admin.orderStatusError'));
    } finally {
      setUpdating(false);
    }
  };

  const fmt = (n) =>
    new Intl.NumberFormat(locale, { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(n);

  const fmtDate = (d) =>
    new Intl.DateTimeFormat(locale, {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }).format(new Date(d));

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="w-6 h-6 text-text-brand animate-spin" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-4 text-start pb-16">
        <div className="p-4 rounded-xl bg-error-50 border border-error-200 text-error-600 text-sm font-medium">
          {error}
        </div>
        <button
          onClick={() => navigate('/admin/orders')}
          className="flex items-center gap-2 text-xs font-bold text-text-brand hover:underline"
        >
          <ArrowLeft className="w-4 h-4" />
          {t('admin.backToOrders')}
        </button>
      </div>
    );
  }

  if (!order) return null;

  const allowedTransitions = ORDER_STATUS_TRANSITIONS[order.status] || [];
  const shippingAddr = order.shipping_address || {};

  return (
    <div className="space-y-6 pb-16 text-start">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-xs font-bold text-text-secondary">
        <Link to="/admin/orders" className="hover:text-text-brand transition-colors">
          {t('admin.orders')}
        </Link>
        <ChevronRight className="w-3 h-3" />
        <span className="text-text-primary">#{order.id}</span>
      </div>

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border-default pb-6">
        <div>
          <h1 className="text-3xl font-bold text-text-primary">
            {t('admin.orderNumber').replace('{id}', order.id)}
          </h1>
          <p className="text-xs text-text-secondary font-medium mt-1">
            {fmtDate(order.created_at)}
          </p>
        </div>
        <div className="flex items-center gap-3">
          <span
            className={`px-3 py-1 rounded-full text-xs font-bold ${ORDER_STATUS_COLORS[order.status] || 'bg-background-primary text-text-secondary'}`}
          >
            {t(`admin.status.${order.status}`)}
          </span>
          <button
            onClick={load}
            disabled={loading}
            className="flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold text-text-secondary border border-border-default hover:bg-background-secondary transition-colors disabled:opacity-50"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            {t('admin.refresh')}
          </button>
        </div>
      </div>

      {/* Status Update */}
      {allowedTransitions.length > 0 && (
        <div className="p-5 rounded-2xl bg-background-secondary border border-border-default space-y-3">
          <h3 className="text-sm font-bold text-text-primary">{t('admin.updateStatus')}</h3>
          <div className="flex items-center gap-2 flex-wrap">
            {allowedTransitions.map((s) => (
              <button
                key={s}
                onClick={() => handleStatusChange(s)}
                disabled={updating}
                className="px-4 py-2 rounded-xl text-xs font-bold border border-border-default bg-background-primary text-text-secondary hover:text-text-primary hover:border-interactive-primary/40 transition-colors disabled:opacity-50"
              >
                {t(`admin.status.${s}`)}
              </button>
            ))}
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Order Items */}
        <div className="lg:col-span-2 space-y-6">
          <div className="p-6 rounded-2xl bg-background-secondary border border-border-default space-y-4">
            <h3 className="text-sm font-bold text-text-primary border-b border-border-default pb-3">
              {t('admin.orderItems')}
            </h3>
            {order.items && order.items.length > 0 ? (
              <div className="space-y-3">
                {order.items.map((item) => (
                  <div
                    key={item.id}
                    className="flex items-center justify-between p-3 rounded-xl bg-background-primary border border-border-default"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-10 h-10 rounded-xl bg-background-secondary flex items-center justify-center shrink-0">
                        <Package className="w-5 h-5 text-text-tertiary" />
                      </div>
                      <div className="min-w-0">
                        <p className="text-xs font-bold text-text-primary truncate">
                          {t('admin.productLabel')} #{item.product_id}
                        </p>
                        {item.variant_id && (
                          <p className="text-[10px] text-text-secondary">
                            {t('admin.variantLabel')}: #{item.variant_id}
                          </p>
                        )}
                      </div>
                    </div>
                    <div className="text-end shrink-0">
                      <p className="text-xs font-bold text-text-primary">
                        {item.quantity} × <bdi>{fmt(item.unit_price)} ₪</bdi>
                      </p>
                      <p className="text-[10px] text-text-secondary">
                        {t('admin.subtotalLabel')}: <bdi>{fmt(item.quantity * item.unit_price)} ₪</bdi>
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-xs text-text-secondary text-center py-4">{t('admin.noItems')}</p>
            )}
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Totals */}
          <div className="p-6 rounded-2xl bg-background-secondary border border-border-default space-y-3">
            <h3 className="text-sm font-bold text-text-primary border-b border-border-default pb-3">
              {t('admin.orderSummary')}
            </h3>
            <div className="space-y-2 text-xs font-bold">
              <div className="flex justify-between text-text-secondary">
                <span>{t('admin.subtotalLabel')}</span>
                <bdi>{fmt(order.subtotal)} ₪</bdi>
              </div>
              {order.discount > 0 && (
                <div className="flex justify-between text-success-600">
                  <span>{t('admin.discountLabel')}</span>
                  <bdi>-{fmt(order.discount)} ₪</bdi>
                </div>
              )}
              <div className="flex justify-between text-text-secondary">
                <span>{t('admin.shippingLabel')}</span>
                <bdi>{fmt(order.shipping_fee)} ₪</bdi>
              </div>
              <div className="flex justify-between text-text-secondary">
                <span>{t('admin.taxLabel')}</span>
                <bdi>{fmt(order.tax)} ₪</bdi>
              </div>
              {order.coupon_code && (
                <div className="flex justify-between text-text-brand">
                  <span>{t('admin.couponLabel')}</span>
                  <span>{order.coupon_code}</span>
                </div>
              )}
              <div className="flex justify-between text-text-primary text-sm pt-2 border-t border-border-default">
                <span>{t('admin.totalLabel')}</span>
                <bdi>{fmt(order.total)} ₪</bdi>
              </div>
            </div>
          </div>

          {/* Customer Info */}
          <div className="p-6 rounded-2xl bg-background-secondary border border-border-default space-y-3">
            <h3 className="text-sm font-bold text-text-primary border-b border-border-default pb-3">
              {t('admin.customerInfo')}
            </h3>
            <div className="space-y-2.5 text-xs font-bold">
              <div className="flex items-center gap-2 text-text-primary">
                <Mail className="w-3.5 h-3.5 text-text-tertiary shrink-0" />
                <span className="truncate">{order.customer_name}</span>
              </div>
              <div className="flex items-center gap-2 text-text-secondary">
                <Mail className="w-3.5 h-3.5 text-text-tertiary shrink-0" />
                <span className="truncate">{order.customer_email}</span>
              </div>
              {order.customer_phone && (
                <div className="flex items-center gap-2 text-text-secondary">
                  <Phone className="w-3.5 h-3.5 text-text-tertiary shrink-0" />
                  <span>{order.customer_phone}</span>
                </div>
              )}
            </div>
          </div>

          {/* Shipping Address */}
          {shippingAddr && Object.keys(shippingAddr).length > 0 && (
            <div className="p-6 rounded-2xl bg-background-secondary border border-border-default space-y-3">
              <h3 className="text-sm font-bold text-text-primary border-b border-border-default pb-3 flex items-center gap-2">
                <MapPin className="w-4 h-4 text-text-brand" />
                {t('admin.shippingAddress')}
              </h3>
              <div className="text-xs font-bold text-text-secondary space-y-1">
                {shippingAddr.fullName && <p className="text-text-primary">{shippingAddr.fullName}</p>}
                {shippingAddr.address && <p>{shippingAddr.address}</p>}
                {shippingAddr.city && <p>{shippingAddr.city}</p>}
                {shippingAddr.country && <p>{shippingAddr.country}</p>}
                {shippingAddr.phone && <p>{shippingAddr.phone}</p>}
                {shippingAddr.notes && (
                  <p className="text-text-tertiary italic mt-2">{shippingAddr.notes}</p>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default AdminOrderDetail;
