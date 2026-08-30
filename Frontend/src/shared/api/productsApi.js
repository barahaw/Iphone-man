const API_BASE_URL = '/api/v1';

const FALLBACK_PRODUCTS = [
  {
    id: 'p1', name: 'iPhone 15 Pro', slug: 'iphone-15-pro', subtitle: 'Titanium Black - 256GB',
    brand: 'Apple', category: 'smartphones', price: 4899, isNew: true, inStock: true,
    image: 'https://images.unsplash.com/photo-1695048133142-1a20484d2569?w=600&auto=format&fit=crop&q=80',
  },
  {
    id: 'p17', name: 'iPhone 17 Pro', slug: 'iphone-17-pro', subtitle: 'Titanium Blue - 256GB',
    brand: 'Apple', category: 'smartphones', price: 4299, isNew: true, inStock: true,
    image: 'https://images.unsplash.com/photo-1542751110-97427bbecf20?w=600&auto=format&fit=crop&q=80',
  },
  {
    id: 'p2', name: 'Galaxy S24 Ultra', slug: 'galaxy-s24-ultra', subtitle: 'Titanium Gray - 512GB',
    brand: 'Samsung', category: 'smartphones', price: 5200, isSale: true, inStock: true,
    image: 'https://images.unsplash.com/photo-1610945265064-0e34e5519bbf?w=600&auto=format&fit=crop&q=80',
  },
  {
    id: 'p3', name: 'Nothing Phone (2)', slug: 'nothing-phone-2', subtitle: 'Glyph Interface - 512GB',
    brand: 'Nothing', category: 'smartphones', price: 2999, inStock: true,
    image: 'https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?w=600&auto=format&fit=crop&q=80',
  },
  {
    id: 'p4', name: 'AirPods Max', slug: 'airpods-max', subtitle: 'Wireless Over-Ear',
    brand: 'Apple', category: 'accessories', price: 2150, inStock: true,
    image: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=600&auto=format&fit=crop&q=80',
  },
  {
    id: 'p5', name: 'Carbon Fiber Case', slug: 'carbon-fiber-case', subtitle: 'iPhone 15 Pro Max',
    brand: 'Apple', category: 'accessories', price: 249, inStock: true,
    image: 'https://images.unsplash.com/photo-1601784551446-20c9e07cdbdb?w=600&auto=format&fit=crop&q=80',
  },
  {
    id: 'p6', name: 'Apple Watch Ultra 2', slug: 'apple-watch-ultra-2', subtitle: 'Pro Outdoor Watch',
    brand: 'Apple', category: 'watches', price: 3499, isNew: true, inStock: true,
    image: 'https://images.unsplash.com/photo-1579586337278-3befd40fd17a?w=600&auto=format&fit=crop&q=80',
  },
  {
    id: 'p7', name: 'MagSafe Stand Pro', slug: 'magsafe-stand-pro', subtitle: 'Magnetic GaN Charger',
    brand: 'Apple', category: 'accessories', price: 399, inStock: true,
    image: 'https://images.unsplash.com/photo-1583863788434-e58a36330cf0?w=600&auto=format&fit=crop&q=80',
  },
  {
    id: 'p8', name: 'Google Pixel 9 Pro', slug: 'google-pixel-9-pro', subtitle: 'Obsidian - 128GB',
    brand: 'Google', category: 'smartphones', price: 3799, isNew: true, inStock: true,
    image: 'https://images.unsplash.com/photo-1598327105666-5b89351aff97?w=600&auto=format&fit=crop&q=80',
  },
];

const DEFAULT_WARRANTY = 'ضمان رسمي لمدة سنتين';
const DEFAULT_DELIVERY = 'توصيل مجاني للطلبات فوق 2,000 ₪';

const GALLERY_POOL = [
  'https://images.unsplash.com/photo-1695048133142-1a20484d2569?w=800&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1542751110-97427bbecf20?w=800&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1610945265064-0e34e5519bbf?w=800&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?w=800&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=800&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1601784551446-20c9e07cdbdb?w=800&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1579586337278-3befd40fd17a?w=800&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1583863788434-e58a36330cf0?w=800&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1598327105666-5b89351aff97?w=800&auto=format&fit=crop&q=80',
];

