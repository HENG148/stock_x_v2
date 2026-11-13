import { Router } from "express";
import { authenticate } from "../../middlewares/authenticate.middleware";
import { validate } from "../../middlewares/validate.middleware";
import { listUsersQuerySchema, updateProfileSchema, updateRoleSchema } from "../validations/user.validation";
import { userController } from "../controllers/user.controller";
import { authorize } from "../../middlewares/authorize.middleware";
import { uuidParamSchema } from "../../shared/validators/common";

export const userRoutes = Router();

userRoutes.use(authenticate);
userRoutes.patch("/me", validate({ body: updateProfileSchema }), userController.updateMe);
userRoutes.get("/", authorize("admin"), validate({ query: listUsersQuerySchema }), userController.list);
userRoutes.get("/:id", authorize("admin"), validate({ params: uuidParamSchema }), userController.getById);
userRoutes.patch("/:id/role", authorize("admin"), validate({ params: uuidParamSchema, body: updateRoleSchema }), userController.changeRole);