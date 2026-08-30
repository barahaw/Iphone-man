import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Check, CreditCard, Truck } from 'lucide-react';
import { useCheckoutStore } from '../../../shared/stores/useCheckoutStore';
import { useCartStore } from '../../../shared/stores/useCartStore';
import { useTranslation } from '../../../shared/i18n/useTranslation';
import { useToastStore } from '../../../shared/stores/useToastStore';

export function CheckoutWizard() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const toast = useToastStore();

  const {
    step,
    setStep,
    shipping,
    updateShipping,
    paymentMethod,
    setPaymentMethod,
    orderResult,
    completeCheckout,
    resetCheckout,
  } = useCheckoutStore();

  const { items, getSubtotal, getDiscountAmount, getTotal, clearCart } = useCartStore();

  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const validateShipping = () => {
    const newErrors = {};
    if (!shipping.fullName?.trim()) newErrors.fullName = t('checkout.requiredField');
    if (!shipping.email?.trim()) newErrors.email = t('checkout.requiredField');
    if (!shipping.address?.trim()) newErrors.address = t('checkout.requiredField');
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleShippingSubmit = (e) => {
    e.preventDefault();
    if (validateShipping()) {
      setStep(2);
    }
  };

  const handlePlaceOrder = async (e) => {
    e.preventDefault();
    if (isSubmitting) return;

    for (const item of items) {
      const numericId = Number(item.id);
      if (!(Number.isInteger(numericId) && numericId > 0) && !item.slug) {
        toast.error(t('checkout.orderInvalidItemError'));
        return;
      }
    }

    setIsSubmitting(true);

    // Items sourced from the embedded fallback catalog have string ids (p1…p17)
    // with no matching backend row. Stay fully client-side in that case instead
    // of sending NaN to the API (§7 / §30 offline fallback).
    const canReachBackend = items.every((item) => {
      const numericId = Number(item.id);
      return Number.isInteger(numericId) && numericId > 0;
    });

    if (!canReachBackend) {
      completeCheckout({
        id: `DEMO-${Date.now()}`,
        customerName: shipping.fullName,
        customerEmail: shipping.email,
        total: getTotal(),
        date: new Date().toLocaleDateString(),
        itemsCount: items.length,
      });
      clearCart();
      toast.success(t('checkout.orderSuccess'));
      setIsSubmitting(false);
      return;
    }

    const orderItems = items.map((item) => ({
      productId: Number(item.id),
      quantity: item.quantity,
    }));

    try {
      const res = await fetch('/api/v1/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          customerName: shipping.fullName,
          customerEmail: shipping.email,
          customerPhone: shipping.phone,
          shippingAddress: {
            address: shipping.address,
            city: shipping.city,
            country: shipping.country,
          },
          items: orderItems,
        }),
      });

      const json = await res.json().catch(() => null);

      if (res.ok) {
        const order = json?.data;
        if (!order?.id) throw new Error('Invalid checkout response');
        completeCheckout({
          id: order.id,
          customerName: shipping.fullName,
          customerEmail: shipping.email,
          total: Number(order.total),
          date: new Date().toLocaleDateString(),
          itemsCount: items.length,
        });
        clearCart();
        toast.success(t('checkout.orderSuccess'));
        return;
      }

      const code = json?.error?.code;
      if (res.status === 404 && code === 'PRODUCT_NOT_FOUND') {
        toast.error(t('checkout.productNotFoundError'));
      } else if (res.status === 409 && code === 'INSUFFICIENT_STOCK') {
        toast.error(t('checkout.insufficientStockError'));
      } else {
        toast.error(t('checkout.orderError'));
      }
    } catch {
      toast.error(t('checkout.orderError'));
    } finally {
      setIsSubmitting(false);
    }
  };

  const updateField = (field, value) => {
    updateShipping({ [field]: value });
    if (errors[field]) {
      setErrors((prev) => {
        const next = { ...prev };
        delete next[field];
        return next;
      });
    }
  };

  if (items.length === 0 && step !== 3) {
    return (
      <div className="py-20 text-center space-y-4">
        <div className="w-16 h-16 rounded-full bg-background-secondary flex items-center justify-center text-text-secondary mx-auto">
          <CreditCard className="w-8 h-8" strokeWidth={1.5} />
        </div>
        <h2 className="text-lg font-bold text-text-primary">{t('common.emptyCart')}</h2>
        <p className="text-xs text-text-secondary">{t('common.emptyCartHint')}</p>
        <button
          onClick={() => navigate('/products')}
          className="px-5 py-2.5 bg-interactive-primary text-white text-xs font-bold rounded-xl hover:bg-interactive-primary-hover transition-colors"
        >
          {t('common.continueShopping')}
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-8 pb-16 text-start">
      {/* Progress Steps */}
      <div className="flex items-center justify-between" role="navigation" aria-label={t('checkout.stepsAria')}>
        {[
          { num: 1, label: t('checkout.step1'), active: step >= 1, done: step > 1 },
          { num: 2, label: t('checkout.step2'), active: step >= 2, done: step > 2 },
          { num: 3, label: t('checkout.step3'), active: step >= 3, done: false },
        ].map((s, idx) => (
          <React.Fragment key={s.num}>
            <div className="flex items-center gap-2">
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-all ${
                  s.done ? 'bg-success-500 text-white' : s.active ? 'bg-interactive-primary text-white' : 'bg-background-secondary text-text-secondary border border-border-default'
                }`}
                aria-current={step === s.num ? 'step' : undefined}
              >
                {s.done ? <Check className="w-4 h-4" /> : s.num}
              </div>
              <span className={`text-xs font-bold hidden sm:block ${s.active ? 'text-text-primary' : 'text-text-secondary'}`}>
                {s.label}
              </span>
            </div>
            {idx < 2 && (
              <div className={`h-0.5 flex-1 mx-3 ${step > s.num ? 'bg-success-500' : 'bg-border-default'}`} />
            )}
          </React.Fragment>
        ))}
      </div>

      {/* STEP 1: Shipping */}
      {step === 1 && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <form onSubmit={handleShippingSubmit} className="md:col-span-2 space-y-4">
            <div className="space-y-1">
              <h2 className="text-lg font-bold text-text-primary">{t('checkout.step1')}</h2>
              <p className="text-xs text-text-secondary">{t('checkout.guestHint')}</p>
            </div>

            <div className="space-y-4">
              <CheckoutField
                label={t('checkout.fullName') + ' *'}
                value={shipping.fullName}
                onChange={(v) => updateField('fullName', v)}
                placeholder={t('checkout.fullNamePlaceholder')}
                error={errors.fullName}
              />
              <CheckoutField
                label={t('checkout.email') + ' *'}
                type="email"
                value={shipping.email}
                onChange={(v) => updateField('email', v)}
                placeholder="email@example.com"
                error={errors.email}
              />
              <CheckoutField
                label={t('checkout.phone')}
                type="tel"
                value={shipping.phone}
                onChange={(v) => updateField('phone', v)}
                placeholder={t('checkout.phonePlaceholder')}
              />
              <CheckoutField
                label={t('checkout.address') + ' *'}
                value={shipping.address}
                onChange={(v) => updateField('address', v)}
                placeholder={t('checkout.addressPlaceholder')}
                error={errors.address}
              />
              <div className="grid grid-cols-2 gap-3">
                <CheckoutField
                  label={t('checkout.city')}
                  value={shipping.city}
                  onChange={(v) => updateField('city', v)}
                  placeholder={t('checkout.cityPlaceholder')}
                />
                <div className="space-y-1.5">
                  <label className="block text-[11px] font-bold text-text-primary uppercase tracking-wider">
                    {t('checkout.country')}
                  </label>
                  <select
                    value={shipping.country}
                    onChange={(e) => updateField('country', e.target.value)}
                    className="w-full rounded-xl border border-border-default bg-background-primary px-4 py-3 text-sm text-text-primary focus:outline-none focus:border-interactive-primary/40 focus:ring-1 focus:ring-interactive-primary/20 transition-all"
                  >
                    <option value="PS">{t('checkout.countryPs')}</option>
                    <option value="JO">{t('checkout.countryJo')}</option>
                    <option value="IL">{t('checkout.countryIl')}</option>
                  </select>
                </div>
              </div>
            </div>

            <button
              type="submit"
              className="w-full flex items-center justify-center gap-2 py-3.5 bg-interactive-primary text-white text-sm font-bold rounded-xl hover:bg-interactive-primary-hover transition-colors mt-4"
            >
              <span>{t('checkout.continueToPayment')}</span>
              <ArrowLeftIcon className="w-4 h-4 rtl:rotate-0 ltr:rotate-180" />
            </button>
          </form>

          {/* Order Summary */}
          <OrderSummary items={items} getSubtotal={getSubtotal} getDiscountAmount={getDiscountAmount} getTotal={getTotal} t={t} />
        </div>
      )}

      {/* STEP 2: Payment */}
      {step === 2 && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <form onSubmit={handlePlaceOrder} className="md:col-span-2 space-y-5">
            <h2 className="text-lg font-bold text-text-primary">{t('checkout.step2')}</h2>

            <div className="space-y-2.5">
              {[
                { key: 'cod', icon: Truck, iconColor: 'text-success-600', title: t('checkout.payCod'), hint: t('checkout.payCodHint') },
              ].map((method) => (
                <button
                  key={method.key}
                  type="button"
                  onClick={() => setPaymentMethod(method.key)}
                  className={`w-full flex items-center gap-4 p-4 rounded-xl border text-start transition-all ${
                    paymentMethod === method.key
                      ? 'border-interactive-primary bg-blue-500/5'
                      : 'border-border-default bg-background-secondary hover:border-interactive-primary/30'
                  }`}
                >
                  <method.icon className={`w-5 h-5 ${method.iconColor}`} strokeWidth={1.5} />
                  <div className="flex-1">
                    <h4 className="font-bold text-sm text-text-primary">{method.title}</h4>
                    <p className="text-[11px] text-text-secondary">{method.hint}</p>
                  </div>
                  <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                    paymentMethod === method.key ? 'border-interactive-primary' : 'border-border-default'
                  }`}>
                    {paymentMethod === method.key && (
                      <div className="w-2.5 h-2.5 rounded-full bg-interactive-primary" />
                    )}
                  </div>
                </button>
              ))}
            </div>

            <div className="flex gap-3 pt-2">
              <button
                type="button"
                onClick={() => setStep(1)}
                className="px-5 py-3 text-sm font-bold text-text-primary border border-border-default rounded-xl hover:bg-background-tertiary transition-colors"
              >
                {t('checkout.back')}
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="flex-1 flex items-center justify-center gap-2 py-3.5 bg-interactive-primary text-white text-sm font-bold rounded-xl hover:bg-interactive-primary-hover transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
              >
                {isSubmitting ? (
                  <>
                    <span className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" aria-hidden="true" />
                    {t('checkout.placeOrderSubmitting')}
                  </>
                ) : (
                  <>
                    {t('checkout.placeOrder')} (<bdi>{getTotal().toLocaleString()} ₪</bdi>)
                  </>
                )}
              </button>
            </div>
          </form>

          <OrderSummary items={items} getSubtotal={getSubtotal} getDiscountAmount={getDiscountAmount} getTotal={getTotal} t={t} />
        </div>
      )}

      {/* STEP 3: Confirmation */}
      {step === 3 && orderResult && (
        <div className="p-8 md:p-12 rounded-xl bg-background-secondary border border-border-default text-center space-y-5 max-w-lg mx-auto">
          <div className="w-16 h-16 rounded-full bg-success-500 text-white flex items-center justify-center mx-auto shadow-sm">
            <Check className="w-8 h-8" />
          </div>
          <div className="space-y-1.5">
            <h2 className="text-xl font-black text-text-primary">{t('checkout.orderSuccess')}</h2>
            <p className="text-xs text-text-secondary">
              {t('checkout.orderSuccessHint')} — <span className="font-bold text-text-primary">{shipping.email}</span>
            </p>
          </div>

          <p className="text-xs text-text-secondary">
            {t('checkout.contactLine').replace('{phone}', '+970 123 346 789')}
          </p>

          <div className="p-4 rounded-xl bg-background-primary border border-border-default text-start space-y-2 text-xs">
            <div className="flex justify-between">
              <span className="text-text-secondary">{t('checkout.orderNumber')}:</span>
              <span className="font-bold text-text-brand">{orderResult.id}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-text-secondary">{t('checkout.fullName')}:</span>
              <span className="font-semibold text-text-primary">{orderResult.customerName}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-text-secondary">{t('common.total')}:</span>
              <span className="font-bold text-text-primary"><bdi>{orderResult.total.toLocaleString()} ₪</bdi></span>
            </div>
            <div className="flex justify-between pt-2 border-t border-border-default">
              <span className="text-text-secondary">{t('common.freeShipping')}:</span>
              <span className="font-semibold text-success-600">{t('checkout.deliveryEstimate')}</span>
            </div>
          </div>

          <button
            onClick={() => { resetCheckout(); navigate('/'); }}
            className="w-full py-3.5 bg-interactive-primary text-white text-sm font-bold rounded-xl hover:bg-interactive-primary-hover transition-colors"
          >
            {t('common.continueShopping')}
          </button>
        </div>
      )}
    </div>
  );
}

