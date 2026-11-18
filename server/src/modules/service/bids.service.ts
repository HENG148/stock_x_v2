import { AppError } from "../../shared/error/app-error";
import { BidDto, CreateBidInput, ListOwnBidsFilters, UpdateBidInput } from "../../types/bids.types";
import { isForeignKeyViolation } from "../../utils/db-error";
import { bidRepository, BidRepository } from "../repo/bids.repository";


const SELF_MATCH_MESSAGE = 'This bid would match one of your own asks on the same product and size';

export class BidService {
  constructor(private readonly repository: BidRepository = bidRepository) {}

  async create(buyerId: string, input: CreateBidInput): Promise<BidDto> {
    if (!(await this.repository.productExists(input.productId))) {
      throw this.productNotFound();
    }
    await this.assertNoSelfMatch(buyerId, input.productId, input.size, input.bidPrice);

    let id: string;
    try {
      id = await this.repository.create(buyerId, input);
    } catch (error) {
      // The product was deleted between the check and the insert.
      if (isForeignKeyViolation(error)) throw this.productNotFound();
      throw error;
    }
    return this.requireOwned(id, buyerId);
  }

  async getOwn(buyerId: string, id: string): Promise<BidDto> {
    await this.repository.expireOverdue(buyerId);
    return this.requireOwned(id, buyerId);
  }

  async listOwn(
    buyerId: string,
    filters: ListOwnBidsFilters,
  ): Promise<{ items: BidDto[]; total: number }> {
    await this.repository.expireOverdue(buyerId);
    return this.repository.listOwn(buyerId, filters);
  }

  async update(buyerId: string, id: string, patch: UpdateBidInput): Promise<BidDto> {
    await this.repository.expireOverdue(buyerId);
    const current = await this.requireOwned(id, buyerId);
    this.assertActive(current);

    if (patch.bidPrice !== undefined && patch.bidPrice !== current.bidPrice) {
      await this.assertNoSelfMatch(buyerId, current.productId, current.size, patch.bidPrice);
    }
    if (!(await this.repository.updateActive(id, buyerId, patch))) {
      throw AppError.conflict('This bid is no longer active');
    }
    return this.requireOwned(id, buyerId);
  }

  async cancel(buyerId: string, id: string): Promise<BidDto> {
    await this.repository.expireOverdue(buyerId);
    const current = await this.requireOwned(id, buyerId);
    this.assertActive(current);
    if (!(await this.repository.cancelActive(id, buyerId))) {
      throw AppError.conflict('This bid is no longer active');
    }
    return this.requireOwned(id, buyerId);
  }

  expireOverdue(): Promise<number> {
    return this.repository.expireOverdue();
  }

  /** Someone else's bid is reported as missing so ids cannot be probed. */
  private async requireOwned(id: string, buyerId: string): Promise<BidDto> {
    const bid = await this.repository.findOwnedById(id, buyerId);
    if (!bid) throw AppError.notFound('Bid not found');
    return bid;
  }

  private assertActive(bid: BidDto): void {
    if (bid.status !== 'active') {
      throw AppError.conflict(`This bid is ${bid.status} and can no longer be changed`);
    }
  }

  private async assertNoSelfMatch(
    buyerId: string,
    productId: string,
    size: string,
    bidPrice: string,
  ): Promise<void> {
    if (await this.repository.hasOwnListingAtOrBelow(buyerId, productId, size, bidPrice)) {
      throw AppError.conflict(SELF_MATCH_MESSAGE);
    }
  }

  private productNotFound(): AppError {
    return AppError.badRequest('Product not found', [
      { path: 'body.productId', message: 'Product not found' },
    ]);
  }
}

export const bidService = new BidService();