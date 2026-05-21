import "dotenv/config";
import { createApp } from "./app.js";
import { connectToMongoIfConfigured } from "./db/mongoose.js";

/** Default local development port when PORT env var is unset/invalid. */
const DEFAULT_PORT = 3000;
/** Parses and validates runtime port configuration from env. */
const parsedPort = Number.parseInt(process.env.PORT ?? `${DEFAULT_PORT}`, 10);
const port = Number.isInteger(parsedPort) && parsedPort > 0 ? parsedPort : DEFAULT_PORT;
const app = createApp();

/** Initializes dependencies before accepting HTTP traffic. */
async function bootstrap() {
  await connectToMongoIfConfigured();
  app.listen(port, () => {
    // Keep startup log simple for local development.
    console.log(`SecureLLM Gateway placeholder listening on :${port}`);
  });
}

void bootstrap();
