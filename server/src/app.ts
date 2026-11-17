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

export function createApp(): Express {
  const app = express();

  app.use(helmet())
  app.disable("x-powered-by");
  app.use(pinoHttp({ logger }));
  app.use(cors(corsOptions))
  app.use(globalRateLimiter);
  app.use(express.json({ limit: "100kb" }));
  app.use(cookieParser());

  app.use(notFoundHandler);
  app.use(errorHandler)

  return app;
}