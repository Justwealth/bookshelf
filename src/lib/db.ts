import "dotenv/config";
import { Pool } from "pg";
const globalDb = globalThis as unknown as { bookshelfPool?: Pool };
export const db =
  globalDb.bookshelfPool ??
  new Pool({
    connectionString: process.env.DATABASE_URL,
    max: 5,
    connectionTimeoutMillis: 5000,
  });
if (process.env.NODE_ENV !== "production") globalDb.bookshelfPool = db;
