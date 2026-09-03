import { useEffect, useState } from 'react';
import { Loader2, RefreshCw, Star, Check, X } from 'lucide-react';
import { useTranslation } from '../../../shared/i18n/useTranslation';
import { useAdminStore } from '../../../shared/stores/useAdminStore';
import { useToastStore } from '../../../shared/stores/useToastStore';
import { fetchReviews, updateReviewStatus } from '../../../shared/api/adminApi';

const STATUS_TABS = [
  { value: '', label: 'all' },
  { value: 'pending', label: 'pending' },
  { value: 'approved', label: 'approved' },
  { value: 'rejected', label: 'rejected' },
];

const STATUS_BADGE = {
  pending: 'bg-warning-50 text-warning-600',
  approved: 'bg-success-50 text-success-600',
  rejected: 'bg-error-50 text-error-500',
};

export function AdminReviews() {
  const { t, locale } = useTranslation();
  const { accessToken } = useAdminStore();
  const toast = useToastStore();

  const [reviews, setReviews] = useState([]);
  const [status, setStatus] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [acting, setActing] = useState(null);

  const load = (st = status) => {
    if (!accessToken) return;
    setLoading(true);
    setError(null);
    fetchReviews(accessToken, { status: st || undefined })
      .then((json) => {
        const data = Array.isArray(json?.data) ? json.data : [];
        setReviews(data);
      })
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    Promise.resolve().then(() => load(status));
  }, [accessToken, status]);

  const handleAction = async (review, newStatus) => {
    setActing(review.id);
    try {
      await updateReviewStatus(accessToken, review.id, newStatus);
      toast.success(
        newStatus === 'approved' ? t('admin.reviewApproved') : t('admin.reviewRejected')
      );
      load();
    } catch (err) {
      toast.error(err.message || t('admin.reviewActionError'));
    } finally {
      setActing(null);
    }
  };

  const fmtDate = (d) =>
    new Intl.DateTimeFormat(locale, { day: 'numeric', month: 'short', year: 'numeric' }).format(new Date(d));

  return (
    <div className="space-y-6 pb-16 text-start">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border-default pb-6">
        <div>
          <h1 className="text-3xl font-bold text-text-primary">{t('admin.reviews')}</h1>
          <p className="text-xs text-text-secondary font-medium mt-1">
            {t('admin.reviewsSubtitle')}
          </p>
        </div>
        <button
          onClick={() => load()}
          disabled={loading}
          className="flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold text-text-secondary border border-border-default hover:bg-background-secondary transition-colors disabled:opacity-50"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          {t('admin.refresh')}
        </button>
      </div>

      {/* Status Tabs */}
      <div className="flex items-center gap-1 flex-wrap">
        {STATUS_TABS.map((tab) => (
          <button
            key={tab.value}
            onClick={() => setStatus(tab.value)}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors ${
              status === tab.value
                ? 'bg-interactive-primary text-text-inverse'
                : 'bg-background-secondary border border-border-default text-text-secondary hover:text-text-primary'
            }`}
          >
            {t(`admin.reviewStatus.${tab.label}`)}
          </button>
        ))}
      </div>

      {error && (
        <div className="p-4 rounded-xl bg-error-50 border border-error-200 text-error-600 text-sm font-medium">
          {error}
        </div>
      )}

      {/* List */}
      <div className="rounded-2xl bg-background-secondary border border-border-default overflow-hidden shadow-xs">
        {loading ? (
          <div className="flex items-center justify-center py-16">
            <Loader2 className="w-6 h-6 text-text-brand animate-spin" />
          </div>
        ) : reviews.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 gap-2">
            <p className="text-sm font-bold text-text-secondary">{t('admin.noReviews')}</p>
            <p className="text-xs text-text-tertiary">{t('admin.noReviewsHint')}</p>
          </div>
        ) : (
          <div className="divide-y divide-border-default">
            {reviews.map((r) => (
              <div key={r.id} className="p-5 space-y-3">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="min-w-0">
                      <p className="text-sm font-bold text-text-primary">
                        {r.reviewer_name}
                        <span className="text-text-tertiary font-medium text-xs ms-2">· {r.reviewer_email}</span>
                      </p>
                      <p className="text-[11px] text-text-secondary truncate">
                        {r.product_name} · {fmtDate(r.created_at)}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <span className="flex items-center gap-0.5 text-warning-600">
                      {Array.from({ length: 5 }).map((_, i) => (
                        <Star
                          key={i}
                          className={`w-3.5 h-3.5 ${i < r.rating ? 'fill-current' : 'text-text-tertiary'}`}
                        />
                      ))}
                      <span className="ms-1 text-xs font-bold">{r.rating}</span>
                    </span>
                    <span
                      className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${STATUS_BADGE[r.status] || 'bg-background-primary text-text-secondary'}`}
                    >
                      {t(`admin.reviewStatus.${r.status}`)}
                    </span>
                  </div>
                </div>

                <p className="text-xs font-medium text-text-primary leading-relaxed">{r.comment}</p>

                {r.status === 'pending' && (
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleAction(r, 'approved')}
                      disabled={acting === r.id}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold text-success-600 bg-success-50 hover:bg-success-100 transition-colors disabled:opacity-50"
                    >
                      {acting === r.id ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Check className="w-3.5 h-3.5" />}
                      {t('admin.approveReview')}
                    </button>
                    <button
                      onClick={() => handleAction(r, 'rejected')}
                      disabled={acting === r.id}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold text-error-500 bg-error-50 hover:bg-error-100 transition-colors disabled:opacity-50"
                    >
                      <X className="w-3.5 h-3.5" />
                      {t('admin.rejectReview')}
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default AdminReviews;
