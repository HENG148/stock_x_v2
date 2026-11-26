import { Request, Response } from "express";
import { AppError } from "../../shared/error/app-error";
import { notificationService, NotificationService } from "../service/notification.service";
import { ListNotificationsQuery } from "../validations/notification.validation";
import { buildPaginationMeta, sendNoContent, sendSuccess } from "../../utils/response";

function currentUserId(req: Request): string {
  if (!req.user) throw AppError.unauthenticated();
  return req.user.id;
}

export class NotificationController{
  constructor(private readonly service: NotificationService = notificationService) { }
  
  list = async (req: Request, res: Response): Promise<void> => {
    const query = req.validated?.query as ListNotificationsQuery;
    const { items, total } = await this.service.list(currentUserId(req), query);
    sendSuccess(res, items, 200, buildPaginationMeta(query.page, query.limit, total));
  }

  unreadCount = async (req: Request, res: Response): Promise<void> => {
    sendSuccess(res, { count: await this.service.unreadCount(currentUserId(req)) });
  }

  markRead = async (req: Request, res: Response): Promise<void> => {
    const { id } = req.validated?.params as { id: string };
    sendSuccess(res, await this.service.markRead(currentUserId(req), id));
  }

  markAllRead = async (req: Request, res: Response): Promise<void> => {
    sendSuccess(res, { updated: await this.service.markAllRead(currentUserId(req)) });
  }

  remove = async (req: Request, res: Response): Promise<void> => {
    const { id } = req.validated?.params as { id: string };
    await this.service.remove(currentUserId(req), id);
    sendNoContent(res);
  }
}

export const notificationController = new NotificationController();