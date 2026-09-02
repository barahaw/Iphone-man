import { Link } from 'react-router-dom';
import { Heart, ShoppingBag, Trash2, ArrowRight, X } from 'lucide-react';
import { useWishlistStore } from '../../../shared/stores/useWishlistStore';
import { useCartStore } from '../../../shared/stores/useCartStore';
import { useToastStore } from '../../../shared/stores/useToastStore';
import { useTranslation } from '../../../shared/i18n/useTranslation';
import { formatPrice } from '../../../shared/utils/format';

export function WishlistPage() {
  const { t, locale } = useTranslation();
  const { items, toggleWishlist, clearWishlist } = useWishlistStore();
  const addItem = useCartStore((state) => state.addItem);
  const toast = useToastStore();

  const handleMoveToCart = (product) => {
    addItem(product, product.variant || 'Standard', 1);
    toggleWishlist(product);
    toast.success(t('common.addedToCart'));
  };

  const handleRemove = (product) => {
    toggleWishlist(product);
    toast.info(t('common.removedFromWishlist'));
  };

  return (
    <div className="space-y-6 pb-16 text-start">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-border-default pb-4">
        <div>
          <h1 className="text-3xl font-bold text-text-primary">{t('nav.wishlist')}</h1>
          <p className="text-xs text-text-secondary mt-1 font-medium">
            <bdi>{items.length}</bdi> {t('common.productCount', { count: items.length }).replace('{count}', String(items.length))}
          </p>
        </div>

        {items.length > 0 && (
          <button
            onClick={clearWishlist}
            className="text-xs font-bold text-error-500 hover:underline transition-colors flex items-center gap-1.5"
          >
            <Trash2 className="w-3.5 h-3.5" />
            {t('common.clearWishlist')}
          </button>
        )}
      </div>

      {/* Empty State */}
      {items.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-center space-y-3 rounded-2xl bg-background-secondary border border-border-default">
          <div className="w-12 h-12 rounded-full bg-background-primary text-text-secondary border border-border-default flex items-center justify-center">
            <Heart className="w-6 h-6" strokeWidth={1.5} />
          </div>
          <div className="space-y-1">
            <h2 className="text-sm font-bold text-text-primary">{t('common.emptyWishlist')}</h2>
            <p className="text-xs text-text-secondary max-w-xs">{t('common.emptyWishlistHint')}</p>
          </div>
          <Link to="/products" className="btn-primary text-xs flex items-center gap-2">
            <span>{t('common.startShopping')}</span>
            <ArrowRight className="w-4 h-4 rtl:rotate-180" />
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {items.map((prod) => (
            <div
              key={prod.id}
              className="p-3.5 rounded-2xl bg-background-secondary border border-border-default flex flex-col justify-between space-y-3 group"
            >
              <Link to={`/product/${prod.slug}`} className="block aspect-square rounded-xl bg-background-primary overflow-hidden border border-border-default">
                <img src={prod.image} alt={prod.name} className="w-full h-full object-cover group-hover:scale-[1.03] transition-transform duration-normal" loading="lazy" width={300} height={300} />
              </Link>
              <div className="space-y-1">
                <span className="text-[10px] font-bold text-text-brand uppercase tracking-wider">{prod.brand}</span>
                <h3 className="font-bold text-xs text-text-primary line-clamp-1">
                  <bdi>{prod.name}</bdi>
                </h3>
                <p className="text-xs font-bold text-text-primary">
                  <bdi>{formatPrice(prod.price, locale)} ₪</bdi>
                </p>
              </div>
              <div className="flex items-center gap-2 pt-2 border-t border-border-default">
                <button
                  onClick={() => handleMoveToCart(prod)}
                  className="flex-1 flex items-center justify-center gap-1.5 py-2 bg-interactive-primary text-text-inverse text-xs font-semibold rounded-full hover:bg-interactive-primary-hover active:scale-95 transition-all shadow-xs"
                >
                  <ShoppingBag className="w-3.5 h-3.5" strokeWidth={1.5} />
                  <span>{t('common.moveToCart')}</span>
                </button>
                <button
                  onClick={() => handleRemove(prod)}
                  className="w-8 h-8 flex items-center justify-center text-text-secondary hover:text-error-500 rounded-full border border-border-default hover:border-error-500/20 active:scale-90 transition-all"
                  aria-label={t('common.remove')}
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default WishlistPage;
