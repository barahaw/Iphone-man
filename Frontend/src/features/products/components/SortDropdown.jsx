import { ArrowUpDown } from 'lucide-react';
import { useTranslation } from '../../../shared/i18n/useTranslation';
import { useFilterStore } from '../../../shared/stores/useFilterStore';

export function SortDropdown() {
  const { t } = useTranslation();
  const { sortBy, setSortBy } = useFilterStore();

  const SORT_OPTIONS = [
    { key: 'latest', label: t('common.sortLatest') },
    { key: 'price-low', label: t('common.sortPriceLow') },
    { key: 'price-high', label: t('common.sortPriceHigh') },
    { key: 'name', label: t('common.sortName') },
  ];

  return (
    <div className="flex items-center gap-1.5 border border-border-default bg-background-primary px-3 py-1.5 rounded-full shadow-xs">
      <ArrowUpDown className="w-3.5 h-3.5 text-text-secondary" />
      <select
        value={sortBy}
        onChange={(e) => setSortBy(e.target.value)}
        className="text-[11px] font-bold text-text-primary bg-transparent border-none focus:outline-none cursor-pointer"
        aria-label={t('common.sort')}
      >
        {SORT_OPTIONS.map((opt) => (
          <option key={opt.key} value={opt.key}>
            {opt.label}
          </option>
        ))}
      </select>
    </div>
  );
}

export default SortDropdown;
