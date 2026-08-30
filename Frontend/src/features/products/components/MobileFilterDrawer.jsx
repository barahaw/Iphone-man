import { X } from 'lucide-react';
import { FilterSidebar } from './FilterSidebar';
import { useTranslation } from '../../../shared/i18n/useTranslation';

export function MobileFilterDrawer({ isOpen, onClose }) {
  const { t } = useTranslation();

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[1200] lg:hidden">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/40 backdrop-blur-xs animate-backdrop-fade transition-opacity duration-fast"
        onClick={onClose}
      />

      <div className="fixed inset-y-0 start-0 w-[85%] max-w-sm bg-background-primary shadow-xl overflow-y-auto flex flex-col transition-transform duration-normal ease-emphasized">
        <div className="flex items-center justify-between p-4 border-b border-border-default">
          <h2 className="text-sm font-bold text-text-primary">{t('common.filter')}</h2>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full flex items-center justify-center text-text-secondary hover:bg-background-secondary active:scale-95 transition-all"
            aria-label={t('common.closeFilters')}
          >
            <X className="w-5 h-5" />
          </button>
        </div>
        <div className="p-4 flex-1">
          <FilterSidebar isMobile onClose={onClose} />
        </div>
      </div>
    </div>
  );
}

export default MobileFilterDrawer;
