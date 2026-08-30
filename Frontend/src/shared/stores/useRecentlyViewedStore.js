import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export const useRecentlyViewedStore = create(
  persist(
    (set, get) => ({
      items: [],

      addRecentlyViewed: (product) => {
        if (!product || !product.id) return;
        const currentItems = get().items;
        const filtered = currentItems.filter((item) => item.id !== product.id);
        set({ items: [product, ...filtered].slice(0, 10) });
      },

      clearRecentlyViewed: () => set({ items: [] }),
    }),
    {
      name: 'iphone-man-recently-viewed',
    }
  )
);

export default useRecentlyViewedStore;
