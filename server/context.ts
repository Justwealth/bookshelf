import type { CreateHTTPContextOptions } from "@trpc/server/adapters/standalone";
import { fromNodeHeaders } from "better-auth/node";
import { auth } from "../src/lib/auth";
export async function createContext({ req }: CreateHTTPContextOptions) {
  const session = await auth.api.getSession({
    headers: fromNodeHeaders(req.headers),
  });
  return { session, origin: req.headers.origin };
}
export type Context = Awaited<ReturnType<typeof createContext>>;
