import { Clock3, Mail, MapPin, Phone } from 'lucide-react';
import { useTranslation } from '../../../shared/i18n/useTranslation';

const CONTACT_ITEMS = [
  { icon: MapPin, key: 'contactPage.address' },
  { icon: Phone, key: 'contactPage.phone' },
  { icon: Mail, key: 'contactPage.email' },
  { icon: Clock3, key: 'contactPage.hours' },
];

export function ContactPage() {
  const { t } = useTranslation();

  return (
    <section className="pb-12 lg:pb-16">
      <div className="rounded-2xl border border-border-default bg-background-secondary p-6 shadow-sm lg:p-9">
        <span className="label-editorial">{t('contactPage.kicker')}</span>
        <h1 className="mt-3 font-display-ar text-3xl leading-tight text-text-primary lg:text-4xl">
          {t('contactPage.title')}
        </h1>
        <p className="mt-4 max-w-3xl text-sm leading-8 text-text-secondary">
          {t('contactPage.description')}
        </p>
      </div>

      <div className="mt-5 grid grid-cols-1 gap-4 sm:grid-cols-2">
        {CONTACT_ITEMS.map((item) => (
          <article key={item.key} className="rounded-2xl border border-border-default bg-background-secondary p-5 shadow-sm">
            <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-lg bg-blue-500/10 text-text-brand">
              <item.icon className="h-5 w-5" strokeWidth={1.7} />
            </div>
            <h2 className="text-xs font-bold uppercase tracking-[0.08em] text-text-secondary">
              {t(`${item.key}.label`)}
            </h2>
            <p className="mt-2 text-sm font-bold text-text-primary">{t(`${item.key}.value`)}</p>
          </article>
        ))}
      </div>
    </section>
  );
}

export default ContactPage;