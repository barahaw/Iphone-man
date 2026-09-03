import { useEffect, useState } from 'react';
import { Loader2, RefreshCw, Plus, Trash2, Edit3, X } from 'lucide-react';
import { Button } from '../../../shared/components/ui/Button';
import { useTranslation } from '../../../shared/i18n/useTranslation';
import { useAdminStore } from '../../../shared/stores/useAdminStore';
import { useToastStore } from '../../../shared/stores/useToastStore';
import { fetchCoupons, createCoupon, updateCoupon, deleteCoupon } from '../../../shared/api/adminApi';

const inputClass =
  'w-full rounded-xl border border-border-default bg-background-primary px-4 py-2.5 text-xs text-text-primary placeholder:text-text-tertiary focus:outline-none focus:ring-1 focus:ring-interactive-primary';

export function AdminCoupons() {
  const { t, locale } = useTranslation();
  const { accessToken, admin } = useAdminStore();
  const toast = useToastStore();

  const [coupons, setCoupons] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState(null);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(null);

  // Form state
  const [code, setCode] = useState('');
  const [discountType, setDiscountType] = useState('percentage');
  const [discountValue, setDiscountValue] = useState('');
  const [minOrderValue, setMinOrderValue] = useState('');
  const [expiresAt, setExpiresAt] = useState('');
  const [usageLimit, setUsageLimit] = useState('');

  const load = () => {
    if (!accessToken) return;
    setLoading(true);
    setError(null);
    fetchCoupons(accessToken)
      .then((json) => {
        const data = Array.isArray(json?.data) ? json.data : [];
        setCoupons(data);
      })
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    Promise.resolve().then(() => load());
  }, [accessToken]);

  const resetForm = () => {
    setCode('');
    setDiscountType('percentage');
    setDiscountValue('');
    setMinOrderValue('');
    setExpiresAt('');
    setUsageLimit('');
    setEditing(null);
  };

  const startCreate = () => {
    resetForm();
    setShowForm(true);
  };

  const startEdit = (c) => {
    setEditing(c);
    setCode(c.code);
    setDiscountType(c.discount_type);
    setDiscountValue(String(c.discount_value));
    setMinOrderValue(String(c.min_order_value));
    setExpiresAt(c.expires_at ? c.expires_at.slice(0, 10) : '');
    setUsageLimit(c.usage_limit != null ? String(c.usage_limit) : '');
    setShowForm(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!code.trim() || !discountValue) {
      toast.error(t('admin.couponRequiredFields'));
      return;
    }
    setSaving(true);
    try {
      const payload = {
        code: code.trim().toUpperCase(),
        discountType,
        discountValue: Number(discountValue),
        minOrderValue: minOrderValue ? Number(minOrderValue) : undefined,
        expiresAt: expiresAt ? new Date(expiresAt).toISOString() : undefined,
        usageLimit: usageLimit ? Number(usageLimit) : undefined,
      };
      if (editing) {
        await updateCoupon(accessToken, editing.id, payload);
        toast.success(t('admin.couponUpdated'));
      } else {
        await createCoupon(accessToken, payload);
        toast.success(t('admin.couponCreated'));
      }
      setShowForm(false);
      resetForm();
      load();
    } catch (err) {
      toast.error(err.message || t('admin.couponSaveError'));
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (c) => {
    if (!window.confirm(t('admin.deleteCouponConfirm').replace('{code}', c.code))) return;
    setDeleting(c.id);
    try {
      await deleteCoupon(accessToken, c.id);
      toast.success(t('admin.couponDeleted'));
      load();
    } catch (err) {
      toast.error(err.message || t('admin.deleteCouponError'));
    } finally {
      setDeleting(null);
    }
  };

  const fmt = (n) =>
    new Intl.NumberFormat(locale, { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(n);

  const fmtDate = (d) => {
    if (!d) return '—';
    return new Intl.DateTimeFormat(locale, { day: 'numeric', month: 'short', year: 'numeric' }).format(new Date(d));
  };

  const isExpired = (c) => c.expires_at && new Date(c.expires_at) < new Date();
  const isExhausted = (c) => c.usage_limit != null && c.times_used >= c.usage_limit;

  return (
    <div className="space-y-6 pb-16 text-start">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border-default pb-6">
        <div>
          <h1 className="text-3xl font-bold text-text-primary">{t('admin.coupons')}</h1>
          <p className="text-xs text-text-secondary font-medium mt-1">
            {t('admin.couponsSubtitle')}
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={load}
            disabled={loading}
            className="flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold text-text-secondary border border-border-default hover:bg-background-secondary transition-colors disabled:opacity-50"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            {t('admin.refresh')}
          </button>
          {!showForm && (
            <button
              onClick={startCreate}
              className="flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold text-text-inverse bg-interactive-primary hover:opacity-90 transition-colors"
            >
              <Plus className="w-3.5 h-3.5" />
              {t('admin.addCoupon')}
            </button>
          )}
        </div>
      </div>

      {error && (
        <div className="p-4 rounded-xl bg-error-50 border border-error-200 text-error-600 text-sm font-medium">
          {error}
        </div>
      )}

      {/* Create / Edit Form */}
      {showForm && (
        <form
          onSubmit={handleSubmit}
          className="p-6 rounded-3xl bg-background-secondary border border-border-default space-y-4 shadow-sm"
        >
          <div className="flex items-center justify-between border-b border-border-default pb-3">
            <h2 className="text-base font-bold text-text-primary">
              {editing ? t('admin.editCoupon') : t('admin.addCoupon')}
            </h2>
            <button
              type="button"
              onClick={() => { setShowForm(false); resetForm(); }}
              className="p-2 rounded-xl text-text-secondary hover:text-error-500 hover:bg-error-50 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-text-primary mb-1.5">{t('admin.couponCodeLabel')}</label>
              <input type="text" value={code} onChange={(e) => setCode(e.target.value)} placeholder="SAVE10" className={`${inputClass} font-mono uppercase`} />
            </div>
            <div>
              <label className="block text-xs font-bold text-text-primary mb-1.5">{t('admin.discountTypeLabel')}</label>
              <select value={discountType} onChange={(e) => setDiscountType(e.target.value)} className={inputClass}>
                <option value="percentage">% ({t('admin.percentage')})</option>
                <option value="fixed">₪ ({t('admin.fixedAmount')})</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-bold text-text-primary mb-1.5">{t('admin.discountValueLabel')}</label>
              <input type="number" value={discountValue} onChange={(e) => setDiscountValue(e.target.value)} className={inputClass} />
            </div>
            <div>
              <label className="block text-xs font-bold text-text-primary mb-1.5">{t('admin.minOrderLabel')}</label>
              <input type="number" value={minOrderValue} onChange={(e) => setMinOrderValue(e.target.value)} placeholder="0" className={inputClass} />
            </div>
            <div>
              <label className="block text-xs font-bold text-text-primary mb-1.5">{t('admin.expiresAtLabel')}</label>
              <input type="date" value={expiresAt} onChange={(e) => setExpiresAt(e.target.value)} className={inputClass} />
            </div>
            <div>
              <label className="block text-xs font-bold text-text-primary mb-1.5">{t('admin.usageLimitLabel')}</label>
              <input type="number" value={usageLimit} onChange={(e) => setUsageLimit(e.target.value)} placeholder={t('admin.unlimited')} className={inputClass} />
            </div>
          </div>

          <div className="flex items-center gap-3">
            <Button type="submit" variant="primary" size="sm" disabled={saving}>
              {saving ? (
                <Loader2 className="w-4 h-4 me-1 animate-spin" />
              ) : (
                <Plus className="w-4 h-4 me-1" />
              )}
              {editing ? t('admin.saveChanges') : t('admin.createCoupon')}
            </Button>
            <Button variant="outline" size="sm" onClick={() => { setShowForm(false); resetForm(); }} type="button">
              {t('common.close')}
            </Button>
          </div>
        </form>
      )}

      {/* Table */}
      <div className="rounded-2xl bg-background-secondary border border-border-default overflow-hidden shadow-xs">
        {loading ? (
          <div className="flex items-center justify-center py-16">
            <Loader2 className="w-6 h-6 text-text-brand animate-spin" />
          </div>
        ) : coupons.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 gap-2">
            <p className="text-sm font-bold text-text-secondary">{t('admin.noCoupons')}</p>
            <p className="text-xs text-text-tertiary">{t('admin.noCouponsHint')}</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className="border-b border-border-default bg-background-primary">
                  <th className="px-4 py-3 text-start font-bold text-text-secondary">{t('admin.couponCodeLabel')}</th>
                  <th className="px-4 py-3 text-start font-bold text-text-secondary">{t('admin.discountLabel')}</th>
                  <th className="px-4 py-3 text-start font-bold text-text-secondary">{t('admin.minOrderLabel')}</th>
                  <th className="px-4 py-3 text-start font-bold text-text-secondary">{t('admin.usageLabel')}</th>
                  <th className="px-4 py-3 text-start font-bold text-text-secondary">{t('admin.expiresAtLabel')}</th>
                  <th className="px-4 py-3 text-end font-bold text-text-secondary">{t('admin.actionsCol')}</th>
                </tr>
              </thead>
              <tbody>
                {coupons.map((c) => {
                  const expired = isExpired(c);
                  const exhausted = isExhausted(c);
                  return (
                    <tr
                      key={c.id}
                      className={`border-b border-border-default last:border-0 hover:bg-background-primary transition-colors ${expired || exhausted ? 'opacity-60' : ''}`}
                    >
                      <td className="px-4 py-3">
                        <span className="font-mono font-bold text-text-brand">{c.code}</span>
                        {(expired || exhausted) && (
                          <span className="ms-2 px-2 py-0.5 rounded-full text-[10px] font-bold bg-warning-50 text-warning-600">
                            {expired ? t('admin.expired') : t('admin.exhausted')}
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-3 font-bold text-text-primary">
                        {c.discount_type === 'percentage' ? `${Number(c.discount_value)}%` : <bdi>{fmt(Number(c.discount_value))} ₪</bdi>}
                      </td>
                      <td className="px-4 py-3 text-text-secondary">
                        <bdi>{fmt(Number(c.min_order_value))} ₪</bdi>
                      </td>
                      <td className="px-4 py-3 text-text-secondary">
                        {c.usage_limit != null ? `${c.times_used}/${c.usage_limit}` : c.times_used}
                      </td>
                      <td className="px-4 py-3 text-text-secondary">{fmtDate(c.expires_at)}</td>
                      <td className="px-4 py-3">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => startEdit(c)}
                            className="p-2 rounded-xl text-text-secondary hover:text-text-brand hover:bg-interactive-primary/10 transition-colors"
                          >
                            <Edit3 className="w-4 h-4" />
                          </button>
                          {admin?.role === 'super_admin' && (
                            <button
                              onClick={() => handleDelete(c)}
                              disabled={deleting === c.id}
                              className="p-2 rounded-xl text-text-secondary hover:text-error-500 hover:bg-error-50 transition-colors disabled:opacity-50"
                            >
                              {deleting === c.id ? (
                                <Loader2 className="w-4 h-4 animate-spin" />
                              ) : (
                                <Trash2 className="w-4 h-4" />
                              )}
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

export default AdminCoupons;
