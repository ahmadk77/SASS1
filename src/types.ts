export interface FashionProduct {
  id: string | number;
  title?: string;
  name?: string;
  price: string | number;
  originalPrice?: string | number;
  original_price?: string | number;
  priceBeforeDiscount?: string | number;
  salePrice?: string | number;
  primaryImage?: string;
  image?: string;
  secondaryImage?: string;
  images?: string[];
  colors?: string[];
  colorImages?: Record<string, string>;
  colorStocks?: Record<string, number>;
  sizes?: string[];
  sizeStocks?: Record<string, number>;
  stock: number;
  category?: string;
  inventoryStatus?: string;
  description?: string;
}

export interface ProductStockAllocation {
  totalStock: number;
  sizes: Record<string, number>;
  colors: Record<string, number>;
}

export interface FashionStoreContent {
  products: FashionProduct[];
  categories?: string[];
  hero?: {
    title?: string;
    subtitle?: string;
    bgUrl?: string;
    ctaText?: string;
  };
}

export type { LocalizedItem, LocalizedWebsiteContentSchema } from './types/content';
