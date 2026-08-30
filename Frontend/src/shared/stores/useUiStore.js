import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export const useUiStore = create(
  persist(
    (set, get) => ({
      locale: 'ar', // Default: 'ar' (Arabic) per INSTRUCTIONS.md
      dir: 'rtl',   // 'rtl' for 'ar' & 'he', 'ltr' for 'en'
      theme: 'light', // 'light' | 'dark'

      isCartOpen: false,
      isWishlistOpen: false,
      isSearchOpen: false,

      setLocale: (locale) => {
        const dir = locale === 'en' ? 'ltr' : 'rtl';
        document.documentElement.setAttribute('lang', locale);
        document.documentElement.setAttribute('dir', dir);
        set({ locale, dir });
      },

      setTheme: (theme) => {
        if (theme === 'dark') {
          document.documentElement.classList.add('dark');
        } else {
          document.documentElement.classList.remove('dark');
        }
        set({ theme });
      },

      toggleTheme: () => {
        const nextTheme = get().theme === 'light' ? 'dark' : 'light';
        get().setTheme(nextTheme);
      },

      openCart: () => set({ isCartOpen: true }),
      closeCart: () => set({ isCartOpen: false }),
      toggleCart: () => set((state) => ({ isCartOpen: !state.isCartOpen })),

      openWishlist: () => set({ isWishlistOpen: true }),
      closeWishlist: () => set({ isWishlistOpen: false }),

      openSearch: () => set({ isSearchOpen: true }),
      closeSearch: () => set({ isSearchOpen: false }),
    }),
    {
      name: 'iphone-man-ui-settings',
      partialize: (state) => ({
        locale: state.locale,
        dir: state.dir,
        theme: state.theme,
      }),
    }
  )
);
