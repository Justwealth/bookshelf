import "dotenv/config";
import { createHTTPServer } from "@trpc/server/adapters/standalone";
import { appRouter } from "./router";
import { createContext } from "./context";
import { db } from "../src/lib/db";
const port = Number(process.env.API_PORT || 4000);
const server = createHTTPServer({
  router: appRouter,
  createContext,
  basePath: "/trpc/",
  maxBodySize: 16384,
  onError({ error }) {
    if (error.code === "INTERNAL_SERVER_ERROR") console.error(error);
  },
});
server.listen(port, "127.0.0.1", () =>
  console.log(`Book tRPC backend: http://127.0.0.1:${port}/trpc`),
);
for (const signal of ["SIGINT", "SIGTERM"] as const)
  process.on(signal, () => {
    const timer = setTimeout(() => process.exit(1), 5000);
    timer.unref();
    server.close(() => {
      void db.end().finally(() => process.exit(0));
    });
  });
