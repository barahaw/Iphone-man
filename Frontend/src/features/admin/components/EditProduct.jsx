import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Loader2, Save, X, Plus } from 'lucide-react';
import { Button } from '../../../shared/components/ui/Button';
import { useTranslation } from '../../../shared/i18n/useTranslation';
import { useAdminStore } from '../../../shared/stores/useAdminStore';
import { useToastStore } from '../../../shared/stores/useToastStore';
import {
  fetchAdminProductBySlug,
  updateProduct,
  fetchCategories,
  fetchBrands,
} from '../../../shared/api/adminApi';

export function EditProduct() {
  const { slug: slugParam } = useParams();
  const navigate = useNavigate();
  const { t } = useTranslation();
  const { accessToken } = useAdminStore();
  const toast = useToastStore();

  const [productId, setProductId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [categories, setCategories] = useState([]);
  const [brands, setBrands] = useState([]);

  const [name, setName] = useState('');
  const [slug, setSlug] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [brandId, setBrandId] = useState('');
  const [price, setPrice] = useState('');
  const [discount, setDiscount] = useState('');
  const [stockQuantity, setStockQuantity] = useState('');
  const [description, setDescription] = useState('');
  const [images, setImages] = useState(['']);
  const [isActive, setIsActive] = useState(true);
  const [warranty, setWarranty] = useState('');

  const inputClass =
    'w-full rounded-xl border border-border-default bg-background-primary px-4 py-2.5 text-xs text-text-primary placeholder:text-text-tertiary focus:outline-none focus:ring-1 focus:ring-interactive-primary';

  const cardClass = 'p-6 rounded-3xl bg-background-secondary border border-border-default space-y-4 shadow-sm';
  const cardTitleClass = 'text-base font-bold text-text-primary border-b border-border-default pb-3';

  useEffect(() => {
    if (!accessToken || !slug) return;

    Promise.resolve().then(() => {
      setLoading(true);

      Promise.all([
        fetchCategories('en'),
        fetchBrands('en'),
      ])
        .then(([catJson, brandJson]) => {
          setCategories(Array.isArray(catJson.data) ? catJson.data : catJson);
          setBrands(Array.isArray(brandJson.data) ? brandJson.data : brandJson);
        })
        .catch(() => {});

      fetchAdminProductBySlug(accessToken, slugParam)
        .then((json) => {
          const p = json.data;
          setProductId(p.id);
          setName(p.name || '');
          setSlug(p.slug || '');
          setCategoryId(p.category_id || '');
          setBrandId(p.brand_id || '');
          setPrice(String(p.price || ''));
          setDiscount(String(p.discount || ''));
          setStockQuantity(String(p.stock_quantity || ''));
          setDescription(p.description || '');
          setImages(p.images?.length > 0 ? [...p.images] : ['']);
          setIsActive(p.is_active ?? true);
          setWarranty(p.warranty || '');
        })
        .catch((err) => setError(err.message))
        .finally(() => setLoading(false));
    });
  }, [accessToken, slugParam]);

  const addImageField = () => setImages([...images, '']);
  const removeImageField = (idx) => setImages(images.filter((_, i) => i !== idx));
  const updateImage = (idx, val) => {
    const next = [...images];
    next[idx] = val;
    setImages(next);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    if (!name.trim() || !slug.trim() || !price) {
      toast.error(t('admin.requiredFields'));
      return;
    }
    setSaving(true);
    try {
      await updateProduct(accessToken, productId, {
        name,
        slug,
        categoryId: categoryId || undefined,
        brandId: brandId || undefined,
        price: Number(price),
        discount: discount ? Number(discount) : undefined,
        stockQuantity: Number(stockQuantity),
        description,
        images: images.filter(Boolean),
        isActive,
        warranty: warranty || undefined,
      });
      toast.success(t('admin.productUpdated'));
      navigate('/admin/products');
    } catch (err) {
      toast.error(err.message || t('admin.productUpdateError'));
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="w-6 h-6 text-text-brand animate-spin" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-4 text-start pb-16">
        <div className="p-4 rounded-xl bg-error-50 border border-error-200 text-error-600 text-sm font-medium">
          {error}
        </div>
        <button
          onClick={() => navigate('/admin/products')}
          className="flex items-center gap-2 text-xs font-bold text-text-brand hover:underline"
        >
          <ArrowLeft className="w-4 h-4" />
          {t('admin.backToProducts')}
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-8 pb-16 text-start max-w-6xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border-default pb-6">
        <div>
          <h1 className="text-3xl font-bold text-text-primary">{t('admin.editProduct')}</h1>
          <p className="text-xs text-text-secondary font-medium mt-1">{name || slug}</p>
        </div>
        <div className="flex items-center gap-3">
          <Button variant="outline" size="sm" onClick={() => navigate('/admin/products')}>
            <X className="w-4 h-4 me-1" />
            {t('common.close')}
          </Button>
          <Button variant="primary" size="sm" className="px-6" onClick={handleSave} disabled={saving}>
            {saving ? (
              <Loader2 className="w-4 h-4 me-1 animate-spin" />
            ) : (
              <Save className="w-4 h-4 me-1" />
            )}
            {saving ? t('admin.saving') : t('admin.saveChanges')}
          </Button>
        </div>
      </div>

      <form onSubmit={handleSave}>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
          {/* Main Column */}
          <div className="lg:col-span-2 space-y-6">
            <div className={cardClass}>
              <h2 className={cardTitleClass}>{t('admin.basicInfo')}</h2>
              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-text-primary mb-1.5">{t('admin.productNameLabel')}</label>
                  <input type="text" value={name} onChange={(e) => setName(e.target.value)} className={inputClass} />
                </div>
                <div>
                  <label className="block text-xs font-bold text-text-primary mb-1.5">Slug</label>
                  <input type="text" value={slug} onChange={(e) => setSlug(e.target.value)} className={`${inputClass} font-mono`} />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-text-primary mb-1.5">{t('admin.categoryLabel')}</label>
                    <select value={categoryId} onChange={(e) => setCategoryId(e.target.value)} className={inputClass}>
                      <option value="">{t('admin.selectCategory')}</option>
                      {categories.map((c) => (
                        <option key={c.id} value={c.id}>{c.name}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-text-primary mb-1.5">{t('admin.brandLabel')}</label>
                    <select value={brandId} onChange={(e) => setBrandId(e.target.value)} className={inputClass}>
                      <option value="">{t('admin.selectBrand')}</option>
                      {brands.map((b) => (
                        <option key={b.id} value={b.id}>{b.name}</option>
                      ))}
                    </select>
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-bold text-text-primary mb-1.5">{t('admin.priceLabel')}</label>
                  <input type="number" value={price} onChange={(e) => setPrice(e.target.value)} className={`${inputClass} font-bold text-text-brand`} />
                </div>
                <div>
                  <label className="block text-xs font-bold text-text-primary mb-1.5">{t('admin.discountLabel')}</label>
                  <input type="number" value={discount} onChange={(e) => setDiscount(e.target.value)} placeholder="0" className={inputClass} />
                </div>
              </div>
            </div>

            {/* Images */}
            <div className={cardClass}>
              <h2 className={cardTitleClass}>{t('admin.productImagesTitle')}</h2>
              <div className="space-y-3">
                {images.map((img, idx) => (
                  <div key={idx} className="flex items-center gap-2">
                    <input
                      type="url"
                      value={img}
                      onChange={(e) => updateImage(idx, e.target.value)}
                      placeholder={t('admin.imageUrlPlaceholder')}
                      className={`${inputClass} flex-1`}
                    />
                    {images.length > 1 && (
                      <button
                        type="button"
                        onClick={() => removeImageField(idx)}
                        className="p-2 rounded-xl text-text-secondary hover:text-error-500 hover:bg-error-50 transition-colors"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                ))}
                <button
                  type="button"
                  onClick={addImageField}
                  className="flex items-center gap-2 text-xs font-bold text-text-brand hover:underline"
                >
                  <Plus className="w-3.5 h-3.5" />
                  {t('admin.addImageUrl')}
                </button>
              </div>
            </div>

            {/* Description */}
            <div className={cardClass}>
              <h2 className={cardTitleClass}>{t('admin.descriptionTitle')}</h2>
              <textarea
                rows={4}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="w-full rounded-2xl border border-border-default bg-background-primary p-4 text-xs text-text-primary placeholder:text-text-tertiary focus:outline-none focus:ring-1 focus:ring-interactive-primary"
              />
            </div>
          </div>

          {/* Side Column */}
          <div className="space-y-6">
            <div className={cardClass}>
              <h2 className={cardTitleClass}>{t('admin.stockTitle')}</h2>
              <div className="space-y-3">
                <div>
                  <label className="block text-xs font-bold text-text-primary mb-1">{t('admin.stockQtyLabel')}</label>
                  <input type="number" value={stockQuantity} onChange={(e) => setStockQuantity(e.target.value)} className={inputClass} />
                </div>
                <div>
                  <label className="block text-xs font-bold text-text-primary mb-1">{t('admin.warrantyLabel')}</label>
                  <input type="text" value={warranty} onChange={(e) => setWarranty(e.target.value)} className={inputClass} />
                </div>
              </div>
            </div>

            <div className={cardClass}>
              <h2 className={cardTitleClass}>{t('admin.optionsTitle')}</h2>
              <label className="flex items-center justify-between text-xs font-bold text-text-primary cursor-pointer">
                <span>{t('admin.productActive')}</span>
                <input
                  type="checkbox"
                  checked={isActive}
                  onChange={(e) => setIsActive(e.target.checked)}
                  className="rounded border-border-default text-text-brand accent-interactive-primary focus:ring-interactive-primary"
                />
              </label>
            </div>
          </div>
        </div>
      </form>
    </div>
  );
}

export default EditProduct;
