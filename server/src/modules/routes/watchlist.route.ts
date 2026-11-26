import { Router } from "express";
import { validate } from "../../middlewares/validate.middleware";
import { addToWatchlistSchema, listWatchlistQuerySchema, watchlistProductParamSchema } from "../validations/watchlist.validation";
import { watchlistController } from "../controllers/watchlist.controller";

export const watchlistRoute = Router();

watchlistRoute.post("/", validate({ body: addToWatchlistSchema }), watchlistController.add);
watchlistRoute.get("/me", validate({ query: listWatchlistQuerySchema }), watchlistController.list);
watchlistRoute.delete("/:productId", validate({params: watchlistProductParamSchema}), watchlistController.remove)