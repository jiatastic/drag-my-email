/**
 * Format an RSA private key for Convex env vars by replacing newlines with spaces.
 *
 * Why: Convex env var values are typically single-line strings, but PEM keys are multiline.
 *
 * Usage:
 * - Provide the key via env:
 *   JWT_PRIVATE_KEY_RAW="$(cat ./private_key.pem)" bun run format-jwt-key.mjs
 *
 * - Or provide a file path:
 *   bun run format-jwt-key.mjs ./private_key.pem
 *
 * Notes:
 * - Do NOT commit real private keys to git.
 * - This script prints the single-line value you can paste into Convex.
 */

import { readFileSync } from "node:fs";

function readInputKey(): string {
  if (process.env.JWT_PRIVATE_KEY_RAW) return process.env.JWT_PRIVATE_KEY_RAW;

  const filePath = process.argv[2];
  if (filePath) {
    return readFileSync(filePath, "utf8");
  }

  throw new Error(
    "Missing input key. Provide JWT_PRIVATE_KEY_RAW env var or a file path argument."
  );
}

const privateKey = readInputKey();
const formattedKey = privateKey.trim().replace(/\r?\n/g, " ");

console.log("\n=== Formatted JWT_PRIVATE_KEY (single line) ===\n");
console.log(formattedKey);
console.log("\n=== How to set it in Convex ===\n");
console.log("Dashboard: Settings → Environment Variables → JWT_PRIVATE_KEY");
console.log("CLI:");
console.log(`npx convex env set JWT_PRIVATE_KEY "${formattedKey}"\n`);
