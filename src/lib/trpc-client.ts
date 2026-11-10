"use client";
import { createTRPCClient, httpBatchLink } from "@trpc/client";
import type { AppRouter } from "../../server/router";
// This is a type-only import: database/backend code is never bundled into the browser.
export const trpc = createTRPCClient<AppRouter>({
  links: [httpBatchLink({ url: "/api/trpc" })],
});
