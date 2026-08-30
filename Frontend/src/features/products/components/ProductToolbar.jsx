import { SlidersHorizontal, X } from 'lucide-react';
import { SortDropdown } from './SortDropdown';
import { useTranslation } from '../../../shared/i18n/useTranslation';
import { useFilterStore } from '../../../shared/stores/useFilterStore';

export function ProductToolbar({ totalCount, onOpenMobileFilters }) {
  const { t } = useTranslation();
  const {
    selectedBrands,
    selectedCategories,
    maxPrice,
    showInStockOnly,
    toggleBrand,
    toggleCategory,
    setShowInStockOnly,
    clearFilters,
  } = useFilterStore();

  const activeFilterCount =
    selectedBrands.length +
    selectedCategories.length +
    (maxPrice < 15000 ? 1 : 0) +
    (showInStockOnly ? 1 : 0);

  return (
    <div className="space-y-3 border-b border-border-default pb-4">
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <p className="text-xs text-text-secondary font-medium">
          {t('common.productCount', { count: totalCount }).replace('{count}', String(totalCount))}
        </p>

        <div className="flex items-center gap-3">
          <button
            onClick={onOpenMobileFilters}
            className="lg:hidden flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-border-default text-xs font-bold text-text-primary hover:bg-background-secondary active:scale-95 transition-all"
          >
            <SlidersHorizontal className="w-3.5 h-3.5" />
            <span>{t('common.filter')}</span>
            {activeFilterCount > 0 && (
              <span className="w-4 h-4 rounded-full bg-interactive-primary text-text-inverse text-[9px] font-bold flex items-center justify-center">
                {activeFilterCount}
              </span>
            )}
          </button>

          <SortDropdown />
        </div>
      </div>

      {/* Active Filter Chips */}
      {activeFilterCount > 0 && (
        <div className="flex flex-wrap gap-1.5 pt-1">
          {selectedBrands.map((brand) => (
            <button
              key={brand}
              onClick={() => toggleBrand(brand)}
              className="flex items-center gap-1 px-2.5 py-1 rounded-full bg-blue-500/10 text-text-brand text-[10px] font-bold hover:bg-blue-500/20 transition-colors"
            >
              {brand}
              <X className="w-3 h-3" />
            </button>
          ))}
          {selectedCategories.map((cat) => (
            <button
              key={cat}
              onClick={() => toggleCategory(cat)}
              className="flex items-center gap-1 px-2.5 py-1 rounded-full bg-blue-500/10 text-text-brand text-[10px] font-bold hover:bg-blue-500/20 transition-colors"
            >
              {cat}
              <X className="w-3 h-3" />
            </button>
          ))}
          {showInStockOnly && (
            <button
              onClick={() => setShowInStockOnly(false)}
              className="flex items-center gap-1 px-2.5 py-1 rounded-full bg-blue-500/10 text-text-brand text-[10px] font-bold hover:bg-blue-500/20 transition-colors"
            >
              {t('common.inStock')}
              <X className="w-3 h-3" />
            </button>
          )}
          <button
            onClick={clearFilters}
            className="text-[10px] font-bold text-error-500 hover:underline px-1.5 self-center"
          >
            {t('common.clearAll')}
          </button>
        </div>
      )}
    </div>
  );
}

export default ProductToolbar;
