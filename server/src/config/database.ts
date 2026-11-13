import { Pool } from "pg";
import { env } from "./env";
import { drizzle } from "drizzle-orm/node-postgres";
import * as schema from "../db/schema/index"

export const pool = new Pool({ connectionString: env.DATABASE_URL, max: 10 })
export const db = drizzle(pool, { schema });

export type Database = typeof db;
export type Transaction = Parameters<Parameters<Database['transaction']>[0]>[0];
export type DbExecutor = Database | Transaction;