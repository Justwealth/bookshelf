import "dotenv/config";
import { betterAuth } from "better-auth";
import { db } from "./db";
export const auth = betterAuth({
  database: db,
  baseURL: process.env.BETTER_AUTH_URL,
  secret: process.env.BETTER_AUTH_SECRET,
  emailAndPassword: { enabled: true, minPasswordLength: 8 },
  session: { expiresIn: 60 * 60 * 24 * 7, cookieCache: { enabled: false } },
});
