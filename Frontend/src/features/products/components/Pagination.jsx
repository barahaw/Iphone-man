import { ChevronLeft, ChevronRight } from 'lucide-react';
import { useFilterStore } from '../../../shared/stores/useFilterStore';
import { useTranslation } from '../../../shared/i18n/useTranslation';

export function Pagination({ totalPages }) {
  const { currentPage, setCurrentPage } = useFilterStore();
  const { t } = useTranslation();

  if (totalPages <= 1) return null;

  return (
    <div className="flex items-center justify-center gap-1.5 pt-8" role="navigation" aria-label={t('common.pagination')}>
      <button
        onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
        disabled={currentPage === 1}
        className="w-9 h-9 rounded-xl border border-border-default flex items-center justify-center text-text-secondary hover:bg-background-secondary disabled:opacity-30 disabled:pointer-events-none active:scale-95 transition-all duration-fast"
        aria-label={t('common.prevPage')}
      >
        <ChevronRight className="w-4 h-4 rtl:rotate-0 ltr:rotate-180" />
      </button>

      {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
        <button
          key={page}
          onClick={() => setCurrentPage(page)}
          className={`w-9 h-9 rounded-xl font-bold text-xs flex items-center justify-center transition-all duration-fast ${
            currentPage === page
              ? 'bg-interactive-primary text-text-inverse shadow-xs scale-105'
              : 'bg-background-secondary text-text-primary border border-border-default hover:border-border-strong'
          }`}
          aria-label={t('common.pageNumber').replace('{number}', String(page))}
          aria-current={currentPage === page ? 'page' : undefined}
        >
          {page}
        </button>
      ))}

      <button
        onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
        disabled={currentPage === totalPages}
        className="w-9 h-9 rounded-xl border border-border-default flex items-center justify-center text-text-secondary hover:bg-background-secondary disabled:opacity-30 disabled:pointer-events-none active:scale-95 transition-all duration-fast"
        aria-label={t('common.nextPage')}
      >
        <ChevronLeft className="w-4 h-4 rtl:rotate-0 ltr:rotate-180" />
      </button>
    </div>
  );
}

export default Pagination;
