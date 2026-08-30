import { Link } from 'react-router-dom';
import { ArrowUpDown, Trash2, Plus, ArrowRight } from 'lucide-react';
import { useCompareStore } from '../../../shared/stores/useCompareStore';
import { useTranslation } from '../../../shared/i18n/useTranslation';
import { ProductSpecTable } from './ProductSpecTable';

export function ComparePage() {
  const { t } = useTranslation();
  const { items, clearCompare } = useCompareStore();

  return (
    <div className="space-y-6 pb-16 text-start">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border-default pb-4">
        <div>
          <h1 className="text-3xl font-bold text-text-primary">{t('compare.title')}</h1>
          <p className="text-xs text-text-secondary font-medium mt-1">
            {t('compare.subtitle')}
          </p>
        </div>

        {items.length > 0 && (
          <div className="flex items-center gap-3">
            <Link
              to="/products"
              className="btn-secondary text-xs inline-flex items-center gap-1.5"
            >
              <Plus className="w-4 h-4" />
              <span>{t('compare.addMore')}</span>
            </Link>
            <button
              onClick={clearCompare}
              className="text-xs font-bold text-error-500 hover:underline flex items-center gap-1.5"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>{t('compare.clearAll')}</span>
            </button>
          </div>
        )}
      </div>

      {/* Main Content */}
      {items.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-center space-y-3 rounded-2xl bg-background-secondary border border-border-default">
          <div className="w-12 h-12 rounded-full bg-background-primary text-text-secondary border border-border-default flex items-center justify-center">
            <ArrowUpDown className="w-6 h-6" strokeWidth={1.5} />
          </div>
          <div className="space-y-1">
            <h2 className="text-sm font-bold text-text-primary">{t('compare.empty')}</h2>
            <p className="text-xs text-text-secondary max-w-xs">{t('compare.emptyHint')}</p>
          </div>
          <Link to="/products" className="btn-primary text-xs flex items-center gap-2">
            <span>{t('common.browseProducts')}</span>
            <ArrowRight className="w-4 h-4 rtl:rotate-180" />
          </Link>
        </div>
      ) : (
        <ProductSpecTable products={items} />
      )}
    </div>
  );
}

export default ComparePage;
