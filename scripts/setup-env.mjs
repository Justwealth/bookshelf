import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { randomBytes } from "node:crypto";
if (existsSync(".env")) console.log(".env already exists; left unchanged.");
else {
  writeFileSync(
    ".env",
    readFileSync(".env.example", "utf8").replace(
      "replace-with-a-random-secret-at-least-32-characters",
      randomBytes(48).toString("base64url"),
    ),
  );
  console.log("Created .env with a random authentication secret.");
}
