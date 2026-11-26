import { createApp } from "./app";
import { pool } from "./config/database";
import { env } from "./config/env";
import { logger } from "./config/logger";
import { authService } from "./modules/service/auth.service";
import { bidService } from "./modules/service/bids.service";
import { listingService } from "./modules/service/listing.service";

const app = createApp();
const server = app.listen(env.PORT, () => {
  logger.info({ port: env.PORT, env: env.NODE_ENV }, "API is listening");
})

const purge = (): void => {
  authService
    .purgeExpiredSession()
    .then((removed) => logger.debug({ removed }, "Expired sessin purged"))
    .catch((err: unknown) => logger.error({ err: err }, "Session purge failed"));
  
  Promise.all([listingService.expireOverdue(), bidService.expireOverdue()])
    .then(([listings, bids]) => logger.debug({ listings, bids }, "Overdue asks and bid expired"))
    .catch((err: unknown) => logger.error({ err: err }, "Expiry sweep failed"));
};

purge();

const purgeTimer = setInterval(purge, 60 * 60 * 1000);
purgeTimer.unref();

function shutdown(signal: string): void {
  logger.info({ signal }, "shutdown");
  clearInterval(purgeTimer)
  server.close(() => {
    pool.end()
      .then(() => process.exit(0))
      .catch(() => process.exit(1));
  });
  setTimeout(() => process.exit(1), 10_000).unref();
}

process.on("SIGTERM", () => shutdown("SIGTERM"));
process.on("SIGINT", () => shutdown("SIGINT"));
process.on("unhandleRejection", (reason) => logger.error({ err: reason }, "Unhandled rejection"));