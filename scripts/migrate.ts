import "dotenv/config";
import { getMigrations } from "better-auth/db/migration";
import { auth } from "../src/lib/auth";
import { db } from "../src/lib/db";
try {
  const { runMigrations } = await getMigrations(auth.options);
  await runMigrations();
  await db.query(`CREATE TABLE IF NOT EXISTS books (
    id uuid PRIMARY KEY,
    user_id text NOT NULL REFERENCES "user"(id) ON DELETE CASCADE,
    title varchar(160) NOT NULL CHECK (length(trim(title)) > 0),
    author varchar(100) NOT NULL CHECK (length(trim(author)) > 0),
    status text NOT NULL DEFAULT 'to-read' CHECK (status IN ('to-read','reading','finished')),
    created_at timestamptz NOT NULL DEFAULT now()
  ); CREATE INDEX IF NOT EXISTS books_user_created_idx ON books(user_id, created_at DESC);`);
  console.log("Authentication tables and books table are ready.");
} catch (error) {
  console.error("Migration failed:", error);
  process.exitCode = 1;
} finally {
  await db.end();
}
