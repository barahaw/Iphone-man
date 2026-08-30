import { create } from 'zustand';

export const useCompareStore = create((set, get) => ({
  items: [],

  toggleCompare: (product) => {
    const { items } = get();
    const exists = items.some((item) => item.id === product.id);

    if (exists) {
      set({ items: items.filter((item) => item.id !== product.id) });
      return { action: 'removed' };
    }

    if (items.length >= 4) {
      return { action: 'limit_reached' };
    }

    set({ items: [...items, product] });
    return { action: 'added' };
  },

  removeItem: (id) => set((state) => ({ items: state.items.filter((item) => item.id !== id) })),

  clearCompare: () => set({ items: [] }),

  isInCompare: (id) => get().items.some((item) => item.id === id),
}));

export default useCompareStore;
