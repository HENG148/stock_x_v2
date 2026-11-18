import type { Request, Response } from 'express';
import { AppError } from '../../shared/error/app-error';
import { bidService, BidService } from '../service/bids.service';
import { CreateBidBody, ListOwnBidsQuery, UpdateBidBody } from '../validations/bids.validation';
import { buildPaginationMeta, sendSuccess } from '../../utils/response';

function currentUserId(req: Request): string {
  if (!req.user) throw AppError.unauthenticated();
  return req.user.id;
}

export class BidController {
  constructor(private readonly service: BidService = bidService) {}

  create = async (req: Request, res: Response): Promise<void> => {
    const body = req.validated?.body as CreateBidBody;
    sendSuccess(res, await this.service.create(currentUserId(req), body), 201);
  };

  listOwn = async (req: Request, res: Response): Promise<void> => {
    const query = req.validated?.query as ListOwnBidsQuery;
    const { items, total } = await this.service.listOwn(currentUserId(req), query);
    sendSuccess(res, items, 200, buildPaginationMeta(query.page, query.limit, total));
  };

  getOwn = async (req: Request, res: Response): Promise<void> => {
    const { id } = req.validated?.params as { id: string };
    sendSuccess(res, await this.service.getOwn(currentUserId(req), id));
  };

  update = async (req: Request, res: Response): Promise<void> => {
    const { id } = req.validated?.params as { id: string };
    const body = req.validated?.body as UpdateBidBody;
    sendSuccess(res, await this.service.update(currentUserId(req), id, body));
  };

  cancel = async (req: Request, res: Response): Promise<void> => {
    const { id } = req.validated?.params as { id: string };
    sendSuccess(res, await this.service.cancel(currentUserId(req), id));
  };
}

export const bidController = new BidController();