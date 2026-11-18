import { Request, Response } from "express"
import { AppError } from "../../shared/error/app-error"
import { listingService, ListingService } from "../service/listing.service";
import { buildPaginationMeta, sendSuccess } from "../../utils/response";
import { CreateListingBody, ListOwnListingsQuery, UpdateListingBody } from "../validations/listing.validation";

function currentUserId(req: Request): string {
  if (!req.user) throw AppError.unauthenticated();
  return req.user.id;
}

export class ListingController {
  constructor(private readonly service: ListingService = listingService) { }

  create = async (req: Request, res: Response): Promise<void> => {
    const body = req.validated?.body as CreateListingBody;
    sendSuccess(res, await this.service.create(currentUserId(req), body), 201);
  }

  listOwn = async (req: Request, res: Response): Promise<void> => {
    const query = req.validated?.query as ListOwnListingsQuery;
    const { items, total } = await this.service.listOwn(currentUserId(req), query);
    sendSuccess(res, items, 200, buildPaginationMeta(query.page, query.limit, total));
  };

  getOwn = async (req: Request, res: Response): Promise<void> => {
    const { id } = req.validated?.params as { id: string };
    sendSuccess(res, await this.service.getOwn(currentUserId(req), id));
  };

  update = async (req: Request, res: Response): Promise<void> => {
    const { id } = req.validated?.params as { id: string };
    const body = req.validated?.body as UpdateListingBody;
    sendSuccess(res, await this.service.update(currentUserId(req), id, body));
  };

  cancel = async (req: Request, res: Response): Promise<void> => {
    const { id } = req.validated?.params as { id: string };
    sendSuccess(res, await this.service.cancel(currentUserId(req), id));
  };
}

export const listingController = new ListingController();