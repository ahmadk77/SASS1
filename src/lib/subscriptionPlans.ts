export interface SubscriptionPlan {
  id: string;
  name: string;
  price: string;
  rawPriceSAR: string;
  rawPriceUSD: string;
  formattedPrice: string;
  duration: string;
  popular?: boolean;
  features: string[];
}

export interface AdminPricingConfig {
  baseCurrency: string; // e.g. 'USD', 'JOD', 'SAR'
  starterPriceJOD: number;
  proPriceJOD: number;
  enterprisePriceJOD: number;
  exchangeRates: {
    [currency: string]: number;
  };
}

export const DEFAULT_PRICING_CONFIG: AdminPricingConfig = {
  baseCurrency: 'USD',
  starterPriceJOD: 0,
  proPriceJOD: 35,
  enterprisePriceJOD: 350,
  exchangeRates: {
    USD: 1.0,
    SAR: 3.75,
    JOD: 0.71,
    AED: 3.67,
    EUR: 0.92,
    GBP: 0.78,
    EGP: 48.0,
    KWD: 0.31,
    QAR: 3.64,
    BHD: 0.38,
    OMR: 0.38
  }
};

export function getAdminPricingConfig(): AdminPricingConfig {
  if (typeof window === 'undefined') return DEFAULT_PRICING_CONFIG;
  try {
    const saved = localStorage.getItem('admin_pricing_config');
    if (saved) {
      return JSON.parse(saved);
    }
  } catch (e) {}
  return DEFAULT_PRICING_CONFIG;
}

export function saveAdminPricingConfig(config: AdminPricingConfig) {
  if (typeof window === 'undefined') return;
  localStorage.setItem('admin_pricing_config', JSON.stringify(config));
}

export function formatCurrencyPrice(amountInUSD: number, currency: string = 'USD', config?: AdminPricingConfig): string {
  const cfg = config || getAdminPricingConfig();
  const rate = cfg.exchangeRates[currency.toUpperCase()] || (currency.toUpperCase() === 'USD' ? 1.0 : 1.0);
  const converted = amountInUSD * rate;

  switch (currency.toUpperCase()) {
    case 'JOD':
      return `${converted.toFixed(2)} د.أ`;
    case 'SAR':
      return `${converted.toFixed(2)} ر.س`;
    case 'USD':
      return `$${converted.toFixed(2)}`;
    case 'AED':
      return `${converted.toFixed(2)} درهم`;
    case 'EUR':
      return `€${converted.toFixed(2)}`;
    case 'GBP':
      return `£${converted.toFixed(2)}`;
    case 'EGP':
      return `${converted.toFixed(2)} ج.م`;
    case 'KWD':
      return `${converted.toFixed(2)} د.ك`;
    case 'QAR':
      return `${converted.toFixed(2)} ر.ق`;
    case 'BHD':
      return `${converted.toFixed(2)} د.ب`;
    case 'OMR':
      return `${converted.toFixed(2)} ر.ع`;
    default:
      return `${converted.toFixed(2)} ${currency}`;
  }
}

export function getSubscriptionPlans(
  appCurrency: string = 'USD',
  hasCustomDomain: boolean = false
): SubscriptionPlan[] {
  const config = getAdminPricingConfig();
  const cur = (appCurrency || config.baseCurrency || 'USD').toUpperCase();

  const monthlyPriceUSD = hasCustomDomain ? 40 : 35;
  const yearlyPriceUSD = hasCustomDomain ? 362 : 350;

  const starterConverted = formatCurrencyPrice(0, cur, config);
  const monthlyConverted = formatCurrencyPrice(monthlyPriceUSD, cur, config);
  const yearlyConverted = formatCurrencyPrice(yearlyPriceUSD, cur, config);

  const sarRate = config.exchangeRates['SAR'] || 3.75;
  const usdRate = config.exchangeRates['USD'] || 1.0;

  return [
    {
      id: 'starter',
      name: 'باقة التجربة المجانية',
      price: starterConverted,
      rawPriceSAR: '0.00',
      rawPriceUSD: '0.00',
      formattedPrice: starterConverted,
      duration: '3 أيام مجاناً',
      features: [
        'تجربة 3 أيام كاملة بدون رسوم',
        'نطاق فرعي افتراضي مجاني',
        'لوحة تحكم كاملة للمتجر',
        'تعديل وحفظ فوري'
      ]
    },
    {
      id: 'monthly',
      name: 'الباقة الشهرية',
      price: monthlyConverted,
      rawPriceSAR: (monthlyPriceUSD * sarRate).toFixed(2),
      rawPriceUSD: (monthlyPriceUSD * usdRate).toFixed(2),
      formattedPrice: monthlyConverted,
      duration: 'شهرياً',
      features: [
        'جميع أدوات ومميزات المنصة',
        hasCustomDomain ? 'شامل دومين خاص مخصص (+5)' : 'إمكانية إضافة دومين خاص (+5 شهرياً)',
        'استضافة وإدارة كاملة',
        'دعم فني مستمر'
      ]
    },
    {
      id: 'yearly',
      name: 'الباقة السنوية',
      price: yearlyConverted,
      rawPriceSAR: (yearlyPriceUSD * sarRate).toFixed(2),
      rawPriceUSD: (yearlyPriceUSD * usdRate).toFixed(2),
      formattedPrice: yearlyConverted,
      duration: 'سنوياً (توفير شهرين)',
      popular: true,
      features: [
        'جميع المميزات بالكامل',
        hasCustomDomain ? 'شامل دومين خاص مخصص (+12)' : 'إمكانية إضافة دومين خاص (+12 سنوياً)',
        'خصم شهرين عند الدفع السنوي',
        'أولوية قصوى في الدعم الفني'
      ]
    }
  ];
}

export function getPlanTitleById(planId?: string): string {
  if (planId === 'yearly' || planId === 'enterprise') return 'الباقة السنوية';
  if (planId === 'monthly' || planId === 'pro') return 'الباقة الشهرية';
  return 'باقة التجربة المجانية';
}

export function getPlanAmountById(planId?: string, appCurrency: string = 'USD', hasDomain: boolean = false): string {
  const config = getAdminPricingConfig();
  const cur = (appCurrency || config.baseCurrency || 'USD').toUpperCase();
  let baseAmountUSD = 0;
  if (planId === 'yearly' || planId === 'enterprise') {
    baseAmountUSD = hasDomain ? 362 : 350;
  } else if (planId === 'monthly' || planId === 'pro') {
    baseAmountUSD = hasDomain ? 40 : 35;
  } else {
    baseAmountUSD = 0;
  }
  return formatCurrencyPrice(baseAmountUSD, cur, config);
}
