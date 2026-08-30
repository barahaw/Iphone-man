import { useUiStore } from '../stores/useUiStore';
import en from '../../locales/en.json';
import ar from '../../locales/ar.json';
import he from '../../locales/he.json';

const dictionaries = { en, ar, he };

export function useTranslation() {
  const locale = useUiStore((state) => state.locale) || 'ar';
  const dict = dictionaries[locale] || dictionaries.ar;

  const t = (path, fallback = '') => {
    const keys = path.split('.');
    let current = dict;
    for (const key of keys) {
      if (current && current[key] !== undefined) {
        current = current[key];
      } else {
        // Fall back to English if missing in target locale (INSTRUCTIONS.md §36.2)
        let enCurrent = dictionaries.en;
        for (const enKey of keys) {
          if (enCurrent && enCurrent[enKey] !== undefined) {
            enCurrent = enCurrent[enKey];
          } else {
            return fallback || path;
          }
        }
        return enCurrent;
      }
    }
    return current;
  };

  return { t, locale, dir: locale === 'en' ? 'ltr' : 'rtl' };
}
