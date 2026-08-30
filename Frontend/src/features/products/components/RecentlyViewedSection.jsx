import { Link } from 'react-router-dom';
import { ChevronRight, X } from 'lucide-react';
import { useRecentlyViewedStore } from '../../../shared/stores/useRecentlyViewedStore';
import { useTranslation } from '../../../shared/i18n/useTranslation';

const PLACEHOLDER_IMG = '/placeholder-product.svg';

export function RecentlyViewedSection() {
  const { t } = useTranslation();
  const { items, clearRecentlyViewed } = useRecentlyViewedStore();

  if (items.length === 0) return null;

  return (
    <section className="space-y-4 text-start" aria-labelledby="recently-viewed-heading">
      <div className="flex items-center justify-between">
        <div>
          <h2 id="recently-viewed-heading" className="text-xl font-bold text-text-primary">
            {t('home.recentlyViewed')}
          </h2>
          <p className="text-xs text-text-secondary mt-0.5">{t('home.recentlyViewedDesc')}</p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={clearRecentlyViewed}
            className="text-[11px] font-bold text-text-secondary hover:text-text-primary flex items-center gap-1 transition-colors"
            aria-label="مسح السجل"
          >
            <X className="w-3.5 h-3.5" />
            <span className="hidden sm:block">{t('common.clearAll')}</span>
          </button>
          <Link
            to="/products"
            className="text-xs font-bold text-interactive-primary hover:underline flex items-center gap-1"
          >
            {t('common.showAll')}
            <ChevronRight className="w-3.5 h-3.5 rtl:rotate-180" />
          </Link>
        </div>
      </div>

      <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-thin snap-x snap-mandatory">
        {items.slice(0, 8).map((product) => (
          <Link
            key={product.id}
            to={`/product/${product.slug}`}
            className="flex-none snap-start w-36 sm:w-44 group"
          >
            <div className="rounded-xl overflow-hidden border border-border-default bg-background-secondary transition-all duration-normal group-hover:shadow-md group-hover:-translate-y-0.5">
              <div className="aspect-square overflow-hidden bg-background-primary">
                <img
                  src={product.image || product.images?.[0] || PLACEHOLDER_IMG}
                  alt={product.name}
                  className="w-full h-full object-cover transition-transform duration-slow group-hover:scale-[1.04]"
                  loading="lazy"
                  width={176}
                  height={176}
                />
              </div>
              <div className="p-2.5 space-y-0.5">
                <span className="text-[9px] font-bold uppercase tracking-wider text-text-secondary">{product.brand}</span>
                <p className="text-xs font-bold text-text-primary line-clamp-1"><bdi>{product.name}</bdi></p>
                <p className="text-xs font-bold text-text-primary"><bdi>{product.price?.toLocaleString()} ₪</bdi></p>
              </div>
            </div>
          </Link>
        ))}
      </div>
    </section>
  );
}

export default RecentlyViewedSection;
