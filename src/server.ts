import "dotenv/config";
import { createApp } from "./app.js";

const DEFAULT_PORT = 3000;
const parsedPort = Number.parseInt(process.env.PORT ?? `${DEFAULT_PORT}`, 10);
const port = Number.isInteger(parsedPort) && parsedPort > 0 ? parsedPort : DEFAULT_PORT;
const app = createApp();

app.listen(port, () => {
  // Keep startup log simple for local development.
  console.log(`SecureLLM Gateway placeholder listening on :${port}`);
});
