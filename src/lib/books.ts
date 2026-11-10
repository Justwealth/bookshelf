import { z } from "zod";
export const statuses = ["to-read", "reading", "finished"] as const;
export type BookStatus = (typeof statuses)[number];
export type Book = {
  id: string;
  title: string;
  author: string;
  status: BookStatus;
  createdAt: string;
};
export const bookSchema = z.object({
  title: z.string().trim().min(1, "Enter a title.").max(160),
  author: z.string().trim().min(1, "Enter an author.").max(100),
  status: z.enum(statuses),
});
export const idSchema = z.string().uuid();
export const updateBookSchema = bookSchema.extend({ id: idSchema });
export const deleteBookSchema = z.object({ id: idSchema });
export type BookInput = z.infer<typeof bookSchema>;
export const parseBook = (input: unknown): BookInput => bookSchema.parse(input);
export const parseId = (input: unknown): string => idSchema.parse(input);
