import { and, asc, count, desc, eq, SQL } from "drizzle-orm";
import { db, DbExecutor } from "../../config/database";
import { notifications } from "../../db/schema";
import { ListNotificationsFilters, NewNotificationInput, NotificationDto } from "../../types/notification.types";

const columns = {
  id: notifications.id,
  type: notifications.type,
  title: notifications.title,
  message: notifications.message,
  link: notifications.link,
  isRead: notifications.isRead,
  createdAt: notifications.createdAt,
};

export class NotificationRepository {
  constructor(private readonly executor: DbExecutor = db) { }
  
  async createMany(input: NewNotificationInput[]): Promise<void> {
    if (input.length === 0) return;
    await this.executor.insert(notifications).values(input)
  }

  async list(
    userId: string,
    filters: ListNotificationsFilters,
  ): Promise<{ items: NotificationDto[]; total: number }>{
    const condition: SQL[] = [eq(notifications.userId, userId)];
    if (filters.isRead !== undefined) condition.push(eq(notifications.isRead, filters.isRead));
    if (filters.type) condition.push(eq(notifications.type, filters.type));
    const where = and(...condition);
    const orderBy = filters.order === "asc" ? asc(notifications.createdAt) : desc(notifications.createdAt);

    const [items, totals] = await Promise.all([
      this.executor
        .select(columns)
        .from(notifications)
        .where(where)
        .orderBy(orderBy, asc(notifications.id))
        .limit(filters.limit)
        .offset((filters.page - 1) * filters.limit),
      this.executor.select({ total: count() }).from(notifications).where(where)
    ]);
    return { items, total: totals[0]?.total ?? 0}
  }

  async countUnread(userId: string): Promise<number> {
    const [row] = await this.executor
      .select({ total: count() })
      .from(notifications)
      .where(and(eq(notifications.userId, userId), eq(notifications.isRead, false)));
    return row?.total ?? 0;
  }

  async markRead(id: string, userId: string): Promise<NotificationDto | null> {
    const [row] = await this.executor
      .update(notifications)
      .set({ isRead: true })
      .where(and(eq(notifications.id, id), eq(notifications.userId, userId)))
      .returning(columns)
    return row ?? null;
  }

  async markAllRead(userId: string): Promise<number> {
    const updated = await this.executor
      .update(notifications)
      .set({ isRead: true })
      .where(and(eq(notifications.userId, userId), eq(notifications.isRead, false)))
      .returning({ id: notifications.id })
    return updated.length;
  }

  async delete(id: string, userId: string): Promise<boolean> {
    const deleted = await this.executor
      .delete(notifications)
      .where(and(eq(notifications.id, id), eq(notifications.userId, userId)))
      .returning({ id: notifications.id });
    return deleted.length > 0;
  }
}

export const notificationRepo = new NotificationRepository();