import { Router } from "express";
import { categoryController } from "../controllers/category.controller";
import { validate } from "../../middlewares/validate.middleware";
import { slugParamSchema, uuidParamSchema } from "../../shared/validators/common";
import { authenticate } from "../../middlewares/authenticate.middleware";
import { authorize } from "../../middlewares/authorize.middleware";
import { createCategorySchema, updateCategorySchema } from "../validations/categories.validation";

export const categoryRoutes = Router();

categoryRoutes.get("/", categoryController.list);
categoryRoutes.get("/:slug", validate({ params: slugParamSchema }), categoryController.getBySlug);
categoryRoutes.post("/", authenticate, authorize("admin"), validate({ body: createCategorySchema }), categoryController.create);
categoryRoutes.patch("/:id", authenticate, authorize("admin"), validate({ params: uuidParamSchema, body: updateCategorySchema }), categoryController.update);
categoryRoutes.delete("/:id", authenticate, authorize("admin"), validate({ params: uuidParamSchema }), categoryController.remove);