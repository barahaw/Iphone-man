import { X, ShoppingBag, Check } from 'lucide-react';
import { useCompareStore } from '../../../shared/stores/useCompareStore';
import { useCartStore } from '../../../shared/stores/useCartStore';
import { useToastStore } from '../../../shared/stores/useToastStore';
import { useTranslation } from '../../../shared/i18n/useTranslation';

export function ProductSpecTable({ products = [] }) {
  const { t } = useTranslation();
  const { removeItem } = useCompareStore();
  const addItem = useCartStore((state) => state.addItem);
  const toast = useToastStore();

  if (products.length === 0) return null;

  const ALL_SPEC_KEYS = [
    { key: 'brand', label: t('common.brand') },
    { key: 'price', label: t('common.price') },
    { key: 'screen', label: 'الشاشة / Screen' },
    { key: 'chip', label: 'المعالج / Chip' },
    { key: 'camera', label: 'الكاميرا / Camera' },
    { key: 'battery', label: 'البطارية / Battery' },
    { key: 'warranty', label: t('common.warranty') },
    { key: 'inStock', label: t('common.availability') },
  ];

  const getSpecValue = (prod, specKey) => {
    switch (specKey) {
      case 'brand':
        return prod.brand || 'Apple';
      case 'price':
        return `${(prod.price || 0).toLocaleString()} ₪`;
      case 'inStock':
        return prod.inStock !== false ? (
          <span className="text-success-600 font-bold inline-flex items-center gap-1">
            <Check className="w-3.5 h-3.5" />
            {t('common.inStock')}
          </span>
        ) : (
          <span className="text-error-500 font-bold">{t('common.outOfStock')}</span>
        );
      case 'warranty':
        return prod.warranty || 'ضمان رسمي 24 شهر';
      case 'screen':
        return prod.specs?.find((s) => s.label.includes('الشاشة'))?.value || 'OLED Super Retina';
      case 'chip':
        return prod.specs?.find((s) => s.label.includes('المعالج'))?.value || 'Apple A17 Pro / Snapdragon';
      case 'camera':
        return prod.specs?.find((s) => s.label.includes('الكاميرا'))?.value || '48MP Pro System';
      case 'battery':
        return prod.specs?.find((s) => s.label.includes('البطارية'))?.value || 'All-Day Battery';
      default:
        return '—';
    }
  };

  return (
    <div className="overflow-x-auto rounded-2xl border border-border-default bg-background-secondary shadow-xs text-start">
      <table className="w-full min-w-[600px] border-collapse text-xs">
        <thead>
          <tr className="border-b border-border-default bg-background-primary">
            <th className="p-4 w-44 font-bold text-text-secondary uppercase tracking-wider text-[11px] align-top">
              المنتج / Product
            </th>
            {products.map((prod) => (
              <th key={prod.id} className="p-4 text-start align-top relative min-w-[180px]">
                <button
                  onClick={() => removeItem(prod.id)}
                  className="absolute top-3 end-3 p-1 text-text-secondary hover:text-error-500 rounded-full hover:bg-background-secondary transition-colors"
                  aria-label="إزالة من المقارنة"
                >
                  <X className="w-4 h-4" />
                </button>
                <div className="space-y-2 pe-6">
                  <img
                    src={prod.image || prod.images?.[0]}
                    alt={prod.name}
                    className="w-16 h-16 object-cover rounded-xl border border-border-default bg-background-primary"
                    width={64}
                    height={64}
                    loading="lazy"
                  />
                  <div>
                    <span className="text-[10px] font-bold text-text-brand uppercase">{prod.brand}</span>
                    <h4 className="font-bold text-xs text-text-primary line-clamp-1">{prod.name}</h4>
                    <p className="font-bold text-sm text-text-primary mt-0.5"><bdi>{prod.price?.toLocaleString()} ₪</bdi></p>
                  </div>
                  <button
                    onClick={() => {
                      addItem(prod, 'Standard', 1);
                      toast.success(t('common.addedToCart'));
                    }}
                    className="w-full flex items-center justify-center gap-1.5 py-1.5 bg-interactive-primary text-text-inverse rounded-full text-[11px] font-bold hover:bg-interactive-primary-hover active:scale-95 transition-all shadow-xs"
                  >
                    <ShoppingBag className="w-3 h-3" />
                    <span>{t('common.addToCart')}</span>
                  </button>
                </div>
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-border-default">
          {ALL_SPEC_KEYS.map((spec) => (
            <tr key={spec.key} className="hover:bg-background-primary/50 transition-colors">
              <td className="p-4 font-bold text-text-primary bg-background-primary/30">
                {spec.label}
              </td>
              {products.map((prod) => (
                <td key={`${prod.id}-${spec.key}`} className="p-4 font-medium text-text-secondary">
                  {getSpecValue(prod, spec.key)}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default ProductSpecTable;
