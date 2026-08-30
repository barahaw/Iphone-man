import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Heart, ShoppingBag, ArrowUpDown } from 'lucide-react';
import { useWishlistStore } from '../../../shared/stores/useWishlistStore';
import { useCartStore } from '../../../shared/stores/useCartStore';
import { useCompareStore } from '../../../shared/stores/useCompareStore';
import { useToastStore } from '../../../shared/stores/useToastStore';
import { useTranslation } from '../../../shared/i18n/useTranslation';
import { SurfaceCard } from '../../../shared/components/ui/SurfaceCard';

const PLACEHOLDER_IMG = '/placeholder-product.svg';

export function ProductCard({ product }) {
  const { t } = useTranslation();
  const toggleWishlist = useWishlistStore((state) => state.toggleWishlist);
  const isInWishlist = useWishlistStore((state) => state.isInWishlist(product.id));
  const toggleCompare = useCompareStore((state) => state.toggleCompare);
  const isInCompare = useCompareStore((state) => state.isInCompare(product.id));
  const addItem = useCartStore((state) => state.addItem);
  const toast = useToastStore();
  const [imgSrc, setImgSrc] = useState(product.image || PLACEHOLDER_IMG);
  const [isHeartPopping, setIsHeartPopping] = useState(false);

  const handleWishlist = (event) => {
    event.preventDefault();
    event.stopPropagation();
    setIsHeartPopping(true);
    setTimeout(() => setIsHeartPopping(false), 250);
    toggleWishlist(product);
    toast.info(isInWishlist ? t('common.removedFromWishlist') : t('common.addedToWishlist'));
  };

  const handleCompare = (event) => {
    event.preventDefault();
    event.stopPropagation();
    const res = toggleCompare(product);
    if (res.action === 'limit_reached') {
      toast.error(t('common.compareLimitReached'));
    } else if (res.action === 'added') {
      toast.success(t('common.addedToCompare'));
    } else {
      toast.info(t('common.removedFromCompare'));
    }
  };

  const handleAddToCart = (event) => {
    event.preventDefault();
    event.stopPropagation();
    addItem(product, product.subtitle || 'Standard', 1);
    toast.success(t('common.addedToCart'));
  };

  return (
    <SurfaceCard
      as={Link}
      to={`/product/${product.slug}`}
      interactive
      className="group product-card rounded-2xl border-border-default bg-background-secondary transition-all duration-normal ease-emphasized"
    >
      <div className="relative aspect-square w-full overflow-hidden border-b border-border-default bg-background-primary">
        <img
          src={imgSrc}
          alt={product.name}
          className="h-full w-full object-cover transition-transform duration-slow ease-emphasized group-hover:scale-[1.03]"
          loading="lazy"
          onError={() => setImgSrc(PLACEHOLDER_IMG)}
          width={400}
          height={400}
        />

        <div className="absolute end-3 top-3 flex items-center gap-1.5">
          <button
            onClick={handleCompare}
            className={`flex h-9 w-9 items-center justify-center rounded-full border transition-all duration-fast ease-standard ${
              isInCompare
                ? 'border-interactive-primary bg-interactive-primary text-text-inverse'
                : 'border-border-default bg-background-primary/90 text-text-primary backdrop-blur-xs hover:border-interactive-primary'
            } active:scale-90`}
            aria-label={t('common.compare')}
          >
            <ArrowUpDown className="h-4 w-4" strokeWidth={1.6} />
          </button>

          <button
            onClick={handleWishlist}
            className={`flex h-9 w-9 items-center justify-center rounded-full border transition-all duration-fast ease-standard ${
              isInWishlist
                ? 'border-text-primary bg-text-primary text-background-primary'
                : 'border-border-default bg-background-primary/90 text-text-primary backdrop-blur-xs hover:border-text-primary'
            } ${isHeartPopping ? 'animate-badge-pop' : ''} active:scale-90`}
            aria-label={isInWishlist ? t('common.remove') : t('common.addedToWishlist')}
          >
            <Heart className="h-4 w-4 transition-transform duration-fast" strokeWidth={1.6} fill={isInWishlist ? 'currentColor' : 'none'} />
          </button>
        </div>
      </div>

      <div className="flex flex-1 flex-col p-4">
        <span className="text-[10px] font-semibold uppercase tracking-[0.12em] text-text-secondary">
          {product.brand || 'iPhone Man'}
        </span>
        <h3 className="mt-1 line-clamp-1 font-display-ar text-xl font-semibold leading-none text-text-primary">
          <bdi>{product.name}</bdi>
        </h3>
        {product.subtitle && (
          <p className="mt-1.5 line-clamp-1 text-xs text-text-secondary">{product.subtitle}</p>
        )}

        <div className="mt-3 flex items-center gap-2 text-[11px]">
          <span className={`h-1.5 w-1.5 rounded-full ${product.inStock !== false ? 'bg-success-500' : 'bg-neutral-400'}`} />
          <span className={product.inStock !== false ? 'text-text-primary font-medium' : 'text-text-secondary'}>
            {product.inStock !== false ? t('common.inStock') : t('common.outOfStock')}
          </span>
        </div>

        <div className="mt-4 flex items-center justify-between border-t border-border-default pt-3">
          <span className="font-display-ar text-xl font-bold leading-none text-text-primary">
            <bdi>{product.price.toLocaleString()} ₪</bdi>
          </span>
          <button
            onClick={handleAddToCart}
            className="inline-flex h-9 items-center gap-1.5 rounded-full bg-interactive-primary px-3.5 text-xs font-semibold text-text-inverse transition-all duration-fast ease-standard hover:bg-interactive-primary-hover active:scale-[0.96]"
            aria-label={t('common.addToCart')}
          >
            <ShoppingBag className="h-3.5 w-3.5" strokeWidth={1.6} />
            {t('common.addToCart')}
          </button>
        </div>
      </div>
    </SurfaceCard>
  );
}

export default ProductCard;
