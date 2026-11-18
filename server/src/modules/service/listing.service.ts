import { AppError } from "../../shared/error/app-error";
import { CreateListingInput, ListingDto, ListOwnListingFilters, UpdateListingInput } from "../../types/listing.types";
import { isForeignKeyViolation } from "../../utils/db-error";
import { listingRepository, ListingRepository } from "../repo/listing.repository";

const SELF_MATCH_MESSAGE = 'This ask would match one of your own bids on the same product and size';

export class ListingService {
  constructor(private readonly repo: ListingRepository = listingRepository) { }
  
  async create(sellerId: string, input: CreateListingInput): Promise<ListingDto> {
    if (!(await this.repo.productExists(input.productId))) {
      throw this.productNotFound();
    }
    await this.assertNoSelfMatch(sellerId, input.productId, input.size, input.askPrice);
    let id: string;
    try {
      id = await this.repo.create(sellerId, input);
    } catch (err) {
      if (isForeignKeyViolation(err)) throw this.productNotFound();
      throw err;
    }
    return this.requiredOwned(id, sellerId);
  }

  async getOwn(sellerId: string, id: string): Promise<ListingDto> {
    await this.repo.expireOverdue(sellerId);
    return this.requiredOwned(id, sellerId);
  }

  async listOwn(
    sellerId: string,
    filters: ListOwnListingFilters,
  ): Promise<{ items: ListingDto[]; total: number}> {
    await this.repo.expireOverdue(sellerId);
    return this.repo.listOwn(sellerId, filters);
  }

  async update(sellerId: string, id: string, patch: UpdateListingInput): Promise<ListingDto>{
    await this.repo.expireOverdue(sellerId);
    const current = await this.requiredOwned(id, sellerId);
    this.assertActive(current);
    if (patch.askPrice !== undefined && patch.askPrice !== current.askPrice) {
      await this.assertNoSelfMatch(sellerId, current.productId, current.size, patch.askPrice)
    }
    if (!(await this.repo.updateActive(id, sellerId, patch))) {
      throw AppError.conflict("This listing is no longer active");
    }
    return this.requiredOwned(id, sellerId);
  }

  async cancel(sellerId: string, id: string): Promise<ListingDto> {
    await this.repo.expireOverdue(sellerId);
    const current = await this.requiredOwned(id, sellerId)
    this.assertActive(current);
    if (!(await this.repo.cancelActive(id, sellerId))) {
      throw AppError.conflict("This listing is no longer active");
    }
    return this.requiredOwned(id, sellerId);
  }

  expireOverdue(): Promise<number> {
    return this.repo.expireOverdue()
  }

  private async requiredOwned(id: string, sellerId: string): Promise<ListingDto> {
    const listing = await this.repo.finOwnedById(id, sellerId)
    if (!listing) throw AppError.notFound("Listing not found");
    return listing;
  }

  private assertActive(listing: ListingDto): void {
    if (listing.status !== "active") {
      throw AppError.conflict(`This listing is ${listing.status} and can no longer be changed`);
    }
  }

  private async assertNoSelfMatch(
    sellerId: string,
    productId: string,
    size: string,
    askPrice: string
  ): Promise<void> {
    if (await this.repo.hasOwnBidAtOrAbove(sellerId, productId, size, askPrice)) {
      throw AppError.conflict(SELF_MATCH_MESSAGE);
    }
  }

  private productNotFound(): AppError{
    return AppError.badRequest("Product not found", [
      { path: "body.productId", message: "Product not found" },
    ])
  }
}

export const listingService = new ListingService();