import { useState, useMemo, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { fetchProducts } from '../../../shared/api/productsApi';
import { useTranslation } from '../../../shared/i18n/useTranslation';
import { useFilterStore } from '../../../shared/stores/useFilterStore';
import { FilterSidebar } from './FilterSidebar';
import { ProductToolbar } from './ProductToolbar';
import { ProductGrid } from './ProductGrid';
import { Pagination } from './Pagination';
import { MobileFilterDrawer } from './MobileFilterDrawer';

export function PLP() {
  const { t } = useTranslation();
  const [searchParams] = useSearchParams();
  const searchQuery = searchParams.get('q') || '';
  const categoryParam = searchParams.get('category') || '';
  const [mobileFiltersOpen, setMobileFiltersOpen] = useState(false);

  const {
    selectedBrands,
    selectedCategories,
    maxPrice,
    sortBy,
    showInStockOnly,
    currentPage,
    setCategories,
  } = useFilterStore();

  // Hydrate ?category= navigation links into the filter store (e.g. homepage tiles)
  useEffect(() => {
    if (categoryParam === 'all') setCategories([]);
    else if (categoryParam) setCategories([categoryParam]);
  }, [categoryParam, setCategories]);

  const ITEMS_PER_PAGE = 8;

  // Remote State via TanStack Query (INSTRUCTIONS.md §5)
  const { data: products = [], isLoading } = useQuery({
    queryKey: ['products'],
    queryFn: () => fetchProducts(),
  });

  const filteredProducts = useMemo(() => {
    let result = products.filter((p) => {
      if (
        searchQuery &&
        !p.name.toLowerCase().includes(searchQuery.toLowerCase()) &&
        !p.brand.toLowerCase().includes(searchQuery.toLowerCase())
      ) {
        return false;
      }
      if (selectedBrands.length > 0 && !selectedBrands.includes(p.brand)) return false;
      if (selectedCategories.length > 0 && !selectedCategories.includes(p.category)) return false;
      if (p.price > maxPrice) return false;
      if (showInStockOnly && p.inStock === false) return false;
      return true;
    });

    switch (sortBy) {
      case 'price-low':
        result.sort((a, b) => a.price - b.price);
        break;
      case 'price-high':
        result.sort((a, b) => b.price - a.price);
        break;
      case 'name':
        result.sort((a, b) => a.name.localeCompare(b.name, 'ar'));
        break;
      default:
        break;
    }

    return result;
  }, [products, searchQuery, selectedBrands, selectedCategories, maxPrice, sortBy, showInStockOnly]);

  const totalPages = Math.ceil(filteredProducts.length / ITEMS_PER_PAGE);
  const paginatedProducts = filteredProducts.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE
  );

  return (
    <div className="space-y-6 pb-16 text-start">
      {/* Page Header */}
      <div className="space-y-1.5">
        <h1 className="text-3xl font-bold text-text-primary">
          {searchQuery
            ? t('common.searchResults').replace('{query}', `"${searchQuery}"`)
            : selectedCategories.length === 1
              ? t(`nav.${selectedCategories[0]}`)
              : t('common.allProducts')}
        </h1>
        <p className="text-xs text-text-secondary font-medium max-w-2xl">
          {t('tagline')}
        </p>
      </div>

      {/* Toolbar */}
      <ProductToolbar
        totalCount={filteredProducts.length}
        onOpenMobileFilters={() => setMobileFiltersOpen(true)}
      />

      {/* Main Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6 items-start">
        {/* Desktop Sidebar */}
        <aside className="hidden lg:block lg:col-span-1 sticky top-28">
          <div className="p-4 rounded-2xl bg-background-secondary border border-border-default shadow-xs">
            <FilterSidebar />
          </div>
        </aside>

        {/* Product Grid & Pagination */}
        <main className="lg:col-span-4 space-y-6">
          <ProductGrid products={paginatedProducts} isLoading={isLoading} />
          <Pagination totalPages={totalPages} />
        </main>
      </div>

      {/* Mobile Filter Drawer */}
      <MobileFilterDrawer
        isOpen={mobileFiltersOpen}
        onClose={() => setMobileFiltersOpen(false)}
      />
    </div>
  );
}

export default PLP;
