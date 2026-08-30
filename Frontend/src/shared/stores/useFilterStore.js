import { create } from 'zustand';

export const useFilterStore = create((set) => ({
  selectedCategories: [],
  selectedBrands: [],
  maxPrice: 15000,
  sortBy: 'latest',
  showInStockOnly: false,
  currentPage: 1,

  toggleCategory: (category) =>
    set((state) => ({
      currentPage: 1,
      selectedCategories: state.selectedCategories.includes(category)
        ? state.selectedCategories.filter((c) => c !== category)
        : [...state.selectedCategories, category],
    })),

  setCategories: (categories) => set({ selectedCategories: categories, currentPage: 1 }),

  toggleBrand: (brand) =>
    set((state) => ({
      currentPage: 1,
      selectedBrands: state.selectedBrands.includes(brand)
        ? state.selectedBrands.filter((b) => b !== brand)
        : [...state.selectedBrands, brand],
    })),

  setMaxPrice: (price) => set({ maxPrice: price, currentPage: 1 }),

  setSortBy: (sort) => set({ sortBy: sort }),

  setShowInStockOnly: (val) => set({ showInStockOnly: val, currentPage: 1 }),

  setCurrentPage: (page) => set({ currentPage: page }),

  clearFilters: () =>
    set({
      selectedCategories: [],
      selectedBrands: [],
      maxPrice: 15000,
      showInStockOnly: false,
      currentPage: 1,
    }),
}));

export default useFilterStore;
