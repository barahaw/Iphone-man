import { useState } from 'react';
import { Upload, Check, Eye } from 'lucide-react';
import { Button } from '../../../shared/components/ui/Button';
import { useTranslation } from '../../../shared/i18n/useTranslation';

export function AddProduct() {
  const { t } = useTranslation();
  const [name, setName] = useState('iPhone 15 Pro Max - 256GB');
  const [category, setCategory] = useState('iPhone');
  const [brand, setBrand] = useState('Apple');
  const [price, setPrice] = useState('4899');
  const [sku, setSku] = useState('IP15-PM-256-NAT');
  const [stock, setStock] = useState('10');
  const [inStock, setInStock] = useState(true);
  const [isFeatured, setIsFeatured] = useState(false);
  const [isNew, setIsNew] = useState(true);
  const [description, setDescription] = useState('هيكل من التيتانيوم الفاخر، شريحة A17 Pro المتطورة...');

  const inputClass =
    'w-full rounded-xl border border-border-default bg-background-primary px-4 py-2.5 text-xs text-text-primary placeholder:text-text-tertiary focus:outline-none focus:ring-1 focus:ring-interactive-primary';

  const cardClass = 'p-6 rounded-3xl bg-background-secondary border border-border-default space-y-4 shadow-sm';

  const cardTitleClass = 'text-base font-bold text-text-primary border-b border-border-default pb-3';

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
          <Button variant="outline" size="sm">
            {t('admin.saveDraft')}
          </Button>
          <Button variant="primary" size="sm" className="px-6">
            {t('admin.publishProduct')}
          </Button>
        </div>
      </div>

      {/* Main Form Grid Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
        {/* Main Column (2 Columns) */}
        <div className="lg:col-span-2 space-y-6">
          {/* Card 1: المعلومات الأساسية */}
          <div className={cardClass}>
            <h2 className={cardTitleClass}>{t('admin.basicInfo')}</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-text-primary mb-1.5">{t('admin.productNameLabel')}</label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder={t('admin.productNamePlaceholder')}
                  className={inputClass}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-text-primary mb-1.5">{t('admin.categoryLabel')}</label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    className={inputClass}
                  >
                    <option value="iPhone">{t('admin.categoryIPhone')}</option>
                    <option value="Samsung">{t('admin.categorySamsung')}</option>
                    <option value="Earbuds">{t('admin.categoryEarbuds')}</option>
                    <option value="Chargers">{t('admin.categoryChargers')}</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-text-primary mb-1.5">{t('admin.brandLabel')}</label>
                  <input
                    type="text"
                    value={brand}
                    onChange={(e) => setBrand(e.target.value)}
                    className={inputClass}
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-text-primary mb-1.5">{t('admin.priceLabel')}</label>
                <input
                  type="number"
                  value={price}
                  onChange={(e) => setPrice(e.target.value)}
                  placeholder={t('admin.pricePlaceholder')}
                  className={`${inputClass} font-bold text-text-brand`}
                />
              </div>
            </div>
          </div>

          {/* Card 2: صور المنتج */}
          <div className={cardClass}>
            <h2 className={cardTitleClass}>{t('admin.productImagesTitle')}</h2>
            <div className="border-2 border-dashed border-border-strong rounded-2xl p-8 text-center space-y-2 bg-background-primary hover:bg-background-tertiary transition-colors cursor-pointer">
              <div className="w-12 h-12 rounded-2xl bg-blue-500/10 text-text-brand flex items-center justify-center mx-auto">
                <Upload className="w-6 h-6" />
              </div>
              <p className="text-xs font-bold text-text-primary">{t('admin.uploadHint')}</p>
              <p className="text-[11px] text-text-secondary">{t('admin.uploadFormats')}</p>
            </div>
          </div>

          {/* Card 3: وصف المنتج والمواصفات */}
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

        {/* Side Column (1 Column) */}
        <div className="space-y-6">
          {/* Card: المخزون */}
          <div className={cardClass}>
            <h2 className={cardTitleClass}>{t('admin.stockTitle')}</h2>
            <div className="space-y-3">
              <div>
                <label className="block text-xs font-bold text-text-primary mb-1">{t('admin.skuLabel')}</label>
                <input
                  type="text"
                  value={sku}
                  onChange={(e) => setSku(e.target.value)}
                  className={`${inputClass} font-mono`}
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-text-primary mb-1">{t('admin.stockQtyLabel')}</label>
                <input
                  type="number"
                  value={stock}
                  onChange={(e) => setStock(e.target.value)}
                  className={inputClass}
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-text-primary mb-1">{t('admin.availabilityLabel')}</label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setInStock(true)}
                    className={`py-2 rounded-xl text-xs font-bold border transition-all ${
                      inStock ? 'bg-success-500/15 text-success-600 border-success-500' : 'bg-background-primary text-text-secondary border-border-default'
                    }`}
                  >
                    <Check className="w-3.5 h-3.5 inline me-1" /> {t('admin.inStock')}
                  </button>
                  <button
                    type="button"
                    onClick={() => setInStock(false)}
                    className={`py-2 rounded-xl text-xs font-bold border transition-all ${
                      !inStock ? 'bg-error-500/15 text-error-500 border-error-500' : 'bg-background-primary text-text-secondary border-border-default'
                    }`}
                  >
                    {t('admin.outOfStock')}
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Card: الخيارات والتمييز */}
          <div className={cardClass}>
            <h2 className={cardTitleClass}>{t('admin.optionsTitle')}</h2>
            <div className="space-y-3">
              <label className="flex items-center justify-between text-xs font-bold text-text-primary cursor-pointer">
                <span>{t('admin.featured')}</span>
                <input
                  type="checkbox"
                  checked={isFeatured}
                  onChange={(e) => setIsFeatured(e.target.checked)}
                  className="rounded border-border-default text-text-brand accent-interactive-primary focus:ring-interactive-primary"
                />
              </label>
              <label className="flex items-center justify-between text-xs font-bold text-text-primary cursor-pointer">
                <span>{t('admin.isNew')}</span>
                <input
                  type="checkbox"
                  checked={isNew}
                  onChange={(e) => setIsNew(e.target.checked)}
                  className="rounded border-border-default text-text-brand accent-interactive-primary focus:ring-interactive-primary"
                />
              </label>
            </div>
          </div>

          {/* Card: معاينة سريعة */}
          <div className={cardClass}>
            <div className="flex items-center gap-2 font-bold text-xs text-text-primary border-b border-border-default pb-2">
              <Eye className="w-4 h-4 text-text-brand" />
              <span>{t('admin.quickPreview')}</span>
            </div>
            <div className="p-3 rounded-2xl bg-background-primary border border-border-default space-y-2 text-center">
              <div className="w-full aspect-square rounded-xl bg-[#08120E] flex items-center justify-center p-2">
                <img
                  src="https://images.unsplash.com/photo-1695048133142-1a20484d2569?w=300&auto=format&fit=crop&q=80"
                  alt={t('admin.previewAlt')}
                  className="w-full h-full object-cover rounded-lg"
                />
              </div>
              <h4 className="font-bold text-xs text-text-primary truncate">{name}</h4>
              <p className="text-xs font-bold text-text-brand"><bdi>{price} ₪</bdi></p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
export default AddProduct;