const PRODUCT_DETAILS = {
  'iphone-15-pro': {
    description:
      'هيكل من التيتانيوم الفاخر، شريحة A17 Pro المتطورة، ونظام كاميرا احترافي يعيد تعريف التصوير الفوتوغرافي للهواتف المحمولة.',
    colors: [
      { name: 'تيتانيوم طبيعي', nameEn: 'Natural Titanium', hex: '#BEB7A4' },
      { name: 'تيتانيوم أزرق', nameEn: 'Blue Titanium', hex: '#3B4B5A' },
      { name: 'تيتانيوم أبيض', nameEn: 'White Titanium', hex: '#F0F0EE' },
      { name: 'تيتانيوم أسود', nameEn: 'Black Titanium', hex: '#2A2A2B' },
    ],
    storageOptions: [
      { label: '128GB', note: 'الأساسي', delta: 0 },
      { label: '256GB', note: '+450 ₪', delta: 450 },
      { label: '512GB', note: '+1,200 ₪', delta: 1200 },
      { label: '1TB', note: '+1,950 ₪', delta: 1950 },
    ],
    specs: [
      { label: 'الشاشة', value: 'Super Retina XDR 6.1 بوصة ProMotion' },
      { label: 'المعالج', value: 'A17 Pro مع وحدة رسومات سداسية النوى' },
      { label: 'الكاميرا الخلفية', value: 'نظام كاميرا برو (48MP رئيسي + عريض جداً + تيليفوتو)' },
      { label: 'البطارية', value: 'حتى 23 ساعة تشغيل فيديو' },
      { label: 'الوزن', value: '187 جرام' },
      { label: 'المقاومة', value: 'مقاومة للماء والغبار (IP68)' },
    ],
  },
  'iphone-17-pro': {
    description:
      'جيل جديد من الأداء والتقنيات الذكية داخل هيكل تيتانيوم متين، مع شريحة A19 Pro وكاميرا محسّنة بتقنيات الذكاء الاصطناعي.',
    colors: [
      { name: 'تيتانيوم أزرق', nameEn: 'Blue Titanium', hex: '#2B5C8C' },
      { name: 'تيتانيوم رمادي', nameEn: 'Graphite', hex: '#3A3A3C' },
      { name: 'تيتانيوم طبيعي', nameEn: 'Natural Titanium', hex: '#C4BFB2' },
      { name: 'تيتانيوم أبيض', nameEn: 'White Titanium', hex: '#EDEDEA' },
    ],
    storageOptions: [
      { label: '256GB', note: 'الأساسي', delta: 0 },
      { label: '512GB', note: '+500 ₪', delta: 500 },
      { label: '1TB', note: '+1,000 ₪', delta: 1000 },
    ],
    specs: [
      { label: 'الشاشة', value: 'Super Retina XDR 6.3 بوصة ProMotion' },
      { label: 'المعالج', value: 'A19 Pro مع محرك عصبي متطور' },
      { label: 'الكاميرا الخلفية', value: 'نظام كاميرا برو (48MP رئيسي + تقريب بصري 5x)' },
      { label: 'البطارية', value: 'حتى 26 ساعة تشغيل فيديو' },
      { label: 'الوزن', value: '199 جرام' },
      { label: 'المقاومة', value: 'مقاومة للماء والغبار (IP68)' },
    ],
  },
  'galaxy-s24-ultra': {
    description:
      'شاشة Dynamic AMOLED 2X مذهلة، كاميرا 200MP تصور بأدق التفاصيل، مع قلم S Pen وأداة Galaxy AI الذكية للعمل والإبداع.',
    colors: [
      { name: 'رمادي تيتانيوم', nameEn: 'Titanium Gray', hex: '#7B7B7E' },
      { name: 'بنفسجي تيتانيوم', nameEn: 'Titanium Violet', hex: '#5A4B8C' },
      { name: 'أسود تيتانيوم', nameEn: 'Titanium Black', hex: '#1C1C1E' },
      { name: 'أصفر تيتانيوم', nameEn: 'Titanium Yellow', hex: '#C7B26A' },
    ],
    storageOptions: [
      { label: '256GB', note: 'الأساسي', delta: 0 },
      { label: '512GB', note: '+400 ₪', delta: 400 },
      { label: '1TB', note: '+700 ₪', delta: 700 },
    ],
    specs: [
      { label: 'الشاشة', value: 'Dynamic AMOLED 2X 6.8 بوصة 120Hz' },
      { label: 'المعالج', value: 'Snapdragon 8 Gen 3 للمرحلة Galaxy' },
      { label: 'الكاميرا الخلفية', value: '200MP + تقريب بصري 5x' },
      { label: 'البطارية', value: '5000 مللي أمبير' },
      { label: 'الوزن', value: '232 جرام' },
      { label: 'القلم', value: 'S Pen مدمج بدعم Galaxy AI' },
    ],
  },
  'nothing-phone-2': {
    description:
      'تصميم Glyph المميز مع واجهة نظيفة وسريعة، شريحة Snapdragon 8+ Gen 1، وشاشة LTPO متوافقة مع عمق تجربة Android الخالص.',
    colors: [
      { name: 'أسود', nameEn: 'Black', hex: '#1C1C1E' },
      { name: 'أبيض', nameEn: 'White', hex: '#F2F2F2' },
    ],
    storageOptions: [
      { label: '256GB', note: 'الأساسي', delta: 0 },
      { label: '512GB', note: '+400 ₪', delta: 400 },
    ],
    specs: [
      { label: 'الشاشة', value: 'LTPO OLED 6.7 بوصة 120Hz' },
      { label: 'المعالج', value: 'Snapdragon 8+ Gen 1' },
      { label: 'الكاميرا الخلفية', value: 'كاميرتان 50MP بدعم بصري' },
      { label: 'البطارية', value: '4700 مللي أمبير مع شحن 45W' },
      { label: 'الوزن', value: '201 جرام' },
      { label: 'التصميم', value: 'واجهة Glyph بإضاءة خلفية تفاعلية' },
    ],
  },
  'airpods-max': {
    description:
      'سماعات رأس سلكية فاخرة بصوت محيطي، تقنية إلغاء الضوضاء النشطة، وخامة ألومنيوم راقية مع توازن صوتي استثنائي.',
    colors: [
      { name: 'رمادي فلكي', nameEn: 'Space Gray', hex: '#5A5A5C' },
      { name: 'فضي', nameEn: 'Silver', hex: '#E5E5E3' },
      { name: 'أزرق سماوي', nameEn: 'Sky Blue', hex: '#A8BFD7' },
      { name: 'وردي', nameEn: 'Pink', hex: '#E8B4BC' },
    ],
    storageOptions: [
      { label: 'قياسي', note: 'الأساسي', delta: 0 },
      { label: 'مع Lightning', note: '+100 ₪', delta: 100 },
    ],
    specs: [
      { label: 'الصوت', value: 'صوت عالي الدقة مع دعم Lossless' },
      { label: 'إلغاء الضوضاء', value: 'إلغاء ضوضاء نشط + وضع شفافية' },
      { label: 'البطارية', value: 'حتى 20 ساعة تشغيل' },
      { label: 'الاتصال', value: 'Bluetooth 5.0 + موصل Lightning' },
      { label: 'الوزن', value: '384.8 جرام' },
    ],
  },
  'carbon-fiber-case': {
    description:
      'كفر حماية بخامة كربون خفيفة للغاية، مقاوم للصدمات والخدوش، مع تصميم نحيف يحافظ على جمالية جهازك.',
    colors: [
      { name: 'كربون أسود', nameEn: 'Carbon Black', hex: '#161616' },
      { name: 'كربون رمادي', nameEn: 'Carbon Gray', hex: '#4A4A4A' },
    ],
    storageOptions: [
      { label: 'iPhone 15 Pro Max', note: 'الأساسي', delta: 0 },
      { label: 'iPhone 15 Pro', note: '-20 ₪', delta: -20 },
    ],
    specs: [
      { label: 'الخامة', value: 'ألياف كربون حقيقية' },
      { label: 'الوزن', value: '18 جرام فقط' },
      { label: 'الحماية', value: 'مقاومة سقوط MIL-STD' },
      { label: 'الحافة', value: 'أغطية أزرار مطاطية متينة' },
    ],
  },
  'apple-watch-ultra-2': {
    description:
      'ساعة ذكية متطورة للمغامرة والرياضة، بشاشة Retina فائقة السطوع، GPS مزدوج التردد، وبطارية تدوم حتى 36 ساعة.',
    colors: [
      { name: 'تيتانيوم طبيعي', nameEn: 'Natural Titanium', hex: '#CFC8BC' },
      { name: 'تيتانيوم أسود', nameEn: 'Black Titanium', hex: '#2A2A2C' },
    ],
    storageOptions: [
      { label: '49mm GPS+Cell', note: 'الأساسي', delta: 0 },
      { label: '49mm مع Loop', note: '+150 ₪', delta: 150 },
    ],
    specs: [
      { label: 'الشاشة', value: 'Retina OLED 49 ملم 3000 nits' },
      { label: 'البطارية', value: 'حتى 36 ساعة (72 وضع توفير)' },
      { label: 'المقاومة', value: '100 متر للغوص + معيار MIL-STD' },
      { label: 'المستشعرات', value: 'قلب، أكسجين الدم، حرارة الجسم' },
      { label: 'الاتصال', value: 'GPS مزدوج التردد + خلية' },
    ],
  },
  'magsafe-stand-pro': {
    description:
      'شاحن مغناطيسي أنيق بتقنية GaN لشحن سريع وآمن، مع تصميم قائم يدعم الوضع الأفقي والعمودي وجميع أجهزة MagSafe.',
    colors: [
      { name: 'فضي', nameEn: 'Silver', hex: '#E5E5E3' },
      { name: 'أسود', nameEn: 'Black', hex: '#2C2C2E' },
    ],
    storageOptions: [
      { label: 'قياسي', note: 'الأساسي', delta: 0 },
      { label: 'بإكسسوار الكابل', note: '+50 ₪', delta: 50 },
    ],
    specs: [
      { label: 'القدرة', value: '15W شحن MagSafe' },
      { label: 'التقنية', value: 'GaN شحن سريع متوافق' },
      { label: 'التوافق', value: 'iPhone 8 فأحدث + أجهزة Qi' },
      { label: 'الأبعاد', value: 'قائم قابل للطي 18 جرام' },
    ],
  },
  'google-pixel-9-pro': {
    description:
      'كبسة Google الذكية مع كاميرا 50MP تقودها الذكاء الاصطناعي، شاشة Super Actua، وتجربة Android أنيقة ونقية.',
    colors: [
      { name: 'سبج', nameEn: 'Obsidian', hex: '#1E1E1E' },
      { name: 'بورسلين', nameEn: 'Porcelain', hex: '#F2F0EB' },
      { name: 'عسلي', nameEn: 'Hazel', hex: '#98907E' },
    ],
    storageOptions: [
      { label: '128GB', note: 'الأساسي', delta: 0 },
      { label: '256GB', note: '+350 ₪', delta: 350 },
      { label: '512GB', note: '+650 ₪', delta: 650 },
    ],
    specs: [
      { label: 'الشاشة', value: 'Super Actua OLED 6.3 بوصة' },
      { label: 'المعالج', value: 'Google Tensor G4 + مساعد Gemini' },
      { label: 'الكاميرا الخلفية', value: '50MP رئيسية + 48MP فائقة الاتساع' },
      { label: 'البطارية', value: '4700 مللي أمبير' },
      { label: 'الوزن', value: '199 جرام' },
      { label: 'المقاومة', value: 'IP68' },
    ],
  },
};

