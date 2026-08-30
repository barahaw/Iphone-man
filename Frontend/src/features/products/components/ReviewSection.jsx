import { useState } from 'react';
import { Star, Check } from 'lucide-react';
import { useTranslation } from '../../../shared/i18n/useTranslation';
import { useToastStore } from '../../../shared/stores/useToastStore';

const INITIAL_REVIEWS = [
  {
    id: 'rv1',
    author: 'أحمد الخليلي',
    rating: 5,
    date: '2026-08-01',
    body: 'منتج ممتاز جداً، التغليف احترافي والجهاز جديد بالكامل. التوصيل كان سريع والخدمة رائعة. بوصي به لكل الناس!',
    verified: true,
  },
  {
    id: 'rv2',
    author: 'سارة ابراهيم',
    rating: 5,
    date: '2026-07-22',
    body: 'كمرا خرافية والاداء سريع جداً. أفضل هاتف استخدمته حتى الآن. شكراً iPhone Man!',
    verified: true,
  },
  {
    id: 'rv3',
    author: 'محمد العواد',
    rating: 4,
    date: '2026-07-14',
    body: 'جهاز ممتاز والسعر معقول مقارنة بالأسواق المحيطة. الشحن مجاني ميزة كبيرة. التوصيل أخذ يومين فقط.',
    verified: false,
  },
];

function RatingStarsDisplay({ rating, size = 'sm' }) {
  const { t } = useTranslation();
  const sizes = { sm: 'w-3.5 h-3.5', md: 'w-4 h-4', lg: 'w-5 h-5' };
  return (
    <div className="flex items-center gap-0.5" aria-label={`${t('common.rating')} ${rating}/5`} role="img">
      {Array.from({ length: 5 }).map((_, i) => (
        <Star
          key={i}
          className={`${sizes[size]} ${i < rating ? 'text-warning-500 fill-current' : 'text-border-default'}`}
          strokeWidth={0}
        />
      ))}
    </div>
  );
}

function RatingInput({ value, onChange }) {
  const { t } = useTranslation();
  const [hovered, setHovered] = useState(0);
  return (
    <div className="flex items-center gap-1" role="group" aria-label={t('pdp.ratingScore')}>
      {Array.from({ length: 5 }).map((_, i) => (
        <button
          key={i}
          type="button"
          onClick={() => onChange(i + 1)}
          onMouseEnter={() => setHovered(i + 1)}
          onMouseLeave={() => setHovered(0)}
          className="p-0.5 focus:outline-none focus-visible:ring-2 focus-visible:ring-interactive-primary rounded-sm"
          aria-label={`${i + 1} ${t('common.rating')}`}
          aria-pressed={value === i + 1}
        >
          <Star
            className={`w-6 h-6 transition-colors duration-fast ${
              i < (hovered || value) ? 'text-warning-500 fill-current' : 'text-border-default'
            }`}
            strokeWidth={0}
          />
        </button>
      ))}
    </div>
  );
}

function ReviewCard({ review, locale }) {
  const { t } = useTranslation();
  const dateLocale = { en: 'en-GB', ar: 'ar-PS', he: 'he-IL' }[locale] || 'ar-PS';
  return (
    <div className="p-4 rounded-xl bg-background-secondary border border-border-default space-y-2 text-start">
      <div className="flex items-start justify-between gap-3">
        <div className="space-y-0.5">
          <div className="flex items-center gap-2">
            <span className="text-sm font-bold text-text-primary">{review.author}</span>
            {review.verified && (
              <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-success-50 text-success-600 border border-success-500/20">
                <Check className="w-3 h-3 inline-block align-[-1px]" strokeWidth={2.5} />
                <span className="ms-1">{t('pdp.verifiedBuyer')}</span>
              </span>
            )}
          </div>
          <time className="text-[11px] text-text-secondary" dateTime={review.date}>
            {new Date(review.date).toLocaleDateString(dateLocale, { year: 'numeric', month: 'long', day: 'numeric' })}
          </time>
        </div>
        <RatingStarsDisplay rating={review.rating} />
      </div>
      <p className="text-sm text-text-secondary leading-relaxed">{review.body}</p>
    </div>
  );
}

