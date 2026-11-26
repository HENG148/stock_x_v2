import { Request, Response } from "express";
import { AppError } from "../../shared/error/app-error";
import { watchListService, WatchlistService } from "../service/watchlist.service";
import { AddToWatchlistBody, ListWatchlistQuery } from "../validations/watchlist.validation";
import { buildPaginationMeta, sendNoContent, sendSuccess } from "../../utils/response";

function currentUserId(req: Request): string {
  if (!req.user) throw AppError.unauthenticated();
  return req.user.id;
}

export class WatchlistController {
  constructor(private readonly service: WatchlistService = watchListService) { }
  
  add = async (req: Request, res: Response): Promise<void> => {
    const { productId } = req.validated?.body as AddToWatchlistBody;
    const { item, created } = await this.service.add(currentUserId(req), productId);
    sendSuccess(res, item, created ? 201 : 200);
  }

  list = async (req: Request, res: Response): Promise<void> => {
    const query = req.validated?.query as ListWatchlistQuery;
    const { items, total } = await this.service.list(currentUserId(req), query);
    sendSuccess(res, items, 200, buildPaginationMeta(query.page, query.limit, total));
  }

  remove = async (req: Request, res: Response): Promise<void> => {
    const { productId } = req.validated?.params as { productId: string };
    await this.service.remove(currentUserId(req), productId);
    sendNoContent(res);
  }
}

export const watchlistController = new WatchlistController();