import { DbExecutor } from "../../config/database";
import { AppError } from "../../shared/error/app-error";
import { ListNotificationsFilters, NewNotificationInput, NotificationDto } from "../../types/notification.types";
import { notificationRepo, NotificationRepository } from "../repo/notification.repository";

const MAX_TITLE = 200;
const MAX_LINK = 500;

function normalise(input: NewNotificationInput): NewNotificationInput {
  return {
    userId: input.userId,
    type: input.type,
    title: input.title.slice(0, MAX_TITLE),
    message: input.message ?? null,
    link: input.link ? input.link.slice(0, MAX_LINK) : null
  };
}

export class NotificationService {
  constructor(private readonly repo: NotificationRepository = notificationRepo) { }
  withExecutor(executor: DbExecutor): NotificationService {
    return new NotificationService(new NotificationRepository(executor));
  }
  notify(input: NewNotificationInput): Promise<void> {
    return this.repo.createMany([normalise(input)]);
  }
  notifyMany(inputs: NewNotificationInput[]): Promise<void> {
    return this.repo.createMany(inputs.map(normalise));
  }

  list(
    userId: string,
    filters: ListNotificationsFilters
  ): Promise<{ items: NotificationDto[]; total: number }> {
    return this.repo.list(userId, filters);
  }

  unreadCount(userId: string): Promise<number> {
    return this.repo.countUnread(userId);
  }

  async markRead(userId: string, id: string): Promise<NotificationDto> {
    const notification = await this.repo.markRead(id, userId);
    if (!notification) throw AppError.notFound("Notification not found");
    return notification;
  }
  
  markAllRead(userId: string): Promise<number> {
    return this.repo.markAllRead(userId);
  }

  async remove(userId: string, id: string): Promise<void> {
    if (!(await this.repo.delete(id, userId))) {
      throw AppError.notFound("Notification not found");
    }
  }
}

export const notificationService = new NotificationService();