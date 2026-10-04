/**
 * Localized String representation supporting either a flat string or a locale-mapped dictionary.
 * Example: "أهلاً بكم" or { ar: "أهلاً بكم", en: "Welcome", fr: "Bienvenue" }
 */
export type LocalizedString = string | Record<string, string>;

/**
 * Localized Media Asset representation
 */
export interface LocalizedAsset {
  url: string;
  alt?: LocalizedString;
}

/**
 * Individual Product / Item Block with Multi-Language & Multi-Currency Support
 */
export interface LocalizedItem {
  id: string | number;
  name: LocalizedString;
  description?: LocalizedString;
  price: string | number;
  pricesByCurrency?: Record<string, string | number>; // e.g., { SAR: 50, USD: 13.3, AED: 49 }
  category?: LocalizedString;
  image?: string;
  images?: string[]; // Multiple product images gallery
  sizes?: string[]; // Available sizes e.g., ["S", "M", "L", "XL"] or ["38", "39", "40", "41", "42"]
  colors?: string[]; // Available colors
  stock?: number; // Total stock quantity (e.g., 10, 3, 0)
  variantStock?: Record<string, number>; // Stock per size e.g. { "S": 5, "M": 0, "L": 2 }
  isAvailable?: boolean;
}

/**
 * Hero Section Block
 */
export interface LocalizedHeroSection {
  title: LocalizedString;
  subtitle?: LocalizedString;
  bgUrl?: string;
  ctaText?: LocalizedString;
  ctaUrl?: string;
  secondaryCtaText?: LocalizedString;
  isVisible?: boolean;
}

/**
 * Feature Block Item
 */
export interface LocalizedFeatureBlock {
  id: string | number;
  title: LocalizedString;
  description: LocalizedString;
  icon?: string;
  imageUrl?: string;
}

/**
 * Global Business & Design Settings
 */
export interface GlobalWebsiteSettings {
  businessName: LocalizedString;
  logoUrl?: string;
  phone?: string;
  whatsapp?: string;
  email?: string;
  address?: LocalizedString;
  workingHours?: LocalizedString;
  
  // Global Design & CSS Variables
  primaryColor?: string;
  secondaryColor?: string;
  bgColor?: string;
  textColor?: string;
  fontFamily?: string;
  baseFontSize?: number;
  buttonRadius?: string;
  
  // Social Links
  instagram?: string;
  tiktok?: string;
  twitter?: string;
  facebook?: string;

  // Store Operations Flags
  disableOrdering?: boolean;
  disableDelivery?: boolean;
  deliveryMessage?: LocalizedString;
}

/**
 * Complete Dynamic Localized Website Content JSON Schema
 * Stored inside website_content.content JSONB column
 */
export interface LocalizedWebsiteContentSchema {
  // Locale & Currency Configuration
  defaultLocale: string; // e.g., 'ar'
  activeLocales: string[]; // e.g., ['ar', 'en']
  defaultCurrency: string; // e.g., 'SAR'
  activeCurrencies: string[]; // e.g., ['SAR', 'USD', 'AED']

  // Global Brand & Design Settings
  settings: GlobalWebsiteSettings;

  // Section-Specific Blocks
  hero: LocalizedHeroSection;
  features?: LocalizedFeatureBlock[];
  items: LocalizedItem[];

  // Extensible Custom Sections Map for infinite updates without DB migrations
  sections?: Record<string, {
    id: string;
    type: string;
    title?: LocalizedString;
    content?: LocalizedString | Record<string, any>;
    isVisible?: boolean;
    styles?: Record<string, any>;
  }>;
}

/**
 * Helper utility function to safely resolve localized text based on requested locale
 */
export function getLocalizedText(
  value: LocalizedString | undefined,
  locale: string = 'ar',
  fallbackLocale: string = 'ar'
): string {
  if (!value) return '';
  if (typeof value === 'string') return value;
  return value[locale] || value[fallbackLocale] || Object.values(value)[0] || '';
}
