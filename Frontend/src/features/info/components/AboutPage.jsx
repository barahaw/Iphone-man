import { Building2, ShieldCheck, Sparkles, Users } from 'lucide-react';
import { useTranslation } from '../../../shared/i18n/useTranslation';

const INFO_CARDS = [
  { icon: Building2, key: 'aboutPage.card1' },
  { icon: Users, key: 'aboutPage.card2' },
  { icon: ShieldCheck, key: 'aboutPage.card3' },
  { icon: Sparkles, key: 'aboutPage.card4' },
];

export function AboutPage() {
  const { t } = useTranslation();

  return (
    <section className="pb-12 lg:pb-16">
      <div className="rounded-2xl border border-border-default bg-background-secondary p-6 shadow-sm lg:p-9">
        <span className="label-editorial">{t('aboutPage.kicker')}</span>
        <h1 className="mt-3 font-display-ar text-3xl leading-tight text-text-primary lg:text-4xl">
          {t('aboutPage.title')}
        </h1>
        <p className="mt-4 max-w-3xl text-sm leading-8 text-text-secondary">
          {t('aboutPage.description')}
        </p>
      </div>

      <div className="mt-5 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {INFO_CARDS.map((card) => (
          <article key={card.key} className="rounded-2xl border border-border-default bg-background-secondary p-5 shadow-sm">
            <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-lg bg-blue-500/10 text-text-brand">
              <card.icon className="h-5 w-5" strokeWidth={1.7} />
            </div>
            <h2 className="text-sm font-bold text-text-primary">{t(`${card.key}.title`)}</h2>
            <p className="mt-2 text-xs leading-6 text-text-secondary">{t(`${card.key}.desc`)}</p>
          </article>
        ))}
      </div>
    </section>
  );
}

export default AboutPage;