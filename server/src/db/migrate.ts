import { migrate } from "drizzle-orm/node-postgres/migrator";
import { logger } from "../config/logger";
import { db, pool } from "../config/database";

async function run(): Promise<void> {
  await migrate(db, { migrationsFolder: "./src/db/migrations" });
  logger.info("Migrations applied");
  await pool.end();
}

run().catch((err: unknown) => {
  logger.error({ err: err }, "Migration  failed");
  process.exit(1);
})
