import { Router } from "express";
import { authenticate } from "../../middlewares/authenticate.middleware";
import { validate } from "../../middlewares/validate.middleware";
import { createListingSchema, listOwnListingQuerySchema, updateListingSchema } from "../validations/listing.validation";
import { listingController } from "../controllers/listing.controller";
import { uuidParamSchema } from "../../shared/validators/common";

export const ListingRoute = Router();

ListingRoute.use(authenticate);
ListingRoute.post("/", validate({ body: createListingSchema }), listingController.create)
ListingRoute.get("/me", validate({ query: listOwnListingQuerySchema }), listingController.listOwn);
ListingRoute.patch("/:id", validate({ params: uuidParamSchema, body: updateListingSchema }), listingController.update);
ListingRoute.post("/:id/cancel", validate({ params: uuidParamSchema }), listingController.cancel);