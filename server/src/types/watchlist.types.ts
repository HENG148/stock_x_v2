export interface WatchlistProductSummary {
  id: string;
  name: string;
  slug: string;
  brand: string | null;
  imageUrl: string | null;
  retailPrice: string;
}

export interface WatchlistItemDto {
  id: string;
  productId: string;
  product: WatchlistProductSummary;
  createdAt: Date;
}

export interface ListWatchlistFilters {
  page: number;
  limit: number;
  order: "asc" | "desc"
}