import { Link } from 'react-router-dom';
import {
  ArrowLeft,
  ArrowUpRight,
  AudioLines,
  Cable,
  CircleCheck,
  Headphones,
  MessageCircle,
  ShieldCheck,
  Smartphone,
  Truck,
  Watch,
} from 'lucide-react';
import { ProductCard } from '../../products/components/ProductCard';
import { RecentlyViewedSection } from '../../products/components/RecentlyViewedSection';
import { Reveal } from '../../../shared/components/ui/Reveal';
import { SurfaceCard } from '../../../shared/components/ui/SurfaceCard';
import { useTranslation } from '../../../shared/i18n/useTranslation';

const CATEGORIES = [
  { nameKey: 'home.smartphones', image: 'https://images.unsplash.com/photo-1695048133142-1a20484d2569?w=900&auto=format&fit=crop&q=82', link: '/products?category=smartphones', icon: Smartphone },
  { nameKey: 'home.accessories', image: 'https://images.unsplash.com/photo-1601784551446-20c9e07cdbdb?w=900&auto=format&fit=crop&q=82', link: '/products?category=accessories', icon: Cable },
  { nameKey: 'home.watches', image: 'https://images.unsplash.com/photo-1579586337278-3befd40fd17a?w=900&auto=format&fit=crop&q=82', link: '/products?category=watches', icon: Watch },
  { nameKey: 'home.audio', image: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=900&auto=format&fit=crop&q=82', link: '/products?category=accessories', icon: AudioLines },
];

const LATEST_PRODUCTS = [
  { id: 'p17', name: 'iPhone 17 Pro', slug: 'iphone-17-pro', subtitle: 'Titanium — 256GB', brand: 'Apple', price: 4299, isNew: true, inStock: true, image: 'https://images.unsplash.com/photo-1695048133142-1a20484d2569?w=700&auto=format&fit=crop&q=82' },
  { id: 'p2', name: 'Galaxy S24 Ultra', slug: 'galaxy-s24-ultra', subtitle: 'Titanium Gray — 512GB', brand: 'Samsung', price: 4899, inStock: true, image: 'https://images.unsplash.com/photo-1610945265064-0e34e5519bbf?w=700&auto=format&fit=crop&q=82' },
  { id: 'p3', name: 'Pixel 9 Pro', slug: 'google-pixel-9-pro', subtitle: '128GB — Obsidian', brand: 'Google', price: 3799, isNew: true, inStock: true, image: 'https://images.unsplash.com/photo-1598327105666-5b89351aff97?w=700&auto=format&fit=crop&q=82' },
  { id: 'p4', name: 'AirPods Max', slug: 'airpods-max', subtitle: 'Wireless Over-Ear', brand: 'Apple', price: 2150, inStock: true, image: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=700&auto=format&fit=crop&q=82' },
];

export function HomePage() {
  const { t } = useTranslation();

  return (
    <div className="text-start">
      <section className="-mt-8 border-b border-border-default pt-4 lg:-mt-10">
        <div className="grid grid-cols-1 gap-8 pb-10 lg:grid-cols-12 lg:items-end lg:gap-6 lg:pb-14">
          <Reveal className="space-y-6 lg:col-span-5">
            <span className="text-[11px] font-semibold uppercase tracking-[0.17em] text-text-secondary">{t('home.heroLabel')}</span>
            <h1 className="font-display-ar text-[clamp(2.8rem,7vw,6.2rem)] font-bold leading-[0.9] text-text-primary">
              {t('home.heroTitle1')}
              <br />
              {t('home.heroTitle2')}
            </h1>
            <p className="max-w-lg text-sm leading-8 text-text-secondary">
              {t('home.heroDesc')}
            </p>
            <div className="flex flex-wrap items-center gap-3">
              <Link to="/products" className="btn-primary">
                {t('home.browseProducts')}
                <ArrowUpRight className="h-3.5 w-3.5 rtl:rotate-0 ltr:rotate-180" strokeWidth={1.8} />
              </Link>
              <Link to="/products?category=smartphones" className="btn-secondary">
                {t('home.discoverMore')}
              </Link>
            </div>
          </Reveal>

          <Reveal className="relative lg:col-span-7" delay={100}>
            <div className="absolute top-3 start-3 z-10 bg-background-primary/90 px-2.5 py-1 text-[10px] font-semibold tracking-[0.12em] text-text-secondary rounded-md backdrop-blur-xs">
              {t('home.featuredBadge')}
            </div>
            <div className="absolute top-3 end-3 z-10 bg-background-primary/90 px-2.5 py-1 text-[10px] font-semibold tracking-[0.12em] text-text-secondary rounded-md backdrop-blur-xs">
              {t('home.newArrivalBadge')}
            </div>
            <img
              src="https://images.unsplash.com/photo-1695048133142-1a20484d2569?w=1200&auto=format&fit=crop&q=80"
              alt="iPhone 17 Pro"
              className="hero-float h-[360px] w-full rounded-2xl object-cover lg:h-[560px]"
              loading="eager"
              width={1200}
              height={800}
            />
            <div className="absolute bottom-4 start-4 rounded-xl border border-border-default bg-background-primary/90 px-4 py-2.5 backdrop-blur-sm shadow-sm">
              <p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-text-secondary">IPHONE 17 PRO</p>
              <p className="mt-0.5 text-sm font-bold text-text-primary">{t('home.startingFromPrice').replace('{price}', '4,299 ₪')}</p>
            </div>
          </Reveal>
        </div>
      </section>

      <section className="py-12 border-b border-border-default">
        <Reveal>
          <div className="mb-6 flex items-end justify-between gap-3">
            <div>
              <span className="text-[11px] font-semibold uppercase tracking-[0.17em] text-text-secondary">{t('common.categories')}</span>
              <h2 className="text-3xl font-bold text-text-primary mt-1">{t('home.shopByCategory')}</h2>
            </div>
            <Link to="/products" className="hidden text-sm font-medium text-text-secondary hover:text-text-primary transition-colors sm:inline-flex">
              {t('common.showAll')}
            </Link>
          </div>
        </Reveal>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {CATEGORIES.map((category, index) => (
            <Reveal key={category.nameKey} delay={index * 60}>
              <Link to={category.link} className="group block overflow-hidden rounded-2xl border border-border-default bg-background-secondary transition-all duration-normal hover:border-border-strong">
                <div className="relative aspect-[5/4] overflow-hidden">
                  <img
                    src={category.image}
                    alt={t(category.nameKey)}
                    className="h-full w-full object-cover transition-transform duration-slow group-hover:scale-[1.04]"
                    loading="lazy"
                    width={600}
                    height={480}
                  />
                  <div className="absolute inset-0 bg-background-dark/30 transition-opacity group-hover:bg-background-dark/20" />
                  <div className="absolute inset-x-0 bottom-0 flex items-center justify-between px-4 py-3 text-text-inverse">
                    <div className="flex items-center gap-2">
                      <category.icon className="h-4 w-4" strokeWidth={1.6} />
                      <span className="font-display-ar text-lg font-semibold">{t(category.nameKey)}</span>
                    </div>
                    <ArrowLeft className="h-4 w-4 transition-transform duration-fast group-hover:-translate-x-1 rtl:group-hover:translate-x-1" strokeWidth={1.8} />
                  </div>
                </div>
              </Link>
            </Reveal>
          ))}
        </div>
      </section>

      <section className="py-12 border-b border-border-default">
        <Reveal>
          <div className="mb-6 flex items-end justify-between gap-3">
            <div>
              <h2 className="text-3xl font-bold text-text-primary">{t('home.latestArrivals')}</h2>
              <p className="mt-1 text-sm text-text-secondary">{t('home.latestArrivalsDesc')}</p>
            </div>
            <Link to="/products" className="btn-secondary">{t('common.allProducts')}</Link>
          </div>
        </Reveal>
        <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
          {LATEST_PRODUCTS.map((product, index) => (
            <Reveal key={product.id} delay={index * 60}>
              <ProductCard product={product} />
            </Reveal>
          ))}
        </div>
      </section>

      <section className="py-12">
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-12 lg:items-center">
          <Reveal className="lg:col-span-5">
            <span className="text-[11px] font-semibold uppercase tracking-[0.17em] text-text-secondary">{t('home.campaignBadge')}</span>
            <h2 className="mt-2 font-display-ar text-[clamp(2.1rem,5vw,4.7rem)] font-bold leading-[0.9] text-text-primary">
              iPhone 17 Pro
            </h2>
            <p className="mt-3 text-sm text-text-secondary">{t('home.campaignSpecs')}</p>
            <p className="mt-5 font-display-ar text-4xl font-bold text-text-primary">
              4,299 ₪
            </p>
            <Link to="/product/iphone-17-pro" className="btn-primary mt-6">
              {t('home.exploreProduct')}
              <ArrowLeft className="h-4 w-4 rtl:rotate-0 ltr:rotate-180" strokeWidth={1.8} />
            </Link>
          </Reveal>

          <Reveal className="lg:col-span-7" delay={120}>
            <SurfaceCard className="overflow-hidden border-border-default bg-background-dark text-text-inverse rounded-3xl" elevated>
              <div className="grid grid-cols-1 gap-2 lg:grid-cols-2">
                <div className="p-6 lg:p-8">
                  <p className="text-[10px] uppercase tracking-[0.14em] text-text-secondary">{t('home.premiumCampaignLabel')}</p>
                  <h3 className="mt-4 font-display-ar text-3xl font-bold leading-[0.95] text-text-inverse">
                    {t('home.campaignTitle')}
                  </h3>
                  <p className="mt-4 text-sm leading-relaxed text-text-secondary">
                    {t('home.campaignDesc')}
                  </p>
                </div>
                <div className="relative min-h-[300px]">
                  <img
                    src="https://images.unsplash.com/photo-1695048133142-1a20484d2569?w=800&auto=format&fit=crop&q=80"
                    alt="iPhone 17 Pro featured"
                    className="h-full w-full object-cover"
                    loading="lazy"
                    width={800}
                    height={600}
                  />
                </div>
              </div>
            </SurfaceCard>
          </Reveal>
        </div>
      </section>

      <section className="py-12 border-y border-border-default">
        <Reveal>
          <h2 className="text-3xl font-bold text-text-primary">{t('home.whyBuyTitle')}</h2>
        </Reveal>
        <div className="mt-8 grid grid-cols-1 divide-y divide-border-default border-y border-border-default sm:grid-cols-2 sm:divide-x sm:divide-y-0 rtl:sm:divide-x-reverse">
          {[
            { num: '01', icon: CircleCheck, titleKey: 'home.trust1Title', descKey: 'home.trust1Desc' },
            { num: '02', icon: ShieldCheck, titleKey: 'home.trust2Title', descKey: 'home.trust2Desc' },
            { num: '03', icon: Truck, titleKey: 'home.trust3Title', descKey: 'home.trust3Desc' },
            { num: '04', icon: Headphones, titleKey: 'home.trust4Title', descKey: 'home.trust4Desc' },
          ].map((item) => (
            <div key={item.num} className="flex items-start gap-4 px-4 py-5 sm:px-6">
              <span className="text-xs font-semibold tracking-[0.14em] text-text-secondary">{item.num}</span>
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <item.icon className="h-4 w-4 text-text-brand" strokeWidth={1.7} />
                  <h3 className="font-display-ar text-xl font-semibold leading-none text-text-primary">{t(item.titleKey)}</h3>
                </div>
                <p className="mt-2 text-xs text-text-secondary">{t(item.descKey)}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      <section className="py-12">
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-12">
          <Reveal className="rounded-2xl border border-border-default bg-background-secondary p-6 lg:col-span-7">
            <span className="text-[10px] font-bold uppercase tracking-wider text-text-secondary">{t('home.supportBadge')}</span>
            <h2 className="mt-2 font-display-ar text-[clamp(2rem,4.4vw,3.5rem)] font-bold leading-[0.92] text-text-primary">
              {t('home.needHelp')}
            </h2>
            <p className="mt-3 max-w-xl text-sm leading-relaxed text-text-secondary">
              {t('home.needHelpDesc')}
            </p>
            <Link to="/contact" className="btn-secondary mt-5">
              {t('home.contactUs')}
              <MessageCircle className="h-4 w-4" strokeWidth={1.8} />
            </Link>
          </Reveal>

          <Reveal className="rounded-2xl border border-border-default bg-background-dark p-6 text-text-inverse lg:col-span-5" delay={100}>
            <h3 className="font-display-ar text-3xl font-bold text-text-inverse">{t('home.newsletter')}</h3>
            <p className="mt-2.5 text-xs leading-relaxed text-text-secondary">{t('home.newsletterHint')}</p>
            <div className="mt-5 flex flex-col gap-2.5 sm:flex-row">
              <input
                type="email"
                placeholder={t('common.emailPlaceholder')}
                className="h-11 w-full rounded-xl border border-border-strong bg-background-dark px-4 text-sm text-text-inverse placeholder:text-text-tertiary focus:border-interactive-focus focus:outline-none transition-colors"
              />
              <button type="button" className="btn-primary">
                {t('common.subscribe')}
              </button>
            </div>
          </Reveal>
        </div>
      </section>

      {/* Recently Viewed — client-side, device-local (INSTRUCTIONS.md §10, §38) */}
      <section className="container mx-auto px-4 lg:px-8 py-8">
        <RecentlyViewedSection />
      </section>
    </div>
  );
}

export default HomePage;
