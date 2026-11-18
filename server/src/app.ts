import { Express } from "express";
import express from "express"
import { pinoHttp } from "pino-http";
import { logger } from "./config/logger";
import { globalRateLimiter } from "./middlewares/rate-limit.middleware";
import cors from "cors"
import cookieParser from "cookie-parser";
import helmet from "helmet";
import { corsOptions } from "./config/cors";
import { notFoundHandler } from "./middlewares/not-found.middleware";
import { errorHandler } from "./middlewares/error.middleware";
import { authRoutes } from "./modules/routes/auth.route";
import { userRoutes } from "./modules/routes/user.route";
import { categoryRoutes } from "./modules/routes/category.route";
import { productRoutes } from "./modules/routes/product.route";
import { env } from "./config/env";
import { ListingRoute } from "./modules/routes/listing.route";
import { route } from "./modules/routes/bids.route";

export function createApp(): Express {
  const app = express();
  app.disable("x-powered-by");
  if (env.TRUST_PROXY) app.set("trust proxy", 1);

  app.use(pinoHttp({ logger }));
  app.use(helmet())
  app.use(cors(corsOptions))
  app.use(globalRateLimiter);
  app.use(express.json({ limit: "100kb" }));
  app.use(cookieParser());

  const v1 = express.Router();
  v1.use("/auth", authRoutes);
  v1.use("/users", userRoutes);
  v1.use("/categories", categoryRoutes)
  v1.use("/products", productRoutes);
  v1.use("/listings", ListingRoute);
  v1.use("/bids", route);
  app.use('/api/v1', v1);

  app.use(notFoundHandler);
  app.use(errorHandler)

  return app;
}