function CheckoutField({ label, type = 'text', value, onChange, placeholder, error }) {
  return (
    <div className="space-y-1.5">
      <label className="block text-[11px] font-bold text-text-primary uppercase tracking-wider">{label}</label>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className={`w-full rounded-xl border bg-background-primary px-4 py-3 text-sm text-text-primary placeholder:text-text-secondary/50 focus:outline-none transition-all ${
          error
            ? 'border-error-500 focus:border-error-500 focus:ring-1 focus:ring-error-500/20'
            : 'border-border-default focus:border-interactive-primary/40 focus:ring-1 focus:ring-interactive-primary/20'
        }`}
      />
      {error && <p className="text-[11px] text-error-500 font-medium">{error}</p>}
    </div>
  );
}

function OrderSummary({ items, getSubtotal, getDiscountAmount, getTotal, t }) {
  return (
    <div className="p-5 rounded-xl bg-background-secondary border border-border-default space-y-3 h-fit sticky top-28">
      <h3 className="font-bold text-sm text-text-primary">{t('common.allProducts')} — {t('checkout.summaryTitle')}</h3>
      <div className="space-y-2.5 divide-y divide-border-default text-xs">
        {items.map((item) => (
          <div key={`${item.id}-${item.variant}`} className="pt-2 first:pt-0 flex justify-between">
            <div className="min-w-0 flex-1">
              <p className="font-bold text-text-primary truncate">{item.name}</p>
              <p className="text-text-secondary">{item.variant} × {item.quantity}</p>
            </div>
            <span className="font-bold text-text-primary ms-3 flex-shrink-0">
              <bdi>{(item.price * item.quantity).toLocaleString()} ₪</bdi>
            </span>
          </div>
        ))}
      </div>
      <div className="pt-3 border-t border-border-default space-y-2 text-xs">
        <div className="flex justify-between text-text-secondary">
          <span>{t('common.subtotal')}</span>
          <span className="font-semibold text-text-primary"><bdi>{getSubtotal().toLocaleString()} ₪</bdi></span>
        </div>
        {getDiscountAmount() > 0 && (
          <div className="flex justify-between text-success-600 font-medium">
            <span>{t('common.discount')}</span>
            <span>-<bdi>{getDiscountAmount().toLocaleString()} ₪</bdi></span>
          </div>
        )}
        <div className="flex justify-between text-base font-black text-text-primary pt-2 border-t border-border-default">
          <span>{t('common.total')}</span>
          <span className="text-text-primary"><bdi>{getTotal().toLocaleString()} ₪</bdi></span>
        </div>
      </div>
    </div>
  );
}

function ArrowLeftIcon({ className }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M19 12H5" />
      <path d="m12 19-7-7 7-7" />
    </svg>
  );
}