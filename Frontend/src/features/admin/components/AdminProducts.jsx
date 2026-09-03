import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Loader2, RefreshCw, ChevronLeft, ChevronRight, Edit3, Trash2, Plus, Package } from 'lucide-react';
import { useTranslation } from '../../../shared/i18n/useTranslation';
import { useAdminStore } from '../../../shared/stores/useAdminStore';
import { useToastStore } from '../../../shared/stores/useToastStore';
import { fetchAdminProducts, deleteProduct } from '../../../shared/api/adminApi';

export function AdminProducts() {
  const { t, locale } = useTranslation();
  const navigate = useNavigate();
  const { accessToken, admin } = useAdminStore();
  const toast = useToastStore();

  const [products, setProducts] = useState([]);
  const [meta, setMeta] = useState({ page: 1, total: 0, limit: 20, hasMore: false });
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [deleting, setDeleting] = useState(null);

  const load = (pg = page) => {
    if (!accessToken) return;
    setLoading(true);
    setError(null);
    fetchAdminProducts(accessToken, { page: pg, limit: 20 })
      .then((json) => {
        setProducts(json.data);
        setMeta(json.meta);
      })
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    Promise.resolve().then(() => {
      load(1);
      setPage(1);
    });
  }, [accessToken]);

  const handleDelete = async (product) => {
    if (!window.confirm(t('admin.deleteProductConfirm').replace('{name}', product.name))) return;
    setDeleting(product.id);
    try {
      await deleteProduct(accessToken, product.id);
      toast.success(t('admin.productDeleted'));
      load(page);
    } catch (err) {
      toast.error(err.message || t('admin.deleteProductError'));
    } finally {
      setDeleting(null);
    }
  };

  const fmt = (n) =>
    new Intl.NumberFormat(locale, { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(n);

  const fmtDate = (d) =>
    new Intl.DateTimeFormat(locale, { day: 'numeric', month: 'short', year: 'numeric' }).format(new Date(d));

  const goPage = (pg) => {
    setPage(pg);
    load(pg);
  };

  return (
    <div className="space-y-6 pb-16 text-start">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border-default pb-6">
        <div>
          <h1 className="text-3xl font-bold text-text-primary">{t('admin.allProducts')}</h1>
          <p className="text-xs text-text-secondary font-medium mt-1">
            {t('admin.productsSubtitle')}
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => load(page)}
            disabled={loading}
            className="flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold text-text-secondary border border-border-default hover:bg-background-secondary transition-colors disabled:opacity-50"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            {t('admin.refresh')}
          </button>
          <button
            onClick={() => navigate('/admin/add')}
            className="flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold text-text-inverse bg-interactive-primary hover:opacity-90 transition-colors"
          >
            <Plus className="w-3.5 h-3.5" />
            {t('admin.addProduct')}
          </button>
        </div>
      </div>

      {error && (
        <div className="p-4 rounded-xl bg-error-50 border border-error-200 text-error-600 text-sm font-medium">
          {error}
        </div>
      )}

      {/* Table */}
      <div className="rounded-2xl bg-background-secondary border border-border-default overflow-hidden shadow-xs">
        {loading ? (
          <div className="flex items-center justify-center py-16">
            <Loader2 className="w-6 h-6 text-text-brand animate-spin" />
          </div>
        ) : products.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 gap-2">
            <p className="text-sm font-bold text-text-secondary">{t('admin.noProducts')}</p>
            <p className="text-xs text-text-tertiary">{t('admin.noProductsHint')}</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className="border-b border-border-default bg-background-primary">
                  <th className="px-4 py-3 text-start font-bold text-text-secondary">{t('admin.productNameCol')}</th>
                  <th className="px-4 py-3 text-start font-bold text-text-secondary">{t('admin.priceCol')}</th>
                  <th className="px-4 py-3 text-start font-bold text-text-secondary">{t('admin.stockCol')}</th>
                  <th className="px-4 py-3 text-start font-bold text-text-secondary">{t('admin.statusCol')}</th>
                  <th className="px-4 py-3 text-start font-bold text-text-secondary">{t('admin.dateCol')}</th>
                  <th className="px-4 py-3 text-end font-bold text-text-secondary">{t('admin.actionsCol')}</th>
                </tr>
              </thead>
              <tbody>
                {products.map((p) => (
                  <tr
                    key={p.id}
                    className="border-b border-border-default last:border-0 hover:bg-background-primary transition-colors"
                  >
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        {p.images && p.images[0] ? (
                          <img
                            src={p.images[0]}
                            alt={p.name}
                            className="w-10 h-10 rounded-xl object-cover bg-background-primary shrink-0"
                          />
                        ) : (
                          <div className="w-10 h-10 rounded-xl bg-background-primary flex items-center justify-center shrink-0">
                            <Package className="w-5 h-5 text-text-tertiary" />
                          </div>
                        )}
                        <div className="min-w-0">
                          <p className="font-bold text-text-primary truncate max-w-[200px]">{p.name}</p>
                          <p className="text-[10px] text-text-secondary font-mono truncate">{p.slug}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3 font-bold text-text-brand">
                      <bdi>{fmt(p.price)} ₪</bdi>
                      {p.discount > 0 && (
                        <span className="text-success-600 text-[10px] ms-1">-{p.discount}%</span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`font-bold ${p.stock_quantity <= 0 ? 'text-error-500' : p.stock_quantity <= 5 ? 'text-warning-600' : 'text-text-primary'}`}
                      >
                        {p.stock_quantity}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`px-2 py-0.5 rounded-full font-bold ${p.is_active ? 'bg-success-50 text-success-600' : 'bg-gray-100 text-gray-500'}`}
                      >
                        {p.is_active ? t('admin.active') : t('admin.inactive')}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-text-secondary">{fmtDate(p.created_at)}</td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => navigate(`/admin/products/${p.slug}/edit`)}
                          className="p-2 rounded-xl text-text-secondary hover:text-text-brand hover:bg-interactive-primary/10 transition-colors"
                          title={t('admin.editProduct')}
                        >
                          <Edit3 className="w-4 h-4" />
                        </button>
                        {admin?.role === 'super_admin' && (
                          <button
                            onClick={() => handleDelete(p)}
                            disabled={deleting === p.id}
                            className="p-2 rounded-xl text-text-secondary hover:text-error-500 hover:bg-error-50 transition-colors disabled:opacity-50"
                            title={t('admin.deleteProduct')}
                          >
                            {deleting === p.id ? (
                              <Loader2 className="w-4 h-4 animate-spin" />
                            ) : (
                              <Trash2 className="w-4 h-4" />
                            )}
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Pagination */}
      {!loading && meta.total > meta.limit && (
        <div className="flex items-center justify-between text-xs font-bold">
          <span className="text-text-secondary">
            {t('admin.showingPage')
              .replace('{page}', meta.page)
              .replace('{total}', Math.ceil(meta.total / meta.limit))}
          </span>
          <div className="flex items-center gap-2">
            <button
              onClick={() => goPage(page - 1)}
              disabled={page === 1}
              className="flex items-center gap-1 px-3 py-1.5 rounded-lg border border-border-default text-text-secondary hover:text-text-primary hover:bg-background-secondary disabled:opacity-40 transition-colors"
            >
              <ChevronLeft className="w-3.5 h-3.5" />
              {t('common.prevPage')}
            </button>
            <button
              onClick={() => goPage(page + 1)}
              disabled={!meta.hasMore}
              className="flex items-center gap-1 px-3 py-1.5 rounded-lg border border-border-default text-text-secondary hover:text-text-primary hover:bg-background-secondary disabled:opacity-40 transition-colors"
            >
              {t('common.nextPage')}
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default AdminProducts;
