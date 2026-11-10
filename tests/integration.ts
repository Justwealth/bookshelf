import "dotenv/config";
import assert from "node:assert/strict";
import { createTRPCClient, httpBatchLink, TRPCClientError } from "@trpc/client";
import type { AppRouter } from "../server/router";
import { db } from "../src/lib/db";

const base = process.env.BETTER_AUTH_URL || "http://localhost:3000";
const run = Date.now();
const emails = [`reader-a-${run}@example.com`, `reader-b-${run}@example.com`];
const password = "Bookshelf-test-password-42!";
function client(cookie = "", origin = base, url = `${base}/api/trpc`) {
  return createTRPCClient<AppRouter>({
    links: [httpBatchLink({ url, headers: { cookie, origin } })],
  });
}
async function account(email: string) {
  const response = await fetch(`${base}/api/auth/sign-up/email`, {
    method: "POST",
    headers: { "Content-Type": "application/json", origin: base },
    body: JSON.stringify({ name: "Test Reader", email, password }),
  });
  assert.equal(response.status, 200, await response.clone().text());
  const cookie = response.headers
    .getSetCookie()
    .map((v) => v.split(";")[0])
    .join("; ");
  assert.ok(cookie.includes("session_token"), "Expected a real session cookie");
  return cookie;
}
async function rejectsCode(work: Promise<unknown>, code: string) {
  await assert.rejects(
    work,
    (e: unknown) => e instanceof TRPCClientError && e.data?.code === code,
  );
}
try {
  await rejectsCode(client().books.list.query(), "UNAUTHORIZED");
  const aCookie = await account(emails[0]);
  const bCookie = await account(emails[1]);
  const a = client(aCookie);
  const b = client(bCookie);
  const input = {
    title: "Things Fall Apart",
    author: "Chinua Achebe",
    status: "reading" as const,
  };
  const book = await a.books.create.mutate(input);
  assert.equal(book.title, input.title);
  assert.equal((await a.books.list.query()).length, 1);
  assert.equal((await b.books.list.query()).length, 0);
  await rejectsCode(
    b.books.update.mutate({ ...input, id: book.id }),
    "NOT_FOUND",
  );
  await rejectsCode(b.books.delete.mutate({ id: book.id }), "NOT_FOUND");
  await rejectsCode(
    a.books.create.mutate({ ...input, title: " " }),
    "BAD_REQUEST",
  );
  const direct = client(
    aCookie,
    "https://wrong-origin.example",
    `${process.env.API_URL || "http://127.0.0.1:4000"}/trpc`,
  );
  await rejectsCode(direct.books.create.mutate(input), "FORBIDDEN");
  const updated = await a.books.update.mutate({
    ...input,
    id: book.id,
    status: "finished",
  });
  assert.equal(updated.status, "finished");
  // A fresh authenticated request proves persistence beyond component state.
  assert.equal(
    (await client(aCookie).books.list.query())[0].status,
    "finished",
  );
  const stored = await db.query("SELECT status FROM books WHERE id=$1", [
    book.id,
  ]);
  assert.equal(stored.rows[0].status, "finished");
  const wrongPassword = await fetch(`${base}/api/auth/sign-in/email`, {
    method: "POST",
    headers: { "Content-Type": "application/json", origin: base },
    body: JSON.stringify({ email: emails[0], password: "wrong-password" }),
  });
  assert.equal(wrongPassword.status, 401);
  const login = await fetch(`${base}/api/auth/sign-in/email`, {
    method: "POST",
    headers: { "Content-Type": "application/json", origin: base },
    body: JSON.stringify({ email: emails[0], password }),
  });
  assert.equal(login.status, 200);
  await a.books.delete.mutate({ id: book.id });
  assert.equal((await a.books.list.query()).length, 0);
  const logout = await fetch(`${base}/api/auth/sign-out`, {
    method: "POST",
    headers: {
      cookie: aCookie,
      origin: base,
      "Content-Type": "application/json",
    },
    body: "{}",
  });
  assert.equal(logout.status, 200);
  await rejectsCode(a.books.list.query(), "UNAUTHORIZED");
  console.log(
    "PASS: sign-up, login, invalid password, sessions, CRUD, SQL persistence, owner isolation, origin rejection, and logout.",
  );
} finally {
  // Only accounts created by this run are removed; book rows cascade.
  await db.query('DELETE FROM "user" WHERE email = ANY($1::text[])', [emails]);
  await db.end();
}
