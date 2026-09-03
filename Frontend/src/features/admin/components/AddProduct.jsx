import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Upload, Plus, X, Save, Loader2 } from 'lucide-react';
import { Button } from '../../../shared/components/ui/Button';
import { useTranslation } from '../../../shared/i18n/useTranslation';
import { useAdminStore } from '../../../shared/stores/useAdminStore';
import { useToastStore } from '../../../shared/stores/useToastStore';
import { createProduct, fetchCategories, fetchBrands } from '../../../shared/api/adminApi';

export function AddProduct() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { accessToken } = useAdminStore();
  const toast = useToastStore();

  const [categories, setCategories] = useState([]);
  const [brands, setBrands] = useState([]);
  const [loadingRefs, setLoadingRefs] = useState(true);
  const [saving, setSaving] = useState(false);

  const [name, setName] = useState('');
  const [slug, setSlug] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [brandId, setBrandId] = useState('');
  const [price, setPrice] = useState('');
  const [discount, setDiscount] = useState('');
  const [stockQuantity, setStockQuantity] = useState('');
  const [description, setDescription] = useState('');
  const [warranty, setWarranty] = useState('');
  const [images, setImages] = useState(['']);
  const [isActive, setIsActive] = useState(true);

  const inputClass =
    'w-full rounded-xl border border-border-default bg-background-primary px-4 py-2.5 text-xs text-text-primary placeholder:text-text-tertiary focus:outline-none focus:ring-1 focus:ring-interactive-primary';

  const cardClass = 'p-6 rounded-3xl bg-background-secondary border border-border-default space-y-4 shadow-sm';
  const cardTitleClass = 'text-base font-bold text-text-primary border-b border-border-default pb-3';

  useEffect(() => {
    Promise.all([fetchCategories('en'), fetchBrands('en')])
      .then(([catJson, brandJson]) => {
        setCategories(Array.isArray(catJson.data) ? catJson.data : catJson);
        setBrands(Array.isArray(brandJson.data) ? brandJson.data : brandJson);
      })
      .catch(() => {})
      .finally(() => setLoadingRefs(false));
  }, []);

  const slugify = (val) =>
    val
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '');

  const handleNameChange = (e) => {
    const v = e.target.value;
    setName(v);
    if (!slug || slug === slugify(slug)) {
      setSlug(slugify(v));
    }
  };

  const addImageField = () => setImages([...images, '']);
  const removeImageField = (idx) => setImages(images.filter((_, i) => i !== idx));
  const updateImage = (idx, val) => {
    const next = [...images];
    next[idx] = val;
    setImages(next);
  };

  const handlePublish = async () => {
    if (!name.trim() || !slug.trim() || !categoryId || !brandId || !price || description.trim() === '') {
      toast.error(t('admin.requiredFields'));
      return;
    }
    setSaving(true);
    try {
      await createProduct(accessToken, {
        name: name.trim(),
        slug: slug.trim(),
        brandId: Number(brandId),
        categoryId: Number(categoryId),
        images: images.filter((u) => u && u.trim() !== ''),
        description: description.trim(),
        warranty: warranty.trim() || undefined,
        stockQuantity: Number(stockQuantity) || 0,
        price: Number(price),
        discount: discount ? Number(discount) : undefined,
        isActive,
        translations: [
          {
            locale: 'en',
            name: name.trim(),
            description: description.trim(),
            warranty: warranty.trim() || undefined,
            specifications: {},
          },
        ],
      });
      toast.success(t('admin.productCreated'));
      navigate('/admin/products');
    } catch (err) {
      toast.error(err.message || t('admin.publishError'));
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-8 pb-16 text-start max-w-6xl mx-auto">
      {/* Header & Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border-default pb-6">
        <div>
          <h1 className="text-3xl font-bold text-text-primary">{t('admin.addProduct')}</h1>
          <p className="text-xs text-text-secondary font-medium mt-1">
            {t('admin.addProductSubtitle')}
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Button variant="primary" size="sm" className="px-6" onClick={handlePublish} disabled={saving}>
            {saving ? (
              <Loader2 className="w-4 h-4 me-1 animate-spin" />
            ) : (
              <Save className="w-4 h-4 me-1" />
            )}
            {saving ? t('admin.saving') : t('admin.publishProduct')}
          </Button>
        </div>
      </div>

      {/* Main Form Grid Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
        {/* Main Column */}
        <div className="lg:col-span-2 space-y-6">
          {/* Basic Info */}
          <div className={cardClass}>
            <h2 className={cardTitleClass}>{t('admin.basicInfo')}</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-text-primary mb-1.5">{t('admin.productNameLabel')}</label>
                <input
                  type="text"
                  value={name}
                  onChange={handleNameChange}
                  placeholder={t('admin.productNamePlaceholder')}
                  className={inputClass}
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-text-primary mb-1.5">Slug</label>
                <input
                  type="text"
                  value={slug}
                  onChange={(e) => setSlug(slugify(e.target.value))}
                  placeholder="my-product-slug"
                  className={`${inputClass} font-mono`}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-text-primary mb-1.5">{t('admin.categoryLabel')}</label>
                  <select
                    value={categoryId}
                    onChange={(e) => setCategoryId(e.target.value)}
                    className={inputClass}
                    disabled={loadingRefs}
                  >
                    <option value="">{loadingRefs ? t('common.loading') : t('admin.selectCategory')}</option>
                    {categories.map((c) => (
                      <option key={c.id} value={c.id}>{c.name}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-text-primary mb-1.5">{t('admin.brandLabel')}</label>
                  <select
                    value={brandId}
                    onChange={(e) => setBrandId(e.target.value)}
                    className={inputClass}
                    disabled={loadingRefs}
                  >
                    <option value="">{loadingRefs ? t('common.loading') : t('admin.selectBrand')}</option>
                    {brands.map((b) => (
                      <option key={b.id} value={b.id}>{b.name}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-text-primary mb-1.5">{t('admin.priceLabel')}</label>
                  <input
                    type="number"
                    value={price}
                    onChange={(e) => setPrice(e.target.value)}
                    placeholder="0.00"
                    className={`${inputClass} font-bold text-text-brand`}
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-text-primary mb-1.5">{t('admin.discountLabel')} (%)</label>
                  <input
                    type="number"
                    value={discount}
                    onChange={(e) => setDiscount(e.target.value)}
                    placeholder="0"
                    className={inputClass}
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-text-primary mb-1.5">{t('admin.warrantyLabel')}</label>
                <input
                  type="text"
                  value={warranty}
                  onChange={(e) => setWarranty(e.target.value)}
                  placeholder={t('admin.warrantyPlaceholder')}
                  className={inputClass}
                />
              </div>
            </div>
          </div>

          {/* Images (URL inputs) */}
          <div className={cardClass}>
            <h2 className={cardTitleClass}>{t('admin.productImagesTitle')}</h2>
            <p className="text-[11px] text-text-secondary -mt-2">
              {t('admin.imagesUrlHint')}
            </p>
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
              placeholder={t('admin.descriptionPlaceholder')}
              className="w-full rounded-2xl border border-border-default bg-background-primary p-4 text-xs text-text-primary placeholder:text-text-tertiary focus:outline-none focus:ring-1 focus:ring-interactive-primary"
            />
          </div>
        </div>

        {/* Side Column */}
        <div className="space-y-6">
          {/* Stock */}
          <div className={cardClass}>
            <h2 className={cardTitleClass}>{t('admin.stockTitle')}</h2>
            <div className="space-y-3">
              <div>
                <label className="block text-xs font-bold text-text-primary mb-1">{t('admin.stockQtyLabel')}</label>
                <input
                  type="number"
                  value={stockQuantity}
                  onChange={(e) => setStockQuantity(e.target.value)}
                  className={inputClass}
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-text-primary mb-1">{t('admin.availabilityLabel')}</label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setIsActive(true)}
                    className={`py-2 rounded-xl text-xs font-bold border transition-all ${
                      isActive ? 'bg-success-500/15 text-success-600 border-success-500' : 'bg-background-primary text-text-secondary border-border-default'
                    }`}
                  >
                    {t('admin.active')}
                  </button>
                  <button
                    type="button"
                    onClick={() => setIsActive(false)}
                    className={`py-2 rounded-xl text-xs font-bold border transition-all ${
                      !isActive ? 'bg-error-500/15 text-error-500 border-error-500' : 'bg-background-primary text-text-secondary border-border-default'
                    }`}
                  >
                    {t('admin.inactive')}
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Preview */}
          <div className={cardClass}>
            <div className="flex items-center gap-2 font-bold text-xs text-text-primary border-b border-border-default pb-2">
              <Upload className="w-4 h-4 text-text-brand" />
              <span>{t('admin.quickPreview')}</span>
            </div>
            <div className="p-3 rounded-2xl bg-background-primary border border-border-default space-y-2 text-center">
              {images[0] ? (
                <img src={images[0]} alt={t('admin.previewAlt')} className="w-full aspect-square object-cover rounded-xl" />
              ) : (
                <div className="w-full aspect-square rounded-xl bg-background-secondary flex items-center justify-center text-text-tertiary">
                  <Upload className="w-8 h-8" />
                </div>
              )}
              <h4 className="font-bold text-xs text-text-primary truncate">{name || '—'}</h4>
              <p className="text-xs font-bold text-text-brand">
                {price ? <bdi>{price} ₪</bdi> : '—'}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
export default AddProduct;
