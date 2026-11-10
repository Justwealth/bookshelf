import test from "node:test";
import assert from "node:assert/strict";
import { parseBook, parseId } from "../src/lib/books";
test("normalizes valid input and ignores a spoofed owner", () => {
  assert.deepEqual(
    parseBook({
      title: "  Things Fall Apart  ",
      author: " Chinua Achebe ",
      status: "reading",
      userId: "victim",
    }),
    { title: "Things Fall Apart", author: "Chinua Achebe", status: "reading" },
  );
});
test("rejects invalid values and oversized fields", () => {
  for (const input of [
    null,
    [],
    {},
    { title: " ", author: "A", status: "reading" },
    { title: "A", author: "B", status: "unknown" },
    { title: "a".repeat(161), author: "B", status: "reading" },
    { title: "A", author: "b".repeat(101), status: "reading" },
  ])
    assert.throws(() => parseBook(input));
});
test("rejects SQL-shaped identifiers", () => {
  assert.throws(() => parseId("' OR 1=1 --"));
  assert.equal(
    parseId("56ba7636-3e33-4c31-8c11-d7073f554221"),
    "56ba7636-3e33-4c31-8c11-d7073f554221",
  );
});
