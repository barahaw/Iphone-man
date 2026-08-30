import { useState, useEffect } from 'react';
import { Link, useParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import {
  ChevronLeft,
  ChevronRight,
  Heart,
  ShoppingBag,
  Zap,
  Camera,
  BatteryCharging,
  Check,
  Share2,
  Truck,
  ShieldCheck,
  PackageSearch,
} from 'lucide-react';
import { ProductCard } from './ProductCard';
import { ReviewSection } from './ReviewSection';
import { fetchProductBySlug } from '../../../shared/api/productsApi';
import { useCartStore } from '../../../shared/stores/useCartStore';
import { useWishlistStore } from '../../../shared/stores/useWishlistStore';
import { useToastStore } from '../../../shared/stores/useToastStore';
import { useRecentlyViewedStore } from '../../../shared/stores/useRecentlyViewedStore';
import { useTranslation } from '../../../shared/i18n/useTranslation';

export function PDP() {
  const { slug } = useParams();
  const { t } = useTranslation();

  const { data: product, isLoading } = useQuery({
    queryKey: ['product', slug],
    queryFn: () => fetchProductBySlug(slug),
    staleTime: 5 * 60 * 1000,
  });

  if (isLoading) {
    return (
      <div className="space-y-10 pb-16 text-start" aria-busy="true" aria-live="polite">
        <div className="h-3 w-48 rounded-full bg-background-tertiary animate-pulse" />
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12 items-start">
          <div className="aspect-square rounded-2xl bg-background-tertiary animate-pulse" />
          <div className="space-y-4">
            <div className="h-4 w-20 rounded-full bg-background-tertiary animate-pulse" />
            <div className="h-10 w-3/4 rounded-full bg-background-tertiary animate-pulse" />
            <div className="h-8 w-32 rounded-full bg-background-tertiary animate-pulse" />
            <div className="h-4 w-full rounded-full bg-background-tertiary animate-pulse" />
            <div className="h-4 w-5/6 rounded-full bg-background-tertiary animate-pulse" />
            <div className="h-12 w-48 rounded-full bg-background-tertiary animate-pulse" />
          </div>
        </div>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="flex flex-col items-center justify-center text-center gap-5 py-24 px-6">
        <div className="w-16 h-16 rounded-2xl bg-background-secondary text-text-brand flex items-center justify-center">
          <PackageSearch className="w-8 h-8" strokeWidth={1.5} />
        </div>
        <h1 className="text-2xl font-bold text-text-primary">{t('pdp.notFoundTitle')}</h1>
        <p className="max-w-md text-sm text-text-secondary">{t('pdp.notFoundHint')}</p>
        <Link
          to="/products"
          className="mt-2 inline-flex items-center gap-2 bg-interactive-primary hover:bg-interactive-primary-hover text-text-inverse px-6 py-3 rounded-full text-sm font-semibold transition-colors duration-fast"
        >
          {t('pdp.notFoundCta')}
          <ChevronRight className="w-4 h-4" />
        </Link>
      </div>
    );
  }

  return <PdpContent key={slug} product={product} />;
}

function PdpContent({ product }) {
  const { t } = useTranslation();

  const [selectedImage, setSelectedImage] = useState(0);
  const [selectedColor, setSelectedColor] = useState(product.colors[0]);
  const [selectedStorage, setSelectedStorage] = useState(product.storageOptions[0]);
  const [quantity, setQuantity] = useState(1);

  const addItem = useCartStore((state) => state.addItem);
  const toggleWishlist = useWishlistStore((state) => state.toggleWishlist);
  const isInWishlist = useWishlistStore((state) => state.isInWishlist(product.id));
  const toast = useToastStore();
  const addRecentlyViewed = useRecentlyViewedStore((state) => state.addRecentlyViewed);

  useEffect(() => {
    addRecentlyViewed({ ...product, image: product.images[0] });
    document.title = `${product.name} — iPhone Man`;
    return () => {
      document.title = 'iPhone Man — Premium Phones & Accessories';
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [product.id]);

  const currentPrice = product.price + selectedStorage.delta;

  const handleAddToCart = () => {
    const variant = `${selectedStorage.label} / ${selectedColor.nameEn}`;
    addItem({ ...product, price: currentPrice, image: product.images[0] }, variant, quantity);
    toast.success(t('common.addedToCart'));
  };

  const handleToggleWishlist = () => {
    toggleWishlist({ ...product, image: product.images[0], price: currentPrice });
    if (isInWishlist) {
      toast.info(t('common.removedFromWishlist'));
    } else {
      toast.success(t('common.addedToWishlist'));
    }
  };

  return (
    <div className="space-y-10 pb-28 lg:pb-16 text-start">
      {/* Breadcrumb */}
      <nav className="flex items-center gap-1.5 text-[11px] font-medium text-text-secondary" aria-label={t('common.breadcrumbHome')}>
        <Link to="/" className="hover:text-text-primary transition-colors duration-fast">{t('common.breadcrumbHome')}</Link>
        <ChevronLeft className="w-3 h-3 rtl:rotate-0 ltr:rotate-180" />
        <Link to="/products" className="hover:text-text-primary transition-colors duration-fast">{t('common.breadcrumbProducts')}</Link>
        <ChevronLeft className="w-3 h-3 rtl:rotate-0 ltr:rotate-180" />
        <span className="text-text-primary font-semibold">{product.name}</span>
      </nav>

      {/* Product Main Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12 items-start">
        {/* Image Gallery */}
        <div className="flex gap-3">
          {/* Thumbnails */}
          <div className="flex flex-col gap-2">
            {product.images.map((img, idx) => (
              <button
                key={idx}
                onClick={() => setSelectedImage(idx)}
                className={`w-14 h-14 rounded-lg overflow-hidden border-2 transition-all duration-fast p-0.5 active:scale-95 ${
                  selectedImage === idx
                    ? 'border-interactive-primary shadow-sm scale-105'
                    : 'border-border-default opacity-60 hover:opacity-100'
                }`}
                aria-label={`${t('pdp.thumbnailAria')} ${idx + 1}`}
              >
                <img src={img} alt={`${product.name} ${idx + 1}`} className="w-full h-full object-cover rounded-md" width={56} height={56} loading="lazy" />
              </button>
            ))}
          </div>

          {/* Main Image */}
          <div className="relative flex-1 aspect-square rounded-2xl bg-gradient-to-br from-[#08120E] to-[#0a1a14] overflow-hidden border border-border-default flex items-center justify-center">
            {product.inStock && (
              <span className="absolute top-3 start-3 bg-success-500 text-white text-[10px] font-bold px-2.5 py-1 rounded-full z-10 flex items-center gap-1">
                <Check className="w-3 h-3" strokeWidth={2} />
                {t('common.inStock')}
              </span>
            )}
            <img
              key={selectedImage}
              src={product.images[selectedImage]}
              alt={product.name}
              className="w-[82%] h-[82%] object-contain animate-image-swap"
              width={800}
              height={800}
              loading="eager"
            />
          </div>
        </div>

        {/* Product Info */}
        <div className="space-y-5">
          {/* Brand & Name */}
          <div className="space-y-1">
            <span className="text-[10px] font-bold uppercase tracking-[0.15em] text-text-brand">{product.brand}</span>
            <h1 className="text-3xl sm:text-4xl font-bold text-text-primary tracking-tight">{product.name}</h1>
            <p className="text-sm text-text-secondary">{product.subtitle}</p>
          </div>

          {/* Price */}
          <div className="flex items-baseline gap-3">
            <span className="text-3xl font-bold text-text-primary tracking-tight">
              <bdi>{currentPrice.toLocaleString()} ₪</bdi>
            </span>
            {selectedStorage.delta > 0 && (
              <span className="text-xs text-text-secondary font-medium">
                (+{selectedStorage.delta.toLocaleString()} ₪)
              </span>
            )}
          </div>

          {/* Description */}
          <p className="text-sm text-text-secondary leading-relaxed max-w-lg">
            {product.description}
          </p>

          {/* Color Selector */}
          <div className="space-y-2.5">
            <label className="text-xs font-bold text-text-primary block">
              {t('common.color')}: <span className="text-text-brand">{selectedColor.name}</span>
            </label>
            <div className="flex items-center gap-3">
              {product.colors.map((c) => (
                <button
                  key={c.name}
                  onClick={() => setSelectedColor(c)}
                  className={`w-9 h-9 rounded-full border-2 transition-all duration-fast ease-emphasized active:scale-90 ${
                    selectedColor.name === c.name ? 'border-interactive-primary scale-110 shadow-sm' : 'border-border-default hover:border-interactive-primary/40'
                  }`}
                  style={{ backgroundColor: c.hex }}
                  aria-label={c.name}
                />
              ))}
            </div>
          </div>

          {/* Storage Selector */}
          <div className="space-y-2.5">
            <label className="text-xs font-bold text-text-primary block">{t('pdp.selectStorage')}</label>
            <div className="grid grid-cols-2 gap-2.5">
              {product.storageOptions.map((opt) => (
                <button
                  key={opt.label}
                  onClick={() => setSelectedStorage(opt)}
                  className={`p-3.5 rounded-xl border text-xs font-bold flex justify-between items-center transition-all duration-fast active:scale-[0.98] ${
                    selectedStorage.label === opt.label
                      ? 'border-interactive-primary bg-blue-50/50 dark:bg-blue-950/30 text-interactive-primary'
                      : 'border-border-default bg-background-secondary text-text-primary hover:border-border-strong'
                  }`}
                >
                  <span>{opt.label}</span>
                  <span className="text-[11px] text-text-secondary">{opt.note}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Quantity */}
          <div className="space-y-2">
            <label className="text-xs font-bold text-text-primary block">{t('common.quantity')}</label>
            <div className="flex items-center gap-3">
              <div className="flex items-center border border-border-default rounded-xl overflow-hidden bg-background-primary">
                <button
                  onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                  className="w-10 h-10 flex items-center justify-center text-text-secondary hover:bg-background-secondary active:scale-90 transition-all duration-fast"
                  aria-label={t('pdp.decreaseQuantity')}
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
                <span className="w-10 text-center text-sm font-bold text-text-primary">{quantity}</span>
                <button
                  onClick={() => setQuantity((q) => q + 1)}
                  className="w-10 h-10 flex items-center justify-center text-text-secondary hover:bg-background-secondary active:scale-90 transition-all duration-fast"
                  aria-label={t('pdp.increaseQuantity')}
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="space-y-3 pt-2">
            <div className="flex gap-3">
              <button
                onClick={handleAddToCart}
                className="flex-1 flex items-center justify-center gap-2 bg-interactive-primary hover:bg-interactive-primary-hover active:scale-[0.97] text-text-inverse py-3.5 rounded-full text-sm font-semibold transition-all duration-fast shadow-sm"
              >
                <ShoppingBag className="w-4 h-4" strokeWidth={1.6} />
                <span>{t('pdp.addToCart')}</span>
              </button>
              <button
                onClick={handleToggleWishlist}
                className={`w-12 h-12 rounded-full border flex items-center justify-center transition-all duration-fast active:scale-90 ${
                  isInWishlist
                    ? 'bg-error-500/10 border-error-500/30 text-error-500'
                    : 'border-border-default text-text-secondary hover:border-border-strong hover:text-text-primary'
                }`}
                aria-label={isInWishlist ? t('common.removedFromWishlist') : t('common.addedToWishlist')}
              >
                <Heart className="w-5 h-5" fill={isInWishlist ? 'currentColor' : 'none'} strokeWidth={1.6} />
              </button>
              <button
                className="w-12 h-12 rounded-full border border-border-default flex items-center justify-center text-text-secondary hover:border-border-strong hover:text-text-primary active:scale-90 transition-all duration-fast"
                aria-label={t('pdp.shareAria')}
              >
                <Share2 className="w-5 h-5" strokeWidth={1.6} />
              </button>
            </div>
          </div>

          {/* Delivery & Warranty Info */}
          <div className="space-y-2 pt-3 border-t border-border-default">
            <div className="flex items-center gap-2 text-xs text-success-600 font-medium">
              <Truck className="w-4 h-4" strokeWidth={1.6} />
              {product.deliveryInfo}
            </div>
            <div className="flex items-center gap-2 text-xs text-text-secondary font-medium">
              <ShieldCheck className="w-4 h-4 text-text-brand" strokeWidth={1.6} />
              {product.warranty}
            </div>
          </div>
        </div>
      </div>

      {/* Features Section */}
      <section className="space-y-4">
        <h2 className="heading-section">{t('pdp.experience')}</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {[
            { icon: Zap, title: t('pdp.fastPerformance'), desc: t('pdp.fastPerformanceDesc') },
            { icon: Camera, title: t('pdp.proCamera'), desc: t('pdp.proCameraDesc') },
            { icon: BatteryCharging, title: t('pdp.batteryLife'), desc: t('pdp.batteryLifeDesc') },
          ].map((feature) => (
            <div key={feature.title} className="p-5 rounded-2xl bg-background-secondary border border-border-default space-y-2.5 transition-all duration-normal hover:border-border-strong">
              <div className="w-9 h-9 rounded-xl bg-blue-500/10 text-text-brand flex items-center justify-center">
                <feature.icon className="w-5 h-5" strokeWidth={1.6} />
              </div>
              <h3 className="font-bold text-sm text-text-primary">{feature.title}</h3>
              <p className="text-xs text-text-secondary leading-relaxed">{feature.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Technical Specifications */}
      <section className="space-y-4">
        <h2 className="heading-section">{t('common.specs')}</h2>
        <div className="rounded-2xl border border-border-default bg-background-secondary overflow-hidden divide-y divide-border-default max-w-3xl">
          {product.specs.map((s, idx) => (
            <div key={idx} className="flex justify-between items-center px-6 py-3.5 text-xs">
              <span className="font-bold text-text-primary">{s.label}</span>
              <span className="font-medium text-text-secondary text-start dir-ltr">{s.value}</span>
            </div>
          ))}
        </div>
      </section>

      {/* Customer Reviews */}
      <ReviewSection productId={product.id} />

      {/* Related Products */}
      <section className="space-y-4 border-t border-border-default pt-8">
        <h2 className="heading-section">{t('common.relatedProducts')}</h2>
        <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-4 gap-4">
          {product.relatedProducts.map((p) => (
            <ProductCard key={p.id} product={p} />
          ))}
        </div>
      </section>

      {/* Mobile Sticky Cart Bar (INSTRUCTIONS.md §21) */}
      <div className="fixed bottom-0 inset-x-0 z-[1000] lg:hidden bg-background-primary/95 backdrop-blur-md border-t border-border-default p-3 shadow-lg flex items-center justify-between gap-3">
        <div>
          <span className="text-[10px] font-bold uppercase tracking-wider text-text-secondary block">{product.name}</span>
          <span className="font-bold text-base text-text-primary">
            <bdi>{currentPrice.toLocaleString()} ₪</bdi>
          </span>
        </div>
        <button
          onClick={handleAddToCart}
          className="flex items-center gap-2 bg-interactive-primary text-text-inverse px-5 py-2.5 rounded-full text-xs font-semibold hover:bg-interactive-primary-hover active:scale-95 transition-all duration-fast shadow-sm"
        >
          <ShoppingBag className="w-4 h-4" strokeWidth={1.6} />
          <span>{t('pdp.addToCart')}</span>
        </button>
      </div>
    </div>
  );
}

export default PDP;