function buildImages(base) {
  const index = Math.max(0, FALLBACK_PRODUCTS.findIndex((p) => p.slug === base.slug));
  const pool = GALLERY_POOL.filter((img) => img !== base.image);
  return [base.image, pool[index % pool.length], pool[(index + 1) % pool.length]];
}

function getRelatedProducts(currentSlug) {
  const current = FALLBACK_PRODUCTS.find((p) => p.slug === currentSlug);
  if (!current) return [];
  const sameCategory = FALLBACK_PRODUCTS.filter(
    (p) => p.slug !== currentSlug && p.category === current.category
  );
  const others = FALLBACK_PRODUCTS.filter(
    (p) => p.slug !== currentSlug && p.category !== current.category
  );
  return [...sameCategory, ...others].slice(0, 4);
}

function enrichProduct(slug) {
  const base = FALLBACK_PRODUCTS.find((p) => p.slug === slug);
  if (!base) return null;

  const details = PRODUCT_DETAILS[base.slug] || {};

  const defaultDetails = {
    description: `${base.name} — ${base.subtitle}`,
    colors: [{ name: 'قياسي', nameEn: 'Standard', hex: '#3A3A3C' }],
    storageOptions: [{ label: 'قياسي', note: 'الأساسي', delta: 0 }],
    specs: [
      { label: 'العلامة التجارية', value: base.brand },
      { label: 'الفئة', value: base.category },
      { label: 'اللون الأساسي', value: base.subtitle },
      { label: 'التوفر', value: base.inStock ? 'متوفر' : 'نفذت الكمية' },
    ],
  };

  return {
    ...base,
    ...defaultDetails,
    ...details,
    images: buildImages(base),
    warranty: DEFAULT_WARRANTY,
    deliveryInfo: DEFAULT_DELIVERY,
    relatedProducts: getRelatedProducts(base.slug),
  };
}

export async function fetchProducts(params = {}) {
  try {
    const queryString = new URLSearchParams(params).toString();
    const res = await fetch(`${API_BASE_URL}/products${queryString ? `?${queryString}` : ''}`);
    if (!res.ok) throw new Error(`API Error: ${res.status}`);
    const json = await res.json();
    return json.data || json;
  } catch {
    return FALLBACK_PRODUCTS;
  }
}

export async function fetchProductBySlug(slug) {
  try {
    const res = await fetch(`${API_BASE_URL}/products/${slug}`);
    if (!res.ok) throw new Error(`API Error: ${res.status}`);
    const json = await res.json();
    const data = json.data || json;
    return (data && data.id) ? data : enrichProduct(slug);
  } catch {
    return enrichProduct(slug);
  }
}