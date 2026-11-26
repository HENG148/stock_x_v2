import { Router } from "express";
import { authenticate } from "../../middlewares/authenticate.middleware";
import { validate } from "../../middlewares/validate.middleware";
import { listNotificationsQuerySchema } from "../validations/notification.validation";
import { notificationController } from "../controllers/notification.controller";
import { uuidParamSchema } from "../../shared/validators/common";

export const notificationRoutes = Router();

notificationRoutes.use(authenticate);

notificationRoutes.get("/me", validate({ query: listNotificationsQuerySchema }), notificationController.list);
notificationRoutes.get("/me/unread-count", notificationController.unreadCount);
notificationRoutes.post("/read-all", notificationController.markAllRead);
notificationRoutes.patch("/:id/read", validate({ params: uuidParamSchema }), notificationController.markRead);
notificationRoutes.delete("/:id", validate({ params: uuidParamSchema }), notificationController.remove);