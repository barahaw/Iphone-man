import { Camera, Mail, MapPin, Phone, Users } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useTranslation } from '../i18n/useTranslation';

export function Footer() {
  const { t } = useTranslation();

  const navLinks = [
    { labelKey: 'nav.home', path: '/' },
    { labelKey: 'nav.products', path: '/products' },
    { labelKey: 'nav.categories', path: '/products?category=all' },
  ];

  const helpLinks = [
    { labelKey: 'footer.faq', path: '/' },
    { labelKey: 'footer.support', path: '/contact' },
    { labelKey: 'footer.trackOrder', path: '/' },
  ];

  return (
    <footer className="mt-10 w-full border-t border-white/18 bg-black text-white">
      <div className="mx-auto grid w-full max-w-[1440px] grid-cols-1 gap-8 px-6 py-10 lg:grid-cols-12 lg:gap-6">
        <div className="lg:col-span-4">
          <Link to="/" className="inline-flex items-center gap-2" aria-label={t('nav.home')}>
            <img src="/logo.jpg" alt="iPhone Man" className="h-10 w-10 rounded-md object-cover" />
            <span className="font-display-ar text-2xl font-semibold">iPhone Man</span>
          </Link>
          <p className="mt-4 max-w-sm text-sm leading-7 text-white/72">
            {t('footer.tagline')}
          </p>
          <div className="mt-5 flex items-center gap-2">
            <a href="/" aria-label="Instagram" className="inline-flex h-10 w-10 items-center justify-center rounded-md border border-white/30 text-white/80 hover:border-white hover:text-white">
              <Camera className="h-4 w-4" strokeWidth={1.7} />
            </a>
            <a href="/" aria-label="Facebook" className="inline-flex h-10 w-10 items-center justify-center rounded-md border border-white/30 text-white/80 hover:border-white hover:text-white">
              <Users className="h-4 w-4" strokeWidth={1.7} />
            </a>
          </div>
        </div>

        <div className="lg:col-span-2">
          <h4 className="font-display-ar text-xl font-semibold">{t('footer.navTitle')}</h4>
          <nav className="mt-3 space-y-2" aria-label={t('common.ariaMainNav')}>
            {navLinks.map((item) => (
              <Link key={item.labelKey} to={item.path} className="block text-sm text-white/80 transition-colors hover:text-white">
                {t(item.labelKey)}
              </Link>
            ))}
          </nav>
        </div>

        <div className="lg:col-span-2">
          <h4 className="font-display-ar text-xl font-semibold">{t('footer.helpTitle')}</h4>
          <nav className="mt-3 space-y-2">
            {helpLinks.map((item) => (
              <Link key={item.labelKey} to={item.path} className="block text-sm text-white/80 transition-colors hover:text-white">
                {t(item.labelKey)}
              </Link>
            ))}
          </nav>
        </div>

        <div className="lg:col-span-4">
          <h4 className="font-display-ar text-xl font-semibold">{t('footer.storeTitle')}</h4>
          <ul className="mt-3 space-y-2.5 text-sm text-white/80">
            <li className="flex items-start gap-2">
              <MapPin className="mt-0.5 h-4 w-4 shrink-0" strokeWidth={1.7} />
              <span>{t('footer.street')}</span>
            </li>
            <li className="flex items-start gap-2">
              <Phone className="mt-0.5 h-4 w-4 shrink-0" strokeWidth={1.7} />
              <a href="tel:+970123346789" dir="ltr" className="hover:text-white">+970 123346789</a>
            </li>
            <li className="flex items-start gap-2">
              <Mail className="mt-0.5 h-4 w-4 shrink-0" strokeWidth={1.7} />
              <a href="mailto:info@iphoneman.ps" className="hover:text-white">info@iphoneman.ps</a>
            </li>
          </ul>
        </div>
      </div>

      <div className="border-t border-white/18">
        <div className="mx-auto flex w-full max-w-[1440px] flex-col gap-2 px-6 py-4 text-xs text-white/65 sm:flex-row sm:items-center sm:justify-between">
          <p>{t('footer.copyright').replace('{year}', String(new Date().getFullYear()))}</p>
          <div className="flex items-center gap-4">
            <Link to="/" className="hover:text-white">{t('footer.privacy')}</Link>
            <Link to="/" className="hover:text-white">{t('footer.terms')}</Link>
          </div>
        </div>
      </div>
    </footer>
  );
}

export default Footer;