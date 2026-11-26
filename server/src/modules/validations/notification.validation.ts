import { z } from 'zod';
import { booleanQuerySchema, paginationQuerySchema } from '../../shared/validators/common.js';
import { NOTIFICATION_TYPES } from '../../db/schema/notification.schema.js';

export const listNotificationsQuerySchema = paginationQuerySchema.extend({
  isRead: booleanQuerySchema.optional(),
  type: z.enum(NOTIFICATION_TYPES).optional(),
  order: z.enum(['asc', 'desc']).default('desc'),
});

export type ListNotificationsQuery = z.infer<typeof listNotificationsQuerySchema>;