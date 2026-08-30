import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export const useCartStore = create(
  persist(
    (set, get) => ({
      items: [],
      appliedCoupon: null, // e.g. { code: 'SAVE10', discountPercent: 10 }

      addItem: (product, variant = 'Standard', qty = 1) => {
        set((state) => {
          const existingIndex = state.items.findIndex(
            (item) => item.id === product.id && item.variant === variant
          );

          if (existingIndex > -1) {
            const updated = [...state.items];
            updated[existingIndex].quantity += qty;
            return { items: updated };
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
                variant,
                quantity: qty,
              },
            ],
          };
        });
      },

      removeItem: (id, variant) => {
        set((state) => ({
          items: state.items.filter(
            (item) => !(item.id === id && item.variant === variant)
          ),
        }));
      },

      updateQuantity: (id, variant, quantity) => {
        if (quantity <= 0) {
          get().removeItem(id, variant);
          return;
        }
        set((state) => ({
          items: state.items.map((item) =>
            item.id === id && item.variant === variant
              ? { ...item, quantity }
              : item
          ),
        }));
      },

      clearCart: () => set({ items: [], appliedCoupon: null }),

      applyCoupon: (coupon) => set({ appliedCoupon: coupon }),
      removeCoupon: () => set({ appliedCoupon: null }),

      getSubtotal: () => {
        return get().items.reduce(
          (total, item) => total + item.price * item.quantity,
          0
        );
      },

      getDiscountAmount: () => {
        const subtotal = get().getSubtotal();
        const coupon = get().appliedCoupon;
        if (!coupon) return 0;
        if (coupon.discountPercent) {
          return (subtotal * coupon.discountPercent) / 100;
        }
        if (coupon.discountFixed) {
          return Math.min(subtotal, coupon.discountFixed);
        }
        return 0;
      },

      getTotal: () => {
        const subtotal = get().getSubtotal();
        const discount = get().getDiscountAmount();
        return Math.max(0, subtotal - discount);
      },

      getItemCount: () => {
        return get().items.reduce((count, item) => count + item.quantity, 0);
      },
    }),
    {
      name: 'iphone-man-cart',
    }
  )
);