function ReviewForm({ onSubmit }) {
  const { t } = useTranslation();
  const [rating, setRating] = useState(0);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [body, setBody] = useState('');
  const [errors, setErrors] = useState({});

  const validate = () => {
    const errs = {};
    if (!name.trim()) errs.name = t('checkout.requiredField');
    if (!email.trim()) errs.email = t('checkout.requiredField');
    if (rating === 0) errs.rating = t('pdp.selectRating');
    if (!body.trim()) errs.body = t('checkout.requiredField');
    return errs;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const errs = validate();
    if (Object.keys(errs).length > 0) {
      setErrors(errs);
      return;
    }
    onSubmit({ author: name, email, rating, body, verified: false, date: new Date().toISOString() });
    setRating(0);
    setName('');
    setEmail('');
    setBody('');
    setErrors({});
  };

  const fieldClass = (err) =>
    `w-full rounded-xl border bg-background-primary px-4 py-3 text-sm text-text-primary placeholder:text-text-secondary/60 focus:outline-none transition-all ${
      err
        ? 'border-error-500 focus:border-error-500 focus:ring-1 focus:ring-error-500/20'
        : 'border-border-default focus:border-interactive-primary/40 focus:ring-1 focus:ring-interactive-primary/20'
    }`;

  return (
    <form onSubmit={handleSubmit} noValidate className="space-y-4 p-5 rounded-2xl bg-background-secondary border border-border-default text-start">
      <h4 className="text-sm font-bold text-text-primary">{t('pdp.writeReview')}</h4>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="space-y-1.5">
          <label className="block text-[11px] font-bold text-text-primary uppercase tracking-wider">{t('pdp.reviewerName')} *</label>
          <input type="text" value={name} onChange={(e) => setName(e.target.value)} className={fieldClass(errors.name)} />
          {errors.name && <p className="text-[11px] text-error-500 font-medium">{errors.name}</p>}
        </div>
        <div className="space-y-1.5">
          <label className="block text-[11px] font-bold text-text-primary uppercase tracking-wider">{t('pdp.orderEmail')} *</label>
          <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} className={fieldClass(errors.email)} />
          {errors.email && <p className="text-[11px] text-error-500 font-medium">{errors.email}</p>}
        </div>
      </div>

      <div className="space-y-1.5">
        <label className="block text-[11px] font-bold text-text-primary uppercase tracking-wider">{t('pdp.ratingScore')} *</label>
        <RatingInput value={rating} onChange={setRating} />
        {errors.rating && <p className="text-[11px] text-error-500 font-medium">{errors.rating}</p>}
      </div>

      <div className="space-y-1.5">
        <label className="block text-[11px] font-bold text-text-primary uppercase tracking-wider">{t('pdp.reviewComment')} *</label>
        <textarea
          rows={4}
          value={body}
          onChange={(e) => setBody(e.target.value)}
          className={fieldClass(errors.body)}
          placeholder={t('pdp.reviewCommentPlaceholder')}
        />
        {errors.body && <p className="text-[11px] text-error-500 font-medium">{errors.body}</p>}
      </div>

      <button
        type="submit"
        className="px-5 py-2.5 bg-interactive-primary text-text-inverse text-xs font-bold rounded-xl hover:bg-interactive-primary-hover transition-colors active:scale-[0.97]"
      >
        {t('pdp.submitReview')}
      </button>
    </form>
  );
}

export function ReviewSection() {
  const { t, locale } = useTranslation();
  const toast = useToastStore();
  const [reviews, setReviews] = useState(INITIAL_REVIEWS);
  const [showForm, setShowForm] = useState(false);

  const handleSubmit = (review) => {
    const newReview = { ...review, id: `rv-${Date.now()}` };
    setReviews((prev) => [newReview, ...prev]);
    setShowForm(false);
    toast.success(t('pdp.reviewSuccess'));
  };

  const avgRating = reviews.length > 0
    ? Math.round(reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length)
    : 0;

  return (
    <section className="space-y-5 text-start" aria-labelledby="reviews-heading">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 id="reviews-heading" className="text-xl font-bold text-text-primary">{t('pdp.customerReviews')}</h2>
          <div className="flex items-center gap-2 mt-1">
            <RatingStarsDisplay rating={avgRating} size="md" />
            <span className="text-xs text-text-secondary font-medium">
              {avgRating}.0 ({reviews.length} {t('common.reviews')})
            </span>
          </div>
        </div>
        <button
          onClick={() => setShowForm((v) => !v)}
          className="px-4 py-2 border border-border-default rounded-full text-xs font-bold text-text-primary hover:bg-background-secondary transition-colors"
        >
          {t('pdp.writeReview')}
        </button>
      </div>

      {showForm && (
        <ReviewForm onSubmit={handleSubmit} />
      )}

      <div className="space-y-3">
        {reviews.map((rv) => (
          <ReviewCard key={rv.id} review={rv} locale={locale} />
        ))}
      </div>
    </section>
  );
}

export default ReviewSection;
