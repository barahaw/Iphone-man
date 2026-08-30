import { useState } from 'react';
import { ShoppingBag, Trash2, Plus, Minus, ArrowRight, Tag } from 'lucide-react';
import { useCartStore } from '../../../shared/stores/useCartStore';
import { useUiStore } from '../../../shared/stores/useUiStore';
import { useTranslation } from '../../../shared/i18n/useTranslation';
import { Drawer } from '../../../shared/components/ui/Drawer';
import { useNavigate } from 'react-router-dom';

export function CartDrawer() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const isCartOpen = useUiStore((state) => state.isCartOpen);
  const closeCart = useUiStore((state) => state.closeCart);

  const {
    items,
    updateQuantity,
    removeItem,
    getSubtotal,
    getDiscountAmount,
    getTotal,
    appliedCoupon,
    applyCoupon,
    removeCoupon,
  } = useCartStore();

  const [couponCode, setCouponCode] = useState('');
  const [couponError, setCouponError] = useState('');

  const handleApplyCoupon = (e) => {
    e.preventDefault();
    setCouponError('');
    if (!couponCode.trim()) return;

    if (couponCode.toUpperCase() === 'SAVE10') {
      applyCoupon({ code: 'SAVE10', discountPercent: 10 });
      setCouponCode('');
    } else if (couponCode.toUpperCase() === 'FREE20') {
      applyCoupon({ code: 'FREE20', discountFixed: 20 });
      setCouponCode('');
    } else {
      setCouponError(t('common.invalidCoupon'));
    }
  };

  const handleProceedToCheckout = () => {
    closeCart();
    navigate('/checkout');
  };

  return (
    <Drawer isOpen={isCartOpen} onClose={closeCart} title={t('common.viewCart')}>
      {items.length === 0 ? (
        <div className="flex flex-col items-center justify-center h-full space-y-4 py-12 text-center">
          <div className="w-14 h-14 rounded-full bg-background-secondary border border-border-default flex items-center justify-center text-text-secondary">
            <ShoppingBag className="w-7 h-7" strokeWidth={1.5} />
          </div>
          <div className="space-y-1">
            <p className="text-sm font-bold text-text-primary">{t('common.emptyCart')}</p>
            <p className="text-xs text-text-secondary">{t('common.emptyCartHint')}</p>
          </div>
          <button
            onClick={() => { closeCart(); navigate('/products'); }}
            className="btn-primary text-xs"
          >
            {t('common.startShopping')}
          </button>
        </div>
      ) : (
        <div className="flex flex-col h-full space-y-4">
          {/* Items List */}
          <div className="flex-1 overflow-y-auto space-y-3 pe-1">
            {items.map((item) => (
              <div
                key={`${item.id}-${item.variant}`}
                className="flex items-center gap-3 p-3.5 rounded-2xl bg-background-secondary border border-border-default"
              >
                <img
                  src={item.image}
                  alt={item.name}
                  className="w-12 h-12 object-cover rounded-xl bg-background-primary flex-shrink-0 border border-border-default"
                  width={48}
                  height={48}
                  loading="lazy"
                />
                <div className="flex-1 min-w-0 space-y-0.5">
                  <h4 className="font-bold text-xs text-text-primary truncate">{item.name}</h4>
                  <p className="text-[10px] text-text-secondary truncate">{item.variant}</p>
                  <p className="text-xs font-bold text-text-primary">
                    <bdi>{item.price.toLocaleString()} ₪</bdi>
                  </p>
                </div>
                <div className="flex flex-col items-end gap-1.5 flex-shrink-0">
                  <div className="flex items-center gap-0 bg-background-primary border border-border-default rounded-lg overflow-hidden">
                    <button
                      onClick={() => updateQuantity(item.id, item.variant, item.quantity - 1)}
                      className="w-7 h-7 flex items-center justify-center text-text-secondary hover:text-text-primary hover:bg-background-secondary transition-colors"
                      aria-label={t('common.decreaseQuantity')}
                    >
                      <Minus className="w-3 h-3" />
                    </button>
                    <span className="w-7 text-center text-xs font-bold text-text-primary">
                      <bdi>{item.quantity}</bdi>
                    </span>
                    <button
                      onClick={() => updateQuantity(item.id, item.variant, item.quantity + 1)}
                      className="w-7 h-7 flex items-center justify-center text-text-secondary hover:text-text-primary hover:bg-background-secondary transition-colors"
                      aria-label={t('common.increaseQuantity')}
                    >
                      <Plus className="w-3 h-3" />
                    </button>
                  </div>
                  <button
                    onClick={() => removeItem(item.id, item.variant)}
                    className="text-[10px] font-bold text-error-500 hover:underline transition-colors flex items-center gap-0.5"
                    aria-label={t('common.removeFromCart')}
                  >
                    <Trash2 className="w-3 h-3" />
                    {t('common.remove')}
                  </button>
                </div>
              </div>
            ))}
          </div>

          {/* Coupon */}
          <form onSubmit={handleApplyCoupon} className="space-y-2 pt-3 border-t border-border-default">
            <div className="flex gap-2">
              <div className="relative flex-1">
                <Tag className="w-3.5 h-3.5 absolute start-3 top-1/2 -translate-y-1/2 text-text-tertiary" />
                <input
                  type="text"
                  value={couponCode}
                  onChange={(e) => setCouponCode(e.target.value)}
                  placeholder={t('common.couponsSoon')}
                  disabled
                  aria-disabled="true"
                  className="w-full rounded-xl border border-border-default bg-background-primary ps-9 pe-3 py-2 text-xs uppercase font-mono text-text-tertiary placeholder:text-text-secondary/50 opacity-60 cursor-not-allowed focus:outline-none transition-colors"
                />
              </div>
              <button
                type="submit"
                disabled
                aria-disabled="true"
                className="px-4 py-2 text-xs font-bold text-text-tertiary border border-border-default rounded-xl opacity-60 cursor-not-allowed"
              >
                {t('common.apply')}
              </button>
            </div>
            <p className="text-[10px] text-text-secondary font-medium">{t('common.couponsSoon')}</p>
            {couponError && <p className="text-[10px] text-error-500 font-medium">{couponError}</p>}
            {appliedCoupon && (
              <div className="flex items-center justify-between text-xs bg-success-50 text-success-600 p-2.5 rounded-xl font-medium border border-success-500/20">
                <span>{t('common.couponApplied').replace('{code}', appliedCoupon.code)}</span>
                <button type="button" onClick={removeCoupon} className="underline font-bold">
                  {t('common.remove')}
                </button>
              </div>
            )}
          </form>

          {/* Summary */}
          <div className="space-y-2 pt-3 border-t border-border-default text-xs">
            <div className="flex justify-between text-text-secondary">
              <span>{t('common.subtotal')}</span>
              <span className="font-bold text-text-primary">
                <bdi>{getSubtotal().toLocaleString()} ₪</bdi>
              </span>
            </div>
            {getDiscountAmount() > 0 && (
              <div className="flex justify-between text-success-600 font-medium">
                <span>{t('common.discount')}</span>
                <span>-<bdi>{getDiscountAmount().toLocaleString()} ₪</bdi></span>
              </div>
            )}
            <div className="flex justify-between text-text-secondary">
              <span>{t('common.shipping')}</span>
              <span className="text-success-600 font-semibold">{t('common.shippingFree')}</span>
            </div>
            <div className="flex justify-between text-base font-bold text-text-primary pt-2 border-t border-border-default">
              <span>{t('common.total')}</span>
              <span>
                <bdi>{getTotal().toLocaleString()} ₪</bdi>
              </span>
            </div>

            <button
              onClick={handleProceedToCheckout}
              className="w-full mt-3 flex items-center justify-center gap-2 py-3.5 bg-interactive-primary text-text-inverse text-xs font-bold rounded-full hover:bg-interactive-primary-hover active:scale-[0.97] transition-all shadow-sm"
            >
              <span>{t('common.checkout')}</span>
              <ArrowRight className="w-4 h-4 rtl:rotate-180" />
            </button>
          </div>
        </div>
      )}
    </Drawer>
  );
}

export default CartDrawer;
