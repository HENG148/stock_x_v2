import { BID_STATUSES } from "../db/schema";

export type BidStatus = (typeof BID_STATUSES)[number];

export interface BidProductSummary {
  id: string;
  name: string;
  slug: string;
  imageUrl: string | null;
}

export interface BidDto {
  id: string;
  productId: string;
  product: BidProductSummary;
  bidPrice: string;
  size: string;
  status: BidStatus;
  expiresAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateBidInput {
  productId: string;
  bidPrice: string;
  size: string;
  expiresAt?: Date;
}

export interface UpdateBidInput {
  bidPrice?: string;
  expiresAt?: Date | null;
}

export interface ListOwnBidsFilters {
  page: number;
  limit: number;
  status?: BidStatus;
  sortBy: "createdAt" | "bidPrice";
  order: "asc" | "desc";
}