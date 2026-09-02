export function formatPrice(value, locale = 'en') {
  const amount = Number(value) || 0;
  // Force Western (Latin) digits even for ar (INSTRUCTIONS.md §36.3)
  return new Intl.NumberFormat(locale, {
    numberingSystem: 'latn',
    maximumFractionDigits: 2,
  }).format(amount);
}