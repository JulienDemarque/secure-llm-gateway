import "dotenv/config";
import { createApp } from "./app.js";
import { connectToMongoIfConfigured } from "./db/mongoose.js";
import { connectToRedisIfConfigured } from "./db/redis.js";
import { logger } from "./observability/logger.js";

/** Default local development port when PORT env var is unset/invalid. */
const DEFAULT_PORT = 3000;
/** Parses and validates runtime port configuration from env. */
const parsedPort = Number.parseInt(process.env.PORT ?? `${DEFAULT_PORT}`, 10);
const port = Number.isInteger(parsedPort) && parsedPort > 0 ? parsedPort : DEFAULT_PORT;
const app = createApp();

/** Initializes dependencies before accepting HTTP traffic. */
async function bootstrap() {
  await connectToMongoIfConfigured();
  await connectToRedisIfConfigured();
  app.listen(port, () => {
    logger.info({ event: "server-started", port }, "SecureLLM Gateway listening");
  });
}

void bootstrap();
