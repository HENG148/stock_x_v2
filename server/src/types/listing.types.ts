import { LISTING_STATUSES } from "../db/schema";

export type ListingStatus = (typeof LISTING_STATUSES)[number];

export interface ListingProductSummary {
  id: string;
  name: string;
  slug: string;
  imageUrl: string | null;
}

export interface ListingDto {
  id: string;
  productId: string;
  product: ListingProductSummary;
  askPrice: string;
  size: string;
  status: ListingStatus;
  expiresAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateListingInput {
  productId: string;
  askPrice: string;
  size: string;
  expiresAt?: Date | undefined;
}

export interface UpdateListingInput {
  askPrice?: string;
  expiresAt?: Date | null;
}

export interface ListOwnListingFilters {
  page: number;
  limit: number;
  status?: ListingStatus;
  sortBy: "createdAt" | "askPrice";
  order: "asc" | "desc";
}