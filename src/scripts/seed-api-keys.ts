import "dotenv/config";
import { randomBytes } from "node:crypto";
import { connectToMongoIfConfigured, disconnectMongo } from "../db/mongoose.js";
import { ApiKeyModel } from "../models/api-key.js";
import { hashApiKey } from "../security/hash.js";

/** Generates a display-only API key value (stored hashed, never persisted raw). */
function createRawApiKey(): string {
  return randomBytes(24).toString("base64url");
}

/** Upserts a role-specific seed key and returns the plaintext value once. */
async function createOrReplaceKey(role: "admin" | "client", label: string): Promise<string> {
  const rawKey = createRawApiKey();
  const keyHash = hashApiKey(rawKey);
  await ApiKeyModel.findOneAndUpdate(
    { label },
    {
      $set: {
        keyHash,
        role,
        status: "active",
        rateLimitPerMinute: 30,
        createdBy: "seed"
      }
    },
    { upsert: true, returnDocument: "after", setDefaultsOnInsert: true }
  );
  return rawKey;
}

/** Seeds one admin and one client API key for local development and testing. */
async function main() {
  if (!process.env.MONGODB_URI) {
    throw new Error("MONGODB_URI is required to seed API keys");
  }

  await connectToMongoIfConfigured();
  const adminKey = await createOrReplaceKey("admin", "seed-admin");
  const clientKey = await createOrReplaceKey("client", "seed-client");

  console.log("Seeded API keys (shown once):");
  console.log(`ADMIN_API_KEY=${adminKey}`);
  console.log(`CLIENT_API_KEY=${clientKey}`);
}

/** Exit with non-zero code on seed failures while always attempting cleanup. */
void main()
  .catch((error: unknown) => {
    console.error("Failed to seed API keys", error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await disconnectMongo();
  });
