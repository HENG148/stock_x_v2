import { NOTIFICATION_TYPES } from "../db/schema/notification.schema";

export type NotificationType = (typeof NOTIFICATION_TYPES)[number];

export interface NotificationDto {
  id: string;
  type: NotificationType;
  title: string;
  message: string | null;
  link: string | null;
  isRead: boolean;
  createdAt: Date;
}

export interface NewNotificationInput {
  userId: string;
  type: NotificationType;
  title: string;
  message?: string | null;
  link?: string | null;
}

export interface ListNotificationsFilters {
  page: number;
  limit: number;
  isRead?: boolean;
  type?: NotificationType;
  order: 'asc' | 'desc';
}