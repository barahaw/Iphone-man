import { Link } from 'react-router-dom';
import { ArrowUpDown, X } from 'lucide-react';
import { useCompareStore } from '../../stores/useCompareStore';
import { useTranslation } from '../../i18n/useTranslation';

export function CompareTray() {
  const { t } = useTranslation();
  const { items, removeItem, clearCompare } = useCompareStore();

  if (items.length === 0) return null;

  return (
    <div
      className="fixed bottom-0 inset-x-0 z-[900] lg:bottom-6 lg:inset-x-auto lg:start-1/2 lg:-translate-x-1/2 bg-background-primary border-t lg:border border-border-default lg:rounded-2xl shadow-xl p-3 px-4 flex items-center gap-3 animate-slide-up"
      role="status"
      aria-live="polite"
      aria-label={t('common.compareTray')}
    >
      <ArrowUpDown className="w-4 h-4 text-text-brand flex-none" strokeWidth={1.6} />

      <div className="flex items-center gap-2 flex-1 overflow-x-auto">
        {items.map((item) => (
          <div key={item.id} className="relative flex-none">
            <img
              src={item.image || item.images?.[0]}
              alt={item.name}
              className="w-10 h-10 rounded-lg object-cover border border-border-default bg-background-secondary"
              width={40}
              height={40}
              loading="lazy"
            />
            <button
              onClick={() => removeItem(item.id)}
              className="absolute -top-1.5 -end-1.5 w-4 h-4 rounded-full bg-text-primary text-background-primary flex items-center justify-center hover:bg-error-500 transition-colors"
              aria-label={t('common.removeFromCompareItem').replace('{name}', item.name)}
            >
              <X className="w-2.5 h-2.5" strokeWidth={2.5} />
            </button>
          </div>
        ))}

        {/* Empty slots */}
        {Array.from({ length: Math.max(0, 2 - items.length) }).map((_, i) => (
          <div
            key={`empty-${i}`}
            className="w-10 h-10 rounded-lg border-2 border-dashed border-border-default flex items-center justify-center text-text-secondary"
            aria-hidden="true"
          >
            <span className="text-[10px] font-bold">+</span>
          </div>
        ))}
      </div>

      <div className="flex items-center gap-2 flex-none">
        <span className="text-xs font-bold text-text-secondary hidden sm:block">
          {items.length} / 4
        </span>
        <Link
          to="/compare"
          className="px-4 py-2 bg-interactive-primary text-text-inverse text-xs font-bold rounded-full hover:bg-interactive-primary-hover transition-colors active:scale-95"
        >
          {t('common.compare')}
        </Link>
        <button
          onClick={clearCompare}
          className="p-2 text-text-secondary hover:text-text-primary transition-colors"
          aria-label={t('compare.clearAll')}
        >
          <X className="w-4 h-4" strokeWidth={1.6} />
        </button>
      </div>
    </div>
  );
}

export default CompareTray;
