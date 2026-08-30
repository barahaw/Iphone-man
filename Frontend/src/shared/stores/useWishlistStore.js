import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export const useWishlistStore = create(
  persist(
    (set, get) => ({
      items: [
        {
          id: 'p3',
          name: 'Nothing Ear (a)',
          slug: 'nothing-ear-a',
          brand: 'Nothing',
          price: 99.0,
          image: 'https://images.unsplash.com/photo-1590658268037-6bf12165a8df?w=500&auto=format&fit=crop&q=80',
          rating: 4.8,
          reviewsCount: 54,
          inStock: true,
        },
      ],

      toggleWishlist: (product) => {
        set((state) => {
          const exists = state.items.some((item) => item.id === product.id);
          if (exists) {
            return {
              items: state.items.filter((item) => item.id !== product.id),
            };
          }
          return {
            items: [
              ...state.items,
              {
                id: product.id,
                name: product.name,
                slug: product.slug,
                brand: product.brand || 'iPhone Man',
                price: product.price,
                image: product.image || product.images?.[0],
                rating: product.rating || 5.0,
                reviewsCount: product.reviewsCount || 0,
                inStock: product.inStock !== false,
              },
            ],
          };
        });
      },

      isInWishlist: (id) => {
        return get().items.some((item) => item.id === id);
      },

      clearWishlist: () => set({ items: [] }),

      getItemCount: () => get().items.length,
    }),
    {
      name: 'iphone-man-wishlist',
    }
  )
);
