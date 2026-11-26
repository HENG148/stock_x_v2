import { AppError } from "../../shared/error/app-error";
import { ListWatchlistFilters, WatchlistItemDto } from "../../types/watchlist.types";
import { isForeignKeyViolation } from "../../utils/db-error";
import { watchlistRepository, WatchlistRepository } from "../repo/watchlist.repository";

export class WatchlistService {
  constructor(private readonly repo: WatchlistRepository = watchlistRepository) { }
  
  async add(
    userId: string,
    productId: string
  ): Promise<{ item: WatchlistItemDto; created: boolean }> {
    if (!(await this.repo.productExist(productId))) throw this.prodocutNotFound();
    let created: boolean;
    try {
      created = await this.repo.add(userId, productId);
    } catch (err) {
      if (isForeignKeyViolation(err)) throw this.prodocutNotFound();
      throw err;
    }
    const item = await this.repo.find(userId, productId);
    if (!item) throw AppError.notFound("Watchlist item not found");
    return { item, created };
  }

  list(userId: string, filters: ListWatchlistFilters): Promise<{ items: WatchlistItemDto[], total: number }>{
    return this.repo.list(userId, filters)
  }

  async remove(userId: string, productId: string): Promise<void> {
    if (!(await this.repo.remove(userId, productId))) {
      throw AppError.notFound("This product is not in your watchlist")
    }
  }

  private prodocutNotFound(): AppError{
    return AppError.badRequest("Product not found", [
      { path: "body.productId", message: "Product not found" }
    ])
  }
}

export const watchListService = new WatchlistService();