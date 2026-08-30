import { useState } from 'react';
import { Settings, Save, Store, Globe, Bell } from 'lucide-react';
import { Button } from '../../../shared/components/ui/Button';
import { Input } from '../../../shared/components/ui/Input';
import { useTranslation } from '../../../shared/i18n/useTranslation';

export function AdminSettings() {
  const { t } = useTranslation();
  const [storeName, setStoreName] = useState('iPhone Man');
  const [storeEmail, setStoreEmail] = useState('info@iphoneman.ps');
  const [storePhone, setStorePhone] = useState('+970 123346789');
  const [storeAddress, setStoreAddress] = useState('شارع وادي التفاح ، الخليل ، فلسطين');
  const [currency, setCurrency] = useState('ILS');
  const [saved, setSaved] = useState(false);

  const handleSave = (e) => {
    e.preventDefault();
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  const cardClass = 'p-6 rounded-3xl bg-background-secondary border border-border-default space-y-4 shadow-sm';
  const cardTitleClass = 'text-base font-bold text-text-primary border-b border-border-default pb-3 flex items-center gap-2';

  return (
    <div className="space-y-8 pb-16 text-start max-w-5xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border-default pb-6">
        <div>
          <h1 className="text-3xl font-bold text-text-primary flex items-center gap-2">
            <Settings className="w-7 h-7 text-text-brand" />
            <span>{t('admin.settings')}</span>
          </h1>
          <p className="text-xs text-text-secondary font-medium mt-1">
            {t('admin.settingsSubtitle')}
          </p>
        </div>

        <Button onClick={handleSave} variant="primary" size="sm" className="px-6">
          <Save className="w-4 h-4 me-1.5" />
          <span>{saved ? t('admin.saved') : t('admin.saveChanges')}</span>
        </Button>
      </div>

      {/* Settings Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8 items-start">
        {/* Settings Form (2 Columns) */}
        <form onSubmit={handleSave} className="md:col-span-2 space-y-6">
          {/* Card 1: بيانات المتجر */}
          <div className={cardClass}>
            <h2 className={cardTitleClass}>
              <Store className="w-4 h-4 text-text-brand" />
              <span>{t('admin.storeInfoTitle')}</span>
            </h2>
            <div className="space-y-4">
              <Input
                label={t('admin.storeNameLabel')}
                value={storeName}
                onChange={(e) => setStoreName(e.target.value)}
              />
              <Input
                label={t('admin.storeEmailLabel')}
                type="email"
                value={storeEmail}
                onChange={(e) => setStoreEmail(e.target.value)}
              />
              <Input
                label={t('admin.storePhoneLabel')}
                type="tel"
                value={storePhone}
                onChange={(e) => setStorePhone(e.target.value)}
              />
              <Input
                label={t('admin.storeAddressLabel')}
                value={storeAddress}
                onChange={(e) => setStoreAddress(e.target.value)}
              />
            </div>
          </div>

          {/* Card 2: العملة واللغات */}
          <div className={cardClass}>
            <h2 className={cardTitleClass}>
              <Globe className="w-4 h-4 text-text-brand" />
              <span>{t('admin.currencyLanguagesTitle')}</span>
            </h2>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-text-primary uppercase">{t('admin.displayCurrencyLabel')}</label>
                <select
                  value={currency}
                  onChange={(e) => setCurrency(e.target.value)}
                  className="w-full rounded-xl border border-border-default bg-background-primary px-4 py-2.5 text-xs font-bold text-text-primary focus:outline-none focus:ring-1 focus:ring-interactive-primary"
                >
                  <option value="ILS">{t('admin.currencyILS')}</option>
                  <option value="USD">{t('admin.currencyUSD')}</option>
                  <option value="JOD">{t('admin.currencyJOD')}</option>
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-text-primary uppercase">{t('admin.mainLanguageLabel')}</label>
                <select className="w-full rounded-xl border border-border-default bg-background-primary px-4 py-2.5 text-xs font-bold text-text-primary focus:outline-none focus:ring-1 focus:ring-interactive-primary">
                  <option value="ar">{t('admin.langArabic')}</option>
                  <option value="en">{t('admin.langEnglish')}</option>
                  <option value="he">{t('admin.langHebrew')}</option>
                </select>
              </div>
            </div>
          </div>
        </form>

        {/* Side Info Box (1 Column) */}
        <div className={cardClass}>
          <h2 className={cardTitleClass}>
            <Bell className="w-4 h-4 text-text-brand" />
            <span>{t('admin.adminAlertsTitle')}</span>
          </h2>
          <div className="space-y-3 text-xs font-bold text-text-primary">
            <label className="flex items-center justify-between cursor-pointer">
              <span>{t('admin.alertNewOrderEmail')}</span>
              <input type="checkbox" defaultChecked className="rounded border-border-default text-text-brand accent-interactive-primary focus:ring-interactive-primary" />
            </label>
            <label className="flex items-center justify-between cursor-pointer">
              <span>{t('admin.alertLowStock')}</span>
              <input type="checkbox" defaultChecked className="rounded border-border-default text-text-brand accent-interactive-primary focus:ring-interactive-primary" />
            </label>
            <label className="flex items-center justify-between cursor-pointer">
              <span>{t('admin.alertSecurityLogin')}</span>
              <input type="checkbox" defaultChecked className="rounded border-border-default text-text-brand accent-interactive-primary focus:ring-interactive-primary" />
            </label>
          </div>
        </div>
      </div>
    </div>
  );
}
export default AdminSettings;