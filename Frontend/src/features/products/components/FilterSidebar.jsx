import { SlidersHorizontal } from 'lucide-react';
import { useTranslation } from '../../../shared/i18n/useTranslation';
import { useFilterStore } from '../../../shared/stores/useFilterStore';
import { formatPrice } from '../../../shared/utils/format';

const BRANDS = ['Apple', 'Samsung', 'Google', 'Nothing'];
const CATEGORIES = [
  { key: 'smartphones', labelKey: 'nav.smartphones' },
  { key: 'accessories', labelKey: 'nav.accessories' },
  { key: 'watches', labelKey: 'nav.smartwatches' },
];

export function FilterSidebar({ isMobile = false, onClose }) {
  const { t, locale } = useTranslation();
  const {
    selectedCategories,
    toggleCategory,
    selectedBrands,
    toggleBrand,
    maxPrice,
    setMaxPrice,
    showInStockOnly,
    setShowInStockOnly,
    clearFilters,
  } = useFilterStore();

  const activeFilterCount =
    selectedBrands.length +
    selectedCategories.length +
    (maxPrice < 15000 ? 1 : 0) +
    (showInStockOnly ? 1 : 0);

  return (
    <div className="space-y-5 text-start">
      {!isMobile && (
        <div className="flex items-center gap-2 font-bold text-xs text-text-primary border-b border-border-default pb-3 mb-4">
          <SlidersHorizontal className="w-3.5 h-3.5 text-text-brand" />
          <span>{t('common.filter')}</span>
        </div>
      )}

      {/* Categories */}
      <div className="space-y-2.5">
        <h3 className="text-[10px] font-bold text-text-secondary uppercase tracking-[0.12em]">{t('common.category')}</h3>
        <div className="space-y-1">
          {CATEGORIES.map((cat) => (
            <label key={cat.key} className="flex items-center gap-2.5 cursor-pointer py-1.5 group">
              <input
                type="checkbox"
                checked={selectedCategories.includes(cat.key)}
                onChange={() => toggleCategory(cat.key)}
                className="w-4 h-4 rounded border-border-default text-interactive-primary focus:ring-interactive-focus accent-interactive-primary"
              />
              <span className="text-xs font-medium text-text-secondary group-hover:text-text-primary transition-colors">
                {t(cat.labelKey)}
              </span>
            </label>
          ))}
        </div>
      </div>

      {/* Brands */}
      <div className="space-y-2.5 pt-4 border-t border-border-default">
        <h3 className="text-[10px] font-bold text-text-secondary uppercase tracking-[0.12em]">{t('common.brand')}</h3>
        <div className="flex flex-wrap gap-1.5">
          {BRANDS.map((brand) => (
            <button
              key={brand}
              onClick={() => toggleBrand(brand)}
              className={`px-3 py-1.5 rounded-lg text-[11px] font-semibold transition-all border ${
                selectedBrands.includes(brand)
                  ? 'bg-interactive-primary text-text-inverse border-interactive-primary'
                  : 'bg-background-primary text-text-secondary border-border-default hover:border-border-strong hover:text-text-primary'
              }`}
            >
              {brand}
            </button>
          ))}
        </div>
      </div>

      {/* Accessible Price Range Slider */}
      <div className="space-y-2.5 pt-4 border-t border-border-default">
        <div className="flex justify-between items-center">
          <label htmlFor="price-range-input" className="text-[10px] font-bold text-text-secondary uppercase tracking-[0.12em]">
            {t('common.price')}
          </label>
          <span className="text-[11px] font-bold text-text-brand">
            <bdi>0 — {formatPrice(maxPrice, locale)} ₪</bdi>
          </span>
        </div>
        <input
          id="price-range-input"
          type="range"
          min="0"
          max="15000"
          step="500"
          value={maxPrice}
          onChange={(e) => setMaxPrice(Number(e.target.value))}
          className="w-full accent-interactive-primary h-1.5 bg-background-secondary rounded-lg cursor-pointer"
          aria-label={t('common.price')}
        />
        <div className="flex justify-between text-[10px] text-text-secondary font-medium">
          <span>0 ₪</span>
          <span>15,000 ₪</span>
        </div>
      </div>

      {/* In Stock Filter */}
      <div className="pt-4 border-t border-border-default">
        <label className="flex items-center gap-2.5 cursor-pointer group">
          <input
            type="checkbox"
            checked={showInStockOnly}
            onChange={(e) => setShowInStockOnly(e.target.checked)}
            className="w-4 h-4 rounded border-border-default text-interactive-primary focus:ring-interactive-focus accent-interactive-primary"
          />
          <span className="text-xs font-medium text-text-secondary group-hover:text-text-primary transition-colors">
            {t('common.inStock')}
          </span>
        </label>
      </div>

      {/* Clear Filters CTA */}
      {activeFilterCount > 0 && (
        <button
          onClick={clearFilters}
          className="w-full py-2 text-[11px] font-bold text-error-500 hover:text-error-600 transition-colors border border-error-500/20 rounded-xl mt-2 active:scale-95"
        >
          {t('common.clearFilters')} ({activeFilterCount})
        </button>
      )}

      {isMobile && onClose && (
        <button
          onClick={onClose}
          className="w-full py-3 rounded-xl bg-interactive-primary text-text-inverse font-bold text-sm mt-4 shadow-sm"
        >
          {t('common.showResults')}
        </button>
      )}
    </div>
  );
}

export default FilterSidebar;
