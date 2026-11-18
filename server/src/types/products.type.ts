export interface ProductCategorySummary {
  id: string;
  name: string;
  slug: string;
}

export interface ProductDto {
  id: string;
  categoryId: string | null;
  category: ProductCategorySummary | null;
  name: string;
  brand: string | null;
  sku: string | null;
  slug: string;
  description: string | null;
  retailPrice: string;
  imageUrl: string | null;
  isFeatured: boolean;
  featuredUntil: Date | null;
  section: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface MarketData {
  lowestAsk: string | null;
  highestBid: string | null;
  lastSalePrice: string | null;
}

export interface ProductDetailDto extends ProductDto {
  market: MarketData;
}

export interface CreateProductInput {
  name: string;
  slug?: string;
  brand?: string | null;
  sku?: string | null;
  description?: string | null;
  retailPrice: string;
  imageUrl?: string | null;
  categoryId?: string | null;
  isFeatured?: boolean;
  featuredUntil?: Date | null;
  section?: string;
}

export type UpdateProductInput = Partial<CreateProductInput>;

export interface ListProductsFilter {
  page: number;
  limit: number;
  search?: string;
  category?: string;
  brand?: string;
  section?: string;
  featured?: boolean;
  minPrice?: string;
  maxPrice?: string;
  sortBy: "createdAt" | "name" | "retailPrice";
  order: "asc" | "desc";
}