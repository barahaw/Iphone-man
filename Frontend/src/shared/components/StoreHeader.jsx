import { useMemo, useState, useEffect, useRef } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Heart, Menu, Moon, Search, ShoppingBag, Sun, User, X } from 'lucide-react';
import { useUiStore } from '../stores/useUiStore';
import { useCartStore } from '../stores/useCartStore';
import { useWishlistStore } from '../stores/useWishlistStore';
import { useTranslation } from '../i18n/useTranslation';

const NAV_LINKS = [
  { key: 'nav.home', path: '/' },
  { key: 'nav.products', path: '/products' },
  { key: 'nav.categories', path: '/products?category=all' },
  { key: 'nav.about', path: '/about' },
  { key: 'nav.contact', path: '/contact' },
];

const SEARCH_SUGGESTIONS = [
  { name: 'iPhone 17 Pro', slug: 'iphone-17-pro' },
  { name: 'Galaxy S24 Ultra', slug: 'galaxy-s24-ultra' },
  { name: 'Google Pixel 9 Pro', slug: 'google-pixel-9-pro' },
  { name: 'AirPods Max', slug: 'airpods-max' },
];

const LOCALE_SHORT = { ar: 'ع', en: 'EN', he: 'ע' };

export function StoreHeader() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const location = useLocation();
  const { theme, toggleTheme, toggleCart, locale, setLocale } = useUiStore();
  const wishlistCount = useWishlistStore((state) => state.items.length);
  const cartCount = useCartStore((state) =>
    state.items.reduce((count, item) => count + item.quantity, 0)
  );

  const [mobileOpen, setMobileOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [animateCartBadge, setAnimateCartBadge] = useState(false);
  const [animateWishlistBadge, setAnimateWishlistBadge] = useState(false);

  const prevCartCount = useRef(cartCount);
  const prevWishlistCount = useRef(wishlistCount);

  useEffect(() => {
    if (cartCount > prevCartCount.current && cartCount > 0) {
      const timer1 = setTimeout(() => setAnimateCartBadge(true), 0);
      const timer2 = setTimeout(() => setAnimateCartBadge(false), 200);
      prevCartCount.current = cartCount;
      return () => {
        clearTimeout(timer1);
        clearTimeout(timer2);
      };
    }
    prevCartCount.current = cartCount;
  }, [cartCount]);

  useEffect(() => {
    if (wishlistCount > prevWishlistCount.current && wishlistCount > 0) {
      const timer1 = setTimeout(() => setAnimateWishlistBadge(true), 0);
      const timer2 = setTimeout(() => setAnimateWishlistBadge(false), 200);
      prevWishlistCount.current = wishlistCount;
      return () => {
        clearTimeout(timer1);
        clearTimeout(timer2);
      };
    }
    prevWishlistCount.current = wishlistCount;
  }, [wishlistCount]);

  const navLinks = NAV_LINKS.map((item) => ({
    ...item,
    label: t(item.key),
  }));

  const suggestions = useMemo(() => {
    if (!searchQuery.trim()) return [];
    const query = searchQuery.toLowerCase();
    return SEARCH_SUGGESTIONS.filter((item) => item.name.toLowerCase().includes(query)).slice(0, 4);
  }, [searchQuery]);

  const isActive = (path) => {
    if (path === '/') return location.pathname === '/';
    const cleanPath = path.split('?')[0];
    return location.pathname.startsWith(cleanPath);
  };

  const handleSearchSubmit = (event) => {
    event.preventDefault();
    if (!searchQuery.trim()) return;
    navigate(`/products?q=${encodeURIComponent(searchQuery.trim())}`);
    setSearchQuery('');
    setMobileOpen(false);
  };

  return (
    <header className="fixed top-0 z-[1100] w-full border-b border-border-default bg-background-primary/90 backdrop-blur-md transition-colors duration-normal">
      <div className="mx-auto w-full max-w-[1440px] px-4 sm:px-6 lg:px-8">
        <div className="flex h-[72px] items-center justify-between gap-4">
          <Link to="/" className="inline-flex items-center gap-2.5 group" aria-label={t('nav.home')}>
            <img src="/logo.jpg" alt="iPhone Man" className="h-9 w-9 rounded-md object-cover transition-transform duration-fast group-hover:scale-105" />
            <span className="font-display-ar text-xl font-bold tracking-wide text-text-primary">iPhone Man</span>
          </Link>

          <nav className="hidden items-center gap-6 lg:flex" aria-label={t('common.ariaMainNav')}>
            {navLinks.map((item) => (
              <Link
                key={item.key}
                to={item.path}
                className={`relative pb-1 text-sm font-medium tracking-[0.02em] transition-colors duration-fast ${
                  isActive(item.path) ? 'text-text-primary' : 'text-text-secondary hover:text-text-primary'
                }`}
              >
                {item.label}
                {isActive(item.path) && (
                  <span className="absolute inset-x-0 -bottom-0.5 h-0.5 bg-interactive-primary rounded-full transition-all duration-fast" />
                )}
              </Link>
            ))}
          </nav>

          <div className="flex items-center gap-1.5 sm:gap-2">
            <form onSubmit={handleSearchSubmit} className="relative hidden lg:block">
              <Search className="absolute start-3 top-1/2 h-4 w-4 -translate-y-1/2 text-text-tertiary" strokeWidth={1.6} />
              <input
                type="search"
                value={searchQuery}
                onChange={(event) => setSearchQuery(event.target.value)}
                placeholder={t('common.searchPlaceholder')}
                className="h-10 w-64 rounded-full border border-border-default bg-background-secondary ps-9 pe-4 text-sm text-text-primary placeholder:text-text-tertiary focus:border-interactive-focus focus:bg-background-primary focus:outline-none transition-all duration-fast"
              />
              {!!suggestions.length && (
                <div className="absolute top-full mt-2 w-full rounded-2xl border border-border-default bg-background-primary p-1.5 shadow-lg animate-toast-in">
                  {suggestions.map((item) => (
                    <button
                      key={item.slug}
                      type="button"
                      onClick={() => {
                        navigate(`/product/${item.slug}`);
                        setSearchQuery('');
                      }}
                      className="w-full rounded-xl px-3 py-2 text-start text-xs text-text-primary hover:bg-background-secondary transition-colors duration-fast"
                    >
                      {item.name}
                    </button>
                  ))}
                </div>
              )}
            </form>

            <button
              onClick={() => setLocale('ar')}
              className={`h-10 items-center justify-center rounded-full border px-3 text-xs font-bold transition-all duration-fast active:scale-90 hidden sm:flex ${
                locale === 'ar'
                  ? 'border-interactive-primary bg-interactive-primary text-text-inverse'
                  : 'border-border-default text-text-secondary hover:border-border-strong hover:text-text-primary'
              }`}
              aria-label={t('common.langArabic')}
              aria-pressed={locale === 'ar'}
            >
              {LOCALE_SHORT.ar}
            </button>
            <button
              onClick={() => setLocale('en')}
              className={`h-10 items-center justify-center rounded-full border px-3 text-xs font-bold transition-all duration-fast active:scale-90 hidden sm:flex ${
                locale === 'en'
                  ? 'border-interactive-primary bg-interactive-primary text-text-inverse'
                  : 'border-border-default text-text-secondary hover:border-border-strong hover:text-text-primary'
              }`}
              aria-label={t('common.langEnglish')}
              aria-pressed={locale === 'en'}
            >
              {LOCALE_SHORT.en}
            </button>
            <button
              onClick={() => setLocale('he')}
              className={`h-10 items-center justify-center rounded-full border px-3 text-xs font-bold transition-all duration-fast active:scale-90 hidden sm:flex ${
                locale === 'he'
                  ? 'border-interactive-primary bg-interactive-primary text-text-inverse'
                  : 'border-border-default text-text-secondary hover:border-border-strong hover:text-text-primary'
              }`}
              aria-label={t('common.langHebrew')}
              aria-pressed={locale === 'he'}
            >
              {LOCALE_SHORT.he}
            </button>

            <button
              onClick={toggleTheme}
              className="hidden h-10 w-10 items-center justify-center rounded-full border border-border-default text-text-secondary transition-all duration-fast hover:border-border-strong hover:text-text-primary active:scale-90 sm:flex"
              aria-label={theme === 'dark' ? t('common.themeLight') : t('common.themeDark')}
            >
              {theme === 'dark' ? <Sun className="h-4 w-4" strokeWidth={1.6} /> : <Moon className="h-4 w-4" strokeWidth={1.6} />}
            </button>

            <button
              type="button"
              className="hidden h-10 w-10 items-center justify-center rounded-full border border-border-default text-text-secondary transition-all duration-fast hover:border-border-strong hover:text-text-primary active:scale-90 sm:flex"
              aria-label={t('common.account')}
            >
              <User className="h-4 w-4" strokeWidth={1.6} />
            </button>

            <Link
              to="/wishlist"
              className="relative hidden h-10 w-10 items-center justify-center rounded-full border border-border-default text-text-secondary transition-all duration-fast hover:border-border-strong hover:text-text-primary active:scale-90 sm:flex"
              aria-label={t('nav.wishlist')}
            >
              <Heart className="h-4 w-4" strokeWidth={1.6} />
              {wishlistCount > 0 && (
                <span className={`absolute -top-1 -end-1 min-h-5 min-w-5 rounded-full border border-background-primary bg-interactive-primary px-1 text-center text-[10px] font-bold leading-4 text-text-inverse ${animateWishlistBadge ? 'animate-badge-pop' : ''}`}>
                  {wishlistCount}
                </span>
              )}
            </Link>

            <button
              onClick={toggleCart}
              className="relative flex h-10 w-10 items-center justify-center rounded-full border border-border-default text-text-secondary transition-all duration-fast hover:border-border-strong hover:text-text-primary active:scale-90"
              aria-label={t('common.cart')}
            >
              <ShoppingBag className="h-4 w-4" strokeWidth={1.6} />
              {cartCount > 0 && (
                <span className={`absolute -top-1 -end-1 min-h-5 min-w-5 rounded-full border border-background-primary bg-interactive-primary px-1 text-center text-[10px] font-bold leading-4 text-text-inverse ${animateCartBadge ? 'animate-badge-pop' : ''}`}>
                  {cartCount}
                </span>
              )}
            </button>

            <button
              onClick={() => setMobileOpen((state) => !state)}
              className="flex h-10 w-10 items-center justify-center rounded-full border border-border-default text-text-secondary transition-all duration-fast hover:border-border-strong hover:text-text-primary active:scale-90 lg:hidden"
              aria-label={mobileOpen ? t('common.closeMenu') : t('common.openMenu')}
              aria-expanded={mobileOpen}
            >
              {mobileOpen ? <X className="h-5 w-5" strokeWidth={1.6} /> : <Menu className="h-5 w-5" strokeWidth={1.6} />}
            </button>
          </div>
        </div>
      </div>

      <div className={`overflow-hidden border-t border-border-default bg-background-primary transition-[max-height,opacity] duration-normal ease-emphasized lg:hidden ${mobileOpen ? 'max-h-[460px] opacity-100' : 'max-h-0 opacity-0'}`}>
        <div className="space-y-2 px-4 py-4 sm:px-6">
          <form onSubmit={handleSearchSubmit} className="relative mb-2">
            <Search className="absolute start-3 top-1/2 h-4 w-4 -translate-y-1/2 text-text-tertiary" strokeWidth={1.6} />
            <input
              type="search"
              value={searchQuery}
              onChange={(event) => setSearchQuery(event.target.value)}
              placeholder={t('common.searchPlaceholder')}
              className="h-10 w-full rounded-full border border-border-default bg-background-secondary ps-9 pe-4 text-sm text-text-primary placeholder:text-text-tertiary focus:border-interactive-focus focus:outline-none"
            />
          </form>
          {navLinks.map((item) => (
            <Link
              key={item.key}
              to={item.path}
              onClick={() => setMobileOpen(false)}
              className={`block rounded-xl border px-4 py-2.5 text-sm font-medium transition-all duration-fast ${
                isActive(item.path)
                  ? 'border-interactive-primary bg-interactive-primary text-text-inverse'
                  : 'border-border-default bg-background-secondary text-text-primary hover:border-border-strong'
              }`}
            >
              {item.label}
            </Link>
          ))}
        </div>
      </div>
    </header>
  );
}

export default StoreHeader;
