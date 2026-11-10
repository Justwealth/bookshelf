import { initTRPC, TRPCError } from "@trpc/server";
import { randomUUID } from "node:crypto";
import { db } from "../src/lib/db";
import {
  bookSchema,
  updateBookSchema,
  deleteBookSchema,
  type Book,
} from "../src/lib/books";
import type { Context } from "./context";
const t = initTRPC.context<Context>().create({
  errorFormatter({ shape, error }) {
    return {
      ...shape,
      message:
        error.code === "INTERNAL_SERVER_ERROR"
          ? "Unable to complete this request."
          : shape.message,
      data: { ...shape.data, stack: undefined },
    };
  },
});
const protectedProcedure = t.procedure.use(({ ctx, next, type }) => {
  if (!ctx.session)
    throw new TRPCError({ code: "UNAUTHORIZED", message: "Please sign in." });
  if (
    type === "mutation" &&
    ctx.origin !==
      new URL(process.env.BETTER_AUTH_URL || "http://localhost:3000").origin
  )
    throw new TRPCError({
      code: "FORBIDDEN",
      message: "Invalid request origin.",
    });
  return next({ ctx: { ...ctx, userId: ctx.session.user.id } });
});
const columns = `id::text, title, author, status, created_at::text AS "createdAt"`;
export const appRouter = t.router({
  books: t.router({
    list: protectedProcedure.query(async ({ ctx }) => {
      const result = await db.query<Book>(
        `SELECT ${columns} FROM books WHERE user_id=$1 ORDER BY created_at DESC, id`,
        [ctx.userId],
      );
      return result.rows;
    }),
    create: protectedProcedure
      .input(bookSchema)
      .mutation(async ({ ctx, input }) => {
        const result = await db.query<Book>(
          `INSERT INTO books (id,user_id,title,author,status) VALUES ($1,$2,$3,$4,$5) RETURNING ${columns}`,
          [randomUUID(), ctx.userId, input.title, input.author, input.status],
        );
        return result.rows[0];
      }),
    update: protectedProcedure
      .input(updateBookSchema)
      .mutation(async ({ ctx, input }) => {
        const result = await db.query<Book>(
          `UPDATE books SET title=$1,author=$2,status=$3 WHERE id=$4 AND user_id=$5 RETURNING ${columns}`,
          [input.title, input.author, input.status, input.id, ctx.userId],
        );
        if (!result.rowCount)
          throw new TRPCError({
            code: "NOT_FOUND",
            message: "Book not found.",
          });
        return result.rows[0];
      }),
    delete: protectedProcedure
      .input(deleteBookSchema)
      .mutation(async ({ ctx, input }) => {
        const result = await db.query(
          "DELETE FROM books WHERE id=$1 AND user_id=$2",
          [input.id, ctx.userId],
        );
        if (!result.rowCount)
          throw new TRPCError({
            code: "NOT_FOUND",
            message: "Book not found.",
          });
        return { success: true };
      }),
  }),
});
export type AppRouter = typeof appRouter;
