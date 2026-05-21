import mongoose from "mongoose";

/** Prevents duplicate connect calls when bootstrap runs more than once. */
let hasConnected = false;

/** Connects to Mongo only when MONGODB_URI is configured. */
export async function connectToMongoIfConfigured(): Promise<void> {
  if (hasConnected) {
    return;
  }

  const mongoUri = process.env.MONGODB_URI;
  if (!mongoUri) {
    return;
  }

  await mongoose.connect(mongoUri);
  hasConnected = true;
}

/** Returns a simplified Mongo health state for the health endpoint. */
export function getMongoHealthStatus(): "ready" | "not-configured" | "not-ready" {
  if (!process.env.MONGODB_URI) {
    return "not-configured";
  }
  return mongoose.connection.readyState === 1 ? "ready" : "not-ready";
}

/** Closes the active connection and resets module-level connection tracking. */
export async function disconnectMongo(): Promise<void> {
  if (!hasConnected) {
    return;
  }
  await mongoose.disconnect();
  hasConnected = false;
}
