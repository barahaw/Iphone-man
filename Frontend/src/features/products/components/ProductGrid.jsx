import { Package } from 'lucide-react';
import { ProductCard } from './ProductCard';
import { useTranslation } from '../../../shared/i18n/useTranslation';
import { useFilterStore } from '../../../shared/stores/useFilterStore';

export function ProductGrid({ products, isLoading }) {
  const { t } = useTranslation();
  const { clearFilters } = useFilterStore();

  if (isLoading) {
    return (
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
        {Array.from({ length: 8 }).map((_, i) => (
          <div key={i} className="aspect-square rounded-2xl bg-background-secondary animate-pulse border border-border-default" />
        ))}
      </div>
    );
  }

  if (products.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center space-y-3 rounded-2xl bg-background-secondary border border-border-default">
        <div className="w-12 h-12 rounded-full bg-background-primary flex items-center justify-center text-text-secondary border border-border-default">
          <Package className="w-6 h-6" strokeWidth={1.5} />
        </div>
        <h3 className="text-sm font-bold text-text-primary">{t('common.noProducts')}</h3>
        <p className="text-xs text-text-secondary max-w-xs">{t('common.noProductsHint')}</p>
        <button
          onClick={clearFilters}
          className="mt-1 px-4 py-2 text-xs font-bold text-text-brand border border-border-default rounded-xl hover:bg-background-primary transition-colors active:scale-95"
        >
          {t('common.clearFilters')}
        </button>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
      {products.map((prod) => (
        <ProductCard key={prod.id} product={prod} />
      ))}
    </div>
  );
}

export default ProductGrid;
