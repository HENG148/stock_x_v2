import { Router } from "express";
import { authenticate } from "../../middlewares/authenticate.middleware";
import { validate } from "../../middlewares/validate.middleware";
import { createBidSchema, listOwnBidsQuerySchema, updateBidSchema } from "../validations/bids.validation";
import { bidController } from "../controllers/bids.controller";
import { uuidParamSchema } from "../../shared/validators/common";

export const route = Router();

route.use(authenticate);
route.post("/", validate({ body: createBidSchema }), bidController.create);
route.get("/me", validate({ query: listOwnBidsQuerySchema }), bidController.listOwn);
route.get("/:id", validate({ params: uuidParamSchema }), bidController.getOwn);
route.patch("/:id", validate({ params: uuidParamSchema, body: updateBidSchema }), bidController.update);
route.post("/:id/cancel", validate({ params: uuidParamSchema }), bidController.cancel);